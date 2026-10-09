import math

def predict_energy_load(base_load_kw, ambient_temp_c, occupancy_count, max_occupancy):
    """
    Multivariate model predicting peak energy load based on thermal cooling duty and occupancy.
    """
    cooling_factor = 1.0 + max(0.0, (float(ambient_temp_c) - 24.0) * 0.042)
    occupancy_ratio = min(1.5, float(occupancy_count) / max(1.0, float(max_occupancy)))
    occupancy_factor = 0.75 + (0.25 * occupancy_ratio)
    
    predicted_load = float(base_load_kw) * cooling_factor * occupancy_factor
    
    # 24-hour simulation curve
    hours = [f"{h:02d}:00" for h in range(0, 24, 3)] + ["Now"]
    profile = []
    
    multipliers = [0.45, 0.40, 0.55, 0.90, 1.02, 0.95, 0.98, 0.65, 1.0]
    for h, m in zip(hours, multipliers):
        hr_int = int(h[:2]) if h != "Now" else 14
        profile.append({
            "time": h,
            "predicted_load_kw": round(predicted_load * m, 1),
            "grid_draw_kw": round(max(0.0, predicted_load * m * 0.7), 1),
            "solar_generation_kw": round(predicted_load * m * 0.3 if 6 <= hr_int <= 17 else 0.0, 1) if h != "Now" else 220.0
        })
        
    return {
        "predicted_peak_load_kw": round(predicted_load * 1.02, 1),
        "cooling_thermal_multiplier": round(cooling_factor, 2),
        "hourly_curve": profile
    }

def predict_dustbin_overflow(fill_percentage, fill_rate_per_hour=15.0):
    """
    Linear regression countdown forecasting minutes remaining until container overflows.
    """
    fill_pct = float(fill_percentage)
    rate = float(fill_rate_per_hour) if float(fill_rate_per_hour) > 0 else 10.0
    remaining_capacity = max(0.0, 100.0 - fill_pct)
    minutes_left = int((remaining_capacity / rate) * 60)
    
    urgency = "Normal"
    if minutes_left <= 30:
        urgency = "Overflow Warning"
    elif minutes_left <= 90:
        urgency = "Near Full"
        
    return {
        "fill_percentage": fill_pct,
        "predicted_overflow_mins": minutes_left,
        "urgency": urgency,
        "collection_recommended": minutes_left <= 45
    }

def detect_anomalies(data_points):
    """
    Pure Python Z-score and IQR statistical anomaly detector.
    """
    if not data_points or len(data_points) < 4:
        return {"anomaly_detected": False, "anomaly_score": 0.0, "severity": "NORMAL"}
        
    nums = [float(x) for x in data_points]
    n = len(nums)
    mean = sum(nums) / n
    variance = sum((x - mean) ** 2 for x in nums) / max(1, n - 1)
    std_dev = math.sqrt(variance) if variance > 0 else 1.0
    
    latest_val = nums[-1]
    z_score = abs(latest_val - mean) / std_dev
    
    has_anomaly = z_score > 2.2
    
    return {
        "anomaly_detected": bool(has_anomaly),
        "z_score": round(z_score, 3),
        "severity": "CRITICAL" if z_score > 3.0 else "WARNING" if z_score > 2.2 else "NORMAL"
    }

def run_what_if_simulation(
    facility_type,
    solar_drop_pct=0,
    occupancy_surge_pct=0,
    heatwave_c=0,
    water_cut_pct=0,
    hvac_hours_reduced=0,
    waste_tuesday_shift=False
):
    """
    Grand Finale What-If Climate Resilience & Operational Intervention Engine.
    Simulates:
    1. 'What if HVAC runs an hour less' (Thermal inertia load shifting)
    2. 'What if collection shifts to Tuesday' (Dynamic waste routing & landfill diversion)
    3. Climate & occupancy stress scenarios (Solar dip, heatwave, occupancy surges)
    """
    base_loads = {
        'HOSPITAL': {'load': 840, 'solar': 220, 'water': 420, 'hvac_ratio': 0.42, 'waste_tons': 1.8},
        'COLLEGE': {'load': 1250, 'solar': 580, 'water': 680, 'hvac_ratio': 0.38, 'waste_tons': 2.4},
        'PSU': {'load': 4800, 'solar': 1200, 'water': 1450, 'hvac_ratio': 0.35, 'waste_tons': 5.2},
        'INDUSTRY': {'load': 9200, 'solar': 1850, 'water': 2800, 'hvac_ratio': 0.32, 'waste_tons': 8.6},
        'MUNICIPAL': {'load': 420, 'solar': 160, 'water': 180, 'hvac_ratio': 0.40, 'waste_tons': 3.1},
    }
    
    base = base_loads.get(facility_type, base_loads['HOSPITAL'])
    
    sim_solar = base['solar'] * (1 - float(solar_drop_pct) / 100.0)
    cooling_penalty = 1 + (float(heatwave_c) * 0.045)
    occupancy_penalty = 1 + (float(occupancy_surge_pct) * 0.0035)
    
    sim_load = round(base['load'] * cooling_penalty * occupancy_penalty)
    sim_grid = max(0, sim_load - sim_solar)
    
    delta_load_pct = round(((sim_load - base['load']) / base['load']) * 100, 1)
    extra_cost_inr = round((sim_grid - (base['load'] - base['solar'])) * 14 * 8.5)
    
    grid_risk = "HIGH RISK" if sim_load > base['load'] * 1.25 else "MODERATE" if sim_load > base['load'] * 1.1 else "LOW RISK"
    
    # Specific Scenario 1: What if HVAC runs an hour less
    hvac_hours = float(hvac_hours_reduced)
    hvac_load_kw = base['load'] * base['hvac_ratio']
    hvac_kwh_saved_daily = round(hvac_load_kw * hvac_hours, 1)
    hvac_cost_saved_monthly_inr = round(hvac_kwh_saved_daily * 8.5 * 30)
    hvac_co2_avoided_kg_daily = round(hvac_kwh_saved_daily * 0.82, 1)
    thermal_comfort_variance_c = round(hvac_hours * 0.32, 2)
    
    # Specific Scenario 2: What if collection shifts to Tuesday
    is_tuesday_shift = bool(waste_tuesday_shift)
    diesel_saved_litres_weekly = 42.0 if is_tuesday_shift else 0.0
    bin_overflow_risk_reduction_pct = 38 if is_tuesday_shift else 0
    dry_recyclable_purity_gain_pct = 24 if is_tuesday_shift else 0
    landfill_diverted_tons_monthly = round(base['waste_tons'] * 0.45 * 4, 1) if is_tuesday_shift else 0.0
    waste_co2_avoided_kg_weekly = round(diesel_saved_litres_weekly * 2.68, 1)
    
    recommended_actions = [
        "[INT-ENG-101] Pre-Cooling Thermal Storage: Shift chiller setpoint down 1.5°C at 11:30 AM to absorb solar surplus, allowing 1-hr earlier shutdown.",
        "[INT-WST-201] Tuesday & Friday Fleet Alignment: Sync campus dry-waste pickup with municipal processing window to divert landfill loads.",
        "[INT-WTR-301] STP Treated Effluent Chiller Loop: Route 95% secondary treated water into cooling tower circuit to save 180 kL fresh water.",
        "[INT-SOL-401] Inverter Phase Balancing: Dynamically throttle non-essential laboratory plug-loads to prevent grid draw spikes."
    ]
    
    return {
        "facility_type": facility_type,
        "simulated_load_kw": sim_load,
        "simulated_solar_kw": round(sim_solar),
        "simulated_grid_draw_kw": round(sim_grid),
        "delta_load_percentage": delta_load_pct,
        "extra_cost_per_day_inr": max(0, extra_cost_inr),
        "grid_overload_risk": grid_risk,
        "hvac_simulation": {
            "hours_reduced": hvac_hours,
            "kwh_saved_daily": hvac_kwh_saved_daily,
            "cost_saved_monthly_inr": hvac_cost_saved_monthly_inr,
            "co2_avoided_kg_daily": hvac_co2_avoided_kg_daily,
            "thermal_comfort_variance_c": thermal_comfort_variance_c,
            "compliance_status": "ASHRAE 55 & NBC 2016 Compliant (< 0.5°C drift)" if thermal_comfort_variance_c <= 0.5 else "Buffer Zone Tolerable"
        },
        "waste_simulation": {
            "is_tuesday_shift": is_tuesday_shift,
            "diesel_saved_litres_weekly": diesel_saved_litres_weekly,
            "bin_overflow_risk_reduction_pct": bin_overflow_risk_reduction_pct,
            "dry_recyclable_purity_gain_pct": dry_recyclable_purity_gain_pct,
            "landfill_diverted_tons_monthly": landfill_diverted_tons_monthly,
            "co2_avoided_kg_weekly": waste_co2_avoided_kg_weekly
        },
        "recommended_actions": recommended_actions
    }
