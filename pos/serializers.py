from rest_framework import serializers
from .models import POSStation
 

class POSStationSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    warehouse_name = serializers.CharField(
        source="warehouse.name",
        read_only=True
    )

    class Meta:
        model = POSStation
        fields = "__all__"