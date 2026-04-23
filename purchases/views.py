from rest_framework import status, viewsets
from rest_framework.response import Response
from .serializers import PurchaseInvoiceCreateSerializer
from .services import PurchaseService
from rest_framework.permissions import IsAuthenticated


class PurchaseInvoiceViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def create(self, request):
        serializer = PurchaseInvoiceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        invoice = PurchaseService.create_invoice(
            validated_data=serializer.validated_data,
            user=request.user
        )

        return Response(
            {
                "id": invoice.id,
                "message": "Purchase invoice created successfully"
            },
            status=status.HTTP_201_CREATED
        )