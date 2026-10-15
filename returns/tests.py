
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase
from unittest.mock import patch

from .services import validate_return_quantity


class ReturnValidationTests(SimpleTestCase):

    @patch("returns.services.get_available_return_quantity")
    def test_zero_quantity_is_rejected(self, mock_available):
        with self.assertRaises(ValidationError):
            validate_return_quantity(
                invoice_item=None,
                quantity=Decimal("0"),
                return_type="sales"
            )

        mock_available.assert_not_called()

    @patch("returns.services.get_available_return_quantity")
    def test_negative_quantity_is_rejected(self, mock_available):
        with self.assertRaises(ValidationError):
            validate_return_quantity(
                invoice_item=None,
                quantity=Decimal("-2"),
                return_type="sales"
            )

        mock_available.assert_not_called()

    @patch("returns.services.get_available_return_quantity")
    def test_quantity_above_available_is_rejected(self, mock_available):
        mock_available.return_value = Decimal("5")

        with self.assertRaises(ValidationError):
            validate_return_quantity(
                invoice_item=None,
                quantity=Decimal("8"),
                return_type="sales"
            )

    @patch("returns.services.get_available_return_quantity")
    def test_valid_quantity_is_accepted(self, mock_available):
        mock_available.return_value = Decimal("5")

        result = validate_return_quantity(
            invoice_item=None,
            quantity=Decimal("3"),
            return_type="sales"
        )

        self.assertTrue(result)


from unittest.mock import Mock

from sales.models import SalesInvoice, SalesInvoiceItem
from purchases.models import PurchaseInvoice, PurchaseInvoiceItem
from .services import validate_return_invoice_item


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
                "sales"
            )

    def test_sales_item_from_correct_invoice_is_accepted(self):
        invoice = Mock(spec=SalesInvoice)
        invoice.id = 10

        invoice_item = Mock(spec=SalesInvoiceItem)
        invoice_item.invoice_id = 10

        result = validate_return_invoice_item(
            invoice,
            invoice_item,
            "sales"
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
                "purchase"
            )

    def test_purchase_item_from_correct_invoice_is_accepted(self):
        invoice = Mock(spec=PurchaseInvoice)
        invoice.id = 20

        invoice_item = Mock(spec=PurchaseInvoiceItem)
        invoice_item.invoice_id = 20

        result = validate_return_invoice_item(
            invoice,
            invoice_item,
            "purchase"
        )

        self.assertTrue(result)
