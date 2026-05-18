from rest_framework import serializers
from .models import SalesInvoice, SalesInvoiceItem
from .models import SalesRepresentative

class SalesInvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesInvoiceItem
        exclude = ["invoice"]

class SalesInvoiceSerializer(serializers.ModelSerializer):

    sales_rep = serializers.PrimaryKeyRelatedField(
        queryset=SalesRepresentative.objects.all(),
        required=False,
        allow_null=True
    )

    items = SalesInvoiceItemSerializer(many=True)

    class Meta:
        model = SalesInvoice
        fields = '__all__'
    class SalesInvoiceSerializer(serializers.ModelSerializer):

        sales_rep = serializers.PrimaryKeyRelatedField(
            queryset=SalesRepresentative.objects.all(),
            required=False,
            allow_null=True
        )

        items = SalesInvoiceItemSerializer(many=True)

        class Meta:
            model = SalesInvoice
            fields = '__all__'

        def validate(self, data):

            payment_type = data.get("payment_type")
            due_date = data.get("due_date")

            if payment_type == "credit" and not due_date:
                raise serializers.ValidationError({
                    "due_date": "Due date is required for credit invoices."
                })

            return data 
    def create(self, validated_data):
        items_data = validated_data.pop('items')

        invoice = SalesInvoice.objects.create(**validated_data)

        total_usd = 0
        total_syp = 0

        for item_data in items_data:
            invoice_item = SalesInvoiceItem.objects.create(
                invoice=invoice,
                **item_data
            )

            total_usd += invoice_item.quantity * invoice_item.unit_price_usd
            total_syp += invoice_item.quantity * invoice_item.unit_price_syp

        invoice.total_amount_usd = total_usd
        invoice.total_amount_syp = total_syp
        invoice.total_amount = total_syp
        invoice.save()

        return invoice
    
class SalesRepresentativeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesRepresentative
        fields = "__all__"