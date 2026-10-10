from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationViewSet,
    EquipmentViewSet,
    DustbinViewSet,
    AqiTelemetryViewSet,
    WaterTelemetryViewSet,
    EnergyTelemetryViewSet,
    ParkingTelemetryViewSet,
    StaffMemberViewSet,
    AiRecommendationViewSet,
    energy_prediction_view,
    dustbin_overflow_prediction_view,
    what_if_simulation_view,
    batch_import_equipment_view,
    seed_initial_data_view,
    iot_ingest_view,
    iot_status_view,
    iot_packets_stream_view,
    iot_live_nodes_view,
    iot_update_node_positions_view,
    iot_simulate_packet_view,
    iot_gateway_config_view,
    admin_realtime_analytics_view,
    api_login_view,
    forgot_password_request_view,
    reset_password_confirm_view,
    send_credentials_email_view,
    assign_user_role_and_notify_view,
    shap_sensor_explain_view,
    list_sensor_anomalies_shap_view,
    superadmin_profile_update_view,
    org_copilot_ai_view,
    configure_parking_capacity_view,
)

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet)
router.register(r'staff', StaffMemberViewSet)
router.register(r'equipment', EquipmentViewSet)
router.register(r'dustbins', DustbinViewSet)
router.register(r'aqi', AqiTelemetryViewSet)
router.register(r'water', WaterTelemetryViewSet)
router.register(r'energy', EnergyTelemetryViewSet)
router.register(r'parking', ParkingTelemetryViewSet)
router.register(r'recommendations', AiRecommendationViewSet)

urlpatterns = [
    # Manual Campus Parking Space Capacity Configuration
    path('parking/configure-capacity/', configure_parking_capacity_view, name='configure_parking_capacity'),

    path('', include(router.urls)),
    
    # Strict Authentication & Password Recovery Endpoints
    path('auth/login/', api_login_view, name='api_login'),
    path('auth/superadmin/profile/', superadmin_profile_update_view, name='superadmin_profile_update'),
    path('auth/forgot-password/', forgot_password_request_view, name='forgot_password_request'),
    path('auth/reset-password/', reset_password_confirm_view, name='reset_password_confirm'),

    # User Role Assignment & Credentials Dispatch Endpoint
    path('users/assign-role/', assign_user_role_and_notify_view, name='assign_user_role_and_notify'),

    # Re-send Credentials Email Endpoint
    path('organizations/<str:org_id>/send-credentials/', send_credentials_email_view, name='send_credentials_email'),

    # Multi-Behavior Organization-Adaptive Groq AI Copilot
    path('ai/org-copilot/', org_copilot_ai_view, name='org_copilot_ai'),

    # Explainable AI (XAI) SHAP Diagnostic Routes
    path('ai/shap-explain/', shap_sensor_explain_view, name='shap_sensor_explain'),
    path('ai/sensor-anomalies/', list_sensor_anomalies_shap_view, name='list_sensor_anomalies_shap'),

    path('predict/energy-load/', energy_prediction_view, name='predict_energy'),
    path('predict/dustbin-overflow/', dustbin_overflow_prediction_view, name='predict_dustbin'),
    path('predict/scenario-simulate/', what_if_simulation_view, name='simulate_scenario'),
    path('equipment/batch-import/', batch_import_equipment_view, name='batch_import_equipment'),
    path('seed-database/', seed_initial_data_view, name='seed_database'),
    
    # Real-Time NeonDB SuperAdmin Analytics & Tenant Directory
    path('analytics/realtime/', admin_realtime_analytics_view, name='admin_realtime_analytics'),

    # Dual-Channel IoT Ingest & Telemetry Gateway Endpoints (LAN & WiFi)
    path('iot/ingest/', iot_ingest_view, name='iot_ingest'),
    path('iot/status/', iot_status_view, name='iot_status'),
    path('iot/packets/', iot_packets_stream_view, name='iot_packets'),
    path('iot/nodes/live/', iot_live_nodes_view, name='iot_live_nodes'),
    path('iot/nodes/update-positions/', iot_update_node_positions_view, name='iot_update_node_positions'),
    path('iot/simulate/', iot_simulate_packet_view, name='iot_simulate'),
    path('iot/gateway-config/', iot_gateway_config_view, name='iot_gateway_config'),
]


