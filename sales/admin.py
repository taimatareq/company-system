from django.contrib import admin
from .models import SalesInvoice, SalesInvoiceItem, SalesPayment
from django.forms.models import BaseInlineFormSet
from django.core.exceptions import ValidationError
from inventory.services import get_latest_quantity
from django.contrib import messages
from django.urls import path
from django.shortcuts import redirect
from inventory.models import Inventory
from finance.models import ExchangeRate

class SalesInvoiceItemInlineFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()

        invoice = self.instance
        warehouse = invoice.warehouse

        for form in self.forms:
            if not form.cleaned_data or form.cleaned_data.get("DELETE"):
                continue

            item = form.cleaned_data.get("item")
            quantity = form.cleaned_data.get("quantity")

            if item and quantity:
                available = get_latest_quantity(
                    warehouse_id=warehouse.id,
                    item_id=item.id
                )

                if available < quantity:
                    raise ValidationError(
                        f"الكمية غير كافية للمادة {item.name}. المتوفر: {available}"
                    )
class SalesInvoiceItemInline(admin.TabularInline):
    model = SalesInvoiceItem
    formset = SalesInvoiceItemInlineFormSet
    extra = 1

    readonly_fields = [
        'unit_price_syp',
        'line_total_usd_display',
        'line_total_syp_display',
    ]

    fields = [
        'item',
        'quantity',
        'unit_price_usd',
        'unit_price_syp',
        'line_total_usd_display',
        'line_total_syp_display',
    ]

    def line_total_usd_display(self, obj):
        if not obj.pk:
            return "0.00"
        return obj.quantity * obj.unit_price_usd

    line_total_usd_display.short_description = "Line total USD"

    def line_total_syp_display(self, obj):
        if not obj.pk:
            return "0.00"
        return obj.quantity * obj.unit_price_syp

    line_total_syp_display.short_description = "Line total SYP"
    def has_add_permission(self, request, obj=None):
        if obj and obj.is_applied:
            return False
        return super().has_add_permission(request, obj)

    def has_change_permission(self, request, obj=None):
        if obj and obj.is_applied:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        if obj and obj.is_applied:
            return False
        return super().has_delete_permission(request, obj)
    
@admin.register(SalesInvoice)
class SalesInvoiceAdmin(admin.ModelAdmin):
    actions = None
    # class Media:
    #     js = ('sales/admin_sales.js',)
    inlines = [SalesInvoiceItemInline]
    list_display = [
        'invoice_number',
        'customer',
        'warehouse',
        'formatted_invoice_date',
        'payment_type',
        'status',
        'total_amount_usd',
        'total_amount_syp',
        'sales_rep',
    ]

    list_filter = [
        'status',
        'payment_type',
        'warehouse',
        'invoice_date',
    ]

    search_fields = [
        'id',
        'customer__name',
        'warehouse__name',
        'sales_rep',
    ]

    ordering = ['-id']

    def formatted_invoice_date(self, obj):
        return obj.invoice_date.date()

    formatted_invoice_date.short_description = "Invoice Date"
    def invoice_number(self, obj):
        return f"SI-{obj.id:04d}"

    invoice_number.short_description = "Invoice"
    readonly_fields = [
        'created_by',
        'total_amount',
        'total_amount_usd',
        'total_amount_syp',
        'is_applied',
    ]
    fields = [
        'branch',
        'warehouse',
        'customer',
        'invoice_date',
        'payment_type',
        'due_date',
        'status',
        'exchange_rate',
        # 'exchange_rate_value',
        # 'created_by',
        'total_amount',
        'total_amount_usd',
        'total_amount_syp',
        'is_applied',
    ]
    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)

        latest_rate = ExchangeRate.objects.order_by("-rate_date").first()

        if latest_rate:
            initial["exchange_rate"] = latest_rate.id

        return initial
    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user

        if obj.exchange_rate:
            obj.exchange_rate_value = obj.exchange_rate.usd_to_syp

        super().save_model(request, obj, form, change)
    def recalculate_invoice_totals(self, invoice):
        invoice = SalesInvoice.objects.get(pk=invoice.pk)

        if invoice.exchange_rate:
            invoice.exchange_rate_value = invoice.exchange_rate.usd_to_syp

        total_usd = 0
        total_syp = 0

        for invoice_item in SalesInvoiceItem.objects.filter(invoice=invoice):
            unit_syp = invoice_item.unit_price_usd * invoice.exchange_rate_value

            invoice_item.unit_price_syp = unit_syp
            invoice_item.save(update_fields=["unit_price_syp"])

            total_usd += invoice_item.quantity * invoice_item.unit_price_usd
            total_syp += invoice_item.quantity * unit_syp

        SalesInvoice.objects.filter(pk=invoice.pk).update(
            exchange_rate_value=invoice.exchange_rate_value,
            total_amount_usd=total_usd,
            total_amount_syp=total_syp,
            total_amount=total_syp,
        )
    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        invoice = form.instance
        self.recalculate_invoice_totals(invoice)
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:invoice_id>/apply/",
                self.admin_site.admin_view(self.apply_invoice_view),
                name="apply_sales_invoice",
            ),
        ]
        return custom_urls + urls


    def response_add(self, request, obj, post_url_continue=None):
        if "_apply" in request.POST:
            return redirect(f"/admin/sales/salesinvoice/{obj.id}/apply/")
        return super().response_add(request, obj, post_url_continue)


    def response_change(self, request, obj):
        if "_apply" in request.POST:
            return redirect(f"/admin/sales/salesinvoice/{obj.id}/apply/")
        return super().response_change(request, obj)


    def apply_invoice_view(self, request, invoice_id):
        invoice = SalesInvoice.objects.get(pk=invoice_id)

        if invoice.is_applied:
            messages.warning(request, "Invoice already applied.")
            return redirect(f"/admin/sales/salesinvoice/{invoice_id}/change/")
        self.recalculate_invoice_totals(invoice)

        for invoice_item in invoice.items.all():
            old_quantity = get_latest_quantity(
                warehouse_id=invoice.warehouse.id,
                item_id=invoice_item.item.id
            )

            if old_quantity < invoice_item.quantity:
                messages.error(
                    request,
                    f"الكمية غير كافية للمادة {invoice_item.item.name}. المتوفر: {old_quantity}"
                )
                return redirect(f"/admin/sales/salesinvoice/{invoice_id}/change/")

            new_quantity = old_quantity - invoice_item.quantity

            Inventory.objects.create(
                warehouse=invoice.warehouse,
                item=invoice_item.item,
                quantity=new_quantity,
                operation_type="sale"
            )
        # invoice.is_applied = True
        # invoice.save()

        # messages.success(request, "Sales invoice applied successfully.")
        # return redirect(f"/admin/sales/salesinvoice/{invoice_id}/change/")
        self.recalculate_invoice_totals(invoice)

        invoice = SalesInvoice.objects.get(pk=invoice_id)
        invoice.is_applied = True
        invoice.save(update_fields=["is_applied"])

        messages.success(request, "Sales invoice applied successfully.")
        return redirect(f"/admin/sales/salesinvoice/{invoice_id}/change/")

    def has_change_permission(self, request, obj=None):
        return True

    def has_delete_permission(self, request, obj=None):
        if obj and obj.is_applied:
            return False
        return super().has_delete_permission(request, obj)

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.is_applied:
            return [field.name for field in obj._meta.fields]
        return self.readonly_fields

    def get_inline_instances(self, request, obj=None):
        inline_instances = super().get_inline_instances(request, obj)

        if obj and obj.is_applied:
            for inline in inline_instances:
                inline.can_delete = False
                inline.extra = 0

        return inline_instances
# admin.site.register(SalesInvoiceItem)
admin.site.register(SalesPayment)
from .models import SalesRepresentative

admin.site.register(SalesRepresentative)