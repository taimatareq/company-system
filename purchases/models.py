from django.db import models
from branches.models import Branch
from warehouses.models import Warehouse
from suppliers.models import Supplier
from finance.models import ExchangeRate
from django.conf import settings
from items.models import Item

class PurchaseInvoice(models.Model):
    PAYMENT_TYPES = [
        ('cash', 'Cash'),
        ('credit', 'Credit'),
    ]

    STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
    ]
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_%(class)ss"
    )
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)

    invoice_date = models.DateTimeField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPES)
    due_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unpaid')

    exchange_rate = models.ForeignKey(ExchangeRate, on_delete=models.SET_NULL, null=True)

    total_amount_usd = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total_amount_syp = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Purchase Invoice {self.id}"


class PurchaseInvoiceItem(models.Model):
    invoice = models.ForeignKey(
        PurchaseInvoice,
        on_delete=models.CASCADE,
        related_name='items'
    )
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost_usd = models.DecimalField(max_digits=18, decimal_places=2)
    unit_cost_syp = models.DecimalField(max_digits=18, decimal_places=2)

    @property
    def line_total_usd(self):
        return self.quantity * self.unit_cost_usd
    @property
    def line_total_syp(self):
        return self.quantity * self.unit_cost_syp
    def __str__(self):
        return f"{self.invoice.id} - {self.item.name}"
    
class PurchasePayment(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('credit', 'Credit'),
    ]

    invoice = models.ForeignKey(PurchaseInvoice, on_delete=models.CASCADE, related_name='payments')
    payment_date = models.DateTimeField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    notes = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Purchase Payment {self.id} - Invoice {self.invoice.id}"