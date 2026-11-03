from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FinalReportViewSet

router = DefaultRouter()
router.register(r'final-reports', FinalReportViewSet, basename='final-report')

urlpatterns = [
    path('', include(router.urls)),
]
