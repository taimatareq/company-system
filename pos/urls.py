from rest_framework.routers import DefaultRouter
from .views import PosViewSet
 
router = DefaultRouter()
router.register(r'pos', PosViewSet)
 
urlpatterns = router.urls