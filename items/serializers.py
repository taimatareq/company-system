from rest_framework import serializers
from .models import Item
import uuid
from django.db import transaction
from organizations.models import Organization

class ItemSerializer(serializers.ModelSerializer):
    code = serializers.CharField(read_only=True)

    # هذا الحقل يأتي من الواجهة فقط وليس موجودًا في قاعدة البيانات
    generate_barcode = serializers.BooleanField(
        write_only=True,
        required=False,
        default=False
    )

    class Meta:
        model = Item
        fields = "__all__"
        read_only_fields = ["organization"]

    def validate_barcode(self, value):
        if not value or not value.strip():
            return None

        value = value.strip()

        user = self.context["request"].user
        membership = getattr(
            user,
            "organization_membership",
            None
        )

        if (
            user.is_superuser
            or not membership
            or not membership.is_active
            or not membership.organization.is_active
        ):
            raise serializers.ValidationError(
                "No active organization."
            )

        queryset = Item.objects.filter(
            organization_id=membership.organization_id,
            barcode=value
        )

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "المادة موجودة مسبقًا بهذا الباركود."
            )

        return value

    def generate_unique_barcode(self):
        user = self.context["request"].user
        membership = getattr(
            user,
            "organization_membership",
            None
        )

        if (
            user.is_superuser
            or not membership
            or not membership.is_active
            or not membership.organization.is_active
            or membership.role != "company_admin"
        ):
            raise serializers.ValidationError(
                "Only company admins can generate barcodes."
            )

        while True:
            barcode = str(uuid.uuid4().int)[:12]

            if not Item.objects.filter(
                organization_id=membership.organization_id,
                barcode=barcode
            ).exists():
                return barcode

    def create(self, validated_data):
        generate_barcode = validated_data.pop(
            "generate_barcode", False
        )

        user = self.context["request"].user
        membership = getattr(
            user,
            "organization_membership",
            None
        )

        if (
            user.is_superuser
            or not membership
            or not membership.is_active
            or not membership.organization.is_active
            or membership.role != "company_admin"
        ):
            raise serializers.ValidationError(
                "Only company admins can create items."
            )

        with transaction.atomic():
            # قفل سجل الشركة أثناء توليد الكود وحفظ الصنف
            organization = Organization.objects.select_for_update().get(
                pk=membership.organization_id,
                is_active=True
            )

            if generate_barcode:
                validated_data["barcode"] = (
                    self.generate_unique_barcode()
                )

            # جلب الأكواد الرقمية الخاصة بالشركة فقط
            numeric_codes = []

            for item in Item.objects.filter(
                organization=organization
            ).only("code"):
                if item.code and item.code.isdigit():
                    numeric_codes.append(int(item.code))

            if numeric_codes:
                next_code = str(max(numeric_codes) + 1)
            else:
                next_code = "100000000001"

            validated_data["code"] = next_code
            validated_data["organization"] = organization

            return super().create(validated_data)
    def update(self, instance, validated_data):
        generate_barcode = validated_data.pop(
            "generate_barcode",
            False
        )

        if generate_barcode:
            validated_data["barcode"] = self.generate_unique_barcode()

        return super().update(instance, validated_data)