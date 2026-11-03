from django.contrib import admin
from .models import (
    FinalReport, 
    FinalReportClientService, 
    FinalReportDMCService, 
    FinalReportPayment, 
    FinalReportPaymentSpent
)


class FinalReportClientServiceInline(admin.TabularInline):
    model = FinalReportClientService
    extra = 1


class FinalReportDMCServiceInline(admin.TabularInline):
    model = FinalReportDMCService
    extra = 1


class FinalReportPaymentInline(admin.TabularInline):
    model = FinalReportPayment
    extra = 1


class FinalReportPaymentSpentInline(admin.TabularInline):
    model = FinalReportPaymentSpent
    extra = 1


@admin.register(FinalReport)
class FinalReportAdmin(admin.ModelAdmin):
    list_display = (
        'crm_id', 'guest_name', 'destination', 'tour_type', 'branch',
        'travel_date', 'total_pax', 'total_cost', 'total_cost_with_gst',
        'total_expense', 'processing_fee', 'net_profit', 
        'total_collected_amount', 'total_spent_amount'
    )
    search_fields = ('crm_id', 'guest_name', 'mobile_no', 'destination', 'sales_by')
    list_filter = ('tour_type', 'branch', 'client_type', 'gst_collected')
    inlines = [
        FinalReportClientServiceInline, 
        FinalReportDMCServiceInline, 
        FinalReportPaymentInline,
        FinalReportPaymentSpentInline
    ]


@admin.register(FinalReportPayment)
class FinalReportPaymentAdmin(admin.ModelAdmin):
    list_display = ('final_report', 'payment_date', 'amount', 'payment_mode', 'created_at')
    search_fields = ('final_report__crm_id', 'final_report__guest_name', 'payment_mode')
    list_filter = ('payment_date', 'payment_mode')


@admin.register(FinalReportPaymentSpent)
class FinalReportPaymentSpentAdmin(admin.ModelAdmin):
    list_display = ('final_report', 'details', 'payment_date', 'amount', 'payment_mode', 'created_at')
    search_fields = ('final_report__crm_id', 'final_report__guest_name', 'details', 'payment_mode')
    list_filter = ('payment_date', 'payment_mode')



