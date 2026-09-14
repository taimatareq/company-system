from rest_framework.routers import DefaultRouter
from .views import DamageViewSet

router = DefaultRouter()
router.register(r'damages', DamageViewSet, basename='damages')

urlpatterns = router.urls