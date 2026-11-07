from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from sales.models import SalesInvoiceItem
from purchases.models import PurchaseInvoiceItem

from .models import (
    SalesReturn,
    SalesReturnItem,
    PurchaseReturn,
    PurchaseReturnItem,
)
from .services import get_available_return_quantity


class SalesReturnItemSerializer(serializers.ModelSerializer):
    invoice_item = serializers.PrimaryKeyRelatedField(
        queryset=SalesInvoiceItem.objects.all()
    )

    class Meta:
        model = SalesReturnItem
        fields = [
            "id",
            "invoice_item",
            "quantity",
            "unit_price_usd",
            "unit_price_syp",
        ]
        read_only_fields = [
            "id",
            "unit_price_usd",
            "unit_price_syp",
        ]


class PurchaseReturnItemSerializer(serializers.ModelSerializer):
    invoice_item = serializers.PrimaryKeyRelatedField(
        queryset=PurchaseInvoiceItem.objects.all()
    )

    class Meta:
        model = PurchaseReturnItem
        fields = [
            "id",
            "invoice_item",
            "quantity",
            "unit_cost_usd",
            "unit_cost_syp",
        ]
        read_only_fields = [
            "id",
            "unit_cost_usd",
            "unit_cost_syp",
        ]


class BaseReturnSerializer(serializers.ModelSerializer):

    def validate(self, attrs):
        if self.instance and self.instance.status != "draft":
            raise serializers.ValidationError(
                "Only draft returns can be modified."
            )

        if self.instance and "invoice" in attrs:
            if attrs["invoice"].pk != self.instance.invoice_id:
                raise serializers.ValidationError(
                    "The original invoice cannot be changed."
                )

        items = attrs.get("items")

        if items is not None:
            if not items:
                raise serializers.ValidationError(
                    {"items": "At least one return item is required."}
                )

            invoice = attrs.get("invoice")

            if invoice is None and self.instance:
                invoice = self.instance.invoice

            if invoice is None:
                raise serializers.ValidationError(
                    {"invoice": "An invoice is required."}
                )

            quantities = {}
            invoice_items = {}

            for item_data in items:
                invoice_item = item_data["invoice_item"]
                quantity = item_data["quantity"]

                if not quantity.is_finite() or quantity <= 0:
                    raise serializers.ValidationError(
                        {"items": "Quantity must be greater than zero."}
                    )

                if invoice_item.invoice_id != invoice.pk:
                    raise serializers.ValidationError(
                        {"items": "An item does not belong to this invoice."}
                    )

                key = invoice_item.pk

                quantities[key] = (
                    quantities.get(key, Decimal("0")) + quantity
                )

                invoice_items[key] = invoice_item

            if isinstance(self, SalesReturnSerializer):
                return_type = "sales"
            elif isinstance(self, PurchaseReturnSerializer):
                return_type = "purchase"
            else:
                raise serializers.ValidationError(
                    "Unsupported return type."
                )

            for key, requested_quantity in quantities.items():
                invoice_item = invoice_items[key]

                if requested_quantity != requested_quantity.to_integral_value():
                    raise serializers.ValidationError({
                        "items": "Return quantity must be a whole number."
                    })

                available_quantity = get_available_return_quantity(
                    invoice_item,
                    return_type,
                )

                if requested_quantity > available_quantity:
                    raise serializers.ValidationError({
                        "items": (
                            f"Cannot return {requested_quantity} units "
                            f"of invoice item {key}. "
                            f"Only {available_quantity} units are available."
                        )
                    })

        return attrs


class SalesReturnSerializer(BaseReturnSerializer):
    items = SalesReturnItemSerializer(many=True)

    class Meta:
        model = SalesReturn
        fields = [
            "id",
            "invoice",
            "return_date",
            "reason",
            "status",
            "total_amount_usd",
            "total_amount_syp",
            "created_by",
            "items",
        ]
        read_only_fields = [
            "id",
            "return_date",
            "status",
            "total_amount_usd",
            "total_amount_syp",
            "created_by",
        ]

    @staticmethod
    def update_totals(instance):
        total_usd = Decimal("0.00")
        total_syp = Decimal("0.00")

        for return_item in instance.items.all():
            total_usd += return_item.quantity * return_item.unit_price_usd
            total_syp += return_item.quantity * return_item.unit_price_syp

        instance.total_amount_usd = total_usd
        instance.total_amount_syp = total_syp
        instance.save(update_fields=["total_amount_usd", "total_amount_syp"])

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        sales_return = SalesReturn.objects.create(**validated_data)

        for data in items_data:
            invoice_item = data["invoice_item"]

            SalesReturnItem.objects.create(
                sales_return=sales_return,
                invoice_item=invoice_item,
                quantity=data["quantity"],
                unit_price_usd=invoice_item.unit_price_usd,
                unit_price_syp=invoice_item.unit_price_syp,
            )

        self.update_totals(sales_return)
        return sales_return

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        instance.reason = validated_data.get(
            "reason", instance.reason
        )
        instance.save(update_fields=["reason"])

        if items_data is not None:
            instance.items.all().delete()

            for data in items_data:
                invoice_item = data["invoice_item"]

                SalesReturnItem.objects.create(
                    sales_return=instance,
                    invoice_item=invoice_item,
                    quantity=data["quantity"],
                    unit_price_usd=invoice_item.unit_price_usd,
                    unit_price_syp=invoice_item.unit_price_syp,
                )

            self.update_totals(instance)

        return instance


class PurchaseReturnSerializer(BaseReturnSerializer):
    items = PurchaseReturnItemSerializer(many=True)

    class Meta:
        model = PurchaseReturn
        fields = [
            "id",
            "invoice",
            "return_date",
            "reason",
            "status",
            "total_amount_usd",
            "total_amount_syp",
            "created_by",
            "items",
        ]
        read_only_fields = [
            "id",
            "return_date",
            "status",
            "total_amount_usd",
            "total_amount_syp",
            "created_by",
        ]

    @staticmethod
    def update_totals(instance):
        total_usd = Decimal("0.00")
        total_syp = Decimal("0.00")

        for return_item in instance.items.all():
            total_usd += return_item.quantity * return_item.unit_cost_usd
            total_syp += return_item.quantity * return_item.unit_cost_syp

        instance.total_amount_usd = total_usd
        instance.total_amount_syp = total_syp
        instance.save(update_fields=["total_amount_usd", "total_amount_syp"])

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        purchase_return = PurchaseReturn.objects.create(**validated_data)

        for data in items_data:
            invoice_item = data["invoice_item"]

            PurchaseReturnItem.objects.create(
                purchase_return=purchase_return,
                invoice_item=invoice_item,
                quantity=data["quantity"],
                unit_cost_usd=invoice_item.unit_cost_usd,
                unit_cost_syp=invoice_item.unit_cost_syp,
            )

        self.update_totals(purchase_return)
        return purchase_return

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        instance.reason = validated_data.get(
            "reason", instance.reason
        )
        instance.save(update_fields=["reason"])

        if items_data is not None:
            instance.items.all().delete()

            for data in items_data:
                invoice_item = data["invoice_item"]

                PurchaseReturnItem.objects.create(
                    purchase_return=instance,
                    invoice_item=invoice_item,
                    quantity=data["quantity"],
                    unit_cost_usd=invoice_item.unit_cost_usd,
                    unit_cost_syp=invoice_item.unit_cost_syp,
                )

            self.update_totals(instance)

        return instance
