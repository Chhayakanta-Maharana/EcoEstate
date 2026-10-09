import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecoestate_backend.settings')
django.setup()

from api.models import (
    Organization,
    AqiTelemetry,
    WaterTelemetry,
    EnergyTelemetry,
    ParkingTelemetry,
    Dustbin,
    Equipment,
    AiRecommendation,
    StaffMember
)

def seed_all_orgs():
    import time
    for attempt in range(5):
        try:
            orgs = list(Organization.objects.all())
            print(f"Found {len(orgs)} organizations in NeonDB.")
            break
        except Exception as e:
            print(f"Connection attempt {attempt+1} failed: {e}. Retrying in 2s...")
            time.sleep(2)
    else:
        print("Failed to connect after 5 attempts.")
        return

    for o in orgs:
        print(f"--- Seeding/Verifying Telemetry for: {o.name} (ID: {o.id}, Type: {o.facility_type}) ---")

        # 1. AQI Telemetry
        if not AqiTelemetry.objects.filter(organization=o).exists():
            aqi_val = 68 if o.facility_type == 'COLLEGE' else (42 if o.facility_type == 'HOSPITAL' else 145)
            aqi_status = 'Satisfactory' if aqi_val < 100 else 'Moderate'
            AqiTelemetry.objects.create(
                organization=o,
                overall_aqi=aqi_val,
                status=aqi_status,
                pm25=28.4 if aqi_val < 100 else 68.2,
                pm10=55.0 if aqi_val < 100 else 122.0,
                co2=480.0 if aqi_val < 100 else 720.0,
                voc=95.0 if aqi_val < 100 else 210.0,
                temperature=27.5,
                humidity=58.0,
                noise=48.2 if aqi_val < 100 else 64.5,
                hotspot_location=f"{o.name} Main Gate & Utility Circle",
                anomaly_detected=False
            )
            print(f"  [+] Created AqiTelemetry")

        # 2. Water Telemetry
        if not WaterTelemetry.objects.filter(organization=o).exists():
            WaterTelemetry.objects.create(
                organization=o,
                daily_consumption_kl=520.0 if o.facility_type == 'COLLEGE' else 780.0,
                flow_rate_lps=18.5,
                underground_tank_level_pct=84,
                overhead_tank_level_pct=76,
                stp_recycle_rate_pct=82,
                stp_treated_water_kl=420.0,
                ph_level=7.35,
                turbidity_ntu=1.8,
                leak_alert_count=0
            )
            print(f"  [+] Created WaterTelemetry")

        # 3. Energy Telemetry
        if not EnergyTelemetry.objects.filter(organization=o).exists():
            EnergyTelemetry.objects.create(
                organization=o,
                current_load_kw=940.0,
                daily_total_kwh=19200.0,
                peak_load_kw=1250.0,
                grid_power_kw=720.0,
                solar_rooftop_kw=220.0,
                power_factor=0.98,
                carbon_emissions_kg=13800.0,
                savings_inr_today=16500.0
            )
            print(f"  [+] Created EnergyTelemetry")

        # 4. Parking Telemetry
        if not ParkingTelemetry.objects.filter(organization=o).exists():
            ParkingTelemetry.objects.create(
                organization=o,
                total_slots=450,
                occupied_slots=290,
                available_slots=160,
                ev_charging_total=35,
                ev_charging_occupied=22,
                occupancy_rate_pct=64,
                peak_congestion_zone="Gate 1 & North Visitor Lot",
                entry_flow_rate=95
            )
            print(f"  [+] Created ParkingTelemetry")

        # 5. Dustbins
        if Dustbin.objects.filter(organization=o).count() == 0:
            bins = [
                {'bin_code': f'BIN-{o.id}-01', 'zone': 'Academic Block / Main Concourse', 'bin_type': 'Dry Recyclable', 'fill_percentage': 45, 'battery_pct': 94, 'predicted_overflow_mins': 180, 'status': 'Normal', 'last_emptied': '1.5 hrs ago'},
                {'bin_code': f'BIN-{o.id}-02', 'zone': 'Student Cafeteria & Food Court', 'bin_type': 'Wet / Organic Waste', 'fill_percentage': 72, 'battery_pct': 88, 'predicted_overflow_mins': 65, 'status': 'Attention', 'last_emptied': '3 hrs ago'},
                {'bin_code': f'BIN-{o.id}-03', 'zone': 'Central Research & Lab Facility', 'bin_type': 'E-Waste & Batteries', 'fill_percentage': 28, 'battery_pct': 96, 'predicted_overflow_mins': 320, 'status': 'Normal', 'last_emptied': '5 hrs ago'},
                {'bin_code': f'BIN-{o.id}-04', 'zone': 'Sports Complex & Hostel Gate', 'bin_type': 'Mixed Municipal Waste', 'fill_percentage': 58, 'battery_pct': 91, 'predicted_overflow_mins': 110, 'status': 'Normal', 'last_emptied': '2 hrs ago'},
            ]
            for b in bins:
                Dustbin.objects.create(organization=o, **b)
            print(f"  [+] Created 4 Dustbins")

        # 6. Equipment Assets
        if Equipment.objects.filter(organization=o).count() < 4:
            equipments = [
                {'equipment_code': f'EQ-{o.id}-HVAC-01', 'name': 'Central Substation Chiller & HVAC Unit', 'category': 'HVAC & Thermal', 'location': 'Main Utility Plant', 'power_rating_kw': 180, 'operating_temp_c': 39.5, 'vibration_mm_per_sec': 1.1, 'health_score': 94, 'status': 'Operational'},
                {'equipment_code': f'EQ-{o.id}-SOLAR-01', 'name': 'Rooftop Solar Inverter Array (450 kW)', 'category': 'Solar & Electrical', 'location': 'Library & Admin Rooftop', 'power_rating_kw': 450, 'operating_temp_c': 48.2, 'vibration_mm_per_sec': 0.4, 'health_score': 98, 'status': 'Operational'},
                {'equipment_code': f'EQ-{o.id}-STP-01', 'name': 'MBBR Sewage Treatment Aeration Pump', 'category': 'Water & STP', 'location': 'South STP Yard', 'power_rating_kw': 75, 'operating_temp_c': 44.0, 'vibration_mm_per_sec': 2.3, 'health_score': 88, 'status': 'Operational'},
                {'equipment_code': f'EQ-{o.id}-DG-01', 'name': 'Emergency Backup DG Genset (500 kVA)', 'category': 'Backup Power', 'location': 'Powerhouse Zone B', 'power_rating_kw': 500, 'operating_temp_c': 32.0, 'vibration_mm_per_sec': 0.8, 'health_score': 95, 'status': 'Operational'},
                {'equipment_code': f'EQ-{o.id}-CAAQMS-01', 'name': 'Continuous Optical CAAQMS Air Monitor', 'category': 'Environmental Sensor', 'location': 'Central Gate Pole', 'power_rating_kw': 5, 'operating_temp_c': 28.0, 'vibration_mm_per_sec': 0.1, 'health_score': 99, 'status': 'Operational'},
            ]
            for eq in equipments:
                Equipment.objects.get_or_create(
                    organization=o,
                    equipment_code=eq['equipment_code'],
                    defaults=eq
                )
            print(f"  [+] Created Equipment Assets")

        # 7. AI Recommendations
        if not AiRecommendation.objects.filter(organization=o).exists():
            recs = [
                {'title': 'Solar Peak Shaving Adjustment', 'category': 'ENERGY', 'urgency': 'Immediate', 'impact_description': 'Shift chiller cooling pre-load to 11:30 AM to absorb peak rooftop solar generation.', 'estimated_saving': '₹4,800 / day', 'confidence_score': 96},
                {'title': 'STP Recirculation Optimization', 'category': 'WATER', 'urgency': 'Scheduled', 'impact_description': 'Increase secondary filtration duration during 14:00-17:00 when wastewater flow reaches peak.', 'estimated_saving': '120 kL / day', 'confidence_score': 92},
                {'title': 'Substation Power Factor Correction', 'category': 'ELECTRICAL', 'urgency': 'Optimal', 'impact_description': 'Capacitor bank stepped up to maintain 0.98 power factor across high inductive load blocks.', 'estimated_saving': '₹2,200 / day', 'confidence_score': 98}
            ]
            for r in recs:
                AiRecommendation.objects.create(organization=o, **r)
            print(f"  [+] Created AI Recommendations")

        # 7. Staff
        if not StaffMember.objects.filter(organization=o, role='ORG_ADMIN').exists():
            StaffMember.objects.create(
                organization=o,
                name=o.assigned_admin_name or f"Admin of {o.name}",
                email=o.assigned_admin_email,
                role='ORG_ADMIN',
                title=f"Estate Administrator - {o.name}",
                status='Active',
                password=o.assigned_password or 'estate@2026'
            )
            print(f"  [+] Created StaffMember Estate Admin")

    print("\nTelemetry seeding completed successfully!")

if __name__ == '__main__':
    seed_all_orgs()
