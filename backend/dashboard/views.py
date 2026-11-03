import datetime
from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce, TruncMonth, TruncDate
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from first_report.models import FirstReport
from final_report.models import FinalReport, FinalReportPayment, FinalReportPaymentSpent


def parse_date_param(val):
    if not val:
        return None
    try:
        return datetime.date.fromisoformat(val)
    except (ValueError, TypeError):
        return None


def get_filter_date_range(preset, custom_from=None, custom_to=None):
    today = timezone.localdate()
    
    if preset == 'all_time':
        return None, None
    elif preset == 'today':
        return today, today
    elif preset in ('this_week', 'last_7_days'):
        # This week (Monday to today)
        start_week = today - datetime.timedelta(days=today.weekday())
        return start_week, today
    elif preset == 'this_month':
        start = today.replace(day=1)
        return start, today
    elif preset == 'last_month':
        first_this_month = today.replace(day=1)
        last_prev_month = first_this_month - datetime.timedelta(days=1)
        start_prev_month = last_prev_month.replace(day=1)
        return start_prev_month, last_prev_month
    elif preset == 'this_year':
        return today.replace(month=1, day=1), today
    elif preset == 'custom':
        d_from = parse_date_param(custom_from)
        d_to = parse_date_param(custom_to)
        return d_from, d_to
    
    # Default: None, None for all_time
    return None, None


def get_previous_period_range(d_from, d_to):
    """
    Computes an equivalent previous date range for period-over-period comparison.
    """
    if not d_from or not d_to:
        return None, None
    days = (d_to - d_from).days + 1
    prev_to = d_from - datetime.timedelta(days=1)
    prev_from = prev_to - datetime.timedelta(days=days - 1)
    return prev_from, prev_to


def apply_base_filters(qs, date_field, d_from, d_to, branch, tour_type):
    if d_from:
        qs = qs.filter(**{f"{date_field}__gte": d_from})
    if d_to:
        qs = qs.filter(**{f"{date_field}__lte": d_to})
    if branch and branch not in ('All Branches', 'ALL', 'all'):
        qs = qs.filter(branch__iexact=branch)
    if tour_type and tour_type not in ('All Tour Types', 'ALL', 'all'):
        qs = qs.filter(tour_type__iexact=tour_type)
    return qs


class DashboardOverviewView(APIView):
    """
    GET /api/dashboard/overview/
    Returns:
      - 4 Main KPI Cards:
        1. total_first_reports
        2. total_final_reports
        3. total_client_value (SUM of Client Services totals from Final Reports)
        4. total_net_profit (SUM of Final Report Net Profit values)
      - Previous period comparison values for trend indicators
    """
    def get(self, request):
        preset = request.query_params.get('date_range', 'all_time')
        custom_from = request.query_params.get('date_from')
        custom_to = request.query_params.get('date_to')
        branch = request.query_params.get('branch')
        tour_type = request.query_params.get('tour_type')

        d_from, d_to = get_filter_date_range(preset, custom_from, custom_to)
        prev_from, prev_to = get_previous_period_range(d_from, d_to)

        # Current period queries
        fr_qs = apply_base_filters(FirstReport.objects.all(), 'report_date', d_from, d_to, branch, tour_type)
        fn_qs = apply_base_filters(FinalReport.objects.all(), 'report_date', d_from, d_to, branch, tour_type)

        first_reports_count = fr_qs.count()
        final_reports_count = fn_qs.count()

        fn_aggregates = fn_qs.aggregate(
            client_value=Coalesce(Sum('total_cost'), Decimal('0.00')),
            net_profit=Coalesce(Sum('net_profit'), Decimal('0.00'))
        )

        curr_client_val = fn_aggregates['client_value']
        curr_net_profit = fn_aggregates['net_profit']

        # Previous period comparison (if available)
        prev_data = None
        if prev_from and prev_to:
            p_fr_qs = apply_base_filters(FirstReport.objects.all(), 'report_date', prev_from, prev_to, branch, tour_type)
            p_fn_qs = apply_base_filters(FinalReport.objects.all(), 'report_date', prev_from, prev_to, branch, tour_type)

            p_fr_count = p_fr_qs.count()
            p_fn_count = p_fn_qs.count()

            p_fn_agg = p_fn_qs.aggregate(
                client_value=Coalesce(Sum('total_cost'), Decimal('0.00')),
                net_profit=Coalesce(Sum('net_profit'), Decimal('0.00'))
            )

            prev_data = {
                'first_reports': p_fr_count,
                'final_reports': p_fn_count,
                'client_value': float(p_fn_agg['client_value']),
                'net_profit': float(p_fn_agg['net_profit']),
                'date_from': str(prev_from),
                'date_to': str(prev_to),
            }

        def calc_growth(current, previous):
            if previous is not None and previous > 0:
                return round(((current - previous) / previous) * 100, 1)
            return None

        p_fr = prev_data['first_reports'] if prev_data else None
        p_fn = prev_data['final_reports'] if prev_data else None
        p_cv = prev_data['client_value'] if prev_data else None
        p_np = prev_data['net_profit'] if prev_data else None

        return Response({
            'success': True,
            'filters': {
                'date_range': preset,
                'date_from': str(d_from) if d_from else None,
                'date_to': str(d_to) if d_to else None,
                'branch': branch or 'All Branches',
                'tour_type': tour_type or 'All Tour Types',
            },
            'kpis': {
                'total_first_reports': first_reports_count,
                'total_final_reports': final_reports_count,
                'total_client_value': float(curr_client_val),
                'total_net_profit': float(curr_net_profit),
            },
            'kpi_first_reports': {
                'value': first_reports_count,
                'growth_percent': calc_growth(first_reports_count, p_fr)
            },
            'kpi_final_reports': {
                'value': final_reports_count,
                'growth_percent': calc_growth(final_reports_count, p_fn)
            },
            'kpi_client_value': {
                'value': float(curr_client_val),
                'growth_percent': calc_growth(float(curr_client_val), p_cv)
            },
            'kpi_net_profit': {
                'value': float(curr_net_profit),
                'growth_percent': calc_growth(float(curr_net_profit), p_np)
            },
            'previous_period': prev_data
        })


class DashboardFinancialChartView(APIView):
    """
    GET /api/dashboard/financial-chart/
    Returns time-series grouped data of Client Value, DMC Expense, and Net Profit
    from actual Final Reports matching filters.
    """
    def get(self, request):
        preset = request.query_params.get('date_range', 'all_time')
        custom_from = request.query_params.get('date_from')
        custom_to = request.query_params.get('date_to')
        branch = request.query_params.get('branch')
        tour_type = request.query_params.get('tour_type')

        d_from, d_to = get_filter_date_range(preset, custom_from, custom_to)
        fn_qs = apply_base_filters(FinalReport.objects.all(), 'report_date', d_from, d_to, branch, tour_type)

        # Group by month if all_time, this_year, or span > 62 days
        span_days = (d_to - d_from).days if (d_from and d_to) else None
        group_by_month = (preset in ('all_time', 'this_year', 'last_month', 'this_month')) or (span_days is None or span_days > 45)

        if group_by_month:
            chart_records = fn_qs.annotate(
                period=TruncMonth('report_date')
            ).values('period').annotate(
                client_value=Coalesce(Sum('total_cost'), Decimal('0.00')),
                dmc_expense=Coalesce(Sum('total_expense'), Decimal('0.00')),
                net_profit=Coalesce(Sum('net_profit'), Decimal('0.00'))
            ).order_by('period')
            
            data = []
            for item in chart_records:
                p_date = item['period']
                label = p_date.strftime('%b %Y') if p_date else ''
                data.append({
                    'label': label,
                    'period': str(p_date),
                    'client_value': float(item['client_value']),
                    'dmc_expense': float(item['dmc_expense']),
                    'net_profit': float(item['net_profit']),
                })
        else:
            chart_records = fn_qs.annotate(
                period=TruncDate('report_date')
            ).values('period').annotate(
                client_value=Coalesce(Sum('total_cost'), Decimal('0.00')),
                dmc_expense=Coalesce(Sum('total_expense'), Decimal('0.00')),
                net_profit=Coalesce(Sum('net_profit'), Decimal('0.00'))
            ).order_by('period')

            data = []
            for item in chart_records:
                p_date = item['period']
                label = p_date.strftime('%d %b') if p_date else ''
                data.append({
                    'label': label,
                    'period': str(p_date),
                    'client_value': float(item['client_value']),
                    'dmc_expense': float(item['dmc_expense']),
                    'net_profit': float(item['net_profit']),
                })

        return Response({
            'success': True,
            'grouped_by': 'month' if group_by_month else 'day',
            'chart_data': data
        })


class DashboardReportStatusView(APIView):
    """
    GET /api/dashboard/report-status/
    Returns:
      - total_first_reports
      - completed_final_reports (First Reports with a linked FinalReport)
      - pending_final_reports (First Reports without a linked FinalReport)
      - completion_rate percentage
    """
    def get(self, request):
        preset = request.query_params.get('date_range', 'all_time')
        custom_from = request.query_params.get('date_from')
        custom_to = request.query_params.get('date_to')
        branch = request.query_params.get('branch')
        tour_type = request.query_params.get('tour_type')

        d_from, d_to = get_filter_date_range(preset, custom_from, custom_to)
        fr_qs = apply_base_filters(FirstReport.objects.all(), 'report_date', d_from, d_to, branch, tour_type)

        total_first = fr_qs.count()
        # Uses existing OneToMany / ForeignKey relationship: FinalReport.first_report with related_name='final_reports'
        completed_count = fr_qs.filter(final_reports__isnull=False).distinct().count()
        pending_count = fr_qs.filter(final_reports__isnull=True).distinct().count()

        completion_rate = round((completed_count / total_first * 100), 1) if total_first > 0 else 0.0

        return Response({
            'success': True,
            'total_first_reports': total_first,
            'completed_final_reports': completed_count,
            'pending_final_reports': pending_count,
            'completion_rate': completion_rate
        })


class DashboardPaymentSummaryView(APIView):
    """
    GET /api/dashboard/payment-summary/
    Returns:
      - Client Payment Overview:
        * total_client_amount (from FinalReport.total_cost)
        * total_collected (from FinalReport.total_collected_amount)
        * yet_to_receive (total_client_amount - total_collected)
      - Supplier Payment Overview:
        * total_to_supplier (from FinalReport.total_expense)
        * total_paid_to_supplier (from FinalReport.total_spent_amount)
        * yet_to_supplier (total_to_supplier - total_paid_to_supplier)
    """
    def get(self, request):
        preset = request.query_params.get('date_range', 'all_time')
        custom_from = request.query_params.get('date_from')
        custom_to = request.query_params.get('date_to')
        branch = request.query_params.get('branch')
        tour_type = request.query_params.get('tour_type')

        d_from, d_to = get_filter_date_range(preset, custom_from, custom_to)
        fn_qs = apply_base_filters(FinalReport.objects.all(), 'report_date', d_from, d_to, branch, tour_type)

        agg = fn_qs.aggregate(
            client_amount=Coalesce(Sum('total_cost'), Decimal('0.00')),
            client_collected=Coalesce(Sum('total_collected_amount'), Decimal('0.00')),
            supplier_total=Coalesce(Sum('total_expense'), Decimal('0.00')),
            supplier_paid=Coalesce(Sum('total_spent_amount'), Decimal('0.00')),
        )

        client_amt = agg['client_amount']
        client_col = agg['client_collected']
        yet_receive = client_amt - client_col

        supp_total = agg['supplier_total']
        supp_paid = agg['supplier_paid']
        yet_supplier = supp_total - supp_paid

        client_payment_data = {
            'total_client_amount': float(client_amt),
            'total_collected': float(client_col),
            'yet_to_receive': float(yet_receive),
            'is_settled': (yet_receive == 0),
            'is_excess': (yet_receive < 0),
        }

        supplier_payment_data = {
            'total_to_supplier': float(supp_total),
            'total_paid_to_supplier': float(supp_paid),
            'yet_to_supplier': float(yet_supplier),
            'is_settled': (yet_supplier == 0),
            'is_overpaid': (yet_supplier < 0),
        }

        return Response({
            'success': True,
            'client_payment': client_payment_data,
            'client_payments': client_payment_data,
            'supplier_payment': supplier_payment_data,
            'supplier_payments': supplier_payment_data
        })


class DashboardRecentReportsView(APIView):
    """
    GET /api/dashboard/recent-reports/
    Returns the latest 5-10 First Reports and Final Reports with real database IDs.
    """
    def get(self, request):
        limit = min(int(request.query_params.get('limit', 7)), 20)

        # Recent First Reports
        first_reports = FirstReport.objects.all().prefetch_related('final_reports').order_by('-created_at')[:limit]
        recent_fr = []
        for fr in first_reports:
            has_final = fr.final_reports.exists()
            status_text = 'Completed' if has_final else 'Pending'
            recent_fr.append({
                'id': fr.id,
                'crm_id': fr.crm_id,
                'guest_name': fr.guest_name,
                'destination': fr.destination,
                'travel_date': str(fr.travel_date) if fr.travel_date else None,
                'date_of_travel': str(fr.travel_date) if fr.travel_date else None,
                'report_date': str(fr.report_date) if fr.report_date else None,
                'tour_type': fr.tour_type,
                'branch': fr.branch,
                'status': status_text,
                'has_final_report': has_final,
                'created_at': fr.created_at.isoformat() if hasattr(fr, 'created_at') and fr.created_at else None,
            })

        # Recent Final Reports
        final_reports = FinalReport.objects.all().order_by('-created_at')[:limit]
        recent_fn = []
        for fn in final_reports:
            recent_fn.append({
                'id': fn.id,
                'crm_id': fn.crm_id,
                'guest_name': fn.guest_name,
                'destination': fn.destination,
                'client_value': float(fn.total_cost or 0),
                'net_profit': float(fn.net_profit or 0),
                'travel_date': str(fn.travel_date) if fn.travel_date else None,
                'date_of_travel': str(fn.travel_date) if fn.travel_date else None,
                'report_date': str(fn.report_date) if fn.report_date else None,
                'tour_type': fn.tour_type,
                'branch': fn.branch,
                'created_at': fn.created_at.isoformat() if fn.created_at else None,
            })

        return Response({
            'success': True,
            'recent_first_reports': recent_fr,
            'recent_final_reports': recent_fn
        })


class DashboardUpcomingToursView(APIView):
    """
    GET /api/dashboard/upcoming-tours/
    Returns tours whose travel_date >= today, ordered nearest first.
    Avoids showing duplicates between FirstReport and FinalReport by matching on crm_id.
    """
    def get(self, request):
        today = timezone.localdate()
        limit = min(int(request.query_params.get('limit', 8)), 20)

        # Gather upcoming Final Reports first (authoritative confirmed bookings)
        final_tours = FinalReport.objects.filter(
            travel_date__gte=today
        ).order_by('travel_date')[:limit]

        used_crm_ids = set()
        tours = []

        for fn in final_tours:
            used_crm_ids.add(fn.crm_id)
            days_remaining = (fn.travel_date - today).days if fn.travel_date else 0
            tours.append({
                'id': fn.id,
                'type': 'final_report',
                'source': 'FinalReport',
                'crm_id': fn.crm_id,
                'guest_name': fn.guest_name,
                'destination': fn.destination,
                'travel_date': str(fn.travel_date),
                'date_of_travel': str(fn.travel_date),
                'total_pax': fn.total_pax,
                'branch': fn.branch,
                'tour_type': fn.tour_type,
                'days_remaining': days_remaining,
            })

        # Fill remaining slots from FirstReport if not already represented
        remaining_slots = limit - len(tours)
        if remaining_slots > 0:
            first_tours = FirstReport.objects.filter(
                travel_date__gte=today
            ).exclude(crm_id__in=used_crm_ids).order_by('travel_date')[:remaining_slots]

            for fr in first_tours:
                days_remaining = (fr.travel_date - today).days if fr.travel_date else 0
                tours.append({
                    'id': fr.id,
                    'type': 'first_report',
                    'source': 'FirstReport',
                    'crm_id': fr.crm_id,
                    'guest_name': fr.guest_name,
                    'destination': fr.destination,
                    'travel_date': str(fr.travel_date),
                    'date_of_travel': str(fr.travel_date),
                    'total_pax': fr.total_pax,
                    'branch': fr.branch,
                    'tour_type': fr.tour_type,
                    'days_remaining': days_remaining,
                })

        # Sort all by travel_date
        tours.sort(key=lambda t: t['travel_date'])

        return Response({
            'success': True,
            'upcoming_tours': tours[:limit]
        })
