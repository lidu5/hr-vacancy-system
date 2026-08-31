from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView,
    get_current_user, update_profile, change_password,
    UserViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('register/', RegisterView.as_view(), name='register'),  # Disabled - Only admins can create users
    path('me/', get_current_user, name='current_user'),
    path('profile/', update_profile, name='update_profile'),
    path('change-password/', change_password, name='change_password'),
    path('', include(router.urls)),
]