
from rest_framework import serializers
from .models import Warehouse


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = "__all__"
        read_only_fields = ["organization"]

    def validate(self, data):
        user = self.context["request"].user

        warehouse_type = data.get(
            "type",
            self.instance.type if self.instance else None
        )
        branch = data.get(
            "branch",
            self.instance.branch if self.instance else None
        )

        if warehouse_type == "branch" and not branch:
            raise serializers.ValidationError({
                "branch": "Branch warehouse must have a branch."
            })

        if warehouse_type == "main" and branch:
            raise serializers.ValidationError({
                "branch": "Main warehouse should not have a branch."
            })

        if not user.is_superuser:
            membership = getattr(
                user,
                "organization_membership",
                None
            )

            if (
                not membership
                or not membership.is_active
                or not membership.organization.is_active
            ):
                raise serializers.ValidationError(
                    "You do not have an active organization."
                )

            if branch and branch.organization_id != membership.organization_id:
                raise serializers.ValidationError({
                    "branch": "Branch belongs to another organization."
                })

        return data

    def create(self, validated_data):
        user = self.context["request"].user

        if user.is_superuser:
            raise serializers.ValidationError({
                "organization": (
                    "System admin must specify an organization "
                    "through a dedicated administration workflow."
                )
            })

        membership = user.organization_membership
        validated_data["organization"] = membership.organization

        return super().create(validated_data)
