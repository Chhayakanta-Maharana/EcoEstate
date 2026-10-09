from rest_framework import serializers
from .models import (
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

class StaffMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffMember
        fields = '__all__'

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

class AqiTelemetrySerializer(serializers.ModelSerializer):
    class Meta:
        model = AqiTelemetry
        fields = '__all__'

class WaterTelemetrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterTelemetry
        fields = '__all__'

class EnergyTelemetrySerializer(serializers.ModelSerializer):
    class Meta:
        model = EnergyTelemetry
        fields = '__all__'

class ParkingTelemetrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingTelemetry
        fields = '__all__'

class DustbinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dustbin
        fields = '__all__'

class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = '__all__'

class AiRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AiRecommendation
        fields = '__all__'

