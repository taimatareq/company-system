from django.db import models
from django.conf import settings

from warehouses.models import Warehouse
from items.models import Item


class StockTransfer(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("completed", "Completed"),
    ]

    from_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="outgoing_stock_transfers"
    )

    to_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="incoming_stock_transfers"
    )

    transfer_date = models.DateTimeField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft"
    )

    notes = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_stock_transfers"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Stock Transfer {self.id}"


class StockTransferItem(models.Model):
    transfer = models.ForeignKey(
        StockTransfer,
        on_delete=models.CASCADE,
        related_name="items"
    )

    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT
    )

    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    def __str__(self):
        return f"{self.transfer_id} - {self.item.name} - {self.quantity}"