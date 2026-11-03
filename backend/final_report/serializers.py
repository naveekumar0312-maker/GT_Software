import re
from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from .models import FinalReport, FinalReportClientService, FinalReportDMCService, FinalReportPayment, FinalReportPaymentSpent


class FinalReportPaymentSpentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinalReportPaymentSpent
        fields = [
            'id',
            'details',
            'payment_date',
            'amount',
            'payment_mode',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_details(self, value):
        cleaned = str(value).strip()
        if not cleaned:
            raise serializers.ValidationError("Details/Vendor is required.")
        return cleaned

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Payment spent amount cannot be negative.")
        return value

    def validate_payment_mode(self, value):
        cleaned = str(value).strip()
        if not cleaned:
            raise serializers.ValidationError("Payment mode is required.")
        return cleaned


class FinalReportPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinalReportPayment
        fields = [
            'id',
            'payment_date',
            'amount',
            'payment_mode',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Payment amount cannot be negative.")
        return value

    def validate_payment_mode(self, value):
        cleaned = str(value).strip()
        if not cleaned:
            raise serializers.ValidationError("Payment mode is required.")
        return cleaned



class FinalReportClientServiceSerializer(serializers.ModelSerializer):
    total_cost = serializers.DecimalField(max_digits=16, decimal_places=2, read_only=True)

    class Meta:
        model = FinalReportClientService
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


class FinalReportDMCServiceSerializer(serializers.ModelSerializer):
    total_payable = serializers.DecimalField(max_digits=16, decimal_places=2, read_only=True)

    class Meta:
        model = FinalReportDMCService
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


class FinalReportSerializer(serializers.ModelSerializer):
    total_pax = serializers.IntegerField(read_only=True)
    client_services = FinalReportClientServiceSerializer(many=True, required=False)
    dmc_services = FinalReportDMCServiceSerializer(many=True, required=False)
    payments = FinalReportPaymentSerializer(many=True, required=False)
    payments_spent = FinalReportPaymentSpentSerializer(many=True, required=False)
    grand_total_cost = serializers.SerializerMethodField(read_only=True)
    total_dmc_cost = serializers.SerializerMethodField(read_only=True)
    
    # Section 9 - Payment Balance Summary Calculated Fields
    total_client_amount = serializers.SerializerMethodField(read_only=True)
    total_collected = serializers.SerializerMethodField(read_only=True)
    yet_to_receive = serializers.SerializerMethodField(read_only=True)
    total_to_supplier = serializers.SerializerMethodField(read_only=True)
    total_paid_to_supplier = serializers.SerializerMethodField(read_only=True)
    yet_to_supplier = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = FinalReport
        fields = [
            'id',
            'first_report',
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
            'payments',
            'payments_spent',
            'grand_total_cost',
            'total_dmc_cost',
            'gst_collected',
            'gst_collected_date',
            'gst_percentage',
            'base_total_cost',
            'gst_amount',
            'final_total_cost',
            'processing_fee',
            'total_cost',
            'total_cost_with_gst',
            'total_expense',
            'net_profit',
            'total_collected_amount',
            'total_spent_amount',
            'total_client_amount',
            'total_collected',
            'yet_to_receive',
            'total_to_supplier',
            'total_paid_to_supplier',
            'yet_to_supplier',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'total_pax',
            'grand_total_cost',
            'total_dmc_cost',
            'gst_amount',
            'final_total_cost',
            'total_cost',
            'total_cost_with_gst',
            'total_expense',
            'net_profit',
            'total_collected_amount',
            'total_spent_amount',
            'total_client_amount',
            'total_collected',
            'yet_to_receive',
            'total_to_supplier',
            'total_paid_to_supplier',
            'yet_to_supplier',
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

    # Section 9 Calculation Methods using Python Decimal
    def get_total_client_amount(self, obj):
        return f"{(obj.total_cost or Decimal('0.00')):.2f}"

    def get_total_collected(self, obj):
        return f"{(obj.total_collected_amount or Decimal('0.00')):.2f}"

    def get_yet_to_receive(self, obj):
        client_amt = obj.total_cost or Decimal('0.00')
        collected = obj.total_collected_amount or Decimal('0.00')
        return f"{(client_amt - collected):.2f}"

    def get_total_to_supplier(self, obj):
        return f"{(obj.total_expense or Decimal('0.00')):.2f}"

    def get_total_paid_to_supplier(self, obj):
        return f"{(obj.total_spent_amount or Decimal('0.00')):.2f}"

    def get_yet_to_supplier(self, obj):
        supplier_amt = obj.total_expense or Decimal('0.00')
        paid = obj.total_spent_amount or Decimal('0.00')
        return f"{(supplier_amt - paid):.2f}"

    def validate_crm_id(self, value):
        cleaned_value = str(value).strip()
        if not cleaned_value:
            raise serializers.ValidationError("CRM ID is required.")

        qs = FinalReport.objects.filter(crm_id=cleaned_value)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)

        if qs.exists():
            raise serializers.ValidationError(
                f"A Final Report with CRM ID '{cleaned_value}' already exists. CRM ID must be unique."
            )
        return cleaned_value

    def validate_mobile_no(self, value):
        cleaned_value = re.sub(r'[\s\-+]', '', str(value))
        if cleaned_value.startswith('91') and len(cleaned_value) == 12:
            cleaned_value = cleaned_value[2:]

        if not re.match(r'^[6-9]\d{9}$', cleaned_value):
            raise serializers.ValidationError(
                "Mobile number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9."
            )
        return cleaned_value

    def validate_email_id(self, value):
        if not value:
            return ""
        cleaned_value = str(value).strip().lower()
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, cleaned_value):
            raise serializers.ValidationError("Please enter a valid email address.")
        return cleaned_value

    def validate_adults(self, value):
        if value < 0:
            raise serializers.ValidationError("Number of adults cannot be negative.")
        return value

    def validate_child(self, value):
        if value < 0:
            raise serializers.ValidationError("Number of children cannot be negative.")
        return value

    def validate_duration(self, value):
        if value < 1:
            raise serializers.ValidationError("Duration must be at least 1 day.")
        return value

    def validate_rooms(self, value):
        if value < 1:
            raise serializers.ValidationError("Rooms must be at least 1.")
        return value

    def validate(self, attrs):
        adults = attrs.get('adults', getattr(self.instance, 'adults', 0) if self.instance else 0)
        child = attrs.get('child', getattr(self.instance, 'child', 0) if self.instance else 0)

        if (adults + child) < 1:
            raise serializers.ValidationError({
                "pax": "At least 1 person (adult or child) is required for the tour."
            })

        first_report = attrs.get('first_report', getattr(self.instance, 'first_report', None) if self.instance else None)
        if first_report:
            dup_qs = FinalReport.objects.filter(first_report=first_report)
            if self.instance:
                dup_qs = dup_qs.exclude(id=self.instance.id)
            if dup_qs.exists():
                raise serializers.ValidationError({
                    "first_report": f"A Final Report has already been created for First Report #{first_report.crm_id}."
                })

        # GST Validations
        gst_collected = attrs.get('gst_collected', getattr(self.instance, 'gst_collected', False) if self.instance else False)
        base_total = attrs.get('base_total_cost', getattr(self.instance, 'base_total_cost', Decimal('0.00')) if self.instance else Decimal('0.00'))

        if base_total < 0:
            raise serializers.ValidationError({
                "base_total_cost": "Base Total Cost cannot be negative."
            })

        processing_fee = attrs.get('processing_fee', getattr(self.instance, 'processing_fee', Decimal('0.00')) if self.instance else Decimal('0.00'))
        if processing_fee < 0:
            raise serializers.ValidationError({
                "processing_fee": "Processing Fee cannot be negative."
            })

        if gst_collected:
            gst_date = attrs.get('gst_collected_date', getattr(self.instance, 'gst_collected_date', None) if self.instance else None)
            if not gst_date:
                raise serializers.ValidationError({
                    "gst_collected_date": "GST Collected Date is required when GST is collected."
                })

            gst_pct = attrs.get('gst_percentage', getattr(self.instance, 'gst_percentage', Decimal('0.00')) if self.instance else Decimal('0.00'))
            if gst_pct < 1 or gst_pct > 100:
                raise serializers.ValidationError({
                    "gst_percentage": "GST Percentage must be between 1% and 100% when GST is collected."
                })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        client_services_data = validated_data.pop('client_services', [])
        dmc_services_data = validated_data.pop('dmc_services', [])
        payments_data = validated_data.pop('payments', [])
        payments_spent_data = validated_data.pop('payments_spent', [])
        final_report = FinalReport.objects.create(**validated_data)

        total_client_cost = Decimal('0.00')
        for cs_data in client_services_data:
            cs = FinalReportClientService.objects.create(
                final_report=final_report,
                **cs_data
            )
            total_client_cost += Decimal(str(cs.total_cost or 0))

        total_dmc_cost = Decimal('0.00')
        for ds_data in dmc_services_data:
            ds = FinalReportDMCService.objects.create(
                final_report=final_report,
                **ds_data
            )
            total_dmc_cost += Decimal(str(ds.total_payable or 0))

        total_collected = Decimal('0.00')
        for p_data in payments_data:
            p = FinalReportPayment.objects.create(
                final_report=final_report,
                **p_data
            )
            total_collected += Decimal(str(p.amount or 0))

        total_spent = Decimal('0.00')
        for ps_data in payments_spent_data:
            ps = FinalReportPaymentSpent.objects.create(
                final_report=final_report,
                **ps_data
            )
            total_spent += Decimal(str(ps.amount or 0))

        # Update and save the exact financial totals
        final_report.total_cost = total_client_cost
        final_report.total_expense = total_dmc_cost
        final_report.total_collected_amount = round(total_collected, 2)
        final_report.total_spent_amount = round(total_spent, 2)
        final_report.save()

        return final_report

    @transaction.atomic
    def update(self, instance, validated_data):
        client_services_data = validated_data.pop('client_services', None)
        dmc_services_data = validated_data.pop('dmc_services', None)
        payments_data = validated_data.pop('payments', None)
        payments_spent_data = validated_data.pop('payments_spent', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if client_services_data is not None:
            instance.client_services.all().delete()
            total_client_cost = Decimal('0.00')
            for cs_data in client_services_data:
                cs = FinalReportClientService.objects.create(
                    final_report=instance,
                    **cs_data
                )
                total_client_cost += Decimal(str(cs.total_cost or 0))
            instance.total_cost = total_client_cost
        else:
            instance.total_cost = Decimal(self.get_grand_total_cost(instance))

        if dmc_services_data is not None:
            instance.dmc_services.all().delete()
            total_dmc_cost = Decimal('0.00')
            for ds_data in dmc_services_data:
                ds = FinalReportDMCService.objects.create(
                    final_report=instance,
                    **ds_data
                )
                total_dmc_cost += Decimal(str(ds.total_payable or 0))
            instance.total_expense = total_dmc_cost
        else:
            instance.total_expense = Decimal(self.get_total_dmc_cost(instance))

        if payments_data is not None:
            instance.payments.all().delete()
            total_collected = Decimal('0.00')
            for p_data in payments_data:
                p = FinalReportPayment.objects.create(
                    final_report=instance,
                    **p_data
                )
                total_collected += Decimal(str(p.amount or 0))
            instance.total_collected_amount = round(total_collected, 2)
        else:
            existing_total = sum(
                Decimal(str(p.amount or 0)) for p in instance.payments.all()
            )
            instance.total_collected_amount = round(existing_total, 2)

        if payments_spent_data is not None:
            instance.payments_spent.all().delete()
            total_spent = Decimal('0.00')
            for ps_data in payments_spent_data:
                ps = FinalReportPaymentSpent.objects.create(
                    final_report=instance,
                    **ps_data
                )
                total_spent += Decimal(str(ps.amount or 0))
            instance.total_spent_amount = round(total_spent, 2)
        else:
            existing_spent = sum(
                Decimal(str(ps.amount or 0)) for ps in instance.payments_spent.all()
            )
            instance.total_spent_amount = round(existing_spent, 2)

        # Save with recalculated totals
        instance.save()

        return instance
