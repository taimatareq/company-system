from rest_framework import serializers
from .models import Organization, OrganizationMembership

class OrganizationSerializer(serializers.ModelSerializer):
    users_count = serializers.SerializerMethodField()
    company_admin = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "is_active",
            "users_count",
            "company_admin",
            "created_at",
        ]

    def get_users_count(self, organization):
        return organization.memberships.filter(
            is_active=True
        ).count()

    def get_company_admin(self, organization):
        membership = organization.memberships.filter(
            role="company_admin",
            is_active=True,
        ).select_related("user").first()

        if not membership:
            return None

        user = membership.user

        return {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
        }

class OrganizationMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    class Meta:
        model = OrganizationMembership
        fields = [
            "id",
            "user",
            "username",
            "role",
            "is_active",
            "can_override_sale_price",
        ]

        read_only_fields = [
            "id",
            "user",
            "username",
            "role",
            "is_active",
        ]
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


class EmployeeCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    first_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )

    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )

    email = serializers.EmailField(
        required=False,
        allow_blank=True,
    )

    can_override_sale_price = serializers.BooleanField(
        default=False,
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "This username already exists."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        admin_membership = request.user.organization_membership

        can_override = validated_data.pop(
            "can_override_sale_price",
            False,
        )

        user = User.objects.create_user(**validated_data)

        OrganizationMembership.objects.create(
            organization=admin_membership.organization,
            user=user,
            role="user",
            is_active=True,
            can_override_sale_price=can_override,
        )

        return user