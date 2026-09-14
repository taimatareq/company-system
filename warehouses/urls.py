from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import warehouseViewSet, branch_warehouses

router = DefaultRouter()
router.register(r'warehouses', warehouseViewSet)

urlpatterns = [
    path(
        "warehouses/by-branch/",
        branch_warehouses,
        name="branch_warehouses"
    ),
]

urlpatterns += router.urls