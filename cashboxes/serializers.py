from rest_framework import serializers
from .models import CashBox
 
class CashBoxSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashBox
        fields = '__all__'
 