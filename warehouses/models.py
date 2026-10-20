from django.db import models
from branches.models import Branch
from django.core.exceptions import ValidationError
from organizations.models import Organization
class Warehouse(models.Model):
    WAREHOUSE_TYPES = [
        ('main', 'Main'),
        ('branch', 'Branch'),
    ]

    name = models.CharField(max_length=100)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="warehouses",
    )
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
        if self.branch_id and self.organization_id:
            if self.branch.organization_id != self.organization_id:
                raise ValidationError({
                    "branch": "Warehouse and branch must belong to the same organization."
                })
    def __str__(self):
        return self.name