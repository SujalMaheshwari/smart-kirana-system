import uuid
from django.db import models
from inventory.models import Product


class CustomerProfile(models.Model):
    """
    Lightweight customer identity — no login needed.
    Unique per shop + phone. Created/updated on every checkout.
    """
    shop       = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='customers')
    phone      = models.CharField(max_length=20)
    name       = models.CharField(max_length=100)
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen  = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('shop', 'phone')

    def __str__(self):
        return f"{self.name} ({self.phone}) @ {self.shop.name}"


class Order(models.Model):
    PAYMENT_CHOICES     = [('cash', 'Cash on Delivery'), ('upi', 'UPI')]
    FULFILLMENT_CHOICES = [('delivery', 'Delivery'), ('pickup', 'Pickup')]
    STATUS_CHOICES      = [
        ('pending',          'Order Received'),
        ('preparing',        'Being Prepared'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered',        'Delivered'),
    ]

    shop              = models.ForeignKey(
                          'shops.Shop', on_delete=models.CASCADE,
                          related_name='orders', null=True, blank=True,
                        )
    customer_name     = models.CharField(max_length=100, default='Guest')
    customer_phone    = models.CharField(max_length=20, blank=True)
    placed_at         = models.DateTimeField(auto_now_add=True)
    grand_total       = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_charge   = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    distance_km       = models.FloatField(default=0)
    payment_method    = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default='cash')
    payment_confirmed = models.BooleanField(default=False)
    upi_ref           = models.CharField(max_length=100, blank=True, default='')

    fulfillment_type  = models.CharField(max_length=10, choices=FULFILLMENT_CHOICES, default='delivery')
    delivery_address  = models.TextField(blank=True)
    delivery_lat      = models.FloatField(null=True, blank=True)
    delivery_lng      = models.FloatField(null=True, blank=True)
    maps_link         = models.URLField(max_length=500, blank=True)

    status    = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    eta_note  = models.CharField(max_length=200, blank=True, default='',
                    help_text='Delivery time note shown to customer on tracker')
    token     = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    def __str__(self):
        return f"Order #{self.id} | {self.customer_name} | ₹{self.grand_total} | {self.fulfillment_type}"


class OrderItem(models.Model):
    order          = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product        = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name   = models.CharField(max_length=200)
    quantity       = models.FloatField()
    unit           = models.CharField(max_length=10, default='pcs')
    price_at_order = models.DecimalField(max_digits=10, decimal_places=2)
    item_total     = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product_name} {self.quantity}{self.unit} = ₹{self.item_total}"

    def to_dict(self):
        return {
            'name': self.product_name,
            'quantity': self.quantity,
            'unit': self.unit,
            'price': float(self.price_at_order),
            'total': float(self.item_total),
        }