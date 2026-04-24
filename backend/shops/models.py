import uuid
from django.db import models
from django.contrib.auth.models import User


def make_shop_code(name):
    base = name.lower().strip().replace(' ', '-')
    base = ''.join(c for c in base if c.isalnum() or c == '-')[:18]
    return f"{base}-{str(uuid.uuid4())[:4]}"


class Shop(models.Model):
    owner    = models.OneToOneField(User, on_delete=models.CASCADE, related_name='shop')
    name     = models.CharField(max_length=200)
    shop_code = models.CharField(max_length=30, unique=True)
    tagline  = models.CharField(max_length=300, blank=True)
    address  = models.TextField(blank=True)
    phone    = models.CharField(max_length=20, blank=True)
    logo_emoji = models.CharField(max_length=10, default='🏪')
    is_open  = models.BooleanField(default=True)
    upi_id   = models.CharField(max_length=100, blank=True)

    # Delivery settings
    offers_delivery      = models.BooleanField(default=True)
    delivery_radius_km   = models.FloatField(default=5.0)
    delivery_base_charge = models.FloatField(default=20.0)
    delivery_per_km      = models.FloatField(default=10.0)
    delivery_base_km     = models.FloatField(default=2.0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (@{self.shop_code})"

    def calc_delivery(self, km):
        if km <= 0:
            return 0.0
        if km <= self.delivery_base_km:
            return self.delivery_base_charge
        return self.delivery_base_charge + (km - self.delivery_base_km) * self.delivery_per_km

    def to_public_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'shop_code': self.shop_code,
            'tagline': self.tagline,
            'logo_emoji': self.logo_emoji,
            'is_open': self.is_open,
            'address': self.address,
            'phone': self.phone,
            'offers_delivery': self.offers_delivery,
            'delivery_radius_km': self.delivery_radius_km,
            'delivery_base_charge': self.delivery_base_charge,
            'delivery_per_km': self.delivery_per_km,
            'delivery_base_km': self.delivery_base_km,
        }

    def to_owner_dict(self):
        d = self.to_public_dict()
        d['upi_id'] = self.upi_id
        return d


class Supplier(models.Model):
    shop           = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='suppliers')
    name           = models.CharField(max_length=200)
    phone          = models.CharField(max_length=20)
    items_supplied = models.TextField(blank=True)
    notes          = models.TextField(blank=True)
    last_order_at  = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} -> {self.shop.name}"

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'items_supplied': self.items_supplied,
            'notes': self.notes,
            'last_order_at': str(self.last_order_at) if self.last_order_at else None,
        }

class Review(models.Model):
    shop          = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='reviews')
    customer_name = models.CharField(max_length=100, blank=True, default='Anonymous')
    rating        = models.IntegerField(default=5)  # 1-5
    comment       = models.TextField(blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def to_dict(self):
        return {
            'id': self.id,
            'customer_name': self.customer_name or 'Anonymous',
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.strftime('%d %b %Y'),
        }