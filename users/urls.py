from django.urls import path
from .views import (
    UserListCreateView,
    CurrentUserView,
    SendEmailCodeView,
)

urlpatterns = [
    path("", UserListCreateView.as_view(), name="users-list-create"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("send-email-code/", SendEmailCodeView.as_view(), name="send-email-code"),
]