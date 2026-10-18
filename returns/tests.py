
from decimal import Decimal
from unittest.mock import Mock, patch

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase, TestCase

from sales.models import SalesInvoice, SalesInvoiceItem
from purchases.models import PurchaseInvoice, PurchaseInvoiceItem

from .services import (
    validate_return_quantity,
    validate_return_invoice_item,
    confirm_sales_return,
    confirm_purchase_return,
)


class ReturnValidationTests(SimpleTestCase):

    @patch("returns.services.get_available_return_quantity")
    def test_zero_quantity_is_rejected(self, mock_available):
        with self.assertRaises(ValidationError):
            validate_return_quantity(
                invoice_item=None,
                quantity=Decimal("0"),
                return_type="sales",
            )

        mock_available.assert_not_called()

    @patch("returns.services.get_available_return_quantity")
    def test_negative_quantity_is_rejected(self, mock_available):
        with self.assertRaises(ValidationError):
            validate_return_quantity(
                invoice_item=None,
                quantity=Decimal("-2"),
                return_type="sales",
            )

        mock_available.assert_not_called()

    @patch("returns.services.get_available_return_quantity")
    def test_quantity_above_available_is_rejected(self, mock_available):
        mock_available.return_value = Decimal("5")

        with self.assertRaises(ValidationError):
            validate_return_quantity(
                invoice_item=None,
                quantity=Decimal("8"),
                return_type="sales",
            )

    @patch("returns.services.get_available_return_quantity")
    def test_valid_quantity_is_accepted(self, mock_available):
        mock_available.return_value = Decimal("5")

        result = validate_return_quantity(
            invoice_item=None,
            quantity=Decimal("3"),
            return_type="sales",
        )

        self.assertTrue(result)


class ReturnInvoiceValidationTests(SimpleTestCase):

    def test_sales_item_from_wrong_invoice_is_rejected(self):
        invoice = Mock(spec=SalesInvoice)
        invoice.id = 10

        invoice_item = Mock(spec=SalesInvoiceItem)
        invoice_item.invoice_id = 15

        with self.assertRaises(ValidationError):
            validate_return_invoice_item(
                invoice,
                invoice_item,
                "sales",
            )

    def test_sales_item_from_correct_invoice_is_accepted(self):
        invoice = Mock(spec=SalesInvoice)
        invoice.id = 10

        invoice_item = Mock(spec=SalesInvoiceItem)
        invoice_item.invoice_id = 10

        result = validate_return_invoice_item(
            invoice,
            invoice_item,
            "sales",
        )

        self.assertTrue(result)

    def test_purchase_item_from_wrong_invoice_is_rejected(self):
        invoice = Mock(spec=PurchaseInvoice)
        invoice.id = 20

        invoice_item = Mock(spec=PurchaseInvoiceItem)
        invoice_item.invoice_id = 25

        with self.assertRaises(ValidationError):
            validate_return_invoice_item(
                invoice,
                invoice_item,
                "purchase",
            )

    def test_purchase_item_from_correct_invoice_is_accepted(self):
        invoice = Mock(spec=PurchaseInvoice)
        invoice.id = 20

        invoice_item = Mock(spec=PurchaseInvoiceItem)
        invoice_item.invoice_id = 20

        result = validate_return_invoice_item(
            invoice,
            invoice_item,
            "purchase",
        )

        self.assertTrue(result)


class ReturnConfirmationTests(TestCase):

    @patch("returns.services.SalesReturn.objects")
    def test_confirmed_sales_return_cannot_be_confirmed_again(
        self,
        mock_objects,
    ):
        sales_return = Mock()
        sales_return.status = "confirmed"

        mock_objects.select_for_update.return_value \
            .select_related.return_value \
            .get.return_value = sales_return

        with self.assertRaises(ValidationError):
            confirm_sales_return(return_id=1)

    @patch("returns.services.PurchaseReturn.objects")
    def test_confirmed_purchase_return_cannot_be_confirmed_again(
        self,
        mock_objects,
    ):
        purchase_return = Mock()
        purchase_return.status = "confirmed"

        mock_objects.select_for_update.return_value \
            .select_related.return_value \
            .get.return_value = purchase_return

        with self.assertRaises(ValidationError):
            confirm_purchase_return(return_id=1)
