from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Item
from .serializers import ItemSerializer


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().order_by("-id")
    serializer_class = ItemSerializer
    permission_classes = [AllowAny]


@api_view(["GET"])
def item_price(request):
    item_id = request.GET.get("item")

    if not item_id:
        return Response({"retail_price": 0})

    try:
        item = Item.objects.get(id=item_id)
        return Response({"retail_price": item.retail_price})
    except Item.DoesNotExist:
        return Response({"retail_price": 0})


@api_view(["GET"])
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
def item_by_barcode(request):
    barcode = request.GET.get("barcode", "").strip()

    if not barcode:
        return Response(
            {
                "exists": False,
                "message": "Barcode is required."
            },
            status=400
        )

    try:
        item = Item.objects.get(barcode=barcode)

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

    except Item.DoesNotExist:
        return Response({
            "exists": False,
            "item": None
        })