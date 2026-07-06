from rest_framework import serializers
from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    code = serializers.CharField(read_only=True)

    class Meta:
        model = Item
        fields = "__all__"

    def create(self, validated_data):
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