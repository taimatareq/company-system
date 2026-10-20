
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Branch
from .serializers import BranchSerializer


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # System Admin cannot access company branches
        if user.is_superuser:
            return Branch.objects.none()

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
            return Branch.objects.none()

        return Branch.objects.filter(
            organization_id=membership.organization_id
        )

    def check_permissions(self, request):
        super().check_permissions(request)

        # Read-only requests
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return

        user = request.user

        if user.is_superuser:
            raise PermissionDenied(
                "System admin cannot modify branches."
            )

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
            raise PermissionDenied(
                "Only company admins can manage branches."
            )
