from django.db import models
from branches.models import Branch
from warehouses.models import Warehouse

class POSStation(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name