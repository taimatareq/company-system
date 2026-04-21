from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('items.urls')),
    path('api/', include('customers.urls')),
    path('api/', include('branches.urls')),
    path('api/', include('warehouses.urls')),
    path('api/', include('suppliers.urls')),
    path('api/', include('cashboxes.urls')),
    path('api/', include('pos.urls')),
    path('api/', include('expenses.urls')),
]