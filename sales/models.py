from django.db import models
from django.conf import settings
from branches.models import Branch
from warehouses.models import Warehouse
from customers.models import Customer
from finance.models import ExchangeRate
from items.models import Item


# 👤 Sales Representative
class SalesRepresentative(models.Model):
    name = models.CharField(max_length=150)

    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0
    )

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

# 🧾 Sales Invoice
class SalesInvoice(models.Model):
    class Meta:
            verbose_name = "Invoice"
            verbose_name_plural = "Invoices"
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
        related_name="created_salesinvoices"
    )

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    sales_rep = models.ForeignKey(
        SalesRepresentative,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_invoices"
    )
    invoice_date = models.DateTimeField()

    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPES)
    due_date = models.DateField(blank=True, null=True)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unpaid')

    exchange_rate = models.ForeignKey(ExchangeRate, on_delete=models.SET_NULL, null=True)
    exchange_rate_value = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total_amount_usd = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total_amount_syp = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    is_applied = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sales Invoice {self.id}"


# 📦 Sales Invoice Item
class SalesInvoiceItem(models.Model):
    invoice = models.ForeignKey(
        SalesInvoice,
        on_delete=models.CASCADE,
        related_name='items'
    )
    item = models.ForeignKey(Item, on_delete=models.CASCADE)

    quantity = models.DecimalField(max_digits=10, decimal_places=2)

    unit_price_usd = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    unit_price_syp = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    @property
    def line_total_usd(self):
        return self.quantity * self.unit_price_usd

    @property
    def line_total_syp(self):
        return self.quantity * self.unit_price_syp

    def __str__(self):
        return f"{self.invoice.id} - {self.item.name}"


# 💰 Payments
class SalesPayment(models.Model):
    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payment"
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('credit', 'Credit'),
    ]

    invoice = models.ForeignKey(
        SalesInvoice,
        on_delete=models.CASCADE,
        related_name='payments'
    )

    payment_date = models.DateTimeField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    notes = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Payment {self.id} - Invoice {self.invoice.id}"