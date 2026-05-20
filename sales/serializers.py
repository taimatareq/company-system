
from inventory.models import Inventory
from inventory.services import get_latest_quantity
from rest_framework.exceptions import ValidationError
from rest_framework import serializers
from inventory.models import Inventory
from inventory.services import get_latest_quantity
from rest_framework.exceptions import ValidationError
from .models import (
    SalesInvoice,
    SalesInvoiceItem,
    SalesRepresentative,
)


class SalesInvoiceItemSerializer(serializers.ModelSerializer):

    item_name = serializers.CharField(
        source="item.name",
        read_only=True
    )

    class Meta:
        model = SalesInvoiceItem
        exclude = ["invoice"]


class SalesInvoiceSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    warehouse_name = serializers.CharField(
        source="warehouse.name",
        read_only=True
    )

    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )

    sales_rep_name = serializers.CharField(
        source="sales_rep.name",
        read_only=True
    )

    sales_rep = serializers.PrimaryKeyRelatedField(
        queryset=SalesRepresentative.objects.all(),
        required=False,
        allow_null=True
    )

    items = SalesInvoiceItemSerializer(many=True)

    class Meta:
        model = SalesInvoice
        fields = "__all__"

    def validate(self, data):
        payment_type = data.get("payment_type")
        due_date = data.get("due_date")

        if payment_type == "credit" and not due_date:
            raise serializers.ValidationError({
                "due_date": "Due date is required for credit invoices."
            })

        return data

    def create(self, validated_data):
        items_data = validated_data.pop("items")

        invoice = SalesInvoice.objects.create(**validated_data)

        total_usd = 0
        total_syp = 0

        for item_data in items_data:
            item = item_data["item"]
            quantity = item_data["quantity"]

            old_quantity = get_latest_quantity(
                warehouse_id=invoice.warehouse.id,
                item_id=item.id
            )

            if old_quantity < quantity:
                invoice.delete()

                raise ValidationError({
                    "stock": f"Not enough stock for {item.name}. Available: {old_quantity}"
                })

            invoice_item = SalesInvoiceItem.objects.create(
                invoice=invoice,
                **item_data
            )

            new_quantity = old_quantity - quantity

            Inventory.objects.create(
                warehouse=invoice.warehouse,
                item=item,
                quantity=new_quantity,
                operation_type="sale"
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