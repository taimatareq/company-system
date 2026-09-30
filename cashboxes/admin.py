from django.contrib import admin
from .models import CashBox, CashBoxTransaction


@admin.register(CashBox)
class CashBoxAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "branch",
        "box_type",
        "created_at",
    )


@admin.register(CashBoxTransaction)
class CashBoxTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "cash_box",
        "transaction_type",
        "amount",
        "description",
        "created_at",
    )

    list_filter = (
        "cash_box",
        "transaction_type",
    )