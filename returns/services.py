
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Sum

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


def get_available_return_quantity(invoice_item, return_type):
    """
    Calculate remaining quantity available for return.
    Only confirmed returns are counted.
    """

    if return_type == "sales":
        if not isinstance(invoice_item, SalesInvoiceItem):
            raise ValueError("Expected a sales invoice item")

        return_items = SalesReturnItem.objects.filter(
            invoice_item=invoice_item,
            sales_return__status="confirmed",
        )

    elif return_type == "purchase":
        if not isinstance(invoice_item, PurchaseInvoiceItem):
            raise ValueError("Expected a purchase invoice item")

        return_items = PurchaseReturnItem.objects.filter(
            invoice_item=invoice_item,
            purchase_return__status="confirmed",
        )

    else:
        raise ValueError("Invalid return type")

    returned_quantity = (
        return_items.aggregate(total=Sum("quantity"))["total"]
        or Decimal("0")
    )

    available_quantity = (
        invoice_item.quantity - returned_quantity
    )

    return max(Decimal("0"), available_quantity)


def validate_return_quantity(invoice_item, quantity, return_type):
    """
    Validate the requested return quantity.
    """

    quantity = Decimal(str(quantity))

    if quantity <= 0:
        raise ValidationError(
            "Return quantity must be greater than zero."
        )

    available_quantity = get_available_return_quantity(
        invoice_item,
        return_type,
    )

    if quantity > available_quantity:
        raise ValidationError(
            f"Cannot return {quantity} units. "
            f"Only {available_quantity} units are available."
        )

    return True


def validate_return_invoice_item(invoice, invoice_item, return_type):
    """
    Ensure invoice item belongs to the selected invoice.
    """

    if return_type == "sales":
        if not isinstance(invoice, SalesInvoice):
            raise ValidationError(
                "Sales returns require a sales invoice."
            )

        if not isinstance(invoice_item, SalesInvoiceItem):
            raise ValidationError(
                "Sales returns require a sales invoice item."
            )

    elif return_type == "purchase":
        if not isinstance(invoice, PurchaseInvoice):
            raise ValidationError(
                "Purchase returns require a purchase invoice."
            )

        if not isinstance(invoice_item, PurchaseInvoiceItem):
            raise ValidationError(
                "Purchase returns require a purchase invoice item."
            )

    else:
        raise ValidationError("Invalid return type.")

    if invoice_item.invoice_id != invoice.id:
        raise ValidationError(
            "This item does not belong to the selected invoice."
        )

    return True


@transaction.atomic
def confirm_sales_return(return_id):
    """
    Confirm a sales return and restore stock.
    """

    sales_return = (
        SalesReturn.objects
        .select_for_update()
        .select_related("invoice")
        .get(pk=return_id)
    )

    if sales_return.status != "draft":
        raise ValidationError(
            "Only draft sales returns can be confirmed."
        )

    invoice = sales_return.invoice

    if not invoice.is_applied:
        raise ValidationError(
            "The original sales invoice must be applied first."
        )

    return_items = list(
        sales_return.items.select_related(
            "invoice_item__item"
        )
    )

    if not return_items:
        raise ValidationError(
            "Cannot confirm an empty sales return."
        )

    total_usd = Decimal("0.00")
    total_syp = Decimal("0.00")

    # Lock the original invoice to serialize confirmations
    # of returns referencing the same invoice.
    SalesInvoice.objects.select_for_update().get(pk=invoice.pk)

    for return_item in return_items:
        invoice_item = return_item.invoice_item

        validate_return_invoice_item(
            invoice,
            invoice_item,
            "sales",
        )

        validate_return_quantity(
            invoice_item,
            return_item.quantity,
            "sales",
        )

        total_usd += (
            return_item.quantity * invoice_item.unit_price_usd
        )
        total_syp += (
            return_item.quantity * invoice_item.unit_price_syp
        )

        item = invoice_item.item

        if item.item_type == "service":
            continue

        old_quantity = get_latest_quantity(
            warehouse_id=invoice.warehouse_id,
            item_id=item.id,
        )

        Inventory.objects.create(
            warehouse_id=invoice.warehouse_id,
            item=item,
            quantity=old_quantity + return_item.quantity,
            operation_type="sales_return",
        )

    sales_return.total_amount_usd = total_usd
    sales_return.total_amount_syp = total_syp
    sales_return.status = "confirmed"
    sales_return.save(
        update_fields=[
            "total_amount_usd",
            "total_amount_syp",
            "status",
        ]
    )

    return sales_return


@transaction.atomic
def confirm_purchase_return(return_id):
    """
    Confirm a purchase return and deduct stock.
    """

    purchase_return = (
        PurchaseReturn.objects
        .select_for_update()
        .select_related("invoice")
        .get(pk=return_id)
    )

    if purchase_return.status != "draft":
        raise ValidationError(
            "Only draft purchase returns can be confirmed."
        )

    invoice = purchase_return.invoice

    if not invoice.is_applied:
        raise ValidationError(
            "The original purchase invoice must be applied first."
        )

    PurchaseInvoice.objects.select_for_update().get(pk=invoice.pk)

    return_items = list(
        purchase_return.items.select_related(
            "invoice_item__item"
        )
    )

    if not return_items:
        raise ValidationError(
            "Cannot confirm an empty purchase return."
        )

    total_usd = Decimal("0.00")
    total_syp = Decimal("0.00")

    for return_item in return_items:
        invoice_item = return_item.invoice_item

        validate_return_invoice_item(
            invoice,
            invoice_item,
            "purchase",
        )

        validate_return_quantity(
            invoice_item,
            return_item.quantity,
            "purchase",
        )

        total_usd += (
            return_item.quantity * invoice_item.unit_cost_usd
        )
        total_syp += (
            return_item.quantity * invoice_item.unit_cost_syp
        )

        item = invoice_item.item

        if item.item_type == "service":
            continue

        old_quantity = get_latest_quantity(
            warehouse_id=invoice.warehouse_id,
            item_id=item.id,
        )

        if old_quantity < return_item.quantity:
            raise ValidationError(
                f"Not enough stock for {item.name}. "
                f"Available: {old_quantity}"
            )

        Inventory.objects.create(
            warehouse_id=invoice.warehouse_id,
            item=item,
            quantity=old_quantity - return_item.quantity,
            operation_type="purchase_return",
        )

    purchase_return.total_amount_usd = total_usd
    purchase_return.total_amount_syp = total_syp
    purchase_return.status = "confirmed"
    purchase_return.save(
        update_fields=[
            "total_amount_usd",
            "total_amount_syp",
            "status",
        ]
    )

    return purchase_return
