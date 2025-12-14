# In sqlchat/urls.py
from django.contrib import admin
from django.urls import path
from api.views import ChatView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/chat/', ChatView.as_view(), name='chat'),
]