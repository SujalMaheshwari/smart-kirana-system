from django.urls import path
from . import views

urlpatterns = [
    path('admin/',          views.admin_chat,          name='admin-chat'),
    path('customer/',       views.customer_chat,        name='customer-chat'),
    path('checkout/',       views.checkout,             name='checkout'),
    path('confirm-payment/', views.confirm_payment,     name='confirm-payment'),
    path('my-orders/',      views.my_orders,            name='my-orders'),
    path('track/',          views.track_order,          name='track-order'),
    path('order-status/',   views.update_order_status,  name='order-status'),
]