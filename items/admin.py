from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Item


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'name',
        'code',
        'retail_price',
        'retail_tax_rate',
        'wholesale_price',
        'wholesale_tax_rate',
        'created_at',
    ]

    search_fields = [
        'name',
        'code',
    ]

    readonly_fields = [
        'created_at',
    ]

    fields = [
        'name',
        'code',
        'retail_price',
        'retail_tax_rate',
        'wholesale_price',
        'wholesale_tax_rate',
        'created_at',
    ]