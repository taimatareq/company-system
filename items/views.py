from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Item
from .serializers import ItemSerializer


class ItemViewSet(viewsets.ModelViewSet):
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # System Admin cannot access company items
        if user.is_superuser:
            return Item.objects.none()

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
            return Item.objects.none()

        return Item.objects.filter(
            organization_id=membership.organization_id
        ).order_by("-id")

    def check_permissions(self, request):
        super().check_permissions(request)

        if request.method in ("GET", "HEAD", "OPTIONS"):
            return

        user = request.user

        if user.is_superuser:
            raise PermissionDenied(
                "System admin cannot modify items."
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
                "Only company admins can manage items."
            )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def item_price(request):
    user = request.user

    if not user.is_authenticated:
        return Response({"detail": "Authentication required."}, status=401)

    if user.is_superuser:
        raise PermissionDenied(
            "System admin cannot access company items."
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
    ):
        raise PermissionDenied(
            "No active organization."
        )

    item_id = request.GET.get("item")

    if not item_id:
        return Response({"retail_price": 0})

    item = Item.objects.filter(
        id=item_id,
        organization_id=membership.organization_id
    ).first()

    if not item:
        return Response({"retail_price": 0})

    return Response({
        "retail_price": item.retail_price
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def item_purchase_price(request):
    item_id = request.GET.get("item")

    if not item_id:
        return Response({"price": 0})

    try:
        item = Item.objects.get(id=item_id)
        return Response({"price": item.retail_price})
    except Item.DoesNotExist:
        return Response({"price": 0})
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def item_by_barcode(request):
    user = request.user

    if user.is_superuser:
        raise PermissionDenied(
            "System admin cannot access company items."
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
    ):
        raise PermissionDenied(
            "No active organization."
        )

    barcode = request.GET.get("barcode", "").strip()

    if not barcode:
        return Response({
            "exists": False,
            "message": "Barcode is required."
        }, status=400)

    item = Item.objects.filter(
        barcode=barcode,
        organization_id=membership.organization_id
    ).first()

    if not item:
        return Response({
            "exists": False,
            "item": None
        })

    return Response({
        "exists": True,
        "item": {
            "id": item.id,
            "name": item.name,
            "code": item.code,
            "barcode": item.barcode,
            "item_type": item.item_type,
            "retail_price": item.retail_price,
            "wholesale_price": item.wholesale_price,
        }
    })