"""
URL configuration for ASPIRE TOUR ERP project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/', include('first_report.urls')),
    path('api/', include('final_report.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]
