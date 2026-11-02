from django.urls import path

from .views import (
    UserListCreateView,
    UserUpdateView,
    CurrentUserView,
    SendEmailCodeView,
    GoogleLoginView,
)

urlpatterns = [
    path("", UserListCreateView.as_view(), name="users-list-create"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("send-email-code/", SendEmailCodeView.as_view(), name="send-email-code"),
    path("google-login/", GoogleLoginView.as_view(), name="google-login"),
    path("<int:pk>/",UserUpdateView.as_view(),name="user-update"),
]