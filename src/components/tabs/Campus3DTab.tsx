'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Layers,
  Sparkles,
  Upload,
  PlusCircle,
  Trash2,
  Edit3,
  Move,
  CheckCircle2,
  RefreshCw,
  Compass,
  Maximize2,
  Sliders,
  Calendar,
  Clock,
  Wind,
  Droplets,
  Zap,
  Activity,
  X,
  Camera,
  ZoomIn,
  ZoomOut,
  MousePointer,
  Hand,
  Check,
  Network,
  Wifi,
  Radio,
} from 'lucide-react';
import IoTGatewayModal from '@/components/IoTGatewayModal';
import { DjangoApi } from '@/services/api';

export interface CampusNode {
  id: string;
  name: string;
  locationLabel: string;
  type: 'aqi' | 'water' | 'energy' | 'weather' | 'general';
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
        id: 'node-gate',
        name: 'Main Campus Entrance Gate',
        locationLabel: 'At Main Gate',
        type: 'aqi',
        interfaceType: 'WIFI',
        xPct: 55.5,
        yPct: 84.0,
        stemHeightPx: 55,
        pm25: 20,
        pm10: 40,
        temp: 33,
        humidity: 47,
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
        pm25: 60,
        pm10: 91,
        temp: 21,
        humidity: 99,
        status: 'moderate',
      },
      {
        id: 'node-academic',
        name: 'Central Academic Block & Computer Science Labs',
        locationLabel: 'Behind Academic Wing',
        type: 'aqi',
        interfaceType: 'WIFI',
        xPct: 38.0,
        yPct: 55.0,
        stemHeightPx: 65,
        pm25: 25,
        pm10: 51,
        temp: 30,
        humidity: 86,
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
        pm25: 22,
        pm10: 35,
        temp: 38,
        humidity: 69,
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
        status: 'optimal',
      },
      {
        id: 'node-guest',
        name: 'Executive Guest House & Faculty Quarters',
        locationLabel: 'at guest house',
        type: 'aqi',
        interfaceType: 'WIFI',
        xPct: 58.0,
        yPct: 40.0,
        stemHeightPx: 60,
        pm25: 29,
        pm10: 46,
        temp: 29,
        humidity: 65,
        status: 'optimal',
      },
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
        id: 'node-hostel',
        name: 'Student Residential Hostels',
        locationLabel: 'In OBH',
        type: 'aqi',
        interfaceType: 'WIFI',
        xPct: 83.0,
        yPct: 32.0,
        stemHeightPx: 65,
        pm25: 30,
        pm10: 38,
        temp: 31,
        humidity: 64,
        status: 'optimal',
      },
    ];
  };

  const [nodes, setNodes] = useState<CampusNode[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`ecoestate-campus-nodes-${orgKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          // fallback
        }
      }
    }
    return generateAutoNodes(activeOrg?.type === 'HOSPITAL');
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
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'aqi' | 'water' | 'energy' | 'weather'>('ALL');
  const [showPm25, setShowPm25] = useState(true);
  const [showPm10, setShowPm10] = useState(true);
  const [showTemp, setShowTemp] = useState(true);
  const [showHumidity, setShowHumidity] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

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
    } else if (draggingNodeId && canvasRef.current) {
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
  }, [isPanning, panStart, draggingNodeId]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  // Click on Canvas to add or calibrate a point
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
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
    return n.type === activeFilter;
  });

  return (
    <div className="space-y-3.5 animate-in fade-in duration-300 select-none pb-12">
      {/* 1. TOP CONTROL BAR (Compact, responsive, aligned with reference photo) */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Branding & Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h1 className="font-black text-sm sm:text-base text-stone-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span className="text-cyan-600 dark:text-cyan-400 font-mono">:::</span> {activeOrg?.name || 'Smart Campus'}
            </h1>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f5efe6] dark:bg-[#0a0b12] text-cyan-700 dark:text-cyan-400 border border-[#ece3d6] dark:border-[#151722]">
            Spatial 3D Mesh
          </span>
          <span className="text-[11px] text-stone-400 dark:text-slate-500 hidden sm:inline">
            • {nodes.length} Nodes Online
          </span>
        </div>

        {/* Center: Timeline Scrubber & Parameter Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Time Scrubber */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#f8f5ee] dark:bg-[#0a0b12] border border-[#ece3d6] dark:border-[#151722]">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono font-bold text-stone-900 dark:text-white min-w-[38px] text-[11px]">
              {String(timelineHour).padStart(2, '0')}:00
            </span>
            <input
              type="range"
              min="0"
              max="23"
              value={timelineHour}
              onChange={(e) => setTimelineHour(Number(e.target.value))}
              className="w-20 sm:w-24 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Metric Parameter Toggles */}
          <div className="flex items-center gap-1 bg-[#f8f5ee] dark:bg-[#0a0b12] p-1 rounded-xl border border-[#ece3d6] dark:border-[#151722] text-[11px] font-bold">
            <button
              onClick={() => setShowPm25(!showPm25)}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                showPm25 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold' : 'text-stone-400'
              }`}
            >
              PM2.5
            </button>
            <button
              onClick={() => setShowPm10(!showPm10)}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                showPm10 ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-extrabold' : 'text-stone-400'
              }`}
            >
              PM10
            </button>
            <button
              onClick={() => setShowTemp(!showTemp)}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                showTemp ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-stone-400'
              }`}
            >
              Temp
            </button>
            <button
              onClick={() => setShowHumidity(!showHumidity)}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                showHumidity ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold' : 'text-stone-400'
              }`}
            >
              Humidity
            </button>
          </div>
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

          {/* Add / Move Mode Indicator */}
          <button
            onClick={() => setIsCalibrateMode(!isCalibrateMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isCalibrateMode
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md animate-pulse'
                : 'border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-700 dark:text-slate-300 hover:border-amber-500'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>{isCalibrateMode ? 'Drag Pins to Position' : 'Move / Edit Pins'}</span>
          </button>

          {/* Import Custom Campus Image */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-1.5 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-700 dark:text-slate-300 hover:border-cyan-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-500" />
            <span>Import Image</span>
          </button>

          {/* 3D Depth Toggle */}
          <button
            onClick={() => {
              const next3D = !is3DMode;
              setIs3DMode(next3D);
              setTiltPitch(next3D ? 16 : 0);
            }}
            className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              is3DMode
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                : 'border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-600 dark:text-slate-400'
            }`}
            title="Toggle 3D Depth Elevation"
          >
            <Compass className={`w-4 h-4 ${is3DMode ? 'rotate-45 text-cyan-500' : ''}`} />
            <span className="text-[10px] hidden sm:inline">{is3DMode ? '3D Tilt' : 'Upright'}</span>
          </button>
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

        {/* Calibration Helper Banner */}
        {isCalibrateMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-extrabold text-xs shadow-2xl flex items-center gap-2">
            <Move className="w-4 h-4 animate-bounce" />
            <span>Click & drag any yellow pin to reposition. Double-click anywhere to add a new sensor pin!</span>
            <button
              onClick={() => setIsCalibrateMode(false)}
              className="ml-2 px-2 py-0.5 rounded bg-slate-950 text-white font-mono text-[10px] cursor-pointer"
            >
              Done
            </button>
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
            const hourDelta = Math.sin((timelineHour / 24) * Math.PI) * 10;
            const currentPm25 = Math.round(node.pm25 + hourDelta);
            const currentPm10 = Math.round(node.pm10 + hourDelta * 1.4);
            const currentTemp = Math.round(node.temp + (hourDelta > 0 ? 3 : -2));
            const currentHumidity = Math.round(node.humidity - (hourDelta > 0 ? 8 : -5));

            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: `${node.xPct}%`,
                  top: `${node.yPct}%`,
                  transform: 'translate(-50%, -100%)',
                  transformStyle: 'preserve-3d',
                  zIndex: isDragging ? 100 : isSelected ? 80 : 30,
                }}
                className="group flex flex-col items-center pointer-events-auto"
              >
                {/* 1. FLOATING TELEMETRY HUD CARD (Exact style of reference screenshot) */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                  }}
                  className={`p-2.5 rounded-2xl bg-[#07080e]/95 backdrop-blur-md border shadow-2xl transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
                      : 'border-stone-800 hover:border-amber-400'
                  }`}
                  style={{ minWidth: '150px' }}
                >
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono font-bold leading-tight">
                    {/* Top Ingestion Channel Badge */}
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
                      <span className="text-stone-400 font-sans">{node.status.toUpperCase()}</span>
                    </div>

                    {/* Row 1: PM2.5 (Amber) & PM10 (Cyan) */}
                    {showPm25 && (
                      <div className="flex items-center gap-1 text-amber-400">
                        <span className="text-[12px]">☁️</span>
                        <span>{currentPm25} <span className="text-[9px] text-amber-500/70 font-normal">µg/m³</span></span>
                      </div>
                    )}
                    {showPm10 && (
                      <div className="flex items-center gap-1 text-cyan-400">
                        <span className="text-[12px]">☁️</span>
                        <span>{currentPm10} <span className="text-[9px] text-cyan-500/70 font-normal">µg/m³</span></span>
                      </div>
                    )}

                    {/* Row 2: Temp (Green) & Humidity (Blue) */}
                    {showTemp && (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <span className="text-[12px]">🌡️</span>
                        <span>{currentTemp} <span className="text-[9px] text-emerald-500/70 font-normal">°C</span></span>
                      </div>
                    )}
                    {showHumidity && (
                      <div className="flex items-center gap-1 text-blue-400">
                        <span className="text-[12px]">💧</span>
                        <span>{currentHumidity} <span className="text-[9px] text-blue-500/70 font-normal">%</span></span>
                      </div>
                    )}

                    {/* Secondary Value if specialized node */}
                    {node.secondaryLabel && (
                      <div className="col-span-2 pt-1 border-t border-white/10 flex justify-between text-[10px] text-purple-300">
                        <span>{node.secondaryLabel}:</span>
                        <span className="text-white font-bold">{node.secondaryValue}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. VERTICAL LEADER STEM LINE (Connecting card to pinpoint) */}
                <div
                  style={{ height: `${node.stemHeightPx || 65}px` }}
                  className="w-0.5 bg-gradient-to-b from-amber-400 to-amber-500 shadow-[0_0_8px_#f59e0b] relative"
                />

                {/* 3. PINPOINT GROUND BEACON (Yellow Dot with Glowing Halo - Drag Target) */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingNodeId(node.id);
                    setSelectedNode(node);
                  }}
                  className="relative flex items-center justify-center cursor-move p-1"
                  title="Click & drag to move this sensor pin"
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_15px_#f59e0b] ${
                    isDragging ? 'bg-cyan-400 scale-125' : 'bg-amber-400'
                  }`} />
                  <span className="absolute w-7 h-7 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
                </div>

                {/* 4. LOCATION LABEL PILL (Directly below pinpoint: e.g. "At Main Gate") */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                  }}
                  className="mt-1 px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-[#07080e]/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white font-bold text-[10px] shadow-lg whitespace-nowrap cursor-pointer hover:border-amber-400"
                >
                  {node.locationLabel}
                </div>

                {/* Quick Edit/Delete buttons on hover/select */}
                {(isSelected || isCalibrateMode) && (
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
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white text-base font-bold"
              >
                ✕
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#07080e] border border-[#ece3d6] dark:border-[#151722] shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#ece3d6] dark:border-[#151722]">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                  Configure Campus Sensor Pin
                </h3>
              </div>
              <button
                onClick={() => setShowNodeModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNode} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-slate-300">Sensor Facility Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Library entrance or At Main Gate"
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
                  placeholder="e.g. At Main Gate, Near Library entrance, Behind KRB"
                  value={editingNode.locationLabel || ''}
                  onChange={(e) => setEditingNode({ ...editingNode, locationLabel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 dark:text-slate-300">Sensor Type:</label>
                  <select
                    value={editingNode.type || 'aqi'}
                    onChange={(e) => setEditingNode({ ...editingNode, type: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] bg-[#f8f5ee] dark:bg-[#0a0b12] text-stone-900 dark:text-white"
                  >
                    <option value="aqi">Air Quality (AQI)</option>
                    <option value="water">Water & STP Pump</option>
                    <option value="energy">Power & Solar Array</option>
                    <option value="weather">Weather & Sports Area</option>
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

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNodeModal(false)}
                  className="flex-1 py-2 rounded-xl border border-[#ece3d6] dark:border-[#151722] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-md"
                >
                  Save Pin
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
