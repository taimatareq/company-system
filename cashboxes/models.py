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