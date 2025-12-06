# api/urls.py
from django.urls import path
from .views import ChatView

urlpatterns = [
    path('chat/', ChatView.as_view()),
]

# sqlchat/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]