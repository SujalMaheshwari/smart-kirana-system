# This replaces your project's main urls.py (inside the folder with settings.py)
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/',         admin.site.urls),
    path('api/shops/',     include('shops.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/chatbot/',   include('chatbot.urls')),
]