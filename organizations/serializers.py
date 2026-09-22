from rest_framework import serializers
from .models import Organization


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