import re
from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from .models import FirstReport, ClientService, BookingServiceDMC


class ClientServiceSerializer(serializers.ModelSerializer):
    total_cost = serializers.DecimalField(max_digits=16, decimal_places=2, read_only=True)

    class Meta:
        model = ClientService
        fields = [
            'id',
            'service',
            'number_of_persons',
            'price_per_person',
            'total_cost',
            'remarks',
            'created_at',
        ]
        read_only_fields = ['id', 'total_cost', 'created_at']

    def validate_number_of_persons(self, value):
        if value < 0:
            raise serializers.ValidationError("Number of persons cannot be negative.")
        return value

    def validate_price_per_person(self, value):
        if value < 0:
            raise serializers.ValidationError("Price per person cannot be negative.")
        return value


class BookingServiceDMCSerializer(serializers.ModelSerializer):
    total_payable = serializers.DecimalField(max_digits=16, decimal_places=2, read_only=True)

    class Meta:
        model = BookingServiceDMC
        fields = [
            'id',
            'service',
            'vendor',
            'contact_no',
            'number_of_persons',
            'price_per_pax',
            'total_payable',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'total_payable', 'created_at', 'updated_at']

    def validate_number_of_persons(self, value):
        if value < 0:
            raise serializers.ValidationError("Number of persons cannot be negative.")
        return value

    def validate_price_per_pax(self, value):
        if value < 0:
            raise serializers.ValidationError("Price per pax cannot be negative.")
        return value


class FirstReportSerializer(serializers.ModelSerializer):
    # total_pax is read-only because the backend computes it securely
    total_pax = serializers.IntegerField(read_only=True)
    client_services = ClientServiceSerializer(many=True, required=False)
    dmc_services = BookingServiceDMCSerializer(many=True, required=False)
    grand_total_cost = serializers.SerializerMethodField(read_only=True)
    total_dmc_cost = serializers.SerializerMethodField(read_only=True)
    total_cost = serializers.SerializerMethodField(read_only=True)
    total_expense = serializers.SerializerMethodField(read_only=True)
    approx_profit = serializers.SerializerMethodField(read_only=True)
    final_report_status = serializers.SerializerMethodField(read_only=True)
    final_report_id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = FirstReport
        fields = [
            'id',
            'report_date',
            'travel_date',
            'tour_type',
            'crm_id',
            'sales_by',
            'branch',
            'guest_name',
            'mobile_no',
            'dob',
            'email_id',
            'adults',
            'child',
            'total_pax',
            'client_type',
            'destination',
            'duration',
            'rooms',
            'client_services',
            'dmc_services',
            'grand_total_cost',
            'total_dmc_cost',
            'total_cost',
            'total_expense',
            'approx_profit',
            'final_report_status',
            'final_report_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'total_pax',
            'grand_total_cost',
            'total_dmc_cost',
            'total_cost',
            'total_expense',
            'approx_profit',
            'final_report_status',
            'final_report_id',
            'created_at',
            'updated_at',
        ]

    def get_grand_total_cost(self, obj):
        services = obj.client_services.all()
        total = sum(
            (Decimal(str(s.number_of_persons or 0)) * Decimal(str(s.price_per_person or 0)))
            for s in services
        )
        return f"{total:.2f}"

    def get_total_dmc_cost(self, obj):
        dmc_services = obj.dmc_services.all()
        total = sum(
            (Decimal(str(s.number_of_persons or 0)) * Decimal(str(s.price_per_pax or 0)))
            for s in dmc_services
        )
        return f"{total:.2f}"

    def get_total_cost(self, obj):
        return self.get_grand_total_cost(obj)

    def get_total_expense(self, obj):
        return self.get_total_dmc_cost(obj)

    def get_approx_profit(self, obj):
        cost = Decimal(self.get_grand_total_cost(obj))
        expense = Decimal(self.get_total_dmc_cost(obj))
        profit = cost - expense
        return f"{profit:.2f}"

    def get_final_report_status(self, obj):
        # Check if a related FinalReport exists
        final_rep = getattr(obj, 'final_reports', None)
        if final_rep and final_rep.exists():
            return 'Completed'
        return 'Pending'

    def get_final_report_id(self, obj):
        final_rep = getattr(obj, 'final_reports', None)
        if final_rep:
            first_final = final_rep.first()
            if first_final:
                return first_final.id
        return None

    def validate_crm_id(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("CRM ID cannot be blank.")
        # Ensure alphanumeric or alphanumeric with hyphens/underscores
        if not re.match(r'^[a-zA-Z0-9_\-]+$', val):
            raise serializers.ValidationError("CRM ID must be alphanumeric (may include '-' or '_').")
        
        # Check uniqueness during creation or update
        instance = getattr(self, 'instance', None)
        qs = FirstReport.objects.filter(crm_id__iexact=val)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(f"A report with CRM ID '{val}' already exists.")
        return val

    def validate_mobile_no(self, value):
        val = str(value).strip().replace(" ", "").replace("-", "")
        # Remove +91 prefix if present
        if val.startswith("+91"):
            val = val[3:]
        elif val.startswith("91") and len(val) == 12:
            val = val[2:]
        elif val.startswith("0") and len(val) == 11:
            val = val[1:]

        if not re.match(r'^[6-9]\d{9}$', val):
            raise serializers.ValidationError(
                "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
            )
        return val

    def validate_adults(self, value):
        if value < 0:
            raise serializers.ValidationError("Adults count cannot be negative.")
        return value

    def validate_child(self, value):
        if value < 0:
            raise serializers.ValidationError("Child count cannot be negative.")
        return value

    def validate_duration(self, value):
        if value < 1:
            raise serializers.ValidationError("Duration must be at least 1 day/night.")
        return value

    def validate_rooms(self, value):
        if value < 1:
            raise serializers.ValidationError("Rooms must be at least 1.")
        return value

    def validate(self, data):
        adults = data.get('adults', getattr(self.instance, 'adults', 0) if self.instance else 0)
        child = data.get('child', getattr(self.instance, 'child', 0) if self.instance else 0)
        if adults == 0 and child == 0:
            raise serializers.ValidationError({
                "adults": "At least one passenger (Adult or Child) is required."
            })
        return data

    @transaction.atomic
    def create(self, validated_data):
        services_data = validated_data.pop('client_services', [])
        dmc_data = validated_data.pop('dmc_services', [])

        adults = validated_data.get('adults', 0)
        child = validated_data.get('child', 0)
        validated_data['total_pax'] = adults + child

        report = super().create(validated_data)

        # Create nested ClientService rows
        for s_data in services_data:
            service_name = (s_data.get('service') or '').strip()
            if service_name or s_data.get('price_per_person', 0) > 0:
                persons = s_data.get('number_of_persons', 0)
                price = s_data.get('price_per_person', Decimal('0.00'))
                total = round(Decimal(str(persons)) * Decimal(str(price)), 2)
                ClientService.objects.create(
                    first_report=report,
                    service=service_name or "Service",
                    number_of_persons=persons,
                    price_per_person=price,
                    total_cost=total,
                    remarks=s_data.get('remarks', '')
                )

        # Create nested BookingServiceDMC rows
        for d_data in dmc_data:
            service_name = (d_data.get('service') or '').strip()
            vendor_name = (d_data.get('vendor') or '').strip()
            if service_name or vendor_name or d_data.get('price_per_pax', 0) > 0:
                persons = d_data.get('number_of_persons', 0)
                price = d_data.get('price_per_pax', Decimal('0.00'))
                total = round(Decimal(str(persons)) * Decimal(str(price)), 2)
                BookingServiceDMC.objects.create(
                    first_report=report,
                    service=service_name or "DMC Service",
                    vendor=vendor_name or "Vendor",
                    contact_no=d_data.get('contact_no', ''),
                    number_of_persons=persons,
                    price_per_pax=price,
                    total_payable=total,
                )

        return report

    @transaction.atomic
    def update(self, instance, validated_data):
        services_data = validated_data.pop('client_services', None)
        dmc_data = validated_data.pop('dmc_services', None)

        adults = validated_data.get('adults', instance.adults)
        child = validated_data.get('child', instance.child)
        validated_data['total_pax'] = adults + child

        report = super().update(instance, validated_data)

        if services_data is not None:
            instance.client_services.all().delete()
            for s_data in services_data:
                service_name = (s_data.get('service') or '').strip()
                if service_name or s_data.get('price_per_person', 0) > 0:
                    persons = s_data.get('number_of_persons', 0)
                    price = s_data.get('price_per_person', Decimal('0.00'))
                    total = round(Decimal(str(persons)) * Decimal(str(price)), 2)
                    ClientService.objects.create(
                        first_report=instance,
                        service=service_name or "Service",
                        number_of_persons=persons,
                        price_per_person=price,
                        total_cost=total,
                        remarks=s_data.get('remarks', '')
                    )

        if dmc_data is not None:
            instance.dmc_services.all().delete()
            for d_data in dmc_data:
                service_name = (d_data.get('service') or '').strip()
                vendor_name = (d_data.get('vendor') or '').strip()
                if service_name or vendor_name or d_data.get('price_per_pax', 0) > 0:
                    persons = d_data.get('number_of_persons', 0)
                    price = d_data.get('price_per_pax', Decimal('0.00'))
                    total = round(Decimal(str(persons)) * Decimal(str(price)), 2)
                    BookingServiceDMC.objects.create(
                        first_report=instance,
                        service=service_name or "DMC Service",
                        vendor=vendor_name or "Vendor",
                        contact_no=d_data.get('contact_no', ''),
                        number_of_persons=persons,
                        price_per_pax=price,
                        total_payable=total,
                    )

        return report
