from django.shortcuts import render
from rest_framework import viewsets
from .models import SalesInvoice
from .serializers import SalesInvoiceSerializer


class SalesInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SalesInvoice.objects.all().order_by('-id')
    serializer_class = SalesInvoiceSerializer

# from django.template.loader import get_template
# from django.http import HttpResponse
# from xhtml2pdf import pisa


# def sales_invoice_pdf(request, invoice_id):
#     invoice = SalesInvoice.objects.get(pk=invoice_id)

#     template = get_template("invoices/sales_invoice_pdf.html")

#     html = template.render({
#         "invoice": invoice
#     })

#     response = HttpResponse(content_type="application/pdf")
#     response["Content-Disposition"] = (
#         f'inline; filename="SI-{invoice.id:04d}.pdf"'
#     )

#     pisa.CreatePDF(html, dest=response)

#     return response
from django.shortcuts import render
from .models import SalesInvoice


def sales_invoice_print(request, invoice_id):
    invoice = SalesInvoice.objects.get(pk=invoice_id)
    return render(request, "invoices/sales_invoice_print.html", {
        "invoice": invoice
    })