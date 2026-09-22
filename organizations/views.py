from django.shortcuts import render

# Create your views here.
from rest_framework import generics
from rest_framework.permissions import BasePermission

from .models import Organization
from .serializers import OrganizationSerializer


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