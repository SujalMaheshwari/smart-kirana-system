# backend/inventory/models.py
from django.db import models

CATEGORY_CHOICES = [
    ('dairy','Dairy & Eggs'),('grains','Grains & Pulses'),('snacks','Snacks & Biscuits'),
    ('beverages','Beverages'),('spices','Spices & Masala'),('oil','Oil & Ghee'),
    ('personal','Personal Care'),('cleaning','Cleaning'),('other','Other'),
]

class Product(models.Model):
    # Each product belongs to one shop
    shop            = models.ForeignKey(
                        'shops.Shop',
                        on_delete=models.CASCADE,
                        related_name='products',
                        null=True,   # null=True so existing rows don't break on migration
                        blank=True,
                      )
    name            = models.CharField(max_length=200)
    barcode         = models.CharField(max_length=100, unique=True, blank=True, null=True)
    price           = models.DecimalField(max_digits=10, decimal_places=2)
    category        = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    stock_quantity  = models.FloatField(default=0)
    min_stock_level = models.FloatField(default=5)
    is_loose        = models.BooleanField(default=False, help_text='Sold by weight — price is per kg')
    description     = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} | Rs.{self.price} | {self.stock_quantity}{'kg' if self.is_loose else 'pcs'}"

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': float(self.price),
            'category': self.category,
            'stock_quantity': self.stock_quantity,
            'min_stock_level': self.min_stock_level,
            'is_loose': self.is_loose,
            'barcode': self.barcode or '',
            'description': self.description or '',
        }