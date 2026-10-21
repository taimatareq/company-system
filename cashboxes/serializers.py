from rest_framework import serializers
from .models import CashBox, CashBoxTransaction


class CashBoxSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    class Meta:
        model = CashBox
        fields = "__all__"


class CashBoxTransactionSerializer(serializers.ModelSerializer):
    cash_box_name = serializers.CharField(
        source="cash_box.name",
        read_only=True
    )

    class Meta:
        model = CashBoxTransaction
        fields = "__all__"