from rest_framework import serializers
from .models import SalesInvoice, SalesInvoiceItem


class SalesInvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesInvoiceItem
        fields = '__all__'


class SalesInvoiceSerializer(serializers.ModelSerializer):
    items = SalesInvoiceItemSerializer(many=True)

    class Meta:
        model = SalesInvoice
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items')

        invoice = SalesInvoice.objects.create(**validated_data)

        for item_data in items_data:
            SalesInvoiceItem.objects.create(
                invoice=invoice,
                **item_data
            )

        return invoice