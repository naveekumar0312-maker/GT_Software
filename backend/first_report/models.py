from django.db import models
from django.core.validators import RegexValidator

class FirstReport(models.Model):
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

    # First Section - Tour Information
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
        help_text="CRM ID (Alphanumeric, Unique)"
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

    # Second Section - Guest Information
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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'first_reports'
        ordering = ['-created_at']
        verbose_name = 'First Report'
        verbose_name_plural = 'First Reports'

    def save(self, *args, **kwargs):
        # Calculate total pax on backend from adults and child
        self.total_pax = (self.adults or 0) + (self.child or 0)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.crm_id} - {self.guest_name} ({self.destination})"


class ClientService(models.Model):
    first_report = models.ForeignKey(
        FirstReport,
        on_delete=models.CASCADE,
        related_name='client_services',
        help_text="Related First Report"
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
        db_table = 'first_report_client_services'
        ordering = ['id']
        verbose_name = 'Client Service'
        verbose_name_plural = 'Client Services'

    def save(self, *args, **kwargs):
        # Always compute total_cost on backend from number_of_persons and price_per_person
        persons = self.number_of_persons or 0
        price = self.price_per_person or 0
        self.total_cost = round(persons * price, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.service} ({self.number_of_persons} pax @ {self.price_per_person})"


class BookingServiceDMC(models.Model):
    first_report = models.ForeignKey(
        FirstReport,
        on_delete=models.CASCADE,
        related_name='dmc_services',
        help_text="Related First Report"
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
        db_table = 'first_report_dmc_services'
        ordering = ['id']
        verbose_name = 'Booking Service (DMC)'
        verbose_name_plural = 'Booking Services (DMC)'

    def save(self, *args, **kwargs):
        # Calculate total_payable on backend using Decimal
        persons = self.number_of_persons or 0
        price = self.price_per_pax or 0
        self.total_payable = round(persons * price, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.service} - {self.vendor} ({self.number_of_persons} pax @ {self.price_per_pax})"
