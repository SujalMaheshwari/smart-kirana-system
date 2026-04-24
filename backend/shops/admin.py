from django.contrib import admin
from .models import Shop, Supplier


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ('name', 'shop_code', 'owner', 'is_open', 'offers_delivery', 'created_at')
    search_fields = ('name', 'shop_code', 'owner__email')
    list_filter = ('is_open', 'offers_delivery')
    readonly_fields = ('created_at',)


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'shop', 'phone', 'last_order_at')
    search_fields = ('name', 'shop__name', 'phone')