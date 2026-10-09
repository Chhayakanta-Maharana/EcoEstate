export type Role =
  | 'SUPERADMIN'
  | 'ORG_ADMIN'
  | 'ORG_OPERATOR'
  | 'ESTATE_MANAGER'
  | 'ENERGY_AUDITOR'
  | 'FACILITY_VIEWER';

export type FacilityType = 'HOSPITAL' | 'COLLEGE' | 'PSU' | 'INDUSTRY' | 'MUNICIPAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId?: string;
  organizationName?: string;
  status?: 'Active' | 'Inactive' | 'Pending';
  lastActive?: string;
  createdAt?: string;
  avatar?: string;
  title?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: FacilityType;
  categoryLabel: string;
  city: string;
  state: string;
  areaSqFt: number;
  occupancyCurrent: number;
  occupancyMax: number;
  assignedAdminEmail: string;
  assignedAdminName: string;
  assignedPassword?: string;
  iotGatewayIp: string;
  iotStatus: 'ONLINE' | 'WARNING' | 'OFFLINE';
  lastPing: string;
  sustainabilityScore: number; // 0 - 100
  carbonTargetReductionPct: number;
  description: string;
}

export interface AqiMetric {
  overallAqi: number;
  status: 'Good' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
  pm25: number; // ug/m3
  pm10: number; // ug/m3
  co2: number;  // ppm
  voc: number;  // ppb
  temperature: number; // °C
  humidity: number;    // %
  noise: number;       // dB
  hotspotLocation: string;
  anomalyDetected: boolean;
  trend24h: { time: string; aqi: number; pm25: number; co2: number }[];
}

export interface WaterMetric {
  dailyConsumptionKL: number;
  flowRateLps: number;
  undergroundTankLevelPct: number;
  overheadTankLevelPct: number;
  stpRecycleRatePct: number;
  stpTreatedWaterKL: number;
  phLevel: number;
  turbidityNtu: number;
  leakAlertCount: number;
  trend7Days: { day: string; freshWater: number; recycledWater: number }[];
}

export interface EnergyMetric {
  currentLoadKw: number;
  dailyTotalKwh: number;
  peakLoadKw: number;
  gridPowerKw: number;
  solarRooftopKw: number;
  powerFactor: number;
  carbonEmissionsKg: number;
  savingsInrToday: number;
  trend24h: { time: string; grid: number; solar: number; load: number }[];
}

export interface ParkingMetric {
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  evChargingSlotsTotal: number;
  evChargingSlotsOccupied: number;
  occupancyRatePct: number;
  peakCongestionZone: string;
  entryFlowRatePerHour: number;
  hourlyOccupancy: { time: string; standard: number; ev: number }[];
}

export interface DustbinItem {
  id: string;
  zone: string;
  binType: 'Bio-Medical' | 'Dry Waste' | 'Wet Waste' | 'E-Waste' | 'Hazardous';
  fillPercentage: number;
  batteryPct: number;
  predictedOverflowMins: number;
  status: 'Normal' | 'Near Full' | 'Overflow Warning' | 'Collected';
  lastEmptied: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'Operational' | 'Warning' | 'Critical' | 'Maintenance Due';
  healthScore: number; // 0 - 100
  powerRatingKw: number;
  runtimeHoursToday: number;
  vibrationMmPerSec: number;
  operatingTempC: number;
  lastCalibrated: string;
  nextServiceDate: string;
  dataSource: 'IoT LAN/WiFi' | 'Manual Log' | 'Batch CSV';
}

export interface AiRecommendation {
  id: string;
  title: string;
  category: 'Energy' | 'Air Quality' | 'Water' | 'Waste' | 'Asset Safety';
  urgency: 'Immediate' | 'Suggested' | 'Optimization';
  impactDescription: string;
  estimatedSaving: string;
  confidenceScore: number;
  timestamp: string;
}

export interface SustainabilityScorecard {
  overallScore: number;
  esgRating: 'A+' | 'A' | 'B+' | 'B' | 'C';
  grihaStars: number; // 1 to 5
  carbonOffsetTons: number;
  waterNeutralityPct: number;
  renewableEnergySharePct: number;
  wasteDiversionPct: number;
  breakdown: {
    category: string;
    score: number;
    maxScore: number;
    benchmarkIndiaAvg: number;
  }[];
}
