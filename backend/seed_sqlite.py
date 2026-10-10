import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecoestate_backend.settings')
django.setup()

from api.models import (
    Organization, StaffMember, AqiTelemetry, WaterTelemetry,
    EnergyTelemetry, ParkingTelemetry, Dustbin, Equipment, AiRecommendation
)

print("[SQLite Seed] Initializing local database with standard campus and facility nodes...")

orgs_data = [
    {
        'name': 'Government College of Engineering Kalahandi (GCEK)',
        'facility_type': 'COLLEGE',
        'category_label': 'Government Engineering College',
        'city': 'Bhawanipatna',
        'state': 'Odisha',
        'area_sqft': 1500000,
        'occupancy_current': 3200,
        'occupancy_max': 5000,
        'assigned_admin_name': 'Hari Pangi',
        'assigned_admin_email': 'hari.pangi@gcek.ac.in',
        'assigned_password': 'college@2026',
        'iot_gateway_ip': '192.168.0.191',
        'sustainability_score': 83,
        'carbon_target_reduction_pct': 28,
        'description': 'Constituent college of BPUT featuring continuous optical CAAQMS, rooftop solar PV microgrid, and smart waste segregation.'
    },
    {
        'name': 'BPUT State University & Engineering Campus',
        'facility_type': 'COLLEGE',
        'category_label': 'Technical University',
        'city': 'Rourkela',
        'state': 'Odisha',
        'area_sqft': 2400000,
        'occupancy_current': 8650,
        'occupancy_max': 12000,
        'assigned_admin_name': 'Prof. Ramesh Mohanty',
        'assigned_admin_email': 'campus.estate@bput.ac.in',
        'assigned_password': 'college@2026',
        'iot_gateway_ip': '192.168.20.1',
        'sustainability_score': 84,
        'carbon_target_reduction_pct': 30,
        'description': 'Premier state technical university campus with high solar rooftop deployment, 6 hostels, smart labs, and rain harvesting lakes.'
    },
    {
        'name': 'AIIMS Apex Healthcare & Research Campus',
        'facility_type': 'HOSPITAL',
        'category_label': 'Super Specialty Hospital',
        'city': 'Bhubaneswar',
        'state': 'Odisha',
        'area_sqft': 1850000,
        'occupancy_current': 14200,
        'occupancy_max': 18000,
        'assigned_admin_name': 'Dr. Arvind Sharma',
        'assigned_admin_email': 'hospital.admin@aiims.gov.in',
        'assigned_password': 'hospital@2026',
        'iot_gateway_ip': '192.168.10.1',
        'sustainability_score': 88,
        'carbon_target_reduction_pct': 25,
        'description': 'Tertiary-care government hospital with 24/7 emergency, ICU wards, PSA oxygen plant, and green bio-medical waste segregation.'
    },
    {
        'name': 'ONGC Green Energy & Refining Estate',
        'facility_type': 'PSU',
        'category_label': 'Central Public Sector Enterprise (CPSE)',
        'city': 'Hazira',
        'state': 'Gujarat',
        'area_sqft': 4500000,
        'occupancy_current': 6200,
        'occupancy_max': 8500,
        'assigned_admin_name': 'Sanjay Verma',
        'assigned_admin_email': 'psu.operations@ongc.in',
        'assigned_password': 'psu@2026',
        'iot_gateway_ip': '192.168.30.1',
        'sustainability_score': 79,
        'carbon_target_reduction_pct': 35,
        'description': 'Strategic national energy complex with continuous emissions monitoring (CEMS), high-voltage substations, and zero liquid discharge.'
    },
    {
        'name': 'Tata Steel Green Steelmaking Complex',
        'facility_type': 'INDUSTRY',
        'category_label': 'Heavy Industrial & Manufacturing Estate',
        'city': 'Jamshedpur',
        'state': 'Jharkhand',
        'area_sqft': 6200000,
        'occupancy_current': 11400,
        'occupancy_max': 15000,
        'assigned_admin_name': 'Pooja Deshmukh',
        'assigned_admin_email': 'industry.head@tatasteel.com',
        'assigned_password': 'industry@2026',
        'iot_gateway_ip': '192.168.40.1',
        'sustainability_score': 81,
        'carbon_target_reduction_pct': 40,
        'description': 'Integrated manufacturing zone monitoring blast furnace emissions, heavy transport logistics, industrial water recycling, and slag processing.'
    }
]

for d in orgs_data:
    org, created = Organization.objects.get_or_create(name=d['name'], defaults=d)
    print(f" -> Org '{org.name}' (ID: {org.id}) {'created' if created else 'exists'}")

    # Seed baseline initial telemetry for each organization
    if not AqiTelemetry.objects.filter(organization=org).exists():
        AqiTelemetry.objects.create(
            organization=org,
            overall_aqi=58,
            status='Good',
            pm25=24.5,
            pm10=45.0,
            co2=430.0,
            voc=85.0,
            temperature=28.5,
            humidity=55.0,
            noise=48.0,
            hotspot_location=f"{org.name} Sensor Quad #1"
        )

    if not WaterTelemetry.objects.filter(organization=org).exists():
        WaterTelemetry.objects.create(
            organization=org,
            daily_consumption_kl=320.0,
            stp_treated_water_kl=230.0,
            underground_tank_level_pct=78,
            overhead_tank_level_pct=78,
            stp_recycle_rate_pct=72,
            flow_rate_lps=18.2,
            ph_level=7.2,
            turbidity_ntu=1.5
        )

    if not EnergyTelemetry.objects.filter(organization=org).exists():
        EnergyTelemetry.objects.create(
            organization=org,
            current_load_kw=420.0,
            daily_total_kwh=5880.0,
            peak_load_kw=485.0,
            grid_power_kw=240.0,
            solar_rooftop_kw=180.0,
            power_factor=0.98,
            carbon_emissions_kg=4800.0,
            savings_inr_today=10080.0
        )

    if not ParkingTelemetry.objects.filter(organization=org).exists():
        ParkingTelemetry.objects.create(
            organization=org,
            total_slots=80,
            occupied_slots=42,
            available_slots=38,
            ev_charging_total=12,
            ev_charging_occupied=6,
            occupancy_rate_pct=52,
            peak_congestion_zone='Basement Bay 1 - Lane 4',
            entry_flow_rate=24
        )

    if not Dustbin.objects.filter(organization=org).exists():
        Dustbin.objects.create(
            organization=org,
            bin_code=f"BIN-{org.id}-01",
            zone=f"{org.name} Plaza",
            bin_type='Dry Waste',
            fill_percentage=35,
            battery_pct=94,
            predicted_overflow_mins=120,
            status='Normal'
        )

    if not Equipment.objects.filter(organization=org).exists():
        Equipment.objects.create(
            organization=org,
            equipment_code=f"EQ-{org.id}-PUMP",
            name=f"STP Raw Sewage Lift Pump #4",
            category='Water Treatment & Pumps',
            location=f"{org.name} Utility Yard",
            vibration_mm_per_sec=1.15,
            operating_temp_c=42.0,
            status='Operational',
            health_score=95
        )

print("[SQLite Seed] Seeding completed successfully.")
