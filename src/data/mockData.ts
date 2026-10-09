import {
  Organization,
  AqiMetric,
  WaterMetric,
  EnergyMetric,
  ParkingMetric,
  DustbinItem,
  EquipmentItem,
  AiRecommendation,
  SustainabilityScorecard,
  User,
} from '@/types';

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-bput',
    name: 'BPUT State University & Engineering Campus',
    type: 'COLLEGE',
    categoryLabel: 'State Technical University Campus',
    city: 'Rourkela',
    state: 'Odisha',
    areaSqFt: 2400000,
    occupancyCurrent: 8400,
    occupancyMax: 12000,
    assignedAdminEmail: 'admin@bput.ac.in',
    assignedAdminName: 'Prof. Ramesh Mohanty',
    assignedPassword: '••••••••',
    iotGatewayIp: '192.168.20.1',
    iotStatus: 'ONLINE',
    lastPing: 'Live sync 1s ago',
    sustainabilityScore: 91,
    carbonTargetReductionPct: 35,
    description: 'Premier engineering university research and academic campus with 450 kW solar rooftop and continuous CAAQMS.',
  },
  {
    id: 'org-aiims',
    name: 'AIIMS Apex Healthcare & Research Campus',
    type: 'HOSPITAL',
    categoryLabel: 'Tertiary Healthcare & Medical Institute',
    city: 'Bhubaneswar',
    state: 'Odisha',
    areaSqFt: 3100000,
    occupancyCurrent: 14200,
    occupancyMax: 18000,
    assignedAdminEmail: 'priya.s@aiims.gov.in',
    assignedAdminName: 'Dr. Priya Swaminathan',
    assignedPassword: '••••••••',
    iotGatewayIp: '192.168.10.1',
    iotStatus: 'ONLINE',
    lastPing: 'Live sync 2s ago',
    sustainabilityScore: 88,
    carbonTargetReductionPct: 30,
    description: 'National institute of medical excellence with ICU-grade HEPA CAAQMS, 800 kL/day water recycle STP, and smart oxygen plant sensors.',
  },
  {
    id: 'org-ongc',
    name: 'ONGC Green Energy & Refining Estate',
    type: 'PSU',
    categoryLabel: 'Central Public Sector Undertaking',
    city: 'Paradip',
    state: 'Odisha',
    areaSqFt: 5800000,
    occupancyCurrent: 4200,
    occupancyMax: 6000,
    assignedAdminEmail: 'alok.p@ongc.res.in',
    assignedAdminName: 'Er. Alok Pattnaik',
    assignedPassword: '••••••••',
    iotGatewayIp: '192.168.30.1',
    iotStatus: 'ONLINE',
    lastPing: 'Live sync 3s ago',
    sustainabilityScore: 84,
    carbonTargetReductionPct: 40,
    description: 'Navratna PSU refinery perimeter with real-time flare gas CEMS, zero liquid discharge (ZLD) plant and ISO 50001 energy telemetry.',
  },
  {
    id: 'org-tata',
    name: 'Tata Steel Green Steelmaking Complex',
    type: 'INDUSTRY',
    categoryLabel: 'Heavy Industrial Green Manufacturing',
    city: 'Jamshedpur',
    state: 'Jharkhand',
    areaSqFt: 8500000,
    occupancyCurrent: 9800,
    occupancyMax: 15000,
    assignedAdminEmail: 'r.varma@tatasteel.com',
    assignedAdminName: 'Rajesh K. Varma',
    assignedPassword: '••••••••',
    iotGatewayIp: '192.168.40.1',
    iotStatus: 'ONLINE',
    lastPing: 'Live sync 1s ago',
    sustainabilityScore: 82,
    carbonTargetReductionPct: 28,
    description: 'Zero waste-to-landfill industrial metallurgy zone with waste heat recovery power generation and particulate scrubbers.',
  },
  {
    id: 'org-bmc',
    name: 'Bhubaneswar Smart Administrative Zone (BMC)',
    type: 'MUNICIPAL',
    categoryLabel: 'Smart City Urban Local Body Headquarters',
    city: 'Bhubaneswar',
    state: 'Odisha',
    areaSqFt: 1200000,
    occupancyCurrent: 3100,
    occupancyMax: 5000,
    assignedAdminEmail: 'sunita.b@bmc.gov.in',
    assignedAdminName: 'Sunita Behera',
    assignedPassword: '••••••••',
    iotGatewayIp: '192.168.50.1',
    iotStatus: 'ONLINE',
    lastPing: 'Live sync 4s ago',
    sustainabilityScore: 89,
    carbonTargetReductionPct: 32,
    description: 'Municipal administrative hub featuring automated greywater irrigation, RFID municipal waste bin telemetry, and public EV fleet chargers.',
  },
];

export const DEMO_USERS: User[] = [
  {
    id: 'user-superadmin',
    name: 'Alex Carter',
    email: 'superadmin@ecoestate.gov.in',
    role: 'SUPERADMIN',
    title: 'National Director & Chief Administrator',
    status: 'Active',
    lastActive: 'Just now',
    createdAt: '2026-01-10',
  },
  {
    id: 'user-bput-admin',
    name: 'Prof. Ramesh Mohanty',
    email: 'admin@bput.ac.in',
    role: 'ORG_ADMIN',
    organizationId: 'org-bput',
    organizationName: 'BPUT State University & Engineering Campus',
    title: 'Dean of Estate & Facilities',
    status: 'Active',
    lastActive: '5 mins ago',
    createdAt: '2026-01-15',
  },
  {
    id: 'user-aiims-admin',
    name: 'Dr. Priya Swaminathan',
    email: 'priya.s@aiims.gov.in',
    role: 'ORG_ADMIN',
    organizationId: 'org-aiims',
    organizationName: 'AIIMS Apex Healthcare & Research Campus',
    title: 'Chief Medical Superintendent',
    status: 'Active',
    lastActive: '12 mins ago',
    createdAt: '2026-01-18',
  },
  {
    id: 'user-ongc-manager',
    name: 'Er. Alok Pattnaik',
    email: 'alok.p@ongc.res.in',
    role: 'ESTATE_MANAGER',
    organizationId: 'org-ongc',
    organizationName: 'ONGC Green Energy & Refining Estate',
    title: 'General Manager (HSE & Sustainability)',
    status: 'Active',
    lastActive: '28 mins ago',
    createdAt: '2026-02-01',
  },
  {
    id: 'user-tata-auditor',
    name: 'Rajesh K. Varma',
    email: 'r.varma@tatasteel.com',
    role: 'ENERGY_AUDITOR',
    organizationId: 'org-tata',
    organizationName: 'Tata Steel Green Steelmaking Complex',
    title: 'Principal Energy & Carbon Auditor',
    status: 'Active',
    lastActive: '1 hour ago',
    createdAt: '2026-02-05',
  },
  {
    id: 'user-bmc-viewer',
    name: 'Sunita Behera',
    email: 'sunita.b@bmc.gov.in',
    role: 'FACILITY_VIEWER',
    organizationId: 'org-bmc',
    organizationName: 'Bhubaneswar Smart Administrative Zone (BMC)',
    title: 'Smart City Operations Officer',
    status: 'Inactive',
    lastActive: '2 days ago',
    createdAt: '2026-02-12',
  },
  {
    id: 'user-bput-operator',
    name: 'Debasis Mishra',
    email: 'operator@bput.ac.in',
    role: 'ORG_OPERATOR',
    organizationId: 'org-bput',
    organizationName: 'BPUT State University & Engineering Campus',
    title: 'Substation & Solar SCADA Operator',
    status: 'Active',
    lastActive: '3 hours ago',
    createdAt: '2026-02-20',
  },
];

// Specific sensor telemetry by facility type
export const getAqiData = (type: string): AqiMetric => {
  const baseMap: Record<string, Partial<AqiMetric>> = {
    HOSPITAL: {
      overallAqi: 78,
      status: 'Moderate',
      pm25: 28.4,
      pm10: 64.1,
      co2: 480,
      voc: 120,
      temperature: 24.2,
      humidity: 52,
      noise: 44.5,
      hotspotLocation: 'Gate 2 Ambulance Inflow Bay',
      anomalyDetected: false,
    },
    COLLEGE: {
      overallAqi: 62,
      status: 'Good',
      pm25: 19.8,
      pm10: 45.2,
      co2: 510,
      voc: 95,
      temperature: 27.6,
      humidity: 58,
      noise: 58.2,
      hotspotLocation: 'Hostel Block 4 Generator Vicinity',
      anomalyDetected: false,
    },
    PSU: {
      overallAqi: 142,
      status: 'Poor',
      pm25: 58.6,
      pm10: 118.4,
      co2: 720,
      voc: 380,
      temperature: 31.4,
      humidity: 46,
      noise: 72.8,
      hotspotLocation: 'Turbine Exhaust & Flare Stack Perimeter',
      anomalyDetected: true,
    },
    INDUSTRY: {
      overallAqi: 168,
      status: 'Poor',
      pm25: 72.3,
      pm10: 142.1,
      co2: 840,
      voc: 450,
      temperature: 33.1,
      humidity: 42,
      noise: 78.4,
      hotspotLocation: 'Blast Furnace Raw Material Unloading Bay',
      anomalyDetected: true,
    },
    MUNICIPAL: {
      overallAqi: 88,
      status: 'Moderate',
      pm25: 32.1,
      pm10: 71.3,
      co2: 495,
      voc: 140,
      temperature: 28.1,
      humidity: 62,
      noise: 52.0,
      hotspotLocation: 'Public Grievance Hall Entrance',
      anomalyDetected: false,
    },
  };

  const selected = baseMap[type] || baseMap.HOSPITAL;

  return {
    overallAqi: selected.overallAqi || 85,
    status: selected.status as any,
    pm25: selected.pm25 || 32,
    pm10: selected.pm10 || 70,
    co2: selected.co2 || 500,
    voc: selected.voc || 130,
    temperature: selected.temperature || 26,
    humidity: selected.humidity || 55,
    noise: selected.noise || 50,
    hotspotLocation: selected.hotspotLocation || 'Main Campus Gateway',
    anomalyDetected: !!selected.anomalyDetected,
    trend24h: [
      { time: '00:00', aqi: selected.overallAqi! - 18, pm25: selected.pm25! - 8, co2: 410 },
      { time: '03:00', aqi: selected.overallAqi! - 22, pm25: selected.pm25! - 10, co2: 395 },
      { time: '06:00', aqi: selected.overallAqi! - 10, pm25: selected.pm25! - 4, co2: 430 },
      { time: '09:00', aqi: selected.overallAqi! + 24, pm25: selected.pm25! + 12, co2: 560 },
      { time: '12:00', aqi: selected.overallAqi! + 18, pm25: selected.pm25! + 8, co2: 590 },
      { time: '15:00', aqi: selected.overallAqi! + 12, pm25: selected.pm25! + 6, co2: 540 },
      { time: '18:00', aqi: selected.overallAqi! + 28, pm25: selected.pm25! + 15, co2: 620 },
      { time: '21:00', aqi: selected.overallAqi! + 8, pm25: selected.pm25! + 4, co2: 490 },
      { time: 'Now', aqi: selected.overallAqi!, pm25: selected.pm25!, co2: selected.co2! },
    ],
  };
};

export const getWaterData = (type: string): WaterMetric => {
  const configs: Record<string, { daily: number; flow: number; recycle: number; stpKL: number }> = {
    HOSPITAL: { daily: 420, flow: 18.5, recycle: 68, stpKL: 285 },
    COLLEGE: { daily: 680, flow: 26.2, recycle: 82, stpKL: 558 },
    PSU: { daily: 1450, flow: 64.0, recycle: 91, stpKL: 1320 },
    INDUSTRY: { daily: 2800, flow: 110.5, recycle: 94, stpKL: 2630 },
    MUNICIPAL: { daily: 180, flow: 8.2, recycle: 72, stpKL: 130 },
  };

  const cfg = configs[type] || configs.HOSPITAL;

  return {
    dailyConsumptionKL: cfg.daily,
    flowRateLps: cfg.flow,
    undergroundTankLevelPct: 82,
    overheadTankLevelPct: 74,
    stpRecycleRatePct: cfg.recycle,
    stpTreatedWaterKL: cfg.stpKL,
    phLevel: 7.35,
    turbidityNtu: 2.1,
    leakAlertCount: type === 'INDUSTRY' ? 2 : 0,
    trend7Days: [
      { day: 'Mon', freshWater: cfg.daily * 0.95, recycledWater: cfg.stpKL * 0.92 },
      { day: 'Tue', freshWater: cfg.daily * 1.02, recycledWater: cfg.stpKL * 0.98 },
      { day: 'Wed', freshWater: cfg.daily * 1.05, recycledWater: cfg.stpKL * 1.01 },
      { day: 'Thu', freshWater: cfg.daily * 0.98, recycledWater: cfg.stpKL * 0.96 },
      { day: 'Fri', freshWater: cfg.daily * 1.08, recycledWater: cfg.stpKL * 1.04 },
      { day: 'Sat', freshWater: cfg.daily * 0.82, recycledWater: cfg.stpKL * 0.85 },
      { day: 'Today', freshWater: cfg.daily, recycledWater: cfg.stpKL },
    ],
  };
};

export const getEnergyData = (type: string): EnergyMetric => {
  const configs: Record<string, { currentKw: number; dailyKwh: number; solarKw: number; peakKw: number }> = {
    HOSPITAL: { currentKw: 840, dailyKwh: 16800, solarKw: 220, peakKw: 1120 },
    COLLEGE: { currentKw: 1250, dailyKwh: 22400, solarKw: 580, peakKw: 1600 },
    PSU: { currentKw: 4800, dailyKwh: 96000, solarKw: 1200, peakKw: 5900 },
    INDUSTRY: { currentKw: 9200, dailyKwh: 184000, solarKw: 1850, peakKw: 11800 },
    MUNICIPAL: { currentKw: 420, dailyKwh: 7600, solarKw: 160, peakKw: 560 },
  };

  const cfg = configs[type] || configs.HOSPITAL;
  const gridKw = Math.max(0, cfg.currentKw - cfg.solarKw);
  const carbon = Math.round(cfg.dailyKwh * 0.72); // kg CO2e based on Indian CEA grid factor
  const savings = Math.round(cfg.solarKw * 7.5 * 8.5); // INR saved via solar per day

  return {
    currentLoadKw: cfg.currentKw,
    dailyTotalKwh: cfg.dailyKwh,
    peakLoadKw: cfg.peakKw,
    gridPowerKw: gridKw,
    solarRooftopKw: cfg.solarKw,
    powerFactor: 0.98,
    carbonEmissionsKg: carbon,
    savingsInrToday: savings,
    trend24h: [
      { time: '02:00', grid: cfg.currentKw * 0.45, solar: 0, load: cfg.currentKw * 0.45 },
      { time: '06:00', grid: cfg.currentKw * 0.55, solar: cfg.solarKw * 0.1, load: cfg.currentKw * 0.58 },
      { time: '10:00', grid: cfg.currentKw * 0.75, solar: cfg.solarKw * 0.85, load: cfg.currentKw * 0.92 },
      { time: '13:00', grid: cfg.currentKw * 0.65, solar: cfg.solarKw * 0.98, load: cfg.currentKw * 1.0 },
      { time: '16:00', grid: cfg.currentKw * 0.80, solar: cfg.solarKw * 0.6, load: cfg.currentKw * 0.95 },
      { time: '19:00', grid: cfg.currentKw * 0.95, solar: 0, load: cfg.currentKw * 0.95 },
      { time: '22:00', grid: cfg.currentKw * 0.62, solar: 0, load: cfg.currentKw * 0.62 },
    ],
  };
};

export const getParkingData = (type: string): ParkingMetric => {
  const configs: Record<string, { total: number; occ: number; evTotal: number; evOcc: number; hotspot: string }> = {
    HOSPITAL: { total: 450, occ: 382, evTotal: 40, evOcc: 34, hotspot: 'Emergency & OPD Wing Parking' },
    COLLEGE: { total: 800, occ: 620, evTotal: 60, evOcc: 48, hotspot: 'Central Library & Admin Gateway' },
    PSU: { total: 600, occ: 410, evTotal: 50, evOcc: 32, hotspot: 'Staff Transit Bay & Gate 3' },
    INDUSTRY: { total: 1100, occ: 935, evTotal: 80, evOcc: 65, hotspot: 'Heavy Logistics Loading Bay' },
    MUNICIPAL: { total: 320, occ: 275, evTotal: 30, evOcc: 28, hotspot: 'Citizen Services Public Bay' },
  };

  const cfg = configs[type] || configs.HOSPITAL;

  return {
    totalSlots: cfg.total,
    occupiedSlots: cfg.occ,
    availableSlots: cfg.total - cfg.occ,
    evChargingSlotsTotal: cfg.evTotal,
    evChargingSlotsOccupied: cfg.evOcc,
    occupancyRatePct: Math.round((cfg.occ / cfg.total) * 100),
    peakCongestionZone: cfg.hotspot,
    entryFlowRatePerHour: Math.round(cfg.total * 0.35),
    hourlyOccupancy: [
      { time: '08:00', standard: Math.round(cfg.total * 0.3), ev: 8 },
      { time: '10:00', standard: Math.round(cfg.total * 0.82), ev: cfg.evOcc },
      { time: '12:00', standard: Math.round(cfg.total * 0.88), ev: cfg.evOcc },
      { time: '14:00', standard: Math.round(cfg.total * 0.78), ev: cfg.evOcc - 4 },
      { time: '16:00', standard: Math.round(cfg.total * 0.85), ev: cfg.evOcc },
      { time: '18:00', standard: Math.round(cfg.total * 0.55), ev: 12 },
    ],
  };
};

export const getDustbins = (type: string): DustbinItem[] => {
  if (type === 'HOSPITAL') {
    return [
      { id: 'BIN-MED-01', zone: 'Emergency & Trauma ICU', binType: 'Bio-Medical', fillPercentage: 88, batteryPct: 92, predictedOverflowMins: 35, status: 'Overflow Warning', lastEmptied: '4 hrs ago' },
      { id: 'BIN-MED-02', zone: 'Pathology & Blood Bank', binType: 'Hazardous', fillPercentage: 72, batteryPct: 88, predictedOverflowMins: 85, status: 'Near Full', lastEmptied: '6 hrs ago' },
      { id: 'BIN-GEN-03', zone: 'OPD Reception Lobby', binType: 'Dry Waste', fillPercentage: 45, batteryPct: 96, predictedOverflowMins: 180, status: 'Normal', lastEmptied: '2 hrs ago' },
      { id: 'BIN-GEN-04', zone: 'Doctors Dining & Canteen', binType: 'Wet Waste', fillPercentage: 65, batteryPct: 90, predictedOverflowMins: 110, status: 'Normal', lastEmptied: '3 hrs ago' },
      { id: 'BIN-RAD-05', zone: 'Radiology & MRI Corridor', binType: 'E-Waste', fillPercentage: 20, batteryPct: 95, predictedOverflowMins: 420, status: 'Normal', lastEmptied: '1 day ago' },
    ];
  }

  if (type === 'COLLEGE') {
    return [
      { id: 'BIN-ACAD-01', zone: 'Central Computer Lab & Server Room', binType: 'E-Waste', fillPercentage: 35, batteryPct: 94, predictedOverflowMins: 360, status: 'Normal', lastEmptied: '2 days ago' },
      { id: 'BIN-HOST-02', zone: 'Boys Hostel 3 Mess Hall', binType: 'Wet Waste', fillPercentage: 91, batteryPct: 84, predictedOverflowMins: 20, status: 'Overflow Warning', lastEmptied: '5 hrs ago' },
      { id: 'BIN-LIB-03', zone: 'Central Digital Library Quad', binType: 'Dry Waste', fillPercentage: 55, batteryPct: 98, predictedOverflowMins: 150, status: 'Normal', lastEmptied: '3 hrs ago' },
      { id: 'BIN-CHEM-04', zone: 'Department of Chemistry Labs', binType: 'Hazardous', fillPercentage: 40, batteryPct: 89, predictedOverflowMins: 240, status: 'Normal', lastEmptied: '1 day ago' },
      { id: 'BIN-AUD-05', zone: 'Main University Auditorium', binType: 'Dry Waste', fillPercentage: 78, batteryPct: 91, predictedOverflowMins: 60, status: 'Near Full', lastEmptied: '4 hrs ago' },
    ];
  }

  if (type === 'PSU' || type === 'INDUSTRY') {
    return [
      { id: 'BIN-IND-01', zone: 'Furnace Heavy Slag Disposal Yard', binType: 'Hazardous', fillPercentage: 86, batteryPct: 78, predictedOverflowMins: 40, status: 'Overflow Warning', lastEmptied: '6 hrs ago' },
      { id: 'BIN-IND-02', zone: 'Machining & CNC Workshop', binType: 'Dry Waste', fillPercentage: 62, batteryPct: 90, predictedOverflowMins: 120, status: 'Normal', lastEmptied: '4 hrs ago' },
      { id: 'BIN-IND-03', zone: 'Control Room Instrumentation Suite', binType: 'E-Waste', fillPercentage: 28, batteryPct: 96, predictedOverflowMins: 400, status: 'Normal', lastEmptied: '3 days ago' },
      { id: 'BIN-IND-04', zone: 'Worker Canteen & Town Facility', binType: 'Wet Waste', fillPercentage: 74, batteryPct: 88, predictedOverflowMins: 75, status: 'Near Full', lastEmptied: '3 hrs ago' },
    ];
  }

  return [
    { id: 'BIN-MUN-01', zone: 'Public Citizen Facilitation Centre', binType: 'Dry Waste', fillPercentage: 79, batteryPct: 92, predictedOverflowMins: 55, status: 'Near Full', lastEmptied: '4 hrs ago' },
    { id: 'BIN-MUN-02', zone: 'Administrative Cafeteria & Garden', binType: 'Wet Waste', fillPercentage: 50, batteryPct: 95, predictedOverflowMins: 160, status: 'Normal', lastEmptied: '3 hrs ago' },
    { id: 'BIN-MUN-03', zone: 'E-Governance Data Center', binType: 'E-Waste', fillPercentage: 15, batteryPct: 99, predictedOverflowMins: 600, status: 'Normal', lastEmptied: '1 week ago' },
  ];
};

export const getEquipmentList = (type: string): EquipmentItem[] => {
  if (type === 'HOSPITAL') {
    return [
      { id: 'EQ-MED-01', name: 'PSA Medical Oxygen Generator Plant 1200 LPM', category: 'Life Support / Critical Gas', location: 'Utility Block B-1', status: 'Operational', healthScore: 96, powerRatingKw: 75, runtimeHoursToday: 24, vibrationMmPerSec: 1.2, operatingTempC: 42, lastCalibrated: '2026-09-15', nextServiceDate: '2026-11-15', dataSource: 'IoT LAN/WiFi' },
      { id: 'EQ-MED-02', name: 'Central HVAC Chiller Plant Unit-1 (300 TR)', category: 'HVAC & Cleanroom Air', location: 'Basement Mechanical Plant', status: 'Operational', healthScore: 91, powerRatingKw: 210, runtimeHoursToday: 18.5, vibrationMmPerSec: 2.1, operatingTempC: 48, lastCalibrated: '2026-08-20', nextServiceDate: '2026-10-30', dataSource: 'IoT LAN/WiFi' },
      { id: 'EQ-MED-03', name: 'Emergency Backup DG Set 1000 kVA (Cummins)', category: 'Power Backup', location: 'DG Yard Gate 4', status: 'Warning', healthScore: 78, powerRatingKw: 800, runtimeHoursToday: 2.1, vibrationMmPerSec: 4.8, operatingTempC: 84, lastCalibrated: '2026-07-10', nextServiceDate: '2026-10-15', dataSource: 'Manual Log' },
      { id: 'EQ-MED-04', name: '3.0T MRI Superconducting Chiller & Cryo-Loop', category: 'Radiology Equipment', location: 'Diagnostic Imaging Wing', status: 'Operational', healthScore: 98, powerRatingKw: 45, runtimeHoursToday: 24, vibrationMmPerSec: 0.8, operatingTempC: 18, lastCalibrated: '2026-09-28', nextServiceDate: '2026-12-28', dataSource: 'IoT LAN/WiFi' },
      { id: 'EQ-MED-05', name: 'High-Pressure Steam Autoclave Sterilizer 500L', category: 'Sterilization & CSSD', location: 'Central Sterile Supply Dept', status: 'Operational', healthScore: 89, powerRatingKw: 35, runtimeHoursToday: 12.0, vibrationMmPerSec: 1.6, operatingTempC: 121, lastCalibrated: '2026-09-01', nextServiceDate: '2026-11-01', dataSource: 'Batch CSV' },
      { id: 'EQ-MED-06', name: 'STP Membrane Bio-Reactor (MBR) Pump 500 KLD', category: 'Water Treatment', location: 'Eco Water Zone', status: 'Operational', healthScore: 94, powerRatingKw: 28, runtimeHoursToday: 20.0, vibrationMmPerSec: 1.9, operatingTempC: 38, lastCalibrated: '2026-08-14', nextServiceDate: '2026-11-14', dataSource: 'IoT LAN/WiFi' },
    ];
  }

  if (type === 'COLLEGE') {
    return [
      { id: 'EQ-COL-01', name: 'Campus 500 kW Rooftop Solar String Inverters', category: 'Renewable Generation', location: 'Academic Block Roofs', status: 'Operational', healthScore: 95, powerRatingKw: 500, runtimeHoursToday: 11.2, vibrationMmPerSec: 0.4, operatingTempC: 44, lastCalibrated: '2026-09-10', nextServiceDate: '2026-12-10', dataSource: 'IoT LAN/WiFi' },
      { id: 'EQ-COL-02', name: 'Central Computing Lab 120 kVA Online Modular UPS', category: 'Power Quality', location: 'IT Centre Floor 2', status: 'Operational', healthScore: 92, powerRatingKw: 120, runtimeHoursToday: 24, vibrationMmPerSec: 0.6, operatingTempC: 35, lastCalibrated: '2026-07-22', nextServiceDate: '2026-10-22', dataSource: 'IoT LAN/WiFi' },
      { id: 'EQ-COL-03', name: 'Central Auditorium Dual Screw Chiller (150 TR)', category: 'HVAC Comfort', location: 'Auditorium Service Bay', status: 'Maintenance Due', healthScore: 74, powerRatingKw: 110, runtimeHoursToday: 6.0, vibrationMmPerSec: 3.8, operatingTempC: 62, lastCalibrated: '2026-05-18', nextServiceDate: '2026-10-05', dataSource: 'Manual Log' },
      { id: 'EQ-COL-04', name: 'Hydro-Pneumatic Lake Water Filtration Pump', category: 'Water Supply', location: 'Eco Lake Station', status: 'Operational', healthScore: 88, powerRatingKw: 22, runtimeHoursToday: 14.0, vibrationMmPerSec: 1.5, operatingTempC: 40, lastCalibrated: '2026-08-05', nextServiceDate: '2026-11-05', dataSource: 'IoT LAN/WiFi' },
    ];
  }

  return [
    { id: 'EQ-IND-01', name: 'Blast Furnace Flue Gas Wet Scrubber Unit B-3', category: 'Emissions Control (CEMS)', location: 'Smelting Sector 4', status: 'Operational', healthScore: 90, powerRatingKw: 420, runtimeHoursToday: 24, vibrationMmPerSec: 2.6, operatingTempC: 88, lastCalibrated: '2026-09-20', nextServiceDate: '2026-10-20', dataSource: 'IoT LAN/WiFi' },
    { id: 'EQ-IND-02', name: 'Primary Cogeneration Steam Turbine Generator (15 MW)', category: 'Power Generation', location: 'Thermal Power Block', status: 'Operational', healthScore: 97, powerRatingKw: 15000, runtimeHoursToday: 24, vibrationMmPerSec: 1.1, operatingTempC: 320, lastCalibrated: '2026-09-02', nextServiceDate: '2026-12-02', dataSource: 'IoT LAN/WiFi' },
    { id: 'EQ-IND-03', name: 'Heavy Effluent Neutralization Aeration Blower 40 kW', category: 'ETP & Zero Discharge', location: 'Industrial ETP Plant', status: 'Warning', healthScore: 76, powerRatingKw: 40, runtimeHoursToday: 22.0, vibrationMmPerSec: 4.2, operatingTempC: 68, lastCalibrated: '2026-06-14', nextServiceDate: '2026-10-12', dataSource: 'Manual Log' },
    { id: 'EQ-IND-04', name: 'High-Tension Step-Down Transformer 33kV/415V', category: 'Substation Asset', location: 'Yard Substation 2', status: 'Operational', healthScore: 93, powerRatingKw: 2500, runtimeHoursToday: 24, vibrationMmPerSec: 0.9, operatingTempC: 56, lastCalibrated: '2026-08-11', nextServiceDate: '2026-11-11', dataSource: 'Batch CSV' },
  ];
};

export const getAiRecommendations = (type: string): AiRecommendation[] => {
  if (type === 'HOSPITAL') {
    return [
      {
        id: 'AI-REC-01',
        title: 'Optimize OPD Air Handling Units (AHUs) based on live occupancy',
        category: 'Energy',
        urgency: 'Suggested',
        impactDescription: 'Reduce AHU fan speeds in non-critical outpatient consultation zones between 13:30 - 15:30 (lunch lull) by 22%.',
        estimatedSaving: '₹ 14,200 / day & 180 kg CO2e',
        confidenceScore: 94,
        timestamp: '10 mins ago',
      },
      {
        id: 'AI-REC-02',
        title: 'Pre-emptive waste dispatch: ICU & Trauma Bio-Medical Bin #1 near capacity',
        category: 'Waste',
        urgency: 'Immediate',
        impactDescription: 'Bio-medical bin BIN-MED-01 fill rate accelerated by 38% due to morning surgery schedules. Auto-alert dispatched to Hazmat team.',
        estimatedSaving: '100% CPCB Bio-waste compliance & zero spill risk',
        confidenceScore: 98,
        timestamp: '18 mins ago',
      },
      {
        id: 'AI-REC-03',
        title: 'Switch Secondary Chiller to Thermal Ice Storage during peak tariff (18:00 - 22:00)',
        category: 'Energy',
        urgency: 'Optimization',
        impactDescription: 'Pre-cool diagnostic blocks at 16:00 using solar surplus, reducing peak grid draw by 140 kW.',
        estimatedSaving: '₹ 8,400 peak tariff penalty avoided',
        confidenceScore: 89,
        timestamp: '45 mins ago',
      },
    ];
  }

  if (type === 'COLLEGE') {
    return [
      {
        id: 'AI-REC-04',
        title: 'Solar Self-Consumption Optimization for Central Computing Labs',
        category: 'Energy',
        urgency: 'Suggested',
        impactDescription: 'Schedule GPU compute batch tasks to run between 11:00 - 15:00 when rooftop solar output peaks at 580 kW.',
        estimatedSaving: '100% Solar-powered compute with ₹ 18,500 monthly savings',
        confidenceScore: 96,
        timestamp: '12 mins ago',
      },
      {
        id: 'AI-REC-05',
        title: 'Reroute Smart Waste Logistics for Hostel Quad',
        category: 'Waste',
        urgency: 'Immediate',
        impactDescription: 'Hostel 3 Mess Bin will overflow in 20 mins. Direct electric trash tug route #2 to collect before noon meal rush.',
        estimatedSaving: 'Prevents litter spillover & 30% reduction in vehicle transit',
        confidenceScore: 92,
        timestamp: '25 mins ago',
      },
    ];
  }

  return [
    {
      id: 'AI-REC-06',
      title: 'Scrubber Fan VFD Modulation based on Real-Time SOx/NOx sensors',
      category: 'Air Quality',
      urgency: 'Immediate',
      impactDescription: 'CEMS sensor detected localized VOC bump. Automatically ramp up scrubber recirc pump while keeping overall power within grid cap.',
      estimatedSaving: 'Enforces Zero Environmental Exceedance',
      confidenceScore: 97,
      timestamp: '5 mins ago',
    },
    {
      id: 'AI-REC-07',
      title: 'Peak Shaving using Cogeneration Unit during 18:30 industrial tariff block',
      category: 'Energy',
      urgency: 'Optimization',
      impactDescription: 'Ramp internal turbine by 800 kW for 90 minutes to eliminate maximum demand charge overrun.',
      estimatedSaving: '₹ 95,000 demand penalty avoided',
      confidenceScore: 91,
      timestamp: '30 mins ago',
    },
  ];
};

export const getSustainabilityScorecard = (org: Organization): SustainabilityScorecard => {
  return {
    overallScore: org.sustainabilityScore,
    esgRating: org.sustainabilityScore >= 85 ? 'A+' : org.sustainabilityScore >= 80 ? 'A' : 'B+',
    grihaStars: org.sustainabilityScore >= 90 ? 5 : org.sustainabilityScore >= 80 ? 4 : 3,
    carbonOffsetTons: Math.round((org.areaSqFt / 100000) * 14.5),
    waterNeutralityPct: org.type === 'INDUSTRY' ? 88 : org.type === 'HOSPITAL' ? 76 : 92,
    renewableEnergySharePct: org.type === 'COLLEGE' ? 44 : org.type === 'HOSPITAL' ? 28 : 32,
    wasteDiversionPct: 91,
    breakdown: [
      { category: 'Air Quality & Indoor Comfort', score: 88, maxScore: 100, benchmarkIndiaAvg: 65 },
      { category: 'Energy Efficiency & Solar Share', score: org.sustainabilityScore >= 85 ? 90 : 80, maxScore: 100, benchmarkIndiaAvg: 58 },
      { category: 'Water Conservation & STP Reuse', score: 86, maxScore: 100, benchmarkIndiaAvg: 62 },
      { category: 'Solid & Hazardous Waste Management', score: 92, maxScore: 100, benchmarkIndiaAvg: 70 },
      { category: 'Low-Carbon Transport & EV Charging', score: 78, maxScore: 100, benchmarkIndiaAvg: 50 },
      { category: 'Predictive Equipment Health & Safety', score: 85, maxScore: 100, benchmarkIndiaAvg: 60 },
    ],
  };
};
