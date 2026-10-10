"""
Multi-Behavior Organization-Adaptive AI Service powered by Groq Llama-3.3-70B Engine.
Provides dynamic persona system prompts, sensor telemetry evaluation,
and actionable maintenance workflows for EcoEstate India.
"""

import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from .shap_explainer import compute_exact_shap_values, SENSOR_BENCHMARKS

DEFAULT_GROQ_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b"
]
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

# 1. Organization Persona Profiles
ORGANIZATION_PERSONAS = {
    'HOSPITAL': {
        'name': 'Critical Healthcare Utility & Cleanroom Specialist',
        'badge': '🏥 Hospital (Zero-Tolerance)',
        'urgency_bias': 'EMERGENCY',
        'compliance_framework': 'NABH Standards, ISO 14644-1 Cleanroom, NFPA 99 Healthcare Facilities',
        'primary_policy': 'Zero downtime tolerance. Patient life-support, ICU power redundancy, sterile OT air pressure, and sterile medical gas/water are non-negotiable. Minor deviations trigger immediate switchover to secondary standby units and emergency engineer dispatch.',
        'tone': 'Strict, decisive, clinical, zero-tolerance, high-urgency'
    },
    'INDUSTRY': {
        'name': 'Industrial Safety & Mechanical Reliability Engineer',
        'badge': '🏭 Heavy Industry (ISO 14001 / Vibration)',
        'urgency_bias': 'CRITICAL',
        'compliance_framework': 'ISO 10816 Vibration Severity, ISO 14001 Environmental, OSHA Lockout/Tagout (LOTO)',
        'primary_policy': 'Prevent production line stoppage and mechanical shaft seizure. Prioritize mechanical wear diagnostics, harmonic distortion mitigation, and immediate Lockout/Tagout (LOTO) protocols for maintenance personnel safety.',
        'tone': 'Authoritative, technical, safety-oriented, engineering-precise'
    },
    'COLLEGE': {
        'name': 'Campus Sustainability & Facility Advisor',
        'badge': '🎓 Campus & Academic Estate Advisor',
        'urgency_bias': 'WARNING',
        'compliance_framework': 'AICTE/UGC Green Campus Framework, CPCB National Air Standards, BEE Star Rating',
        'primary_policy': 'Ensure uninterrupted academic sessions, hostel comfort, and student safety. Maximize STP treated water reuse for botanical lawns, optimize solar peak shaving, and schedule noisy maintenance during off-class or weekend hours.',
        'tone': 'Educative, sustainability-focused, cost-conscious, planned-schedule'
    },
    'PSU': {
        'name': 'Civic Infrastructure & ESG Governance Director',
        'badge': '🏛️ PSU / Municipal Infrastructure Director',
        'urgency_bias': 'HIGH_COMPLIANCE',
        'compliance_framework': 'CPCB CAAQMS Regulatory Guidelines, MoHUA Smart Cities ESG Framework, National Water Mission',
        'primary_policy': 'Maintain public transparency, statutory CPCB clean air compliance, urban STP effluent quality, and ESG audit readiness across municipal and public sector estates.',
        'tone': 'Governance-focused, regulatory, public-safety, audit-ready'
    },
    'MUNICIPAL': {
        'name': 'Civic Infrastructure & ESG Governance Director',
        'badge': '🏛️ Municipal Infrastructure Director',
        'urgency_bias': 'HIGH_COMPLIANCE',
        'compliance_framework': 'CPCB CAAQMS Guidelines, Swachh Bharat Smart Bin Protocols, SWM Rules 2016',
        'primary_policy': 'Public sanitation uptime, smart waste route dispatch, flood-proof lift stations, and civic air quality compliance.',
        'tone': 'Administrative, public-service, regulatory'
    },
    'COMMERCIAL': {
        'name': 'Tenant Comfort & Smart Building Energy Manager',
        'badge': '🏬 Commercial Real Estate & IT Park Manager',
        'urgency_bias': 'MODERATE',
        'compliance_framework': 'ASHRAE 62.1 Indoor Air Quality, IGBC Green Building, LEED O+M Platinum',
        'primary_policy': 'Maintain premium tenant comfort (IAQ CO2 < 800 ppm, temperature 23°C), sub-metering billing accuracy, and execute maintenance strictly after business hours to avoid tenant disruption.',
        'tone': 'Professional, tenant-centric, energy-optimizing, business-smooth'
    }
}

# 2. Sensor Cluster Benchmarks & Fallback Parameters
CLUSTER_MAPPING = {
    'WATER': 'WATER_PUMP',
    'WATER_PUMP': 'WATER_PUMP',
    'STP': 'WATER_PUMP',
    'ENERGY': 'ENERGY_TRANSFORMER',
    'SUBSTATION': 'ENERGY_TRANSFORMER',
    'ENERGY_TRANSFORMER': 'ENERGY_TRANSFORMER',
    'AQI': 'AIR_QUALITY_STATION',
    'AIR_QUALITY_STATION': 'AIR_QUALITY_STATION',
    'AIR': 'AIR_QUALITY_STATION',
    'WASTE': 'SMART_BIN',
    'SMART_BIN': 'SMART_BIN',
    'HVAC': 'WATER_PUMP', # or general machinery
    'GATEWAY': 'IOT_GATEWAY_NODE',
    'IOT_GATEWAY_NODE': 'IOT_GATEWAY_NODE',
    'ALL': 'WATER_PUMP',
    'ESTATE': 'WATER_PUMP'
}


def get_groq_api_key() -> str:
    return os.environ.get("GROQ_API_KEY", "").strip() or DEFAULT_GROQ_KEY


def build_system_prompt(org_type: str, cluster: str = 'ALL') -> str:
    org_key = org_type.upper().strip()
    persona = ORGANIZATION_PERSONAS.get(org_key, ORGANIZATION_PERSONAS['COLLEGE'])
    
    return f"""You are the Master EcoEstate AI Copilot & Technical Operations Advisor for {persona['badge']}.
Organization Persona: {persona['name']}
Applicable Compliance Framework: {persona['compliance_framework']}
Tone & Demeanor: {persona['tone']}
Operational Policy:
{persona['primary_policy']}

UNIFIED ESTATE INFRASTRUCTURE DOMAINS (YOU COVER ALL OF THESE):
1. Water & STP: Submersible pumps, membrane bio-reactors (MBR), overhead/underground sumps, greywater recycling, Zero Liquid Discharge (ZLD), pH purity, and TDS.
2. Energy & Power: 11kV/415V substations, rooftop solar PV systems, active load, harmonics, power factor (PF) correction, diesel genset backup.
3. Air Quality & CAAQMS: CPCB continuous ambient air monitoring, PM2.5, PM10, CO2 levels, indoor air quality (IAQ), dust mitigation.
4. Smart Waste: Wet/dry segregation, RFID smart bins, organic waste composters, hazardous/biomedical/e-waste protocols.
5. HVAC & Chillers: Central chilled water loops, AHU air handling, positive pressure cleanroom/ICU air filtration, thermal comfort.
6. Asset Health & Maintenance: ISO 10816 vibration guidelines, motor overheating, electrical safety (OSHA LOTO), spare parts, and technician procedures.

MANDATORY BEHAVIOR:
- Directly, accurately, and thoroughly answer ANY question the user asks about water, energy, solar, air quality, waste, HVAC, equipment diagnostics, or operations for this estate.
- Give a direct, structured response with technical clarity, engineering insights, and practical steps.
- If no real-time telemetry is provided or telemetry is in standby, DO NOT invent fake emergency alarms. Answer the user's question directly with operational best practices and engineering standards.

YOUR MANDATORY OUTPUT FORMAT:
You must reply with a valid JSON object strictly matching this schema:
{{
  "persona_summary": "1-line badge and current operational summary",
  "urgency": "NORMAL" | "WARNING" | "CRITICAL" | "EMERGENCY",
  "domain": "WATER" | "ENERGY" | "AQI" | "WASTE" | "HVAC" | "ESTATE_OPERATIONS",
  "answer": "Direct, structured markdown explanation answering the user's specific question with technical depth, bullet points, and reasoning.",
  "sensor_evaluations": [
    {{
      "parameter": "Parameter Name",
      "measured_value": 0.0,
      "threshold_value": 0.0,
      "unit": "unit",
      "status": "NORMAL" | "ELEVATED" | "CRITICAL",
      "deviation_pct": "+0%"
    }}
  ],
  "immediate_actions": [
    "Key action or recommendation 1",
    "Key action or recommendation 2"
  ],
  "maintenance_steps": [
    "Step 1: Specific procedure...",
    "Step 2: ..."
  ],
  "spare_parts": [
    "Relevant spare part with model/spec (e.g. SKF-6208 bearing, APFC capacitor)"
  ]
}}

CRITICAL INSTRUCTIONS:
1. If persona is HOSPITAL:
   - Any failure in critical power, chillers, medical gas, or cleanroom pressure has ZERO DOWNTIME TOLERANCE. Mandate immediate switch to backup units.
2. Return ONLY the JSON object without markdown fences or extraneous text.
"""


def query_groq_copilot(
    org_type: str,
    cluster: str,
    sensor_telemetry: Dict[str, Any],
    user_query: Optional[str] = None,
    org_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes a high-speed Llama-3.3-70B diagnostic query via Groq API.
    Falls back gracefully to localized rule-based SHAP engine if network or API limits fail.
    """
    api_key = get_groq_api_key()
    org_type_clean = org_type.upper().strip() if org_type else 'COLLEGE'
    cluster_clean = cluster.upper().strip() if cluster else 'WATER_PUMP'
    mapped_category = CLUSTER_MAPPING.get(cluster_clean, 'WATER_PUMP')

    # Compute base SHAP baseline contributions for fallback or telemetry injection
    numeric_telemetry = {}
    for k, v in sensor_telemetry.items():
        try:
            numeric_telemetry[k] = float(v)
        except (ValueError, TypeError):
            pass

    shap_result = compute_exact_shap_values(
        sensor_category=mapped_category,
        telemetry_values=numeric_telemetry,
        sensor_id=sensor_telemetry.get('node_id', 'NODE-01'),
        sensor_name=f"{org_name or org_type_clean} {cluster_clean} Unit"
    )

    system_prompt = build_system_prompt(org_type_clean, cluster_clean)
    
    user_content = {
        "organization_name": org_name or f"EcoEstate {org_type_clean} Estate",
        "organization_type": org_type_clean,
        "cluster": cluster_clean,
        "user_query": user_query or f"Diagnose live telemetry and provide maintenance requirements for {cluster_clean}.",
        "telemetry_readings": numeric_telemetry,
        "preliminary_shap_score": shap_result.get('anomaly_prediction_score', 0.0),
        "dominant_sensor_feature": shap_result.get('dominant_root_cause', {}).get('feature_label', 'Normal')
    }

    last_error = None
    for model_name in GROQ_MODELS:
        groq_payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_content, indent=2)}
            ],
            "temperature": 0.2,
            "max_tokens": 1500,
            "response_format": {"type": "json_object"}
        }

        try:
            req = urllib.request.Request(
                GROQ_API_URL,
                data=json.dumps(groq_payload).encode('utf-8'),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "User-Agent": GROQ_USER_AGENT
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                raw_text = res_data['choices'][0]['message']['content'].strip()
                
                # Clean JSON if any markdown wrapping was included
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                raw_text = raw_text.strip()
                
                parsed_result = json.loads(raw_text)
                parsed_result['source'] = f'GROQ_CLOUD ({model_name})'
                parsed_result['shap_contributions'] = shap_result.get('shap_contributions', [])
                return parsed_result
        except Exception as e:
            last_error = str(e)
            continue

    # Fallback to local rule-based SHAP engine if all models failed
    return generate_local_fallback_diagnosis(
        org_type=org_type_clean,
        cluster=cluster_clean,
        telemetry=numeric_telemetry,
        shap_result=shap_result,
        error_reason=last_error or "Network failure"
    )


def generate_local_fallback_diagnosis(
    org_type: str,
    cluster: str,
    telemetry: Dict[str, float],
    shap_result: Dict[str, Any],
    error_reason: str = ""
) -> Dict[str, Any]:
    """
    Offline Rule-Based Diagnostic Generator that matches the exact response schema.
    Ensures uninterrupted operation even during internet disruption.
    """
    persona = ORGANIZATION_PERSONAS.get(org_type, ORGANIZATION_PERSONAS['COLLEGE'])
    fault_prob = shap_result.get('anomaly_prediction_score', 0.15)
    dominant = shap_result.get('dominant_root_cause', {})
    dominant_key = dominant.get('feature_key', 'general')

    # Urgency assignment
    if org_type == 'HOSPITAL':
        urgency = "EMERGENCY" if fault_prob > 0.25 else "WARNING"
    elif org_type == 'INDUSTRY':
        urgency = "CRITICAL" if fault_prob > 0.40 else "WARNING" if fault_prob > 0.20 else "NORMAL"
    else:
        urgency = "CRITICAL" if fault_prob > 0.65 else "WARNING" if fault_prob > 0.35 else "NORMAL"

    sensor_evals = []
    for c in shap_result.get('shap_contributions', []):
        meas = c.get('actual_value', 0.0)
        base = c.get('baseline_value', 0.0)
        diff_pct = round(((meas - base) / max(0.001, base)) * 100, 1)
        sign = "+" if diff_pct > 0 else ""
        status = "CRITICAL" if abs(diff_pct) > 60 else "ELEVATED" if abs(diff_pct) > 25 else "NORMAL"
        sensor_evals.append({
            "parameter": c.get('feature_label', c.get('feature_key')),
            "measured_value": meas,
            "threshold_value": base,
            "unit": c.get('unit', ''),
            "status": status,
            "deviation_pct": f"{sign}{diff_pct}%"
        })

    # Default hospital emergency procedure
    if org_type == 'HOSPITAL':
        immediate_actions = [
            "Emergency switchover: Engage secondary redundant backup unit (Chiller #2 / Genset ATS Busbar).",
            "Continuous clinical monitoring: Verify positive pressure (+20 Pa) in ICU/OT cleanroom ducts.",
            "Alert Biomedical Engineering Rapid Response Team via internal paging."
        ]
        maintenance_steps = [
            "Isolate primary faulty unit and apply clinical Lockout/Tagout (LOTO).",
            "Perform laser shaft vibration analysis on motor drive-end and non-drive-end bearings.",
            "Verify chilled water differential temperature (Delta-T) across heat exchanger tubes.",
            "Recalibrate positive-pressure differential sensor and check HEPA filter resistance."
        ]
        required_tools = [
            "ISO 10816-1 Optical Vibration Pen & Tachometer",
            "Digital Differential Pressure Manometer (0-100 Pa range)",
            "Fluke 87V Industrial True-RMS Multimeter",
            "Sterilized PPE Cleanroom Gown and Booties"
        ]
        spare_parts = [
            "SKF-6208 2Z Deep Groove Ball Bearings (C3 Clearance)",
            "Grade H14 Terminal HEPA Filter Cartridge (610x610x150 mm)",
            "R-134a Medical HVAC Grade Refrigerant Cylinder (13.6 kg)",
            "EPDM High-Purity Gasket Kit"
        ]
    elif org_type == 'INDUSTRY':
        immediate_actions = [
            "Execute OSHA Lockout/Tagout (LOTO) on 415V distribution bus feeder.",
            "Divert mechanical load to standby feeder to prevent production line stoppage.",
            "Inspect mechanical shaft coupling for dynamic angular misalignment."
        ]
        maintenance_steps = [
            "De-energize main motor circuit and verify zero-voltage using calibrated probe.",
            "Perform dial gauge runout check on motor-to-pump coupling shaft.",
            "Flush degraded lithium grease and repack bearing cavity to 40% volume.",
            "Test motor stator winding insulation resistance using 1000V Megger tester."
        ]
        required_tools = [
            "Laser Shaft Alignment System (Fixturlaser / Pruftechnik)",
            "Fluke 1587 FC 1000V Insulation Resistance Tester (Megger)",
            "Digital Torque Wrench (20-150 Nm)",
            "High-Temperature Ultrasonic Grease Gun with dB Sensor"
        ]
        spare_parts = [
            "SKF Explorer 6310 C3 Deep Groove Ball Bearings",
            "Viton High-Temperature Mechanical Face Seals (45mm shaft)",
            "Mobil Polyrex EM Synthetic Polyurea Grease",
            "Lovejoy Jaw Coupling Elastomer Spider Insert (Size L-110)"
        ]
    else:
        immediate_actions = [
            "Notify campus estate maintenance supervisor of telemetry elevation.",
            "Verify automated bypass valves to avoid campus supply interruption.",
            "Schedule on-site technician inspection during upcoming off-peak hours."
        ]
        maintenance_steps = [
            "Inspect physical unit for unusual acoustic cavitation or chassis vibration.",
            "Check power factor APFC bank capacitors for swollen contactors.",
            "Clean intake air filters and remove debris from suction manifold."
        ]
        required_tools = [
            "Clamp-on Digital Ammeter (AC/DC 400A)",
            "Non-Contact Infrared Thermometer Gun (-50°C to 550°C)",
            "Standard Electrician Insulated Tool Kit (1000V rated)"
        ]
        spare_parts = [
            "Heavy Duty Contactor 32A 3-Pole 240V Coil",
            "Replacement 50-Micron Intake Mesh Screen",
            "General Purpose Lithium EP-2 Grease"
        ]

    return {
        "persona_summary": f"{persona['badge']}: {persona['primary_policy'][:120]}...",
        "urgency": urgency,
        "answer": f"**Diagnostic Assessment ({persona['name']})**\n\nDominant root cause identified as **{dominant.get('feature_label', dominant_key)}** with anomaly probability score of **{round(fault_prob * 100, 1)}%**. System is actively operating under {persona['compliance_framework']}.",
        "sensor_evaluations": sensor_evals,
        "immediate_actions": immediate_actions,
        "maintenance_steps": maintenance_steps,
        "required_tools": required_tools,
        "spare_parts": spare_parts,
        "compliance_standards": [persona['compliance_framework']],
        "shap_contributions": shap_result.get('shap_contributions', []),
        "source": "LOCAL_SHAP_FALLBACK",
        "note": f"Rule-based deterministic diagnosis (Groq status: {error_reason or 'local mode'})"
    }
