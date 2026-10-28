
from decimal import Decimal
from unittest.mock import Mock, patch

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase, TestCase
from django.utils import timezone

from organizations.models import Organization, OrganizationMembership
from branches.models import Branch
from warehouses.models import Warehouse
from customers.models import Customer
from suppliers.models import Supplier
from items.models import Item
from inventory.models import Inventory
from inventory.services import get_latest_quantity

from sales.models import SalesInvoice, SalesInvoiceItem
from purchases.models import PurchaseInvoice, PurchaseInvoiceItem

from .models import (
    SalesReturn,
    SalesReturnItem,
    PurchaseReturn,
    PurchaseReturnItem,
)
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

        self.assertTrue(
            validate_return_quantity(
                invoice_item=None,
                quantity=Decimal("3"),
                return_type="sales",
            )
        )


class ReturnInvoiceValidationTests(SimpleTestCase):

    def test_sales_item_from_wrong_invoice_is_rejected(self):
        invoice = Mock(spec=SalesInvoice)
        invoice.id = 10
        invoice_item = Mock(spec=SalesInvoiceItem)
        invoice_item.invoice_id = 15

        with self.assertRaises(ValidationError):
            validate_return_invoice_item(
                invoice, invoice_item, "sales"
            )

    def test_sales_item_from_correct_invoice_is_accepted(self):
        invoice = Mock(spec=SalesInvoice)
        invoice.id = 10
        invoice_item = Mock(spec=SalesInvoiceItem)
        invoice_item.invoice_id = 10

        self.assertTrue(
            validate_return_invoice_item(
                invoice, invoice_item, "sales"
            )
        )

    def test_purchase_item_from_wrong_invoice_is_rejected(self):
        invoice = Mock(spec=PurchaseInvoice)
        invoice.id = 20
        invoice_item = Mock(spec=PurchaseInvoiceItem)
        invoice_item.invoice_id = 25

        with self.assertRaises(ValidationError):
            validate_return_invoice_item(
                invoice, invoice_item, "purchase"
            )

    def test_purchase_item_from_correct_invoice_is_accepted(self):
        invoice = Mock(spec=PurchaseInvoice)
        invoice.id = 20
        invoice_item = Mock(spec=PurchaseInvoiceItem)
        invoice_item.invoice_id = 20

        self.assertTrue(
            validate_return_invoice_item(
                invoice, invoice_item, "purchase"
            )
        )


class ReturnConfirmationTests(TestCase):

    @patch("returns.services.SalesReturn.objects")
    def test_confirmed_sales_return_cannot_be_confirmed_again(
        self, mock_objects
    ):
        sales_return = Mock()
        sales_return.status = "confirmed"

        (
            mock_objects.select_for_update.return_value
            .select_related.return_value
            .get.return_value
        ) = sales_return

        with self.assertRaises(ValidationError):
            confirm_sales_return(return_id=1)

    @patch("returns.services.PurchaseReturn.objects")
    def test_confirmed_purchase_return_cannot_be_confirmed_again(
        self, mock_objects
    ):
        purchase_return = Mock()
        purchase_return.status = "confirmed"

        (
            mock_objects.select_for_update.return_value
            .select_related.return_value
            .get.return_value
        ) = purchase_return

        with self.assertRaises(ValidationError):
            confirm_purchase_return(return_id=1)


class ReturnInventoryTests(TestCase):

    def setUp(self):
        self.organization = Organization.objects.create(
            name="Returns Test Organization"
        )

        self.branch = Branch.objects.create(
            name="Test Branch",
            organization=self.organization,
        )

        self.warehouse = Warehouse.objects.create(
            name="Test Warehouse",
            organization=self.organization,
            type="branch",
            branch=self.branch,
        )

        self.customer = Customer.objects.create(
            name="Test Customer"
        )

        self.supplier = Supplier.objects.create(
            name="Test Supplier"
        )

        self.item = Item.objects.create(
            name="Test Product",
            organization=self.organization,
            code="RETURN-TEST-001",
            item_type="product",
            retail_price=Decimal("20.00"),
            wholesale_price=Decimal("10.00"),
        )

        self.sales_invoice = SalesInvoice.objects.create(
            branch=self.branch,
            warehouse=self.warehouse,
            customer=self.customer,
            invoice_date=timezone.now(),
            payment_type="cash",
            is_applied=True,
        )

        self.sales_invoice_item = SalesInvoiceItem.objects.create(
            invoice=self.sales_invoice,
            item=self.item,
            quantity=Decimal("5.00"),
            unit_price_usd=Decimal("20.00"),
            unit_price_syp=Decimal("200000.00"),
        )

        self.purchase_invoice = PurchaseInvoice.objects.create(
            branch=self.branch,
            warehouse=self.warehouse,
            supplier=self.supplier,
            invoice_date=timezone.now(),
            payment_type="cash",
            is_applied=True,
        )

        self.purchase_invoice_item = PurchaseInvoiceItem.objects.create(
            invoice=self.purchase_invoice,
            item=self.item,
            quantity=Decimal("8.00"),
            unit_cost_usd=Decimal("10.00"),
            unit_cost_syp=Decimal("100000.00"),
        )

        Inventory.objects.create(
            warehouse=self.warehouse,
            item=self.item,
            quantity=Decimal("10.00"),
            operation_type="purchase",
        )

    def create_sales_return(self, quantity):
        sales_return = SalesReturn.objects.create(
            invoice=self.sales_invoice,
            status="draft",
        )
        SalesReturnItem.objects.create(
            sales_return=sales_return,
            invoice_item=self.sales_invoice_item,
            quantity=quantity,
            unit_price_usd=Decimal("20.00"),
            unit_price_syp=Decimal("200000.00"),
        )
        return sales_return

    def create_purchase_return(self, quantity):
        purchase_return = PurchaseReturn.objects.create(
            invoice=self.purchase_invoice,
            status="draft",
        )
        PurchaseReturnItem.objects.create(
            purchase_return=purchase_return,
            invoice_item=self.purchase_invoice_item,
            quantity=quantity,
            unit_cost_usd=Decimal("10.00"),
            unit_cost_syp=Decimal("100000.00"),
        )
        return purchase_return

    def test_sales_return_increases_stock(self):
        sales_return = self.create_sales_return(
            Decimal("3.00")
        )

        confirm_sales_return(sales_return.id)

        self.assertEqual(
            get_latest_quantity(self.warehouse.id, self.item.id),
            Decimal("13.00"),
        )

        sales_return.refresh_from_db()
        self.assertEqual(sales_return.status, "confirmed")

    def test_purchase_return_decreases_stock(self):
        purchase_return = self.create_purchase_return(
            Decimal("4.00")
        )

        confirm_purchase_return(purchase_return.id)

        self.assertEqual(
            get_latest_quantity(self.warehouse.id, self.item.id),
            Decimal("6.00"),
        )

        purchase_return.refresh_from_db()
        self.assertEqual(purchase_return.status, "confirmed")

    def test_purchase_return_rejects_insufficient_stock(self):
        purchase_return = self.create_purchase_return(
            Decimal("8.00")
        )

        Inventory.objects.create(
            warehouse=self.warehouse,
            item=self.item,
            quantity=Decimal("2.00"),
            operation_type="sale",
        )

        with self.assertRaises(ValidationError):
            confirm_purchase_return(purchase_return.id)

        self.assertEqual(
            get_latest_quantity(self.warehouse.id, self.item.id),
            Decimal("2.00"),
        )

        purchase_return.refresh_from_db()
        self.assertEqual(purchase_return.status, "draft")

    def test_sales_return_cannot_change_stock_twice(self):
        sales_return = self.create_sales_return(
            Decimal("2.00")
        )

        confirm_sales_return(sales_return.id)

        with self.assertRaises(ValidationError):
            confirm_sales_return(sales_return.id)

        self.assertEqual(
            get_latest_quantity(self.warehouse.id, self.item.id),
            Decimal("12.00"),
        )

    def test_draft_return_does_not_change_stock(self):
        self.create_sales_return(Decimal("2.00"))

        self.assertEqual(
            get_latest_quantity(self.warehouse.id, self.item.id),
            Decimal("10.00"),
        )


    def test_duplicate_sales_return_lines_exceed_invoice_quantity(self):
        sales_return = self.create_sales_return(Decimal("3.00"))

        SalesReturnItem.objects.create(
            sales_return=sales_return,
            invoice_item=self.sales_invoice_item,
            quantity=Decimal("4.00"),
            unit_price_usd=Decimal("20.00"),
            unit_price_syp=Decimal("200000.00"),
        )

        with self.assertRaises(ValidationError):
            confirm_sales_return(sales_return.id)

        self.assertEqual(
            get_latest_quantity(self.warehouse.id, self.item.id),
            Decimal("10.00"),
        )

        sales_return.refresh_from_db()
        self.assertEqual(sales_return.status, "draft")

    def test_duplicate_purchase_return_lines_exceed_invoice_quantity(self):
        purchase_return = self.create_purchase_return(Decimal("5.00"))

        PurchaseReturnItem.objects.create(
            purchase_return=purchase_return,
            invoice_item=self.purchase_invoice_item,
            quantity=Decimal("4.00"),
            unit_cost_usd=Decimal("10.00"),
            unit_cost_syp=Decimal("100000.00"),
        )

        with self.assertRaises(ValidationError):
            confirm_purchase_return(purchase_return.id)

        self.assertEqual(
            get_latest_quantity(self.warehouse.id, self.item.id),
            Decimal("10.00"),
        )

        purchase_return.refresh_from_db()
        self.assertEqual(purchase_return.status, "draft")





class ReturnAPITests(TestCase):

    def setUp(self):
        from django.contrib.auth import get_user_model
        from rest_framework.test import APIClient

        User = get_user_model()

        self.user = User.objects.create_user(
            username="returns_test_user",
            email="returns_test@example.com",
            password="TestPassword123!",
        )

        OrganizationMembership.objects.create(
            organization=getattr(self, "organization", None) or Organization.objects.create(name="Returns API Test Organization"),
            user=self.user,
            role="company_admin",
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_authenticated_user_can_list_returns(self):
        response = self.client.get(
            "/api/sales-returns/",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, 200)

    def test_authenticated_user_can_list_purchase_returns(self):
        response = self.client.get(
            "/api/purchase-returns/",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, 200)
    
    def test_create_sales_return_requires_invoice(self):
        response = self.client.post(
            "/api/sales-returns/",
            {
                "reason": "Damaged product",
                "items": [],
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            SalesReturn.objects.count(),
            0,
        )




class SalesReturnAPIWorkflowTests(ReturnInventoryTests):

    def setUp(self):
        super().setUp()

        from django.contrib.auth import get_user_model
        from rest_framework.test import APIClient

        User = get_user_model()

        self.user = User.objects.create_user(
            username="returns_workflow_user",
            email="workflow@example.com",
            password="TestPassword123!",
        )

        OrganizationMembership.objects.create(
            organization=getattr(self, "organization", None) or Organization.objects.create(name="Returns API Test Organization"),
            user=self.user,
            role="company_admin",
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_sales_return_via_api(self):
        response = self.client.post(
            "/api/sales-returns/",
            {
                "invoice": self.sales_invoice.id,
                "reason": "Returned product",
                "items": [
                    {
                        "invoice_item": self.sales_invoice_item.id,
                        "quantity": "2.00",
                    }
                ],
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )

        self.assertEqual(
            SalesReturn.objects.count(),
            1,
        )

        self.assertEqual(
            SalesReturn.objects.first().status,
            "draft",
        )

    def test_confirm_sales_return_via_api(self):
        sales_return = self.create_sales_return(
            Decimal("2.00")
        )

        response = self.client.post(
            f"/api/sales-returns/{sales_return.id}/confirm/",
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )

        self.assertEqual(
            get_latest_quantity(
                self.warehouse.id,
                self.item.id,
            ),
            Decimal("12.00"),
        )

    def test_confirmed_sales_return_cannot_be_modified(self):
        sales_return = self.create_sales_return(
            Decimal("2.00")
        )

        confirm_sales_return(sales_return.id)

        response = self.client.patch(
            f"/api/sales-returns/{sales_return.id}/",
            {"reason": "Modified after confirmation"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(
            response.status_code,
            400,
            response.data,
        )



class PurchaseReturnAPIWorkflowTests(ReturnInventoryTests):

    def setUp(self):
        super().setUp()

        from django.contrib.auth import get_user_model
        from rest_framework.test import APIClient

        User = get_user_model()

        self.user = User.objects.create_user(
            username="purchase_returns_test_user",
            email="purchase_returns@example.com",
            password="TestPassword123!",
        )

        OrganizationMembership.objects.create(
            organization=getattr(self, "organization", None) or Organization.objects.create(name="Returns API Test Organization"),
            user=self.user,
            role="company_admin",
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_purchase_return_via_api(self):
        response = self.client.post(
            "/api/purchase-returns/",
            {
                "invoice": self.purchase_invoice.id,
                "reason": "Returned to supplier",
                "items": [
                    {
                        "invoice_item": self.purchase_invoice_item.id,
                        "quantity": "3.00",
                    }
                ],
            },
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(
            response.status_code,
            201,
            response.data,
        )

        self.assertEqual(
            PurchaseReturn.objects.count(),
            1,
        )

        self.assertEqual(
            PurchaseReturn.objects.first().status,
            "draft",
        )

    def test_confirm_purchase_return_via_api(self):
        purchase_return = self.create_purchase_return(
            Decimal("3.00")
        )

        response = self.client.post(
            f"/api/purchase-returns/{purchase_return.id}/confirm/",
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(
            response.status_code,
            200,
            response.data,
        )

        self.assertEqual(
            get_latest_quantity(
                self.warehouse.id,
                self.item.id,
            ),
            Decimal("7.00"),
        )

    def test_confirmed_purchase_return_cannot_be_modified(self):
        purchase_return = self.create_purchase_return(
            Decimal("2.00")
        )

        confirm_purchase_return(purchase_return.id)

        response = self.client.patch(
            f"/api/purchase-returns/{purchase_return.id}/",
            {"reason": "Modified after confirmation"},
            format="json",
            HTTP_HOST="localhost",
        )

        self.assertEqual(
            response.status_code,
            400,
            response.data,
        )
