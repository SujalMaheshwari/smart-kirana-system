# backend/shops/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('register/',        views.register_owner,  name='shop-register'),
    path('login/',           views.login_owner,     name='shop-login'),
    path('logout/',          views.logout_owner,    name='shop-logout'),
    path('me/',              views.me,              name='shop-me'),
    # Owner actions
    path('update/',          views.shop_update,     name='shop-update'),
    path('dashboard/',       views.dashboard,       name='shop-dashboard'),
    path('suppliers/',       views.suppliers_list,  name='suppliers-list'),
    path('suppliers/add/',   views.supplier_create, name='supplier-create'),
    path('suppliers/<int:supplier_id>/delete/', views.supplier_delete, name='supplier-delete'),
    path('reviews/',         views.reviews,         name='shop-reviews'),
    # Public (no auth) — must be last to avoid swallowing other routes
    path('<str:shop_code>/', views.shop_public,     name='shop-public'),
]