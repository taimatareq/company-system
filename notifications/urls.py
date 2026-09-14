from django.urls import path
from .views import notifications_summary

urlpatterns = [
    path("notifications/", notifications_summary),
]