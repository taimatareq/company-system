from rest_framework import serializers
from .models import POSStation
 
class POSStationSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSStation
        fields = '__all__'