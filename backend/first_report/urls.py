from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FirstReportViewSet

router = DefaultRouter()
router.register(r'first-reports', FirstReportViewSet, basename='first-report')

urlpatterns = [
    path('', include(router.urls)),
]
