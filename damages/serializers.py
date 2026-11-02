from rest_framework import serializers
from .models import Damage, DamageItem


class DamageItemInputSerializer(serializers.Serializer):
    item = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2)


class DamageCreateSerializer(serializers.Serializer):
    warehouse = serializers.IntegerField()
    damage_date = serializers.DateTimeField()
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )
    items = DamageItemInputSerializer(
        many=True,
        allow_empty=False
    )


class DamageItemListSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)

    class Meta:
        model = DamageItem
        fields = [
            "id",
            "item",
            "item_name",
            "quantity",
        ]


class DamageListSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(
        source="warehouse.name",
        read_only=True
    )
    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True
    )
    items = DamageItemListSerializer(many=True, read_only=True)

    class Meta:
        model = Damage
        fields = [
            "id",
            "warehouse",
            "warehouse_name",
            "damage_date",
            "notes",
            "created_by",
            "created_by_name",
            "is_applied",
            "items",
        ]