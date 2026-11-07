from django.urls import path

from .views import (
    OrganizationListCreateView,
    OrganizationUpdateView,
    OrganizationMembershipPermissionView,
    OrganizationEmployeesListView,
    OrganizationEmployeeCreateView,
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
    path(
        "memberships/<int:pk>/permissions/",
        OrganizationMembershipPermissionView.as_view(),
        name="organization-membership-permissions",
    ),
    path(
    "employees/",
    OrganizationEmployeesListView.as_view(),
    name="organization-employees",
    ),
    path(
    "employees/create/",
    OrganizationEmployeeCreateView.as_view(),
    name="organization-employee-create",
    ),
]