from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    # This controls what columns the shop owner sees in the dashboard
    list_display = ('name', 'price', 'stock_quantity', 'min_stock_level', 'barcode')
    search_fields = ('name', 'barcode')
    list_filter = ('stock_quantity',)