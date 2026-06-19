"""
URL configuration for traffic_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# backend/traffic_project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

# 1. Create a simple view for the homepage
def home(request):
    return HttpResponse("<h1>Traffic AI Backend is Running!</h1><p>The API is listening at /api/predict/</p>")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    
    # 2. Add the home path here:
    path('', home),
]
