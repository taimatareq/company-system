# expenses/urls.py
from rest_framework.routers import DefaultRouter
from .views import ExpenseViewSet, ExpenseCategoryViewSet

router = DefaultRouter()
router.register(r'expenses', ExpenseViewSet)
router.register(r'expense-categories', ExpenseCategoryViewSet)

urlpatterns = router.urls