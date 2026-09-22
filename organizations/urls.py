from django.urls import path

from .views import (
    OrganizationListCreateView,
    OrganizationUpdateView,
)


urlpatterns = [
    path(
        "",
        OrganizationListCreateView.as_view(),
        name="organization-list-create",
    ),
    path(
        "<int:pk>/",
        OrganizationUpdateView.as_view(),
        name="organization-detail",
    ),
]