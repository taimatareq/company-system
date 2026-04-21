from django.db import models
from warehouses.models import Warehouse
from items.models import Item

class Inventory(models.Model):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        unique_together = ('warehouse', 'item')

    def __str__(self):
        return f"{self.item} - {self.warehouse}"