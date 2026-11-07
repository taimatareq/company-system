from rest_framework import serializers
from .models import ExchangeRate


class ExchangeRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeRate
        fields = "__all__"
        read_only_fields = ["organization"]

    def validate_usd_to_syp(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Exchange rate must be greater than zero."
            )
        return value