from django.urls import path
from .views import (
    DashboardOverviewView,
    DashboardFinancialChartView,
    DashboardReportStatusView,
    DashboardPaymentSummaryView,
    DashboardRecentReportsView,
    DashboardUpcomingToursView,
)

urlpatterns = [
    path('overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('financial-chart/', DashboardFinancialChartView.as_view(), name='dashboard-financial-chart'),
    path('report-status/', DashboardReportStatusView.as_view(), name='dashboard-report-status'),
    path('payment-summary/', DashboardPaymentSummaryView.as_view(), name='dashboard-payment-summary'),
    path('recent-reports/', DashboardRecentReportsView.as_view(), name='dashboard-recent-reports'),
    path('upcoming-tours/', DashboardUpcomingToursView.as_view(), name='dashboard-upcoming-tours'),
]
