from django.db import models
from sales.models import SalesInvoice
from purchases.models import PurchaseInvoice

class SalesPaymentReminder(models.Model):
    REPEAT_TYPES = [
        ('weekly', 'Weekly'),
    ]

    sales_invoice = models.ForeignKey(SalesInvoice, on_delete=models.CASCADE)
    due_date = models.DateField()
    repeat_type = models.CharField(max_length=20, choices=REPEAT_TYPES)
    is_active = models.BooleanField(default=True)
    last_reminder_date = models.DateField(blank=True, null=True)
    next_reminder_date = models.DateField(blank=True, null=True)
    notes = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Sales Reminder {self.id}"


class PurchasePaymentReminder(models.Model):
    REPEAT_TYPES = [
        ('weekly', 'Weekly'),
    ]

    purchase_invoice = models.ForeignKey(PurchaseInvoice, on_delete=models.CASCADE)
    due_date = models.DateField()
    repeat_type = models.CharField(max_length=20, choices=REPEAT_TYPES)
    is_active = models.BooleanField(default=True)
    last_reminder_date = models.DateField(blank=True, null=True)
    next_reminder_date = models.DateField(blank=True, null=True)
    notes = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Purchase Reminder {self.id}"