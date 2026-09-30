
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
    SalesPayment,
)
from django.db.models import Sum
from cashboxes.models import CashBoxTransaction
from django.utils import timezone

class SalesInvoiceItemSerializer(serializers.ModelSerializer):

    item_name = serializers.CharField(
        source="item.name",
        read_only=True
    )

    class Meta:
        model = SalesInvoiceItem
        exclude = ["invoice"]


class SalesInvoiceSerializer(serializers.ModelSerializer):
    total_paid = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()

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

    def get_total_paid(self, obj):
        return (
            obj.payments.aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

    def get_remaining(self, obj):
        paid = self.get_total_paid(obj)

        return (
            obj.total_amount_usd
            - paid
        )

    def validate(self, data):
        payment_type = data.get("payment_type")
        due_date = data.get("due_date")
        cash_box = data.get("cash_box")

        if payment_type == "credit" and not due_date:
            raise serializers.ValidationError({
                "due_date": "Due date is required for credit invoices."
            })

        if payment_type == "cash" and not cash_box:
            raise serializers.ValidationError({
                "cash_box": "Cash box is required for cash invoices."
            })

        if (
            cash_box
            and data.get("branch")
            and cash_box.branch_id != data["branch"].id
        ):
            raise serializers.ValidationError({
                "cash_box": "Cash box must belong to the selected branch."
            })

        return data

    def create(self, validated_data):
        items_data = validated_data.pop("items")

        invoice = SalesInvoice.objects.create(**validated_data)

        total_usd = 0
        total_syp = 0

        try:
            for item_data in items_data:
                item = item_data["item"]
                quantity = item_data["quantity"]

                # تحقق من المخزون قبل الخصم
                if item.item_type != "service":
                    old_quantity = get_latest_quantity(
                        warehouse_id=invoice.warehouse.id,
                        item_id=item.id
                    )

                    if old_quantity < quantity:
                        raise ValidationError({
                            "stock": (
                                f"Not enough stock for {item.name}. "
                                f"Available: {old_quantity}"
                            )
                        })

                invoice_item = SalesInvoiceItem.objects.create(
                    invoice=invoice,
                    **item_data
                )

                # خصم المخزون
                if item.item_type != "service":
                    new_quantity = old_quantity - quantity

                    Inventory.objects.create(
                        warehouse=invoice.warehouse,
                        item=item,
                        quantity=new_quantity,
                        operation_type="sale"
                    )

                total_usd += (
                    invoice_item.quantity
                    * invoice_item.unit_price_usd
                )

                total_syp += (
                    invoice_item.quantity
                    * invoice_item.unit_price_syp
                )

            # حفظ الإجماليات
            invoice.total_amount_usd = total_usd
            invoice.total_amount_syp = total_syp
            invoice.total_amount = total_syp

            # تحديد الحالة من الـ Backend
            if invoice.payment_type == "cash":
                invoice.status = "paid"
            else:
                invoice.status = "unpaid"

            invoice.save()

            # =========================
            # CASH SALE
            # =========================
            if invoice.payment_type == "cash":

                payment = SalesPayment.objects.create(
                    invoice=invoice,
                    payment_date=timezone.now(),
                    amount=total_usd,
                    notes="Automatic payment for cash sale"
                )

                CashBoxTransaction.objects.create(
                    cash_box=invoice.cash_box,
                    transaction_type="in",
                    amount=total_usd,
                    description=f"Cash sale - Invoice SI-{invoice.id:04d}"
                )

            return invoice

        except Exception:
            invoice.delete()
            raise

class SalesRepresentativeSerializer(serializers.ModelSerializer):

    class Meta:
        model = SalesRepresentative
        fields = "__all__"
from django.db.models import Sum


class SalesPaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = SalesPayment
        fields = "__all__"

    def validate(self, data):
        invoice = data.get("invoice")
        cash_box = data.get("cash_box")
        amount = data.get("amount")

        if not cash_box:
            raise serializers.ValidationError({
                "cash_box": "Cash box is required."
            })

        if cash_box.box_type != "cash":
            raise serializers.ValidationError({
                "cash_box": "Selected cash box must be a cash box."
            })

        if invoice and cash_box.branch_id != invoice.branch_id:
            raise serializers.ValidationError({
                "cash_box": "Cash box must belong to the invoice branch."
            })

        if invoice and amount:
            total_paid = (
                invoice.payments.aggregate(
                    total=Sum("amount")
                )["total"] or 0
            )

            remaining = (
                invoice.total_amount_usd - total_paid
            )

            if amount > remaining:
                raise serializers.ValidationError({
                    "amount": (
                        f"Payment cannot exceed remaining amount: "
                        f"{remaining}"
                    )
                })

        return data

    def create(self, validated_data):
        payment = SalesPayment.objects.create(
            **validated_data
        )

        invoice = payment.invoice

        total_paid = (
            invoice.payments.aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        invoice_total = invoice.total_amount_usd

        if total_paid <= 0:
            invoice.status = "unpaid"

        elif total_paid < invoice_total:
            invoice.status = "partial"

        else:
            invoice.status = "paid"

        invoice.save(update_fields=["status"])

        CashBoxTransaction.objects.create(
            cash_box=payment.cash_box,
            transaction_type="in",
            amount=payment.amount,
            description=(
                f"Customer payment - "
                f"Invoice SI-{invoice.id:04d}"
            )
        )

        return payment