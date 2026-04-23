from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

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
]