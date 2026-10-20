from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Warehouse
from .serializers import WarehouseSerializer

class warehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return Warehouse.objects.none()
        else:
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
                return Warehouse.objects.none()

            queryset = Warehouse.objects.filter(
                organization_id=membership.organization_id
            )

        branch_id = self.request.query_params.get("branch")

        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)

        return queryset


    def check_permissions(self, request):
        super().check_permissions(request)

        if request.method in ("GET", "HEAD", "OPTIONS"):
            return

        user = request.user

        if user.is_superuser:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "System admin cannot modify warehouses."
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
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                "Only company admins can manage warehouses."
            )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def branch_warehouses(request):
    user = request.user

    if not user.is_authenticated:
        return Response(
            {"detail": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    branch_id = request.query_params.get("branch")

    if not branch_id:
        return Response(
            {"branch": "Branch is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if user.is_superuser:
        return Response(
            {"detail": "System admin cannot access company warehouses."},
            status=status.HTTP_403_FORBIDDEN
        )
    else:
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
            return Response(
                {"detail": "No active organization."},
                status=status.HTTP_403_FORBIDDEN
            )

        warehouses = Warehouse.objects.filter(
            branch_id=branch_id,
            organization_id=membership.organization_id,
            branch__organization_id=membership.organization_id
        )

    data = [
        {
            "id": warehouse.id,
            "name": warehouse.name
        }
        for warehouse in warehouses
    ]

    return Response(data)
