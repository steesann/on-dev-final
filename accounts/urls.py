from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import TokenView, ProfileView, RegisterView

urlpatterns = [
    path("token/", TokenView.as_view(), name="token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("register/", RegisterView.as_view(), name="register"),
]