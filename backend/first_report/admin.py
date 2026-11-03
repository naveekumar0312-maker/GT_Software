from django.contrib import admin
from .models import FirstReport

@admin.register(FirstReport)
class FirstReportAdmin(admin.ModelAdmin):
    list_display = (
        'crm_id',
        'guest_name',
        'destination',
        'tour_type',
        'branch',
        'report_date',
        'travel_date',
        'total_pax',
        'created_at',
    )
    list_filter = ('tour_type', 'branch', 'client_type', 'report_date', 'travel_date')
    search_fields = ('crm_id', 'guest_name', 'mobile_no', 'destination', 'sales_by')
    readonly_fields = ('total_pax', 'created_at', 'updated_at')
