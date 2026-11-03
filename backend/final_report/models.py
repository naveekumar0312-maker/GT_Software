from decimal import Decimal
from django.db import models
from django.core.validators import RegexValidator
from first_report.models import FirstReport


class FinalReport(models.Model):
    TOUR_TYPE_CHOICES = [
        ('International', 'International'),
        ('Domestic', 'Domestic'),
    ]

    BRANCH_CHOICES = [
        ('Coimbatore', 'Coimbatore'),
        ('Chennai', 'Chennai'),
        ('Erode', 'Erode'),
        ('Tiruppur', 'Tiruppur'),
        ('Salem', 'Salem'),
    ]

    CLIENT_TYPE_CHOICES = [
        ('Family', 'Family'),
        ('Couple', 'Couple'),
        ('Friends', 'Friends'),
        ('Corporate', 'Corporate'),
        ('Group', 'Group'),
        ('Solo', 'Solo'),
        ('Corporate Group', 'Corporate Group'),  # Legacy compatibility
    ]

    phone_regex = RegexValidator(
        regex=r'^[6-9]\d{9}$',
        message="Mobile number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9."
    )

    # Reference to original First Report
    first_report = models.ForeignKey(
        FirstReport,
        on_delete=models.PROTECT,
        related_name='final_reports',
        null=True,
        blank=True,
        help_text="Reference to original First Report"
    )

    # Section 1 – Tour Confirmation Details
    report_date = models.DateField(
        help_text="Booking/Report Date"
    )
    travel_date = models.DateField(
        help_text="Date of Travel"
    )
    tour_type = models.CharField(
        max_length=50,
        choices=TOUR_TYPE_CHOICES,
        help_text="International or Domestic"
    )
    crm_id = models.CharField(
        max_length=100,
        unique=True,
        help_text="CRM ID (Alphanumeric, Unique within Final Reports)"
    )
    sales_by = models.CharField(
        max_length=150,
        help_text="Sales Executive/Person Name"
    )
    branch = models.CharField(
        max_length=50,
        choices=BRANCH_CHOICES,
        help_text="Branch Location"
    )

    # Section 2 – Guest & Tour Details
    guest_name = models.CharField(
        max_length=200,
        help_text="Primary Guest Name"
    )
    mobile_no = models.CharField(
        max_length=15,
        validators=[phone_regex],
        help_text="10-digit Mobile Number"
    )
    dob = models.DateField(
        null=True,
        blank=True,
        help_text="Date of Birth (Optional)"
    )
    email_id = models.EmailField(
        blank=True,
        null=True,
        help_text="Email Address (Optional)"
    )
    adults = models.PositiveIntegerField(
        default=0,
        help_text="Number of Adults (>= 0)"
    )
    child = models.PositiveIntegerField(
        default=0,
        help_text="Number of Children (>= 0)"
    )
    total_pax = models.PositiveIntegerField(
        default=0,
        help_text="Total Pax (Adults + Child)"
    )
    client_type = models.CharField(
        max_length=50,
        choices=CLIENT_TYPE_CHOICES,
        help_text="Client Type category"
    )
    destination = models.CharField(
        max_length=200,
        help_text="Travel Destination"
    )
    duration = models.PositiveIntegerField(
        default=1,
        help_text="Duration in Days/Nights"
    )
    rooms = models.PositiveIntegerField(
        default=1,
        help_text="Number of Rooms"
    )

    # Section 5 – GST Details & Calculation
    gst_collected = models.BooleanField(
        default=False,
        help_text="GST Collected: True for Yes, False for No"
    )
    gst_collected_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when GST was collected (if applicable)"
    )
    gst_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text="GST Percentage (e.g., 5.00 for 5%)"
    )
    base_total_cost = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0.00,
        help_text="Base Total Cost Before GST"
    )
    gst_amount = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0.00,
        help_text="Calculated GST Amount"
    )
    final_total_cost = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0.00,
        help_text="Final Total Cost (Base Total Cost + GST Amount)"
    )

    # Section 6 – Final Financial Summary & Net Profit
    processing_fee = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0.00,
        help_text="Manual Processing Fee in INR"
    )
    total_cost = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0.00,
        help_text="Total Cost from Client Services"
    )
    total_cost_with_gst = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0.00,
        help_text="Total Cost with GST = total_cost + gst_amount"
    )
    total_expense = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0.00,
        help_text="Total Expense from DMC Services"
    )
    net_profit = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0.00,
        help_text="Net Profit = total_cost_with_gst - total_expense - processing_fee"
    )
    total_collected_amount = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0.00,
        help_text="Total Collected Amount from Payment Collection"
    )
    total_spent_amount = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0.00,
        help_text="Total Spent Amount from Payment Spent"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'final_reports'
        ordering = ['-created_at']
        verbose_name = 'Final Report'
        verbose_name_plural = 'Final Reports'

    def save(self, *args, **kwargs):
        # Calculate total pax on backend from adults and child
        self.total_pax = (self.adults or 0) + (self.child or 0)

        # GST Calculations on Backend using Decimal safe rounding
        base = Decimal(str(self.base_total_cost or '0.00'))
        if self.gst_collected:
            pct = Decimal(str(self.gst_percentage or '0.00'))
            self.gst_amount = round(base * (pct / Decimal('100.00')), 2)
            self.final_total_cost = round(base + self.gst_amount, 2)
        else:
            self.gst_collected_date = None
            self.gst_percentage = Decimal('0.00')
            self.gst_amount = Decimal('0.00')
            self.final_total_cost = round(base, 2)

        # Section 6 Financial Summary calculations
        # total_cost_with_gst = total_cost + gst_amount
        tc = Decimal(str(self.total_cost or '0.00'))
        gst_amt = Decimal(str(self.gst_amount or '0.00'))
        self.total_cost_with_gst = round(tc + gst_amt, 2)

        # net_profit = total_cost_with_gst - total_expense - processing_fee
        te = Decimal(str(self.total_expense or '0.00'))
        pf = Decimal(str(self.processing_fee or '0.00'))
        self.net_profit = round(self.total_cost_with_gst - te - pf, 2)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.crm_id} - {self.guest_name} ({self.destination})"


class FinalReportPayment(models.Model):
    final_report = models.ForeignKey(
        FinalReport,
        on_delete=models.CASCADE,
        related_name='payments',
        help_text="Related Final Report"
    )
    payment_date = models.DateField(
        help_text="Payment received date"
    )
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        help_text="Payment amount in INR (>= 0)"
    )
    payment_mode = models.CharField(
        max_length=150,
        help_text="Payment mode or account name (e.g. ICICI, HDFC, Gpay, Cash, etc.)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'final_report_payments'
        ordering = ['payment_date', 'id']
        verbose_name = 'Final Report Payment'
        verbose_name_plural = 'Final Report Payments'

    def __str__(self):
        return f"{self.payment_date} - ₹{self.amount} via {self.payment_mode}"


class FinalReportPaymentSpent(models.Model):
    final_report = models.ForeignKey(
        FinalReport,
        on_delete=models.CASCADE,
        related_name='payments_spent',
        help_text="Related Final Report"
    )
    details = models.CharField(
        max_length=255,
        help_text="Payment details / vendor description (e.g. Flight, LittleTown-DMC, etc.)"
    )
    payment_date = models.DateField(
        help_text="Payment spent date"
    )
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        help_text="Payment spent amount in INR (>= 0)"
    )
    payment_mode = models.CharField(
        max_length=150,
        help_text="Payment mode or account name (e.g. ICICI, HDFC, Gpay, Cash, etc.)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'final_report_payments_spent'
        ordering = ['payment_date', 'id']
        verbose_name = 'Final Report Payment Spent'
        verbose_name_plural = 'Final Report Payments Spent'

    def __str__(self):
        return f"{self.details} ({self.payment_date}) - ₹{self.amount} via {self.payment_mode}"


class FinalReportClientService(models.Model):
    final_report = models.ForeignKey(
        FinalReport,
        on_delete=models.CASCADE,
        related_name='client_services',
        help_text="Related Final Report"
    )
    service = models.CharField(
        max_length=255,
        help_text="Service name e.g. Flight - CJB to BKK, Singapore VISA, Land Package, Hotel"
    )
    number_of_persons = models.PositiveIntegerField(
        default=1,
        help_text="Number of Persons"
    )
    price_per_person = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00,
        help_text="Price per person in INR"
    )
    total_cost = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0.00,
        help_text="Total cost = number_of_persons * price_per_person"
    )
    remarks = models.TextField(
        blank=True,
        default="",
        help_text="Optional remarks for this service"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'final_report_client_services'
        ordering = ['id']
        verbose_name = 'Final Report Client Service'
        verbose_name_plural = 'Final Report Client Services'

    def save(self, *args, **kwargs):
        # Always compute total_cost on backend from number_of_persons and price_per_person
        persons = self.number_of_persons or 0
        price = self.price_per_person or 0
        self.total_cost = round(persons * price, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.service} ({self.number_of_persons} pax @ {self.price_per_person})"


class FinalReportDMCService(models.Model):
    final_report = models.ForeignKey(
        FinalReport,
        on_delete=models.CASCADE,
        related_name='dmc_services',
        help_text="Related Final Report"
    )
    service = models.CharField(
        max_length=255,
        help_text="Service name e.g. Flight - CJB to BKK, Singapore VISA, Courier, Land Packages"
    )
    vendor = models.CharField(
        max_length=255,
        help_text="Vendor / DMC name e.g. Tripjack, Travel Berries"
    )
    contact_no = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Vendor contact number(s), may contain multiple numbers or prefixes"
    )
    number_of_persons = models.PositiveIntegerField(
        default=0,
        help_text="No. of Persons (whole numbers >= 0)"
    )
    price_per_pax = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00,
        help_text="Price per Pax in INR"
    )
    total_payable = models.DecimalField(
        max_digits=16,
        decimal_places=2,
        default=0.00,
        help_text="Total Payable = No. of Persons * Price / Pax"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'final_report_dmc_services'
        ordering = ['id']
        verbose_name = 'Final Report DMC Service'
        verbose_name_plural = 'Final Report DMC Services'

    def save(self, *args, **kwargs):
        persons = self.number_of_persons or 0
        price = self.price_per_pax or 0
        self.total_payable = round(persons * price, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.service} - {self.vendor} ({self.number_of_persons} pax @ {self.price_per_pax})"

