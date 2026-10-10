from django.db import models

class Organization(models.Model):
    FACILITY_TYPES = [
        ('HOSPITAL', 'Hospital'),
        ('COLLEGE', 'College / University'),
        ('PSU', 'Public Sector Undertaking'),
        ('INDUSTRY', 'Industrial Estate'),
        ('MUNICIPAL', 'Municipal Campus'),
    ]

    name = models.CharField(max_length=255)
    facility_type = models.CharField(max_length=50, choices=FACILITY_TYPES, default='COLLEGE')
    category_label = models.CharField(max_length=255, default='College / University Campus')
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    area_sqft = models.BigIntegerField(default=1000000)
    occupancy_current = models.IntegerField(default=5000)
    occupancy_max = models.IntegerField(default=10000)
    assigned_admin_name = models.CharField(max_length=255)
    assigned_admin_email = models.EmailField(blank=True, default='')
    assigned_password = models.CharField(max_length=255, default='estate@2026')

    iot_gateway_ip = models.GenericIPAddressField(default='192.168.1.1')
    iot_status = models.CharField(max_length=50, default='ONLINE')
    sustainability_score = models.IntegerField(default=85)
    carbon_target_reduction_pct = models.IntegerField(default=25)
    description = models.TextField(blank=True, default='')
    campus_image_url = models.TextField(blank=True, default='')
    campus_nodes_json = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"{self.name} ({self.facility_type})"

class AqiTelemetry(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='aqi_telemetry')
    overall_aqi = models.IntegerField(default=80)
    status = models.CharField(max_length=50, default='Moderate')
    pm25 = models.FloatField(default=28.0)
    pm10 = models.FloatField(default=65.0)
    co2 = models.FloatField(default=500.0)
    voc = models.FloatField(default=120.0)
    temperature = models.FloatField(default=26.0)
    humidity = models.FloatField(default=55.0)
    noise = models.FloatField(default=50.0)
    hotspot_location = models.CharField(max_length=255, default='Main Campus Gateway')
    anomaly_detected = models.BooleanField(default=False)
    recorded_at = models.DateTimeField(auto_now_add=True)

class WaterTelemetry(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='water_telemetry')
    daily_consumption_kl = models.FloatField(default=400.0)
    flow_rate_lps = models.FloatField(default=18.0)
    underground_tank_level_pct = models.IntegerField(default=80)
    overhead_tank_level_pct = models.IntegerField(default=75)
    stp_recycle_rate_pct = models.IntegerField(default=80)
    stp_treated_water_kl = models.FloatField(default=280.0)
    ph_level = models.FloatField(default=7.3)
    turbidity_ntu = models.FloatField(default=2.0)
    leak_alert_count = models.IntegerField(default=0)
    recorded_at = models.DateTimeField(auto_now_add=True)

class EnergyTelemetry(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='energy_telemetry')
    current_load_kw = models.FloatField(default=850.0)
    daily_total_kwh = models.FloatField(default=18000.0)
    peak_load_kw = models.FloatField(default=1100.0)
    grid_power_kw = models.FloatField(default=650.0)
    solar_rooftop_kw = models.FloatField(default=200.0)
    power_factor = models.FloatField(default=0.98)
    carbon_emissions_kg = models.FloatField(default=12000.0)
    savings_inr_today = models.FloatField(default=15000.0)
    recorded_at = models.DateTimeField(auto_now_add=True)

class ParkingTelemetry(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='parking_telemetry')
    total_slots = models.IntegerField(default=500)
    occupied_slots = models.IntegerField(default=350)
    available_slots = models.IntegerField(default=150)
    ev_charging_total = models.IntegerField(default=40)
    ev_charging_occupied = models.IntegerField(default=28)
    occupancy_rate_pct = models.IntegerField(default=70)
    peak_congestion_zone = models.CharField(max_length=255, default='Main Entry Gateway')
    entry_flow_rate = models.IntegerField(default=120)
    recorded_at = models.DateTimeField(auto_now_add=True)

class Dustbin(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='dustbins')
    bin_code = models.CharField(max_length=50)
    zone = models.CharField(max_length=255)
    bin_type = models.CharField(max_length=100, default='Dry Waste')
    fill_percentage = models.IntegerField(default=50)
    battery_pct = models.IntegerField(default=95)
    predicted_overflow_mins = models.IntegerField(default=120)
    status = models.CharField(max_length=50, default='Normal')
    last_emptied = models.CharField(max_length=100, default='2 hrs ago')

class Equipment(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='equipments')
    equipment_code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default='Operational')
    health_score = models.IntegerField(default=95)
    power_rating_kw = models.FloatField(default=50.0)
    runtime_hours_today = models.FloatField(default=14.0)
    vibration_mm_per_sec = models.FloatField(default=1.2)
    operating_temp_c = models.FloatField(default=45.0)
    last_calibrated = models.DateField(null=True, blank=True)
    next_service_date = models.DateField(null=True, blank=True)
    data_source = models.CharField(max_length=50, default='IoT LAN/WiFi')

class AiRecommendation(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='ai_recommendations')
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    urgency = models.CharField(max_length=50, default='Suggested')
    impact_description = models.TextField()
    estimated_saving = models.CharField(max_length=255)
    confidence_score = models.IntegerField(default=95)
    created_at = models.DateTimeField(auto_now_add=True)

class StaffMember(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='staff_members')
    name = models.CharField(max_length=255)
    email = models.EmailField(default='')
    password = models.CharField(max_length=255, default='staff@2026')

    role = models.CharField(max_length=50, default='ESTATE_MANAGER')
    title = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=50, default='Active')
    last_active = models.CharField(max_length=100, default='Recently assigned')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.role}) - {self.organization.name}"

