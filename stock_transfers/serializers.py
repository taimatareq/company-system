from rest_framework import serializers
from .models import StockTransfer, StockTransferItem


class StockTransferItemInputSerializer(serializers.Serializer):
    item = serializers.IntegerField()

    quantity = serializers.DecimalField(
        max_digits=10,
        decimal_places=2
    )


class StockTransferCreateSerializer(serializers.Serializer):
    from_warehouse = serializers.IntegerField()
    to_warehouse = serializers.IntegerField()
    transfer_date = serializers.DateTimeField()

    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )

    items = StockTransferItemInputSerializer(
        many=True
    )

    execute = serializers.BooleanField(
        required=False,
        default=False,
        write_only=True
    )


class StockTransferItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(
        source="item.name",
        read_only=True
    )

    class Meta:
        model = StockTransferItem

        fields = [
            "id",
            "item",
            "item_name",
            "quantity",
        ]


class StockTransferSerializer(serializers.ModelSerializer):
    items = StockTransferItemSerializer(
        many=True,
        read_only=True
    )

    from_warehouse_name = serializers.CharField(
        source="from_warehouse.name",
        read_only=True
    )

    to_warehouse_name = serializers.CharField(
        source="to_warehouse.name",
        read_only=True
    )

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True
    )

    class Meta:
        model = StockTransfer

        fields = [
            "id",
            "from_warehouse",
            "from_warehouse_name",
            "to_warehouse",
            "to_warehouse_name",
            "transfer_date",
            "status",
            "notes",
            "created_by",
            "created_by_name",
            "created_at",
            "items",
        ]