
from inventory.models import Inventory
from inventory.services import get_latest_quantity
from rest_framework.exceptions import ValidationError
from rest_framework import serializers
from inventory.models import Inventory
from inventory.services import get_latest_quantity
from rest_framework.exceptions import ValidationError
from django.db import transaction
from .models import (
    SalesInvoice,
    SalesInvoiceItem,
    SalesRepresentative,
    SalesPayment,
)
from decimal import Decimal
from django.db.models import Sum
from cashboxes.models import CashBoxTransaction
from django.utils import timezone
from django.db import transaction
class SalesInvoiceItemSerializer(serializers.ModelSerializer):

    item_name = serializers.CharField(
        source="item.name",
        read_only=True
    )

    returned_quantity = serializers.SerializerMethodField()
    available_return_quantity = serializers.SerializerMethodField()

    class Meta:
        model = SalesInvoiceItem
        exclude = ["invoice"]

    def get_returned_quantity(self, obj):
        from returns.models import SalesReturnItem
        from django.db.models import Sum
        from decimal import Decimal

        returned = SalesReturnItem.objects.filter(
            invoice_item=obj,
            sales_return__status="confirmed"
        ).aggregate(
            total=Sum("quantity")
        )["total"]

        return returned or Decimal("0")

    def get_available_return_quantity(self, obj):
        returned = self.get_returned_quantity(obj)

        available = obj.quantity - returned

        return max(Decimal("0"), available)
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Sales quantity must be greater than zero."
            )

        if value != value.to_integral_value():
            raise serializers.ValidationError(
                "Sales quantity must be a whole number."
            )

        return value
    def validate_unit_price_usd(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "USD unit price cannot be negative."
            )
        return value


    def validate_unit_price_syp(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "SYP unit price cannot be negative."
            )
        return value
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
    cash_box_name = serializers.CharField(
        source="cash_box.name",
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

        read_only_fields = [
            "total_amount",
            "total_amount_usd",
            "total_amount_syp",
            "status",
            "is_applied",
            "created_by",

        ]
    def get_organization(self):
        request = self.context.get("request")

        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError({
                "organization": "Authenticated user is required."
            })

        membership = getattr(
            request.user,
            "organization_membership",
            None
        )

        if (
            membership is None
            or not membership.is_active
            or not membership.organization.is_active
        ):
            raise serializers.ValidationError({
                "organization": "User does not belong to an active organization."
            })

        return membership.organization
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
        organization = self.get_organization()

        # استخدام القيم الحالية عند تعديل الفاتورة
        instance = self.instance
        exchange_rate = data.get(
            "exchange_rate",
            instance.exchange_rate if instance else None
        )

        if exchange_rate and exchange_rate.organization_id != organization.id:
            raise serializers.ValidationError({
                "exchange_rate": "Exchange rate does not belong to your organization."
            })
        branch = data.get(
            "branch",
            instance.branch if instance else None
        )

        warehouse = data.get(
            "warehouse",
            instance.warehouse if instance else None
        )

        customer = data.get(
            "customer",
            instance.customer if instance else None
        )

        sales_rep = data.get(
            "sales_rep",
            instance.sales_rep if instance else None
        )

        cash_box = data.get(
            "cash_box",
            instance.cash_box if instance else None
        )

        payment_type = data.get(
            "payment_type",
            instance.payment_type if instance else None
        )

        due_date = data.get(
            "due_date",
            instance.due_date if instance else None
        )

        # التحقق من الشركة
        if branch and branch.organization_id != organization.id:
            raise serializers.ValidationError({
                "branch": "Branch does not belong to your organization."
            })

        if warehouse and warehouse.organization_id != organization.id:
            raise serializers.ValidationError({
                "warehouse": "Warehouse does not belong to your organization."
            })

        if warehouse and branch and warehouse.branch_id != branch.id:
            raise serializers.ValidationError({
                "warehouse": "Warehouse must belong to the selected branch."
            })

        if customer and customer.organization_id != organization.id:
            raise serializers.ValidationError({
                "customer": "Customer does not belong to your organization."
            })

        if sales_rep and sales_rep.organization_id != organization.id:
            raise serializers.ValidationError({
                "sales_rep": "Sales representative does not belong to your organization."
            })

        # التحقق من الصندوق النقدي
        if cash_box and branch and cash_box.branch_id != branch.id:
            raise serializers.ValidationError({
                "cash_box": "Cash box must belong to the selected branch."
            })

        # التحقق من البيع النقدي والآجل
        if payment_type == "credit" and not due_date:
            raise serializers.ValidationError({
                "due_date": "Due date is required for credit invoices."
            })

        if payment_type == "cash" and not cash_box:
            raise serializers.ValidationError({
                "cash_box": "Cash box is required for cash invoices."
            })

        # التحقق من المواد داخل الفاتورة
        items_data = data.get("items", [])

        for item_data in items_data:
            item = item_data["item"]

            if item.organization_id != organization.id:
                raise serializers.ValidationError({
                    "items": f"Item {item.id} does not belong to your organization."
                })

        # التحقق من صلاحية تعديل أسعار البيع
        request = self.context["request"]
        membership = request.user.organization_membership

        can_override = (
            membership.role == "company_admin"
            or membership.can_override_sale_price
        )

        if exchange_rate is None:
            raise serializers.ValidationError({
                "exchange_rate": "Exchange rate is required."
            })

        from decimal import Decimal, ROUND_HALF_UP

        for item_data in items_data:
            item = item_data["item"]

            if can_override:
                # المدير أو الموظف المخوّل
                unit_price_usd = item_data.get(
                    "unit_price_usd",
                    item.retail_price,
                )
            else:
                # الموظف العادي: السعر من قاعدة البيانات فقط
                unit_price_usd = item.retail_price

            unit_price_usd = Decimal(str(unit_price_usd))

            # سعر الليرة يُحسب دائمًا على السيرفر
            unit_price_syp = (
                unit_price_usd * exchange_rate.usd_to_syp
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP,
            )

            item_data["unit_price_usd"] = unit_price_usd
            item_data["unit_price_syp"] = unit_price_syp

        return data
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")

        exchange_rate = validated_data.get("exchange_rate")

        if exchange_rate is None:
            raise serializers.ValidationError({
                "exchange_rate": "Exchange rate is required."
            })

        validated_data["exchange_rate_value"] = exchange_rate.usd_to_syp

        validated_data["is_applied"] = True
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
            raise

class SalesRepresentativeSerializer(serializers.ModelSerializer):

    class Meta:
        model = SalesRepresentative
        fields = "__all__"
        read_only_fields = ["organization"]
from django.db.models import Sum


class SalesPaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = SalesPayment
        fields = "__all__"
        extra_kwargs = {
            "cash_box": {
                "required": True,
                "allow_null": False,
            }
        }

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

    @transaction.atomic
    def create(self, validated_data):

        invoice = SalesInvoice.objects.select_for_update().get(
            pk=validated_data["invoice"].pk
        )

        amount = validated_data["amount"]
        cash_box = validated_data["cash_box"]

        total_paid = (
            invoice.payments.aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        remaining = invoice.total_amount_usd - total_paid

        if invoice.status == "paid" or remaining <= 0:
            raise serializers.ValidationError({
                "invoice": "Invoice is already fully paid."
            })

        if amount <= 0:
            raise serializers.ValidationError({
                "amount": "Payment amount must be greater than zero."
            })

        if amount > remaining:
            raise serializers.ValidationError({
                "amount": f"Payment cannot exceed remaining amount: {remaining}"
            })

        if cash_box.box_type != "cash" or cash_box.branch_id != invoice.branch_id:
            raise serializers.ValidationError({
                "cash_box": "Invalid cash box for this invoice."
            })

        validated_data["invoice"] = invoice

        payment = SalesPayment.objects.create(
            **validated_data
        )

        new_total_paid = total_paid + amount

        if new_total_paid < invoice.total_amount_usd:
            invoice.status = "partial"
        else:
            invoice.status = "paid"

        invoice.save(update_fields=["status"])

        CashBoxTransaction.objects.create(
            cash_box=cash_box,
            transaction_type="in",
            amount=amount,
            description=f"sales_payment:{payment.id}:{invoice.id}"
        )

        return payment