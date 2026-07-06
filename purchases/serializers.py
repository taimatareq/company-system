from rest_framework import serializers
from django.db.models import Sum

from .models import (
    PurchaseInvoice,
    PurchaseInvoiceItem,
    PurchasePayment,
)


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
    payment_type = serializers.ChoiceField(choices=["cash", "credit"])
    due_date = serializers.DateField(required=False, allow_null=True)
    status = serializers.ChoiceField(
        choices=["unpaid", "partial", "paid"],
        default="unpaid"
    )
    exchange_rate = serializers.IntegerField(required=False, allow_null=True)
    items = PurchaseInvoiceItemInputSerializer(many=True)

    def validate(self, data):
        if data.get("payment_type") == "credit" and not data.get("due_date"):
            raise serializers.ValidationError({
                "due_date": "Due date is required for credit invoices."
            })

        return data


class PurchaseInvoiceItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(
        source="item.name",
        read_only=True
    )

    class Meta:
        model = PurchaseInvoiceItem
        fields = "__all__"


class PurchaseInvoiceSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(
        source="supplier.name",
        read_only=True
    )

    warehouse_name = serializers.CharField(
        source="warehouse.name",
        read_only=True
    )

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    total_paid = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()

    items = PurchaseInvoiceItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = PurchaseInvoice
        fields = "__all__"

    def get_total_paid(self, obj):
        return (
            obj.payments.aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

    def get_remaining(self, obj):
        paid = self.get_total_paid(obj)
        return obj.total_amount_usd - paid


class PurchasePaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.SerializerMethodField()

    supplier = serializers.IntegerField(
        source="invoice.supplier.id",
        read_only=True
    )

    supplier_name = serializers.CharField(
        source="invoice.supplier.name",
        read_only=True
    )

    invoice_total = serializers.DecimalField(
        source="invoice.total_amount_usd",
        max_digits=18,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = PurchasePayment
        fields = "__all__"

    def get_invoice_number(self, obj):
        return f"PI{str(obj.invoice.id).zfill(5)}"

    def create(self, validated_data):
        payment = PurchasePayment.objects.create(**validated_data)

        invoice = payment.invoice

        total_paid = (
            invoice.payments.aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        invoice_total = invoice.total_amount_usd

        if total_paid <= 0:
            invoice.status = "unpaid"
        elif total_paid < invoice_total:
            invoice.status = "partial"
        else:
            invoice.status = "paid"

        invoice.save()

        return payment