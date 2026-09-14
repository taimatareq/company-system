from rest_framework import serializers


class DamageItemInputSerializer(serializers.Serializer):
    item = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2)


class DamageCreateSerializer(serializers.Serializer):
    warehouse = serializers.IntegerField()
    damage_date = serializers.DateTimeField()
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    items = DamageItemInputSerializer(many=True)