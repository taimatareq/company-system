from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from cashboxes.models import CashBoxTransaction
from .models import Expense, ExpenseCategory
from .serializers import ExpenseSerializer, ExpenseCategorySerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by("-expense_date", "-id")
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        expense = serializer.save(
            created_by=self.request.user
        )

        CashBoxTransaction.objects.create(
            cash_box=expense.cash_box,
            transaction_type="out",
            amount=expense.amount,
           description=f"expense:{expense.id}"
           )


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all().order_by("-id")
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated]