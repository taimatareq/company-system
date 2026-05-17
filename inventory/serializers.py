from rest_framework import serializers
from .models import Inventory


class InventorySerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(
        source="warehouse.name",
        read_only=True
    )

    item_name = serializers.CharField(
        source="item.name",
        read_only=True
    )

    movement_qty = serializers.SerializerMethodField()

    class Meta:
        model = Inventory
        fields = "__all__"

    def get_movement_qty(self, obj):
        previous = Inventory.objects.filter(
            warehouse=obj.warehouse,
            item=obj.item,
            operation_date__lt=obj.operation_date
        ).order_by("-operation_date", "-id").first()

        if previous:
            return obj.quantity - previous.quantity

        return obj.quantity