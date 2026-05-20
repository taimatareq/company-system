from django.db import models
from branches.models import Branch
from cashboxes.models import CashBox
from django.conf import settings

class ExpenseCategory(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Expense(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    cash_box = models.ForeignKey(CashBox, on_delete=models.CASCADE)
    category = models.ForeignKey(ExpenseCategory, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expense_date = models.DateTimeField()
    notes = models.CharField(max_length=255, blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_%(class)ss"
    )
    def __str__(self):
        return f"{self.category.name} - {self.amount}"