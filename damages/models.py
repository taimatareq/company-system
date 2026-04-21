from django.db import models
from warehouses.models import Warehouse
from items.models import Item
from django.conf import settings

class Damage(models.Model):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    damage_date = models.DateTimeField()
    notes = models.CharField(max_length=255, blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_%(class)ss"
    )
    def __str__(self):
        return f"Damage {self.id}"


class DamageItem(models.Model):
    damage = models.ForeignKey(Damage, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.damage.id} - {self.item.name}"