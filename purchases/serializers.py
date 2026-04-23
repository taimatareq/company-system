from rest_framework import serializers


class PurchaseInvoiceItemInputSerializer(serializers.Serializer):
    item = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2)
    unit_cost_usd = serializers.DecimalField(max_digits=18, decimal_places=2)
    unit_cost_syp = serializers.DecimalField(max_digits=18, decimal_places=2)


class PurchaseInvoiceCreateSerializer(serializers.Serializer):
    branch = serializers.IntegerField()
    warehouse = serializers.IntegerField()
    supplier = serializers.IntegerField()
    invoice_date = serializers.DateTimeField()
    payment_type = serializers.ChoiceField(choices=['cash', 'credit'])
    due_date = serializers.DateField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=['unpaid', 'partial', 'paid'], default='unpaid')
    exchange_rate = serializers.IntegerField(required=False, allow_null=True)
    items = PurchaseInvoiceItemInputSerializer(many=True)