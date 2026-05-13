from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.views.generic import RedirectView

urlpatterns = [
    path('', RedirectView.as_view(url='/admin/', permanent=False)),
    path('admin/', admin.site.urls),
    path('api/', include('items.urls')),
    path('api/', include('customers.urls')),
    path('api/', include('branches.urls')),
    path('api/', include('warehouses.urls')),
    path('api/', include('suppliers.urls')),
    path('api/', include('cashboxes.urls')),
    path('api/', include('pos.urls')),
    path('api/', include('expenses.urls')),
    path('api/', include('inventory.urls')),
    path('api/', include('purchases.urls')),
    path('api/', include('finance.urls')),
    path('api/', include('damages.urls')),
    path('api/', include('sales.urls')),    
]