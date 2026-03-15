from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    message = "У вас нет прав для выполнения этого действия."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"