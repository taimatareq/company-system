
from rest_framework import serializers
from .models import Branch


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = "__all__"
        read_only_fields = ["organization"]

    def create(self, validated_data):
        user = self.context["request"].user

        membership = getattr(
            user,
            "organization_membership",
            None
        )

        if (
            not membership
            or not membership.is_active
            or not membership.organization.is_active
            or membership.role != "company_admin"
        ):
            raise serializers.ValidationError(
                "Only company admins can create branches."
            )

        validated_data["organization"] = membership.organization

        return super().create(validated_data)
