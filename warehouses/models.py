from django.db import models
from branches.models import Branch
from django.core.exceptions import ValidationError
class Warehouse(models.Model):
    WAREHOUSE_TYPES = [
        ('main', 'Main'),
        ('branch', 'Branch'),
    ]

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=WAREHOUSE_TYPES)

    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    def clean(self):
        if self.type == 'branch' and not self.branch:
            raise ValidationError("Branch warehouse must have a branch.")

        if self.type == 'main' and self.branch:
            raise ValidationError("Main warehouse should not have a branch.")

    def __str__(self):
        return self.name