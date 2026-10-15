
from decimal import Decimal

from django.db.models import Sum

from .models import SalesReturnItem, PurchaseReturnItem

from sales.models import SalesInvoice, SalesInvoiceItem
from purchases.models import PurchaseInvoice, PurchaseInvoiceItem

def get_available_return_quantity(invoice_item, return_type):
    """
    Calculate how many units can still be returned.

    return_type: "sales" or "purchase"
    """

    if return_type == "sales":
        if not hasattr(invoice_item, "unit_price_usd"):
            raise ValueError("Expected a sales invoice item")

        return_items = SalesReturnItem.objects.filter(
            invoice_item=invoice_item,
            sales_return__status="confirmed"
        )

    elif return_type == "purchase":
        if not hasattr(invoice_item, "unit_cost_usd"):
            raise ValueError("Expected a purchase invoice item")

        return_items = PurchaseReturnItem.objects.filter(
            invoice_item=invoice_item,
            purchase_return__status="confirmed"
        )

    else:
        raise ValueError("Invalid return type")

    returned_quantity = return_items.aggregate(
        total=Sum("quantity")
    )["total"] or Decimal("0")

    available_quantity = invoice_item.quantity - returned_quantity

    return max(Decimal("0"), available_quantity)


from django.core.exceptions import ValidationError


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
        return_type
    )

    if quantity > available_quantity:
        raise ValidationError(
            f"Cannot return {quantity} units. "
            f"Only {available_quantity} units are available."
        )

    return True


def validate_return_invoice_item(
    invoice,
    invoice_item,
    return_type
):
    """
    Ensure the returned invoice line belongs
    to the correct original invoice.
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
