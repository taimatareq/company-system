from rest_framework import serializers
from .models import Item
import uuid


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

    def validate_barcode(self, value):
        if not value:
            return value

        value = value.strip()

        # عند التعديل لا نعتبر باركود نفس المادة تكرارًا
        queryset = Item.objects.filter(barcode=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "المادة موجودة مسبقًا بهذا الباركود."
            )

        return value

    def generate_unique_barcode(self):
        while True:
            # باركود داخلي رقمي من 12 خانة
            barcode = str(uuid.uuid4().int)[:12]

            if not Item.objects.filter(barcode=barcode).exists():
                return barcode

    def create(self, validated_data):
        generate_barcode = validated_data.pop(
            "generate_barcode",
            False
        )

        # إذا اختار المستخدم إنشاء باركود تلقائيًا
        if generate_barcode:
            validated_data["barcode"] = self.generate_unique_barcode()

        # إنشاء code تلقائي كما كان سابقًا
        numeric_codes = []

        for item in Item.objects.all():
            if item.code and item.code.isdigit():
                numeric_codes.append(int(item.code))

        if numeric_codes:
            next_code = str(max(numeric_codes) + 1)
        else:
            next_code = "100000000001"

        validated_data["code"] = next_code

        return super().create(validated_data)

    def update(self, instance, validated_data):
        generate_barcode = validated_data.pop(
            "generate_barcode",
            False
        )

        if generate_barcode:
            validated_data["barcode"] = self.generate_unique_barcode()

        return super().update(instance, validated_data)