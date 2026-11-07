from django.shortcuts import render

# Create your views here.
from rest_framework import generics
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Organization, OrganizationMembership
from .serializers import (
    OrganizationSerializer,
    OrganizationMembershipSerializer,
    EmployeeCreateSerializer,
)

class IsSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class OrganizationListCreateView(generics.ListCreateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [IsSystemAdmin]

    def get_queryset(self):
        return Organization.objects.all().order_by("-created_at")


class OrganizationUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [IsSystemAdmin]
    queryset = Organization.objects.all()

    http_method_names = ["get", "patch"]

class OrganizationMembershipPermissionView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = OrganizationMembershipSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch"]

    def get_queryset(self):
        membership = getattr(
            self.request.user,
            "organization_membership",
            None,
        )

        if (
            membership is None
            or not membership.is_active
            or not membership.organization.is_active
            or membership.role != "company_admin"
        ):
            raise PermissionDenied(
                "Only an active company admin can manage permissions."
            )

        return OrganizationMembership.objects.filter(
            organization=membership.organization,
            role="user",
        ).select_related("user")
class OrganizationEmployeesListView(generics.ListAPIView):
    serializer_class = OrganizationMembershipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        membership = getattr(
            self.request.user,
            "organization_membership",
            None,
        )

        if (
            membership is None
            or not membership.is_active
            or not membership.organization.is_active
            or membership.role != "company_admin"
        ):
            raise PermissionDenied(
                "Only an active company admin can view employees."
            )

        return OrganizationMembership.objects.filter(
            organization=membership.organization,
            role="user",
        ).select_related("user").order_by("user__username")
class OrganizationEmployeeCreateView(generics.CreateAPIView):
    serializer_class = EmployeeCreateSerializer
    permission_classes = [IsAuthenticated]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)

        membership = getattr(
            request.user,
            "organization_membership",
            None,
        )

        if (
            membership is None
            or not membership.is_active
            or not membership.organization.is_active
            or membership.role != "company_admin"
        ):
            raise PermissionDenied(
                "Only an active company admin can create employees."
            )