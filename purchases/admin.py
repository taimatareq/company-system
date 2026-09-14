from django.contrib import admin, messages
from django.urls import path
from django.shortcuts import redirect
from inventory.models import Inventory
from inventory.services import get_latest_quantity
from .models import PurchaseInvoice, PurchaseInvoiceItem, PurchasePayment
from finance.models import ExchangeRate


class PurchaseInvoiceItemInline(admin.TabularInline):
    model = PurchaseInvoiceItem
    extra = 1
    readonly_fields = ['unit_cost_syp']
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

@admin.register(PurchaseInvoice)
class PurchaseInvoiceAdmin(admin.ModelAdmin):
    actions = None
    inlines = [PurchaseInvoiceItemInline]
    # class Media:
    #     js = ('purchases/admin_purchase.js',)
    list_display = [
        'invoice_number',
        'supplier',
        'warehouse',
        'formatted_invoice_date',
        'payment_type',
        'status',
        'total_amount_usd',
        'total_amount_syp',
    ]

    list_filter = [
        'status',
        'payment_type',
        'warehouse',
        'invoice_date',
    ]

    search_fields = [
        'id',
        'supplier__name',
        'warehouse__name',
    ]

    ordering = ['-id']
    def formatted_invoice_date(self, obj):
        return obj.invoice_date.date()

    formatted_invoice_date.short_description = "Invoice Date"
    def invoice_number(self, obj):
        return f"SI-{obj.id:04d}"
    def invoice_number(self, obj):
        return f"PI-{obj.id:04d}"

    invoice_number.short_description = "Invoice"
    readonly_fields = [
        # 'created_by',
        # 'total_amount',
        'total_amount_usd',
        'total_amount_syp',
        'is_applied',
    ]

    fields = [
        'branch',
        'warehouse',
        'supplier',
        'invoice_date',
        'payment_type',
        'due_date',
        'status',
        'exchange_rate',
        # 'exchange_rate_value',
        # 'created_by',
        # 'total_amount',
        'total_amount_usd',
        'total_amount_syp',
        'is_applied',
    ]
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:invoice_id>/apply/",
                self.admin_site.admin_view(self.apply_invoice_view),
                name="apply_purchase_invoice",
            ),
        ]
        return custom_urls + urls
    def get_changeform_initial_data(self, request):
            initial = super().get_changeform_initial_data(request)

            latest_rate = ExchangeRate.objects.order_by("-rate_date").first()

            if latest_rate:
                initial["exchange_rate"] = latest_rate.id

            return initial
    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user

        if obj.exchange_rate and not obj.exchange_rate_value:
            obj.exchange_rate_value = obj.exchange_rate.usd_to_syp

        super().save_model(request, obj, form, change)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)

        invoice = form.instance
        total_usd = 0
        total_syp = 0

        for invoice_item in invoice.items.all():
            invoice_item.unit_cost_syp = (
                invoice_item.unit_cost_usd * invoice.exchange_rate_value
            )
            invoice_item.save()

            total_usd += invoice_item.quantity * invoice_item.unit_cost_usd
            total_syp += invoice_item.quantity * invoice_item.unit_cost_syp

        invoice.total_amount_usd = total_usd
        invoice.total_amount_syp = total_syp
        invoice.total_amount = total_syp
        invoice.save()

    def response_change(self, request, obj):
        if "_apply" in request.POST:
            return redirect(f"/admin/purchases/purchaseinvoice/{obj.id}/apply/")
        return super().response_change(request, obj)

    def response_add(self, request, obj, post_url_continue=None):
        if "_apply" in request.POST:
            return redirect(f"/admin/purchases/purchaseinvoice/{obj.id}/apply/")
        return super().response_add(request, obj, post_url_continue)

    def apply_invoice_view(self, request, invoice_id):
        invoice = PurchaseInvoice.objects.get(pk=invoice_id)

        if invoice.is_applied:
            messages.warning(request, "Invoice already applied.")
            return redirect(f"/admin/purchases/purchaseinvoice/{invoice_id}/change/")

        for invoice_item in invoice.items.all():
            old_quantity = get_latest_quantity(
                warehouse_id=invoice.warehouse.id,
                item_id=invoice_item.item.id
            )

            new_quantity = old_quantity + invoice_item.quantity

            Inventory.objects.create(
                warehouse=invoice.warehouse,
                item=invoice_item.item,
                quantity=new_quantity,
                operation_type='purchase'
            )

        invoice.is_applied = True
        invoice.save()

        messages.success(request, "Invoice applied successfully.")
        return redirect(f"/admin/purchases/purchaseinvoice/{invoice_id}/change/")

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
admin.site.register(PurchasePayment)