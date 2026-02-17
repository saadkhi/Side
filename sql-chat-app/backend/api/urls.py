# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import ChatView, ConversationViewSet
from .auth_views import register, login, user_profile, logout

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', ChatView.as_view()),
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/logout/', logout, name='logout'),
    path('auth/user/', user_profile, name='user_profile'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]