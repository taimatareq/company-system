from django.db import models
from warehouses.models import Warehouse
from items.models import Item

class Inventory(models.Model):
    OPERATION_TYPES = [
        ('purchase', 'Purchase'),
        ('sale', 'Sale'),
        ('damage', 'Damage'),
    ]

    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)

    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    # movement_qty = models.DecimalField(max_digits=10, decimal_places=2)

    operation_type = models.CharField(max_length=20,choices=OPERATION_TYPES,null=True,blank=True)
    operation_date = models.DateTimeField(auto_now_add=True,null=True,blank=True)

    def __str__(self):
        return f"{self.warehouse_id} - {self.item_id} - {self.quantity}"