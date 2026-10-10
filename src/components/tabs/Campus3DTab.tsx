'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  Upload,
  PlusCircle,
  Trash2,
  Edit3,
  Move,
  CheckCircle2,
  RefreshCw,
  Maximize2,
  Sliders,
  Calendar,
  Wind,
  Droplets,
  Zap,
  Activity,
  X,
  Cloud,
  Thermometer,
  Camera,
  ZoomIn,
  ZoomOut,
  MousePointer,
  Hand,
  Check,
  Network,
  Wifi,
  Radio,
  Car,
  Sun,
  Gauge,
  Waves,
  BatteryCharging,
  Scale,
  Truck,
} from 'lucide-react';
import IoTGatewayModal from '@/components/IoTGatewayModal';
import { DjangoApi } from '@/services/api';

export interface CampusNode {
  id: string;
  name: string;
  locationLabel: string;
  type: 'aqi' | 'water' | 'energy' | 'parking' | 'waste' | 'weather' | 'general';
  interfaceType?: 'LAN' | 'WIFI';
  xPct: number; // 0 to 100 percentage
  yPct: number; // 0 to 100 percentage
  stemHeightPx: number; // length of leader line
  pm25: number;
  pm10: number;
  temp: number;
  humidity: number;
  secondaryLabel?: string;
  secondaryValue?: string;
  metric1Label?: string;
  metric1Value?: string;
  metric2Label?: string;
  metric2Value?: string;
  metric3Label?: string;
  metric3Value?: string;
  metric4Label?: string;
  metric4Value?: string;
  status: 'optimal' | 'moderate' | 'warning';
}

export const Campus3DTab: React.FC = () => {
  const { activeOrg } = useAuth();
  const orgKey = activeOrg?.id || 'default-campus';

  // 1. Campus Image State: persistent per organization
  const [campusImage, setCampusImage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`ecoestate-campus-image-${orgKey}`);
      if (saved) return saved;
    }
    return activeOrg?.type === 'HOSPITAL'
      ? '/images/hospital_aerial.jpg'
      : '/images/campus_aerial.jpg';
  });

  // 2. Intelligent Default Nodes
  const generateAutoNodes = (isHospital = false): CampusNode[] => {
    if (isHospital) {
      return [
        {
          id: 'node-hosp-gate',
          name: 'Main Public Plaza & Visitor Fountain',
          locationLabel: 'At Main Gate',
          type: 'aqi',
          interfaceType: 'WIFI',
          xPct: 52.0,
          yPct: 82.0,
          stemHeightPx: 55,
          pm25: 22,
          pm10: 42,
          temp: 32,
          humidity: 50,
          status: 'optimal',
        },
        {
          id: 'node-hosp-er',
          name: 'Emergency & Trauma Care Entrance',
          locationLabel: 'Emergency Bay',
          type: 'aqi',
          interfaceType: 'WIFI',
          xPct: 22.0,
          yPct: 55.0,
          stemHeightPx: 65,
          pm25: 18,
          pm10: 34,
          temp: 24,
          humidity: 54,
          status: 'optimal',
        },
        {
          id: 'node-hosp-diag',
          name: 'Super-Specialty Diagnostic Center',
          locationLabel: 'Near Diagnostic Center',
          type: 'energy',
          interfaceType: 'LAN',
          xPct: 42.0,
          yPct: 52.0,
          stemHeightPx: 70,
          pm25: 19,
          pm10: 36,
          temp: 23,
          humidity: 51,
          secondaryLabel: 'Power Load',
          secondaryValue: '340 kW',
          status: 'optimal',
        },
        {
          id: 'node-hosp-icu',
          name: 'General Inpatient Towers & ICU Wing',
          locationLabel: 'Behind Hospital Tower',
          type: 'aqi',
          interfaceType: 'LAN',
          xPct: 58.0,
          yPct: 35.0,
          stemHeightPx: 75,
          pm25: 15,
          pm10: 29,
          temp: 22,
          humidity: 52,
          status: 'optimal',
        },
        {
          id: 'node-hosp-solar',
          name: 'Solar Rooftop & Oxygen Plant Deck',
          locationLabel: 'At Solar Energy Deck',
          type: 'energy',
          interfaceType: 'LAN',
          xPct: 78.0,
          yPct: 54.0,
          stemHeightPx: 65,
          pm25: 26,
          pm10: 40,
          temp: 31,
          humidity: 58,
          secondaryLabel: 'Solar Output',
          secondaryValue: '480 kW',
          status: 'optimal',
        },
      ];
    }

    return [
      {
        id: 'node-quarters',
        name: 'Senior Faculty Residential Enclave',
        locationLabel: 'At Faculty Quarters',
        type: 'aqi',
        interfaceType: 'WIFI',
        xPct: 15.0,
        yPct: 55.0,
        stemHeightPx: 60,
        pm25: 39,
        pm10: 48,
        temp: 28,
        humidity: 87,
        status: 'optimal',
      },
      {
        id: 'node-academic',
        name: 'Central Academic Block & Solar Rooftop',
        locationLabel: 'Behind Academic Wing',
        type: 'energy',
        interfaceType: 'WIFI',
        xPct: 38.0,
        yPct: 55.0,
        stemHeightPx: 65,
        pm25: 25,
        pm10: 51,
        temp: 30,
        humidity: 86,
        secondaryLabel: 'Solar Gen',
        secondaryValue: '185 kW',
        metric1Label: 'Solar Gen',
        metric1Value: '185 kW',
        metric2Label: 'Grid Load',
        metric2Value: '280 kVA',
        metric3Label: 'Daily Yield',
        metric3Value: '910 kWh',
        metric4Label: 'Power Factor',
        metric4Value: '0.99 PF',
        status: 'optimal',
      },
      {
        id: 'node-pump',
        name: 'Central Water Reservoir & Pump House',
        locationLabel: 'at pump house',
        type: 'water',
        interfaceType: 'LAN',
        xPct: 44.0,
        yPct: 34.0,
        stemHeightPx: 70,
        pm25: 24,
        pm10: 45,
        temp: 32,
        humidity: 73,
        secondaryLabel: 'STP Flow',
        secondaryValue: '550 kL',
        metric1Label: 'STP Flow',
        metric1Value: '550 kL',
        metric2Label: 'Tank Level',
        metric2Value: '84%',
        metric3Label: 'Pressure',
        metric3Value: '4.2 bar',
        metric4Label: 'TDS Purity',
        metric4Value: '142 ppm',
        status: 'optimal',
      },
      {
        id: 'node-guest',
        name: 'Executive Guest House & Waste Logistics',
        locationLabel: 'at guest house',
        type: 'waste',
        interfaceType: 'WIFI',
        xPct: 58.0,
        yPct: 40.0,
        stemHeightPx: 60,
        pm25: 29,
        pm10: 46,
        temp: 29,
        humidity: 65,
        secondaryLabel: 'Bin Fill',
        secondaryValue: '38%',
        metric1Label: 'Fill Level',
        metric1Value: '38%',
        metric2Label: 'Bin Weight',
        metric2Value: '14 kg',
        metric3Label: 'Odor / VOC',
        metric3Value: 'Clean',
        metric4Label: 'Pickup',
        metric4Value: 'Scheduled',
        status: 'optimal',
      },
      {
        id: 'node-gate',
        name: 'Main Campus Entrance Gate & Smart EV Parking',
        locationLabel: 'At Main Gate',
        type: 'parking',
        interfaceType: 'WIFI',
        xPct: 55.5,
        yPct: 84.0,
        stemHeightPx: 55,
        pm25: 20,
        pm10: 40,
        temp: 33,
        humidity: 47,
        secondaryLabel: 'EV Slots',
        secondaryValue: '18 / 28',
        metric1Label: 'Slots Avail',
        metric1Value: '18 / 28',
        metric2Label: 'EV Fast',
        metric2Value: '4 Active',
        metric3Label: 'Occupancy',
        metric3Value: '64%',
        metric4Label: 'Gate Status',
        metric4Value: 'OPEN',
        status: 'optimal',
      },
      {
        id: 'node-library',
        name: 'Central University Library & Innovation Hub',
        locationLabel: 'Near Library entrance',
        type: 'aqi',
        interfaceType: 'WIFI',
        xPct: 69.0,
        yPct: 62.0,
        stemHeightPx: 70,
        pm25: 38,
        pm10: 69,
        temp: 31,
        humidity: 50,
        status: 'optimal',
      },
      {
        id: 'node-sports',
        name: 'Athletic Track & Sports Complex',
        locationLabel: 'Football ground',
        type: 'weather',
        interfaceType: 'WIFI',
        xPct: 82.0,
        yPct: 52.0,
        stemHeightPx: 60,
        pm25: 32,
        pm10: 49,
        temp: 41,
        humidity: 61,
        status: 'optimal',
      },
    ];
  };

  const enrichWithDomainDefaults = (nodeList: CampusNode[]): CampusNode[] => {
    return nodeList.map((n) => {
      let t = n.type;
      if (t === 'aqi') {
        const loc = (n.locationLabel || '').toLowerCase();
        const nm = (n.name || '').toLowerCase();
        if (loc.includes('pump') || n.secondaryLabel?.toLowerCase().includes('stp')) {
          t = 'water';
        } else if (loc.includes('academic') || nm.includes('solar') || n.secondaryLabel?.toLowerCase().includes('power') || n.secondaryLabel?.toLowerCase().includes('solar')) {
          t = 'energy';
        } else if (loc.includes('guest') || nm.includes('waste')) {
          t = 'waste';
        } else if (loc.includes('gate') || nm.includes('parking')) {
          t = 'parking';
        }
      }

      if (t === 'water') {
        return {
          ...n,
          type: 'water',
          metric1Label: n.metric1Label || 'STP Flow',
          metric1Value: n.metric1Value || n.secondaryValue || '550 kL',
          metric2Label: n.metric2Label || 'Tank Level',
          metric2Value: n.metric2Value || '84%',
          metric3Label: n.metric3Label || 'Pressure',
          metric3Value: n.metric3Value || '4.2 bar',
          metric4Label: n.metric4Label || 'TDS Purity',
          metric4Value: n.metric4Value || '142 ppm',
        };
      }
      if (t === 'energy') {
        return {
          ...n,
          type: 'energy',
          metric1Label: n.metric1Label || 'Solar Gen',
          metric1Value: n.metric1Value || n.secondaryValue || '185 kW',
          metric2Label: n.metric2Label || 'Grid Load',
          metric2Value: n.metric2Value || '280 kVA',
          metric3Label: n.metric3Label || 'Daily Yield',
          metric3Value: n.metric3Value || '910 kWh',
          metric4Label: n.metric4Label || 'Power Factor',
          metric4Value: n.metric4Value || '0.99 PF',
        };
      }
      if (t === 'parking') {
        return {
          ...n,
          type: 'parking',
          metric1Label: n.metric1Label || 'Slots Avail',
          metric1Value: n.metric1Value || '18 / 28',
          metric2Label: n.metric2Label || 'EV Fast',
          metric2Value: n.metric2Value || '4 Active',
          metric3Label: n.metric3Label || 'Occupancy',
          metric3Value: n.metric3Value || '64%',
          metric4Label: n.metric4Label || 'Gate Status',
          metric4Value: n.metric4Value || 'OPEN',
        };
      }
      if (t === 'waste') {
        return {
          ...n,
          type: 'waste',
          metric1Label: n.metric1Label || 'Fill Level',
          metric1Value: n.metric1Value || '38%',
          metric2Label: n.metric2Label || 'Bin Weight',
          metric2Value: n.metric2Value || '14 kg',
          metric3Label: n.metric3Label || 'Odor / VOC',
          metric3Value: n.metric3Value || 'Clean',
          metric4Label: n.metric4Label || 'Pickup',
          metric4Value: n.metric4Value || 'Scheduled',
        };
      }
      return { ...n, type: t };
    });
  };

  const [nodes, setNodes] = useState<CampusNode[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`ecoestate-campus-nodes-${orgKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return enrichWithDomainDefaults(parsed);
          }
        } catch (e) {
          // fallback
        }
      }
    }
    return enrichWithDomainDefaults(generateAutoNodes(activeOrg?.type === 'HOSPITAL'));
  });

  // Sync 3D nodes with real NeonDB PostgreSQL telemetry
  useEffect(() => {
    if (!activeOrg?.id) return;
    Promise.all([
      DjangoApi.getAqiTelemetry(activeOrg.id),
      DjangoApi.getWaterTelemetry(activeOrg.id),
      DjangoApi.getEnergyTelemetry(activeOrg.id),
    ]).then(([dbAqi, dbWater, dbEnergy]) => {
      if (dbAqi || dbWater || dbEnergy) {
        setNodes((prevNodes) =>
          prevNodes.map((n) => {
            if (n.type === 'aqi' && dbAqi) {
              return {
                ...n,
                pm25: dbAqi.pm25 ?? n.pm25,
                pm10: dbAqi.pm10 ?? n.pm10,
                temp: dbAqi.temperature ? Math.round(dbAqi.temperature) : n.temp,
                humidity: dbAqi.humidity ? Math.round(dbAqi.humidity) : n.humidity,
                status: dbAqi.overall_aqi > 150 ? 'warning' : dbAqi.overall_aqi > 100 ? 'moderate' : 'optimal',
              };
            }
            if (n.type === 'water' && dbWater) {
              return {
                ...n,
                secondaryValue: `${dbWater.stp_treated_water_kl ?? 420} kL`,
              };
            }
            if (n.type === 'energy' && dbEnergy) {
              const val = n.name.toLowerCase().includes('solar')
                ? `${dbEnergy.solar_rooftop_kw ?? 220} kW`
                : `${dbEnergy.current_load_kw ?? 840} kW`;
              return {
                ...n,
                secondaryValue: val,
              };
            }
            return n;
          })
        );
      }
    });
  }, [activeOrg?.id]);

  // 3. Viewport Transform & Interactive State:
  // Default tiltPitch is 0deg so the image is clean, upright, and NOT skewed or slanted!
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tiltPitch, setTiltPitch] = useState<number>(0); // 0 = upright natural view, >0 = 3D angle
  const [is3DMode, setIs3DMode] = useState<boolean>(false);

  // Dragging Nodes state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<CampusNode | null>(null);

  // Mouse pan state
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calibration & Modals
  const [isCalibrateMode, setIsCalibrateMode] = useState<boolean>(false);
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showNodeModal, setShowNodeModal] = useState<boolean>(false);
  const [showGatewayModal, setShowGatewayModal] = useState<boolean>(false);
  const [editingNode, setEditingNode] = useState<Partial<CampusNode> | null>(null);

  // Top Bar Filters
  const [timelineHour, setTimelineHour] = useState<number>(13);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'aqi' | 'water' | 'energy' | 'parking' | 'waste'>('ALL');
  const [showPm25, setShowPm25] = useState(true);
  const [showPm10, setShowPm10] = useState(true);
  const [showTemp, setShowTemp] = useState(true);
  const [showHumidity, setShowHumidity] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Live Telemetry states & Real-time polling
  const [aqiList, setAqiList] = useState<any[]>([]);
  const [waterList, setWaterList] = useState<any[]>([]);
  const [energyList, setEnergyList] = useState<any[]>([]);

  useEffect(() => {
    if (!activeOrg?.id) return;
    const fetchLiveStreams = () => {
      DjangoApi.getAqiTelemetry(activeOrg.id).then(res => setAqiList(Array.isArray(res) ? res : [])).catch(() => {});
      DjangoApi.getWaterTelemetry(activeOrg.id).then(res => setWaterList(Array.isArray(res) ? res : [])).catch(() => {});
      DjangoApi.getEnergyTelemetry(activeOrg.id).then(res => setEnergyList(Array.isArray(res) ? res : [])).catch(() => {});
    };
    fetchLiveStreams();
    const interval = setInterval(fetchLiveStreams, 1500);
    return () => clearInterval(interval);
  }, [activeOrg?.id]);

  const hasAqiData = aqiList.length > 0;
  const hasWaterData = waterList.length > 0;
  const hasEnergyData = energyList.length > 0;

  // Averages for AQI & Weather
  const avgAqi = hasAqiData ? Math.round(aqiList.reduce((acc, r) => acc + (r.overall_aqi || 0), 0) / aqiList.length) : null;
  const avgPm25 = hasAqiData ? Math.round((aqiList.reduce((acc, r) => acc + (r.pm25 || 0), 0) / aqiList.length) * 10) / 10 : null;
  const avgPm10 = hasAqiData ? Math.round((aqiList.reduce((acc, r) => acc + (r.pm10 || 0), 0) / aqiList.length) * 10) / 10 : null;
  const avgTemp = hasAqiData ? Math.round((aqiList.reduce((acc, r) => acc + (r.temperature || 0), 0) / aqiList.length) * 10) / 10 : null;
  const avgHumidity = hasAqiData ? Math.round((aqiList.reduce((acc, r) => acc + (r.humidity || 0), 0) / aqiList.length) * 10) / 10 : null;

  // Averages for Water
  const avgFlow = hasWaterData ? Math.round((waterList.reduce((acc, r) => acc + (r.flow_rate_lps || 0), 0) / waterList.length) * 10) / 10 : null;
  const avgTreated = hasWaterData ? Math.round((waterList.reduce((acc, r) => acc + (r.treated_output_kl || 0), 0) / waterList.length) * 10) / 10 : null;
  const avgTds = hasWaterData ? Math.round((waterList.reduce((acc, r) => acc + (r.tds_ppm || 0), 0) / waterList.length) * 10) / 10 : null;

  // Averages for Energy
  const avgPower = hasEnergyData ? Math.round((energyList.reduce((acc, r) => acc + (r.real_power_kw || 0), 0) / energyList.length) * 10) / 10 : null;
  const avgPowerFactor = hasEnergyData ? Math.round((energyList.reduce((acc, r) => acc + (r.power_factor || 0), 0) / energyList.length) * 100) / 100 : null;
  const avgSolar = hasEnergyData ? Math.round((energyList.reduce((acc, r) => acc + (r.solar_generation_kw || 0), 0) / energyList.length) * 10) / 10 : null;

  // Fetch latest 3D campus twin image & nodes from NeonDB whenever activeOrg changes
  useEffect(() => {
    if (!activeOrg?.id) return;

    if (activeOrg.campusImageUrl) {
      setCampusImage(activeOrg.campusImageUrl);
    }
    if (activeOrg.campusNodesJson) {
      try {
        const parsed = JSON.parse(activeOrg.campusNodesJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNodes(parsed);
        }
      } catch (e) {}
    }

    DjangoApi.getOrganizations().then((orgs) => {
      const numericId = Number(String(activeOrg.id).replace(/^org-/, ''));
      const dbOrg = orgs.find((o) => o.id === numericId);
      if (dbOrg) {
        if (dbOrg.campus_image_url) {
          setCampusImage(dbOrg.campus_image_url);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`ecoestate-campus-image-${orgKey}`, dbOrg.campus_image_url);
          }
        }
        if (dbOrg.campus_nodes_json) {
          try {
            const parsed = JSON.parse(dbOrg.campus_nodes_json);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setNodes(parsed);
              if (typeof window !== 'undefined') {
                localStorage.setItem(`ecoestate-campus-nodes-${orgKey}`, dbOrg.campus_nodes_json);
              }
            }
          } catch (e) {}
        }
      }
    });
  }, [activeOrg?.id, orgKey]);

  // Persistence to local cache & NeonDB
  useEffect(() => {
    if (typeof window !== 'undefined' && nodes.length > 0) {
      localStorage.setItem(`ecoestate-campus-nodes-${orgKey}`, JSON.stringify(nodes));
    }
  }, [nodes, orgKey]);

  useEffect(() => {
    if (typeof window !== 'undefined' && campusImage) {
      localStorage.setItem(`ecoestate-campus-image-${orgKey}`, campusImage);
    }
  }, [campusImage, orgKey]);


  // Canvas Mouse Down for Panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background (not on a node or card)
    if (e.target === containerRef.current || e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'IMG') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  // Canvas Mouse Move (Handles both canvas panning & pin dragging)
  const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (isCalibrateMode && draggingNodeId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const rawXPct = (clickX / rect.width) * 100;
      const rawYPct = (clickY / rect.height) * 100;

      const clampedX = Math.round(Math.max(4, Math.min(96, rawXPct)) * 10) / 10;
      const clampedY = Math.round(Math.max(8, Math.min(94, rawYPct)) * 10) / 10;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNodeId ? { ...n, xPct: clampedX, yPct: clampedY } : n
        )
      );
    }
  }, [isPanning, panStart, isCalibrateMode, draggingNodeId]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    if (draggingNodeId && activeOrg?.id) {
      setNodes((currentNodes) => {
        DjangoApi.updateCampusTwin(activeOrg.id, {
          campus_nodes_json: JSON.stringify(currentNodes),
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem(`ecoestate-campus-nodes-${orgKey}`, JSON.stringify(currentNodes));
        }
        return currentNodes;
      });
    }
    setDraggingNodeId(null);
  }, [draggingNodeId, activeOrg?.id, orgKey]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  // Click on Canvas to add or calibrate a point (only in Edit mode)
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (!isCalibrateMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPct = Math.round(((clickX / rect.width) * 100) * 10) / 10;
    const yPct = Math.round(((clickY / rect.height) * 100) * 10) / 10;

    const newNode: Partial<CampusNode> = {
      id: `node-${Date.now()}`,
      name: `Sensor Anchor #${nodes.length + 1}`,
      locationLabel: `Zone ${nodes.length + 1}`,
      type: 'aqi',
      xPct: Math.max(4, Math.min(96, xPct)),
      yPct: Math.max(8, Math.min(94, yPct)),
      stemHeightPx: 65,
      pm25: Math.floor(Math.random() * 25) + 18,
      pm10: Math.floor(Math.random() * 35) + 30,
      temp: Math.floor(Math.random() * 10) + 26,
      humidity: Math.floor(Math.random() * 30) + 50,
      status: 'optimal',
    };

    setEditingNode(newNode);
    setShowNodeModal(true);
  };

  // AI Auto-Detection Simulation
  const handleRunAiAutoDetect = () => {
    setIsAiScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAiScanning(false);
          const autoNodes = generateAutoNodes(activeOrg?.type === 'HOSPITAL');
          setNodes(autoNodes);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  // Image Upload handler
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImg = event.target.result as string;
          setCampusImage(newImg);
          setShowUploadModal(false);
          // Persist uploaded image to NeonDB so ALL users in this organization see it!
          if (activeOrg?.id) {
            DjangoApi.updateCampusTwin(activeOrg.id, { campus_image_url: newImg });
          }
          // Automatically seed smart points across the newly uploaded image!
          handleRunAiAutoDetect();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode) return;

    let updatedNodes: CampusNode[] = [];
    const exists = nodes.find((n) => n.id === editingNode.id);
    if (exists) {
      updatedNodes = nodes.map((n) => (n.id === editingNode.id ? ({ ...n, ...editingNode } as CampusNode) : n));
    } else {
      updatedNodes = [...nodes, editingNode as CampusNode];
    }
    setNodes(updatedNodes);

    // Persist node updates to NeonDB so ALL users in this organization see them!
    if (activeOrg?.id) {
      DjangoApi.updateCampusTwin(activeOrg.id, { campus_nodes_json: JSON.stringify(updatedNodes) });
    }

    setShowNodeModal(false);
    setEditingNode(null);
  };

  const handleDeleteNode = (id: string) => {
    const updatedNodes = nodes.filter((n) => n.id !== id);
    setNodes(updatedNodes);
    if (selectedNode?.id === id) setSelectedNode(null);

    // Persist node removal to NeonDB
    if (activeOrg?.id) {
      DjangoApi.updateCampusTwin(activeOrg.id, { campus_nodes_json: JSON.stringify(updatedNodes) });
    }
  };

  const handleResetDefaults = () => {
    const baseNodes = generateAutoNodes(activeOrg?.type === 'HOSPITAL');
    const baseImg = activeOrg?.type === 'HOSPITAL' ? '/images/hospital_aerial.jpg' : '/images/campus_aerial.jpg';
    setNodes(baseNodes);
    setCampusImage(baseImg);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setTiltPitch(0);
    setIs3DMode(false);

    // Reset twin config in NeonDB
    if (activeOrg?.id) {
      DjangoApi.updateCampusTwin(activeOrg.id, {
        campus_image_url: baseImg,
        campus_nodes_json: JSON.stringify(baseNodes),
      });
    }
  };


  // Filter nodes according to selected category
  const filteredNodes = nodes.filter((n) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'aqi') return n.type === 'aqi' || n.type === 'weather';
    return n.type === activeFilter;
  });

  const getDomainTheme = (type: string) => {
    switch (type) {
      case 'water':
        return {
          cardBorder: 'border-cyan-500/50 hover:border-cyan-400',
          cardSelected: 'border-cyan-400 ring-2 ring-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.45)]',
          cardGlow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]',
          cardBg: 'bg-[#030d17]/95',
          channelBadge: 'text-cyan-400',
          stem: 'from-cyan-400 to-blue-500 shadow-[0_0_8px_#06b6d4]',
          beacon: 'bg-cyan-400 shadow-[0_0_15px_#06b6d4]',
          beaconHalo: 'bg-cyan-400/40',
          pillBorder: 'hover:border-cyan-400',
        };
      case 'energy':
        return {
          cardBorder: 'border-amber-500/50 hover:border-amber-400',
          cardSelected: 'border-amber-400 ring-2 ring-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.45)]',
          cardGlow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]',
          cardBg: 'bg-[#150e04]/95',
          channelBadge: 'text-amber-400',
          stem: 'from-amber-400 to-yellow-500 shadow-[0_0_8px_#f59e0b]',
          beacon: 'bg-amber-400 shadow-[0_0_15px_#f59e0b]',
          beaconHalo: 'bg-amber-400/40',
          pillBorder: 'hover:border-amber-400',
        };
      case 'parking':
        return {
          cardBorder: 'border-emerald-500/50 hover:border-emerald-400',
          cardSelected: 'border-emerald-400 ring-2 ring-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.45)]',
          cardGlow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]',
          cardBg: 'bg-[#04140b]/95',
          channelBadge: 'text-emerald-400',
          stem: 'from-emerald-400 to-teal-500 shadow-[0_0_8px_#10b981]',
          beacon: 'bg-emerald-400 shadow-[0_0_15px_#10b981]',
          beaconHalo: 'bg-emerald-400/40',
          pillBorder: 'hover:border-emerald-400',
        };
      case 'waste':
        return {
          cardBorder: 'border-purple-500/50 hover:border-purple-400',
          cardSelected: 'border-purple-400 ring-2 ring-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.45)]',
          cardGlow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]',
          cardBg: 'bg-[#120519]/95',
          channelBadge: 'text-purple-400',
          stem: 'from-purple-400 to-indigo-500 shadow-[0_0_8px_#a855f7]',
          beacon: 'bg-purple-400 shadow-[0_0_15px_#a855f7]',
          beaconHalo: 'bg-purple-400/40',
          pillBorder: 'hover:border-purple-400',
        };
      case 'aqi':
      case 'weather':
      default:
        return {
          cardBorder: 'border-sky-500/50 hover:border-sky-400',
          cardSelected: 'border-sky-400 ring-2 ring-sky-500/50 shadow-[0_0_25px_rgba(14,165,233,0.45)]',
          cardGlow: 'hover:shadow-[0_0_20px_rgba(14,165,233,0.25)]',
          cardBg: 'bg-[#060c15]/95',
          channelBadge: 'text-sky-400',
          stem: 'from-sky-400 to-blue-500 shadow-[0_0_8px_#0ea5e9]',
          beacon: 'bg-sky-400 shadow-[0_0_15px_#0ea5e9]',
          beaconHalo: 'bg-sky-400/40',
          pillBorder: 'hover:border-sky-400',
        };
    }
  };

  return (
    <div className="space-y-3.5 animate-in fade-in duration-300 select-none pb-12">
      {/* 1. TOP CONTROL BAR (Compact, responsive, aligned with reference photo) */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Quick Domain Filters ("in short") */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Domain Filter Buttons ("in short") */}
          <div className="flex items-center gap-1 bg-[#f8f5ee] dark:bg-[#0a0b12] p-1 rounded-2xl border border-[#ece3d6] dark:border-[#151722] text-[11px] font-bold">
            {[
              { id: 'aqi', label: 'AQI', icon: Wind, color: 'text-amber-500' },
              { id: 'water', label: 'Water', icon: Droplets, color: 'text-cyan-400' },
              { id: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-400' },
              { id: 'parking', label: 'EV Parking', icon: Car, color: 'text-emerald-400' },
              { id: 'waste', label: 'Waste', icon: Trash2, color: 'text-purple-400' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(activeFilter === tab.id ? 'ALL' : (tab.id as any))}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                    isActive
                      ? 'bg-white dark:bg-stone-800 text-cyan-600 dark:text-cyan-400 shadow-sm font-extrabold border border-cyan-500/30 ring-1 ring-cyan-500/20'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                  title={`Filter pins by ${tab.label}`}
                >
                  <Icon className={`w-3 h-3 ${tab.color || ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Parameter Filters & Contextual Indicators */}
        <div className="flex flex-wrap items-center gap-2 text-xs">

          {/* Metric Parameter Toggles - Only visible for Air (AQI) */}
          {activeFilter === 'aqi' && (
            <div className="flex items-center gap-1 bg-[#f8f5ee] dark:bg-[#0a0b12] p-1 rounded-xl border border-[#ece3d6] dark:border-[#151722] text-[11px] font-bold animate-in fade-in duration-200">
              <button
                onClick={() => setShowPm25(!showPm25)}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  showPm25 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold' : 'text-stone-400'
                }`}
                title="Toggle PM2.5 visibility"
              >
                PM2.5
              </button>
              <button
                onClick={() => setShowPm10(!showPm10)}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  showPm10 ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-extrabold' : 'text-stone-400'
                }`}
                title="Toggle PM10 visibility"
              >
                PM10
              </button>
              <button
                onClick={() => setShowTemp(!showTemp)}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  showTemp ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-stone-400'
                }`}
                title="Toggle Temperature visibility"
              >
                Temp
              </button>
              <button
                onClick={() => setShowHumidity(!showHumidity)}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  showHumidity ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold' : 'text-stone-400'
                }`}
                title="Toggle Humidity visibility"
              >
                Humidity
              </button>
            </div>
          )}

          {/* Contextual Metric Indicators for other categories */}
          {activeFilter === 'water' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[11px] font-bold animate-in fade-in duration-200">
              <Droplets className="w-3.5 h-3.5" />
              <span>STP Flow • Tank Level • Pressure • TDS</span>
            </div>
          )}
          {activeFilter === 'energy' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold animate-in fade-in duration-200">
              <Zap className="w-3.5 h-3.5" />
              <span>Solar Gen • Grid Load • Daily Yield • PF</span>
            </div>
          )}
          {activeFilter === 'parking' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold animate-in fade-in duration-200">
              <Car className="w-3.5 h-3.5" />
              <span>Slots Avail • EV Fast • Occupancy • Gate</span>
            </div>
          )}
          {activeFilter === 'waste' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-[11px] font-bold animate-in fade-in duration-200">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Fill Level • Bin Weight • Odor VOC • Route</span>
            </div>
          )}
        </div>

        {/* Right: Key Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dual-Channel Hardware Ingest Trigger */}
          <button
            onClick={() => setShowGatewayModal(true)}
            className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Inspect Live Hardware Ingestion via LAN (Modbus) & WiFi (ESP32)"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
            <span className="hidden xl:inline">LAN / WiFi Ingest</span>
            <span className="xl:hidden">IoT Live</span>
          </button>

          {/* AI Auto-Detect */}
          <button
            onClick={handleRunAiAutoDetect}
            disabled={isAiScanning}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-60"
            title="Automatically detect building hotspots and anchor sensors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAiScanning ? `Scanning Vision...` : 'AI Auto-Detect'}</span>
          </button>

          {/* Import Custom Campus Image */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-1.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-700 dark:text-slate-300 hover:border-cyan-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-500" />
            <span>Import Image</span>
          </button>
        </div>
      </div>

      {/* 1.5 CAMPUS REAL-TIME AVERAGE AGGREGATE STRIP */}
      <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${hasAqiData || hasWaterData || hasEnergyData ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
          <span className="font-extrabold uppercase tracking-wider text-[11px] text-stone-700 dark:text-stone-300">
            {hasAqiData || hasWaterData || hasEnergyData ? 'Live Campus Spatial Averages' : 'Awaiting Sensor Telemetry (Spatial Mesh Standby)'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1 text-amber-500">
            <span>Avg PM2.5:</span>
            <span className="font-bold">{hasAqiData ? `${avgPm25} µg/m³` : '--'}</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-500">
            <span>Avg PM10:</span>
            <span className="font-bold">{hasAqiData ? `${avgPm10} µg/m³` : '--'}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-500">
            <span>Avg Temp:</span>
            <span className="font-bold">{hasAqiData ? `${avgTemp} °C` : '--'}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-500">
            <span>Avg Humid:</span>
            <span className="font-bold">{hasAqiData ? `${avgHumidity}%` : '--'}</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <span>Avg Flow:</span>
            <span className="font-bold">{hasWaterData ? `${avgFlow} L/s` : '--'}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <span>Avg Power:</span>
            <span className="font-bold">{hasEnergyData ? `${avgPower} kW` : '--'}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN INTERACTIVE MAP CANVAS CONTAINER */}
      <div
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleCanvasDoubleClick}
        className="relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-[#ece3d6] dark:border-[#151722] shadow-2xl min-h-[580px] lg:min-h-[720px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      >
        {/* Subtle Ambient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none z-10" />

        {/* Floating Edit Pins & Add Pin Controls on Top-Right Corner of Image */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          {/* Quick Add Pin button appears when Edit Mode is active */}
          {isCalibrateMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const defaultType = activeFilter === 'ALL' ? 'aqi' : activeFilter;
                let metricsDefaults = {};
                if (defaultType === 'water') {
                  metricsDefaults = { metric1Label: 'STP Flow', metric1Value: '550 kL', metric2Label: 'Tank Level', metric2Value: '84%', metric3Label: 'Pressure', metric3Value: '4.2 bar', metric4Label: 'TDS Purity', metric4Value: '142 ppm' };
                } else if (defaultType === 'energy') {
                  metricsDefaults = { metric1Label: 'Solar Gen', metric1Value: '185 kW', metric2Label: 'Grid Load', metric2Value: '280 kVA', metric3Label: 'Daily Yield', metric3Value: '910 kWh', metric4Label: 'Power Factor', metric4Value: '0.99 PF' };
                } else if (defaultType === 'parking') {
                  metricsDefaults = { metric1Label: 'Slots Avail', metric1Value: '18 / 28', metric2Label: 'EV Fast', metric2Value: '4 Active', metric3Label: 'Occupancy', metric3Value: '64%', metric4Label: 'Gate Status', metric4Value: 'OPEN' };
                } else if (defaultType === 'waste') {
                  metricsDefaults = { metric1Label: 'Fill Level', metric1Value: '38%', metric2Label: 'Bin Weight', metric2Value: '14 kg', metric3Label: 'Odor / VOC', metric3Value: 'Clean', metric4Label: 'Pickup', metric4Value: 'Scheduled' };
                }

                const newNode: Partial<CampusNode> = {
                  id: `node-${Date.now()}`,
                  name: `New ${defaultType.toUpperCase()} Node #${nodes.length + 1}`,
                  locationLabel: `Zone ${nodes.length + 1}`,
                  type: defaultType as any,
                  interfaceType: 'WIFI',
                  xPct: 50,
                  yPct: 50,
                  stemHeightPx: 65,
                  pm25: 25,
                  pm10: 45,
                  temp: 30,
                  humidity: 55,
                  status: 'optimal',
                  ...metricsDefaults,
                };
                setEditingNode(newNode);
                setShowNodeModal(true);
              }}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-xl flex items-center gap-1.5 cursor-pointer animate-in fade-in transition-all"
              title="Add a new sensor pin"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Pin</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isCalibrateMode) {
                // Persist current node positions when user finishes editing
                if (activeOrg?.id) {
                  DjangoApi.updateCampusTwin(activeOrg.id, {
                    campus_nodes_json: JSON.stringify(nodes),
                  });
                }
                if (typeof window !== 'undefined') {
                  localStorage.setItem(`ecoestate-campus-nodes-${orgKey}`, JSON.stringify(nodes));
                }
              }
              setIsCalibrateMode(!isCalibrateMode);
            }}
            title={isCalibrateMode ? 'Exit Pin Calibration (Done)' : 'Move & Edit Sensor Pins'}
            className={`p-2.5 sm:px-3.5 sm:py-2 rounded-2xl backdrop-blur-md border shadow-2xl flex items-center gap-2 text-xs font-extrabold transition-all cursor-pointer ${
              isCalibrateMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.55)] ring-2 ring-amber-300'
                : 'bg-slate-900/85 hover:bg-slate-900/95 text-white border-white/20 hover:border-cyan-400 hover:scale-105 shadow-xl'
            }`}
          >
            {isCalibrateMode ? (
              <>
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span className="hidden sm:inline">Done Editing</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Edit Pins</span>
              </>
            )}
          </button>
        </div>

        {/* AI Laser Scanline sweep overlay */}
        {isAiScanning && (
          <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
            <div
              className="w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_30px_#22d3ee] animate-pulse"
              style={{
                position: 'absolute',
                top: `${scanProgress}%`,
                transition: 'top 0.15s linear',
              }}
            />
            <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[0.5px]" />
            <div className="absolute top-6 left-6 px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-cyan-500 text-cyan-400 text-xs font-mono font-bold flex items-center gap-2 shadow-2xl">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              AI Vision Scanning Campus Landmarks... {scanProgress}%
            </div>
          </div>
        )}


        {/* Transformed Map & Spatial Layer Canvas */}
        <div
          ref={canvasRef}
          style={{
            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel}) ${
              is3DMode ? `perspective(1400px) rotateX(${tiltPitch}deg)` : ''
            }`,
            transformStyle: 'preserve-3d',
            transition: isPanning || draggingNodeId ? 'none' : 'transform 0.25s ease-out',
          }}
          className="relative w-full max-w-[1450px] aspect-[16/9] shadow-2xl rounded-2xl overflow-visible my-auto"
        >
          {/* Real Campus Aerial Drone Image (Upright, Clean, No Forced Skew) */}
          <img
            src={campusImage}
            alt="Campus 3D Spatial Digital Twin"
            draggable={false}
            className="w-full h-full object-cover rounded-2xl select-none pointer-events-none shadow-2xl border border-white/20"
          />

          {/* SENSOR NODES & FLOATING TELEMETRY HUD CARDS */}
          {filteredNodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const isDragging = draggingNodeId === node.id;

            // Live values when telemetry has arrived, otherwise clean '--' standby placeholders
            const nodePm25 = hasAqiData ? (avgPm25 ?? '--') : '--';
            const nodePm10 = hasAqiData ? (avgPm10 ?? '--') : '--';
            const nodeTemp = hasAqiData ? (avgTemp ?? '--') : '--';
            const nodeHumidity = hasAqiData ? (avgHumidity ?? '--') : '--';

            const nodeStatus = (
              node.type === 'aqi' ? (hasAqiData ? 'OPTIMAL' : 'STANDBY') :
              node.type === 'water' ? (hasWaterData ? 'OPTIMAL' : 'STANDBY') :
              node.type === 'energy' ? (hasEnergyData ? 'OPTIMAL' : 'STANDBY') :
              'STANDBY'
            );

            const theme = getDomainTheme(node.type);

            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: `${node.xPct}%`,
                  top: `${node.yPct}%`,
                  transformStyle: 'preserve-3d',
                  zIndex: isDragging ? 100 : isSelected ? 80 : 30,
                }}
                className="group pointer-events-auto"
              >
                {/* 1. FLOATING TELEMETRY HUD CARD & STEM (Extends upwards above pinpoint beacon) */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
                  <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                    setEditingNode({ ...node });
                    setShowNodeModal(true);
                  }}
                  title="Click to customize and edit this sensor card"
                  className={`p-2.5 rounded-2xl ${theme.cardBg} backdrop-blur-md border shadow-2xl transition-all cursor-pointer select-none group/card ${
                    isSelected
                      ? theme.cardSelected
                      : `${theme.cardBorder} ${theme.cardGlow} hover:scale-[1.02]`
                  }`}
                  style={{ minWidth: '155px' }}
                >
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-mono font-bold leading-tight">
                    {/* Top Ingestion Channel Badge + Click to Edit Prompt */}
                    <div className="col-span-2 pb-1 border-b border-white/10 flex items-center justify-between text-[9px]">
                      <span className="flex items-center gap-1">
                        {node.interfaceType === 'LAN' ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                            <Network className="w-2.5 h-2.5" /> LAN (RJ45)
                          </span>
                        ) : (
                          <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                            <Wifi className="w-2.5 h-2.5" /> WiFi (ESP32)
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-sans font-bold ${nodeStatus === 'STANDBY' ? 'text-amber-400/80' : 'text-emerald-400'}`}>
                          {nodeStatus}
                        </span>
                        <Edit3 className="w-2.5 h-2.5 text-stone-500 group-hover/card:text-amber-400 transition-colors" />
                      </div>
                    </div>

                    {/* Domain-Specific Metrics Content */}
                    {node.type === 'water' ? (
                      /* Water & STP Loop HUD */
                      <>
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Waves className="w-3 h-3 flex-shrink-0" />
                          <span>{hasWaterData ? `${avgFlow} L/s` : '-- L/s'} <span className="text-[9px] text-cyan-500/70 font-sans">{node.metric1Label || 'Flow'}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-400">
                          <Droplets className="w-3 h-3 flex-shrink-0" />
                          <span>{hasWaterData ? `${avgTreated} kL` : '-- %'} <span className="text-[9px] text-blue-500/70 font-sans">{node.metric2Label || 'Tank'}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Gauge className="w-3 h-3 flex-shrink-0" />
                          <span>{hasWaterData ? '4.2 bar' : '-- bar'} <span className="text-[9px] text-emerald-500/70 font-sans">{node.metric3Label || 'Press'}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-indigo-400">
                          <Activity className="w-3 h-3 flex-shrink-0" />
                          <span>{hasWaterData ? `${avgTds} ppm` : '-- ppm'} <span className="text-[9px] text-indigo-500/70 font-sans">{node.metric4Label || 'TDS'}</span></span>
                        </div>
                      </>
                    ) : node.type === 'energy' ? (
                      /* Energy & Solar Grid HUD */
                      <>
                        <div className="flex items-center gap-1 text-amber-400">
                          <Sun className="w-3 h-3 flex-shrink-0" />
                          <span>{hasEnergyData ? `${avgSolar} kW` : '-- kW'} <span className="text-[9px] text-amber-500/70 font-sans">{node.metric1Label || 'Solar'}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-orange-400">
                          <Zap className="w-3 h-3 flex-shrink-0" />
                          <span>{hasEnergyData ? `${avgPower} kVA` : '-- kVA'} <span className="text-[9px] text-orange-500/70 font-sans">{node.metric2Label || 'Grid'}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400">
                          <BatteryCharging className="w-3 h-3 flex-shrink-0" />
                          <span>{hasEnergyData ? `${Math.round((avgPower || 0) * 4.2)} kWh` : '-- kWh'} <span className="text-[9px] text-emerald-500/70 font-sans">{node.metric3Label || 'Yield'}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Gauge className="w-3 h-3 flex-shrink-0" />
                          <span>{hasEnergyData ? `${avgPowerFactor} PF` : '-- PF'} <span className="text-[9px] text-cyan-500/70 font-sans">{node.metric4Label || 'PF'}</span></span>
                        </div>
                      </>
                    ) : node.type === 'parking' ? (
                      /* Smart EV Parking HUD */
                      <>
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Car className="w-3 h-3 flex-shrink-0" />
                          <span>-- / -- <span className="text-[9px] text-emerald-500/70 font-sans">{node.metric1Label || 'Slots'}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-cyan-400">
                          <BatteryCharging className="w-3 h-3 flex-shrink-0" />
                          <span>-- Active <span className="text-[9px] text-cyan-500/70 font-sans">{node.metric2Label || 'EV'}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400">
                          <Gauge className="w-3 h-3 flex-shrink-0" />
                          <span>-- % <span className="text-[9px] text-amber-500/70 font-sans">{node.metric3Label || 'Occ'}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-400">
                          <Activity className="w-3 h-3 flex-shrink-0" />
                          <span>STANDBY <span className="text-[9px] text-blue-500/70 font-sans">{node.metric4Label || 'Gate'}</span></span>
                        </div>
                      </>
                    ) : node.type === 'waste' ? (
                      /* Waste Logistics HUD */
                      <>
                        <div className="flex items-center gap-1 text-purple-400">
                          <Trash2 className="w-3 h-3 flex-shrink-0" />
                          <span>-- % <span className="text-[9px] text-purple-500/70 font-sans">{node.metric1Label || 'Fill'}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-indigo-400">
                          <Scale className="w-3 h-3 flex-shrink-0" />
                          <span>-- kg <span className="text-[9px] text-indigo-500/70 font-sans">{node.metric2Label || 'Weight'}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Activity className="w-3 h-3 flex-shrink-0" />
                          <span>STANDBY <span className="text-[9px] text-emerald-500/70 font-sans">{node.metric3Label || 'Odor'}</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Truck className="w-3 h-3 flex-shrink-0" />
                          <span>STANDBY <span className="text-[9px] text-cyan-500/70 font-sans">{node.metric4Label || 'Route'}</span></span>
                        </div>
                      </>
                    ) : (
                      /* AQI / Weather Station HUD */
                      <>
                        {showPm25 && (
                          <div className="flex items-center gap-1 text-amber-400">
                            <Cloud className="w-3 h-3 flex-shrink-0" />
                            <span>{nodePm25} <span className="text-[9px] text-amber-500/70 font-normal">µg/m³</span></span>
                          </div>
                        )}
                        {showPm10 && (
                          <div className="flex items-center gap-1 text-cyan-400">
                            <Cloud className="w-3 h-3 flex-shrink-0" />
                            <span>{nodePm10} <span className="text-[9px] text-cyan-500/70 font-normal">µg/m³</span></span>
                          </div>
                        )}
                        {showTemp && (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <Thermometer className="w-3 h-3 flex-shrink-0" />
                            <span>{nodeTemp} <span className="text-[9px] text-emerald-500/70 font-normal">°C</span></span>
                          </div>
                        )}
                        {showHumidity && (
                          <div className="flex items-center gap-1 text-blue-400">
                            <Droplets className="w-3 h-3 flex-shrink-0" />
                            <span>{nodeHumidity} <span className="text-[9px] text-blue-500/70 font-normal">%</span></span>
                          </div>
                        )}
                        {node.secondaryLabel && (
                          <div className="col-span-2 pt-1 border-t border-white/10 flex justify-between text-[10px] text-purple-300">
                            <span>{node.secondaryLabel}:</span>
                            <span className="text-white font-bold">{node.secondaryValue}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                  {/* 2. VERTICAL LEADER STEM LINE (Connecting card to pinpoint) */}
                  <div
                    style={{ height: `${node.stemHeightPx || 65}px` }}
                    className={`w-0.5 bg-gradient-to-b ${theme.stem} relative`}
                  />
                </div>

                {/* 3. PINPOINT GROUND BEACON (Centered directly at 0,0 = xPct%, yPct%) */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (isCalibrateMode) {
                      setDraggingNodeId(node.id);
                    }
                    setSelectedNode(node);
                  }}
                  className={`absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center p-1.5 ${
                    isCalibrateMode ? 'cursor-move' : 'cursor-pointer'
                  }`}
                  title={isCalibrateMode ? 'Click & drag to reposition this sensor pin' : node.name}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 border-white ${
                    isDragging ? 'bg-white scale-125 shadow-[0_0_20px_#ffffff]' : theme.beacon
                  }`} />
                  <span className={`absolute w-7 h-7 rounded-full ${theme.beaconHalo} animate-ping pointer-events-none`} />
                </div>

                {/* 4. LOCATION LABEL PILL & EDIT CONTROLS (Positioned directly below pinpoint beacon) */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center whitespace-nowrap">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                    className={`px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-[#07080e]/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white font-bold text-[10px] shadow-lg cursor-pointer ${theme.pillBorder}`}
                  >
                    {node.locationLabel}
                  </div>

                  {/* Quick Edit/Delete buttons (Only visible during Edit Mode) */}
                  {isCalibrateMode && (
                    <div className="mt-1 flex items-center gap-1 bg-black/80 p-1 rounded-xl shadow-lg">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNode(node);
                          setShowNodeModal(true);
                        }}
                        className="p-1 rounded bg-amber-500 text-slate-950 hover:bg-amber-400 text-[10px]"
                        title="Edit this sensor"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                        className="p-1 rounded bg-rose-500 text-white hover:bg-rose-400 text-[10px]"
                        title="Delete this sensor"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. FLOATING CAMERA, ZOOM & RESET CONTROLS (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 p-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-white text-xs shadow-2xl">
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.8, z + 0.15))}
            className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-cyan-400" />
          </button>
          <span className="font-mono text-[10px] text-stone-300 min-w-[34px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.65, z - 0.15))}
            className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-cyan-400" />
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Reset View */}
          <button
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
              setTiltPitch(0);
              setIs3DMode(false);
            }}
            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 font-bold text-[10px] cursor-pointer"
            title="Reset Pan, Zoom, and Tilt"
          >
            Reset
          </button>
        </div>

        {/* Interaction Hint */}
        <div className="absolute bottom-4 left-4 z-30 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-[10px] text-stone-400 pointer-events-none">
          <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click & Drag pins to move • Double-click to add pin • Use [+] [-] side buttons to zoom</span>
        </div>
      </div>

      {/* 4. SELECTED SENSOR HUD DETAIL INSPECTOR */}
      {selectedNode && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping" />
              <div>
                <h3 className="font-black text-base text-stone-900 dark:text-white">
                  {selectedNode.name}
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Location Anchor: <strong>{selectedNode.locationLabel}</strong> • Telemetry Node ID: <span className="font-mono">{selectedNode.id}</span> • Coordinate: <span className="font-mono">{selectedNode.xPct}%, {selectedNode.yPct}%</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingNode(selectedNode);
                  setShowNodeModal(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-xs font-bold text-stone-700 dark:text-slate-300 hover:border-cyan-500 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Parameters
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722]">
              <span className="text-[10px] text-stone-500 dark:text-slate-400 block font-semibold">Fine Particulate PM2.5</span>
              <span className="text-2xl font-black text-amber-500 mt-1 block">{selectedNode.pm25} µg/m³</span>
              <span className="text-[10px] text-emerald-600 font-semibold">NAQI Standard Passed</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722]">
              <span className="text-[10px] text-stone-500 dark:text-slate-400 block font-semibold">Inhalable Particulate PM10</span>
              <span className="text-2xl font-black text-cyan-500 mt-1 block">{selectedNode.pm10} µg/m³</span>
              <span className="text-[10px] text-cyan-600 font-semibold">Clean Atmospheric Index</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722]">
              <span className="text-[10px] text-stone-500 dark:text-slate-400 block font-semibold">Ambient Temperature</span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">{selectedNode.temp} °C</span>
              <span className="text-[10px] text-stone-400">Micro-climate Thermal Balance</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722]">
              <span className="text-[10px] text-stone-500 dark:text-slate-400 block font-semibold">Relative Humidity</span>
              <span className="text-2xl font-black text-blue-500 mt-1 block">{selectedNode.humidity} %</span>
              <span className="text-[10px] text-blue-600 font-semibold">Psychrometric Comfort</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: IMPORT CAMPUS IMAGE */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-500" />
                <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                  Import College / Organization Image
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
              Upload a high-resolution drone photo or campus aerial view. Once imported, sensor nodes are automatically placed on key building landmarks. You can also drag and move pins directly with your mouse.
            </p>

            <div className="p-6 rounded-2xl border-2 border-dashed border-[#ece3d6] dark:border-[#151722] text-center space-y-3 bg-[#f8f5ee] dark:bg-[#0a0b12]">
              <Camera className="w-8 h-8 text-cyan-500 mx-auto" />
              <div>
                <p className="text-xs font-bold text-stone-900 dark:text-white">Select a campus aerial drone image</p>
                <p className="text-[11px] text-stone-400">PNG, JPG, or WEBP up to 15MB</p>
              </div>
              <label className="inline-block px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs cursor-pointer shadow-md transition-all">
                <span>Browse Local Files</span>
                <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Restore Default Aerial Photo
              </button>

              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: EDIT / CONFIGURE SENSOR NODE */}
      {showNodeModal && editingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                  Customize Campus Sensor Pin & Telemetry Card
                </h3>
              </div>
              <button
                onClick={() => setShowNodeModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNode} className="space-y-3.5">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">Sensor Facility Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Water Reservoir & Pump House"
                  value={editingNode.name || ''}
                  onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">Map Tag (Pill on Canvas):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. at pump house, Behind Academic Wing, Football ground"
                  value={editingNode.locationLabel || ''}
                  onChange={(e) => setEditingNode({ ...editingNode, locationLabel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                />
              </div>

              {/* Sensor Domain Type & Ingest Interface */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-slate-300">Category / Domain:</label>
                  <select
                    value={editingNode.type || 'aqi'}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      let updates: Partial<CampusNode> = { type: newType };
                      if (newType === 'water' && !editingNode.metric1Value) {
                        updates = { ...updates, metric1Label: 'STP Flow', metric1Value: '550 kL', metric2Label: 'Tank Level', metric2Value: '84%', metric3Label: 'Pressure', metric3Value: '4.2 bar', metric4Label: 'TDS Purity', metric4Value: '142 ppm' };
                      } else if (newType === 'energy' && !editingNode.metric1Value) {
                        updates = { ...updates, metric1Label: 'Solar Gen', metric1Value: '185 kW', metric2Label: 'Grid Load', metric2Value: '280 kVA', metric3Label: 'Daily Yield', metric3Value: '910 kWh', metric4Label: 'Power Factor', metric4Value: '0.99 PF' };
                      } else if (newType === 'parking' && !editingNode.metric1Value) {
                        updates = { ...updates, metric1Label: 'Slots Avail', metric1Value: '18 / 28', metric2Label: 'EV Fast', metric2Value: '4 Active', metric3Label: 'Occupancy', metric3Value: '64%', metric4Label: 'Gate Status', metric4Value: 'OPEN' };
                      } else if (newType === 'waste' && !editingNode.metric1Value) {
                        updates = { ...updates, metric1Label: 'Fill Level', metric1Value: '38%', metric2Label: 'Bin Weight', metric2Value: '14 kg', metric3Label: 'Odor / VOC', metric3Value: 'Clean', metric4Label: 'Pickup', metric4Value: 'Scheduled' };
                      }
                      setEditingNode({ ...editingNode, ...updates });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white font-bold"
                  >
                    <option value="aqi">Air Quality (AQI)</option>
                    <option value="water">Water & STP Loop</option>
                    <option value="energy">Energy & Solar Grid</option>
                    <option value="parking">Smart EV Parking</option>
                    <option value="waste">Waste Logistics</option>
                    <option value="weather">Weather Station</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-slate-300">Ingestion Channel:</label>
                  <select
                    value={editingNode.interfaceType || 'WIFI'}
                    onChange={(e) => setEditingNode({ ...editingNode, interfaceType: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  >
                    <option value="WIFI">WiFi (ESP32 Wireless)</option>
                    <option value="LAN">LAN (RJ45 / Modbus Wired)</option>
                  </select>
                </div>
              </div>

              {/* Status & Leader Line */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-slate-300">Telemetry Status:</label>
                  <select
                    value={editingNode.status || 'optimal'}
                    onChange={(e) => setEditingNode({ ...editingNode, status: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  >
                    <option value="optimal">OPTIMAL (Active / Normal)</option>
                    <option value="moderate">MODERATE (Warning Threshold)</option>
                    <option value="warning">CRITICAL (Action Required)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-slate-300">Leader Line Height (px):</label>
                  <input
                    type="number"
                    min="35"
                    max="110"
                    value={editingNode.stemHeightPx || 65}
                    onChange={(e) => setEditingNode({ ...editingNode, stemHeightPx: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              {/* DYNAMIC DOMAIN-SPECIFIC METRIC INPUTS */}
              <div className="p-3 rounded-2xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-[11px] text-stone-800 dark:text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Card Display Metrics ({editingNode.type?.toUpperCase()})
                  </h4>
                  <span className="text-[10px] text-stone-400">Customizable</span>
                </div>

                {editingNode.type === 'water' ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 1 (Flow):</label>
                      <input
                        type="text"
                        value={editingNode.metric1Value ?? '550 kL'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric1Value: e.target.value, secondaryValue: e.target.value })}
                        placeholder="e.g. 550 kL"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 2 (Tank Level):</label>
                      <input
                        type="text"
                        value={editingNode.metric2Value ?? '84%'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric2Value: e.target.value })}
                        placeholder="e.g. 84%"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 3 (Pressure):</label>
                      <input
                        type="text"
                        value={editingNode.metric3Value ?? '4.2 bar'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric3Value: e.target.value })}
                        placeholder="e.g. 4.2 bar"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 4 (TDS / Purity):</label>
                      <input
                        type="text"
                        value={editingNode.metric4Value ?? '142 ppm'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric4Value: e.target.value })}
                        placeholder="e.g. 142 ppm"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                ) : editingNode.type === 'energy' ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 1 (Solar Gen):</label>
                      <input
                        type="text"
                        value={editingNode.metric1Value ?? '185 kW'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric1Value: e.target.value, secondaryValue: e.target.value })}
                        placeholder="e.g. 185 kW"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 2 (Grid Load):</label>
                      <input
                        type="text"
                        value={editingNode.metric2Value ?? '280 kVA'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric2Value: e.target.value })}
                        placeholder="e.g. 280 kVA"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 3 (Daily Yield):</label>
                      <input
                        type="text"
                        value={editingNode.metric3Value ?? '910 kWh'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric3Value: e.target.value })}
                        placeholder="e.g. 910 kWh"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 4 (Power Factor):</label>
                      <input
                        type="text"
                        value={editingNode.metric4Value ?? '0.99 PF'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric4Value: e.target.value })}
                        placeholder="e.g. 0.99 PF"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                ) : editingNode.type === 'parking' ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 1 (Slots Avail):</label>
                      <input
                        type="text"
                        value={editingNode.metric1Value ?? '18 / 28'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric1Value: e.target.value, secondaryValue: e.target.value })}
                        placeholder="e.g. 18 / 28"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 2 (EV Fast Chargers):</label>
                      <input
                        type="text"
                        value={editingNode.metric2Value ?? '4 Active'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric2Value: e.target.value })}
                        placeholder="e.g. 4 Active"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 3 (Occupancy):</label>
                      <input
                        type="text"
                        value={editingNode.metric3Value ?? '64%'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric3Value: e.target.value })}
                        placeholder="e.g. 64%"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 4 (Gate Status):</label>
                      <input
                        type="text"
                        value={editingNode.metric4Value ?? 'OPEN'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric4Value: e.target.value })}
                        placeholder="e.g. OPEN"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                ) : editingNode.type === 'waste' ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 1 (Fill Level):</label>
                      <input
                        type="text"
                        value={editingNode.metric1Value ?? '38%'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric1Value: e.target.value, secondaryValue: e.target.value })}
                        placeholder="e.g. 38%"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 2 (Bin Weight):</label>
                      <input
                        type="text"
                        value={editingNode.metric2Value ?? '14 kg'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric2Value: e.target.value })}
                        placeholder="e.g. 14 kg"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 3 (Odor / VOC):</label>
                      <input
                        type="text"
                        value={editingNode.metric3Value ?? 'Clean'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric3Value: e.target.value })}
                        placeholder="e.g. Clean"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Metric 4 (Pickup Route):</label>
                      <input
                        type="text"
                        value={editingNode.metric4Value ?? 'Scheduled'}
                        onChange={(e) => setEditingNode({ ...editingNode, metric4Value: e.target.value })}
                        placeholder="e.g. Scheduled"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">PM2.5 (µg/m³):</label>
                      <input
                        type="number"
                        value={editingNode.pm25 ?? 25}
                        onChange={(e) => setEditingNode({ ...editingNode, pm25: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">PM10 (µg/m³):</label>
                      <input
                        type="number"
                        value={editingNode.pm10 ?? 45}
                        onChange={(e) => setEditingNode({ ...editingNode, pm10: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Temp (°C):</label>
                      <input
                        type="number"
                        value={editingNode.temp ?? 30}
                        onChange={(e) => setEditingNode({ ...editingNode, temp: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-stone-500 font-bold">Humidity (%):</label>
                      <input
                        type="number"
                        value={editingNode.humidity ?? 60}
                        onChange={(e) => setEditingNode({ ...editingNode, humidity: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#ece3d6] dark:border-[#151722] bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Position coordinates */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-slate-300">X Position (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingNode.xPct || 50}
                    onChange={(e) => setEditingNode({ ...editingNode, xPct: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-slate-300">Y Position (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingNode.yPct || 50}
                    onChange={(e) => setEditingNode({ ...editingNode, yPct: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                {editingNode.id && nodes.some((n) => n.id === editingNode.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (editingNode.id) {
                        handleDeleteNode(editingNode.id);
                        setShowNodeModal(false);
                      }
                    }}
                    className="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNodeModal(false)}
                  className="flex-1 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] font-bold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-md cursor-pointer transition-all"
                >
                  Save Pin & Telemetry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 7. DUAL-CHANNEL HARDWARE GATEWAY MODAL (LAN & WiFi) */}
      <IoTGatewayModal isOpen={showGatewayModal} onClose={() => setShowGatewayModal(false)} />
    </div>
  );
};

export default Campus3DTab;
