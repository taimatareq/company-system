from rest_framework import status, viewsets
from rest_framework.response import Response
from .serializers import PurchaseInvoiceCreateSerializer
from .services import PurchaseService
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from .models import PurchaseInvoice

class PurchaseInvoiceViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    def list(self, request):
        invoices = PurchaseInvoice.objects.all().order_by("-id")

        data = []

        for invoice in invoices:
            data.append({
                "id": invoice.id,
                "invoice_number": f"PI-{invoice.id:04d}",
                "supplier": invoice.supplier.name,
                "warehouse": invoice.warehouse.name,
                "invoice_date": invoice.invoice_date,
                "payment_type": invoice.payment_type,
                "status": invoice.status,
                "total_amount_usd": invoice.total_amount_usd,
                "total_amount_syp": invoice.total_amount_syp,
            })

        return Response(data)
    def retrieve(self, request, pk=None):
        invoice = PurchaseInvoice.objects.get(pk=pk)

        items = []

        for invoice_item in invoice.items.all():
            items.append({
                "id": invoice_item.id,
                "item": invoice_item.item.name,
                "quantity": invoice_item.quantity,
                "unit_cost_usd": invoice_item.unit_cost_usd,
                "unit_cost_syp": invoice_item.unit_cost_syp,
                "total_usd": invoice_item.quantity * invoice_item.unit_cost_usd,
                "total_syp": invoice_item.quantity * invoice_item.unit_cost_syp,
            })

        return Response({
            "id": invoice.id,
            "invoice_number": f"PI-{invoice.id:04d}",
            "branch": invoice.branch.name,
            "warehouse": invoice.warehouse.name,
            "supplier": invoice.supplier.name,
            "invoice_date": invoice.invoice_date,
            "payment_type": invoice.payment_type,
            "status": invoice.status,
            "total_amount_usd": invoice.total_amount_usd,
            "total_amount_syp": invoice.total_amount_syp,
            "items": items,
        })
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

    def update(self, request, pk=None):
        raise ValidationError("Purchase invoices cannot be updated after creation.")

    def partial_update(self, request, pk=None):
        raise ValidationError("Purchase invoices cannot be updated after creation.")

    def destroy(self, request, pk=None):
        raise ValidationError("Purchase invoices cannot be deleted after creation.")