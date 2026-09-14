from rest_framework import serializers
from .models import Warehouse
class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'
    def validate(self, data):
        warehouse_type = data.get('type')
        branch = data.get('branch')

        if warehouse_type == 'branch' and not branch:
            raise serializers.ValidationError(
                "Branch warehouse must have a branch."
            )

        if warehouse_type == 'main' and branch:
            raise serializers.ValidationError(
                "Main warehouse should not have a branch."
            )

        return data