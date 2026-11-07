from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import ExchangeRate
from .serializers import ExchangeRateSerializer


class ExchangeRateViewSet(viewsets.ModelViewSet):
    queryset = ExchangeRate.objects.none()
    serializer_class = ExchangeRateSerializer
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
        return ExchangeRate.objects.filter(
            organization=self.get_organization()
        ).order_by("-rate_date")

    def perform_create(self, serializer):
        serializer.save(
            organization=self.get_organization()
        )

    def perform_update(self, serializer):
        serializer.save(
            organization=self.get_organization()
        )