
from django.db import models
from django.conf import settings
from sales.models import SalesInvoice, SalesInvoiceItem
from purchases.models import PurchaseInvoice, PurchaseInvoiceItem


# Sales Returns
class SalesReturn(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("confirmed", "Confirmed"),
    ]

    invoice = models.ForeignKey(
        SalesInvoice,
        on_delete=models.PROTECT,
        related_name="returns"
    )
    return_date = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft"
    )
    total_amount_usd = models.DecimalField(
        max_digits=18, decimal_places=2, default=0
    )
    total_amount_syp = models.DecimalField(
        max_digits=18, decimal_places=2, default=0
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Sales Return {self.id} - Invoice {self.invoice_id}"


class SalesReturnItem(models.Model):
    sales_return = models.ForeignKey(
        SalesReturn,
        on_delete=models.CASCADE,
        related_name="items"
    )
    invoice_item = models.ForeignKey(
        SalesInvoiceItem,
        on_delete=models.PROTECT
    )
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2
    )
    unit_price_usd = models.DecimalField(
        max_digits=18, decimal_places=2
    )
    unit_price_syp = models.DecimalField(
        max_digits=18, decimal_places=2
    )

    def __str__(self):
        return f"Sales Return Item {self.id}"


# Purchase Returns
class PurchaseReturn(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("confirmed", "Confirmed"),
    ]

    invoice = models.ForeignKey(
        PurchaseInvoice,
        on_delete=models.PROTECT,
        related_name="returns"
    )
    return_date = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft"
    )
    total_amount_usd = models.DecimalField(
        max_digits=18, decimal_places=2, default=0
    )
    total_amount_syp = models.DecimalField(
        max_digits=18, decimal_places=2, default=0
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Purchase Return {self.id} - Invoice {self.invoice_id}"


class PurchaseReturnItem(models.Model):
    purchase_return = models.ForeignKey(
        PurchaseReturn,
        on_delete=models.CASCADE,
        related_name="items"
    )
    invoice_item = models.ForeignKey(
        PurchaseInvoiceItem,
        on_delete=models.PROTECT
    )
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2
    )
    unit_cost_usd = models.DecimalField(
        max_digits=18, decimal_places=2
    )
    unit_cost_syp = models.DecimalField(
        max_digits=18, decimal_places=2
    )

    def __str__(self):
        return f"Purchase Return Item {self.id}"
