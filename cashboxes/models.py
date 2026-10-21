from django.db import models
from branches.models import Branch

class CashBox(models.Model):
    BOX_TYPES = [
        ('cash', 'Cash'),
        ('credit', 'Credit'),
    ]

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    box_type = models.CharField(max_length=10, choices=BOX_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.branch.name}"
class CashBoxTransaction(models.Model):
    TRANSACTION_TYPES = [
        ("in", "Money In"),
        ("out", "Money Out"),
    ]

    cash_box = models.ForeignKey(
        CashBox,
        on_delete=models.CASCADE,
        related_name="transactions"
    )

    transaction_type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPES
    )

    amount = models.DecimalField(
        max_digits=18,
        decimal_places=2
    )

    description = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.cash_box.name} - {self.transaction_type} - {self.amount}"