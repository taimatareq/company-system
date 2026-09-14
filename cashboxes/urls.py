from rest_framework.routers import DefaultRouter
from .views import CashBoxViewSet
 
router = DefaultRouter()
router.register(r'cashboxes', CashBoxViewSet)
 
urlpatterns = router.urls