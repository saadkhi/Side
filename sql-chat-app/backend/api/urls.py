# api/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import ChatView
from .auth_views import register, login, user_profile, logout

urlpatterns = [
    path('chat/', ChatView.as_view()),
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/logout/', logout, name='logout'),
    path('auth/user/', user_profile, name='user_profile'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]