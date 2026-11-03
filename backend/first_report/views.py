from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import FirstReport
from .serializers import FirstReportSerializer

class FirstReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling First Report operations:
    - POST /api/first-reports/ (Create)
    - GET /api/first-reports/ (List)
    - GET /api/first-reports/{id}/ (Retrieve)
    - PUT /api/first-reports/{id}/ (Update)
    - DELETE /api/first-reports/{id}/ (Delete)
    """
    queryset = FirstReport.objects.all().order_by('-created_at')
    serializer_class = FirstReportSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['crm_id', 'guest_name', 'mobile_no', 'destination', 'sales_by']
    ordering_fields = ['report_date', 'travel_date', 'created_at', 'total_pax']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Validation failed. Please correct the errors below.",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "success": True,
                "message": "First Report created and saved successfully!",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Validation failed. Please correct the errors below.",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        self.perform_update(serializer)
        return Response(
            {
                "success": True,
                "message": "First Report updated successfully!",
                "data": serializer.data
            }
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'], url_path='pdf')
    def pdf(self, request, pk=None):
        """
        Downloadable print-ready PDF endpoint for First Report.
        Filename format: First_Report_CRM_{crm_id}.pdf
        """
        instance = self.get_object()
        from .pdf_generator import ReportPDFGenerator
        from django.http import HttpResponse

        gen = ReportPDFGenerator(is_landscape=True)
        pdf_bytes = gen.generate_first_report_pdf(instance)

        crm_clean = str(instance.crm_id or instance.id).replace(' ', '_')
        filename = f"CRM_First_Report_{crm_clean}.pdf"

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response

