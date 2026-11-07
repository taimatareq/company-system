from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.none()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_organization(self):
        membership = getattr(
            self.request.user,
            "organization_membership",
            None
        )

        if (
            membership is None
            or not membership.is_active
            or not membership.organization.is_active
        ):
            raise PermissionDenied(
                "User does not belong to an active organization."
            )

        return membership.organization

    def get_queryset(self):
        organization = self.get_organization()

        return Customer.objects.filter(
            organization=organization
        )

    def perform_create(self, serializer):
        organization = self.get_organization()

        serializer.save(
            organization=organization
        )

    def perform_update(self, serializer):
        organization = self.get_organization()

        serializer.save(
            organization=organization
        )