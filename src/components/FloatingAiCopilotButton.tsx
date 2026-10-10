'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DjangoApi, OrgCopilotResponse } from '@/services/api';
import {
  BrainCircuit,
  Sparkles,
  X,
  Send,
  Maximize2,
  RefreshCw,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  Hospital,
  Factory,
  GraduationCap,
  Landmark,
  Building2,
  Package,
  Layers,
} from 'lucide-react';
import { OrgCopilotModal } from '@/components/OrgCopilotModal';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  urgency?: string;
  domain?: string;
  immediate_actions?: string[];
  maintenance_steps?: string[];
  spare_parts?: string[];
}

const getOrgConfig = (type?: string) => {
  switch (type?.toUpperCase()) {
    case 'HOSPITAL':
      return {
        label: 'Hospital Healthcare Complex',
        badge: '🏥 Critical Healthcare Utility (Zero-Downtime)',
        icon: Hospital,
        color: 'border-rose-500/40 text-rose-300 bg-rose-500/15',
        quickPills: [
          'ICU cleanroom positive pressure & AHU status',
          'Hospital STP treated water & autoclave reuse',
          'Backup chiller & emergency power ATS busbar',
          'Biomedical waste autoclave temperature check'
        ]
      };
    case 'INDUSTRY':
      return {
        label: 'Industrial Manufacturing Complex',
        badge: '🏭 Industrial Safety & Reliability (ISO 10816)',
        icon: Factory,
        color: 'border-amber-500/40 text-amber-300 bg-amber-500/15',
        quickPills: [
          'ISO 10816 vibration limit check for slurry pumps',
          '415V substation harmonic distortion & APFC',
          'Effluent treatment plant (ETP) COD/BOD discharge',
          'OSHA Lockout/Tagout (LOTO) maintenance protocol'
        ]
      };
    case 'PSU':
    case 'MUNICIPAL':
      return {
        label: 'PSU / Civic Infrastructure Hub',
        badge: '🏛️ Civic Infrastructure & CPCB ESG Standards',
        icon: Landmark,
        color: 'border-blue-500/40 text-blue-300 bg-blue-500/15',
        quickPills: [
          'CPCB CAAQMS real-time air quality report',
          'Municipal STP secondary effluent water quality',
          'Smart waste bin route dispatch & RFID logs',
          'Public EV fleet solar charging load analysis'
        ]
      };
    case 'COMMERCIAL':
      return {
        label: 'Commercial IT & Business Park',
        badge: '🏬 Tenant IAQ & Smart Building Efficiency (ASHRAE)',
        icon: Building2,
        color: 'border-purple-500/40 text-purple-300 bg-purple-500/15',
        quickPills: [
          'Indoor CO2 & ASHRAE 62.1 ventilation check',
          'Chiller plant COP & cooling tower approach',
          'Tenant sub-metered power consumption',
          'Basement sump water pumping status'
        ]
      };
    case 'COLLEGE':
    default:
      return {
        label: 'College & University Campus',
        badge: '🎓 Campus Safety & Sustainability Advisor',
        icon: GraduationCap,
        color: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/15',
        quickPills: [
          'How can we improve campus STP water recycling?',
          'Analyze rooftop solar PV generation & power factor',
          'Check ambient AQI & classroom ventilation',
          'Water sump level and hostel pumping schedule'
        ]
      };
  }
};

/** Formats simple markdown into styled HTML elements without external bulky dependencies */
const renderMarkdown = (content: string) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header ###
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold text-cyan-300 pt-1.5 pb-0.5 border-b border-slate-800">
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-xs font-extrabold text-cyan-200 pt-2 pb-0.5 border-b border-slate-700">
              {trimmed.replace(/^##\s+/, '')}
            </h3>
          );
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.replace(/^[-*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 text-[11px] text-slate-300">
              <span className="text-cyan-400 font-bold mt-0.5">•</span>
              <div>{renderInlineFormatting(itemText)}</div>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 text-[11px] text-slate-300">
              <span className="text-cyan-400 font-mono font-bold mt-0.5">{numMatch[1]}.</span>
              <div>{renderInlineFormatting(numMatch[2])}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="text-[11px] text-slate-300">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

const renderInlineFormatting = (text: string) => {
  // Replace bold **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Replace code `text`
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1 py-0.2 rounded bg-black/40 text-cyan-300 font-mono text-[10px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

export const FloatingAiCopilotButton: React.FC = () => {
  const { currentUser, isAuthReady, activeOrg } = useAuth();
  const pathname = usePathname();

  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const initialOrg = (activeOrg?.type as any) || 'COLLEGE';
  const [selectedOrg, setSelectedOrg] = useState<string>(initialOrg);

  const currentOrgConfig = getOrgConfig(activeOrg?.type || selectedOrg);
  const OrgIcon = currentOrgConfig.icon;

  const [userQuery, setUserQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync activeOrg when user switches organizations
  useEffect(() => {
    if (activeOrg?.type) {
      setSelectedOrg(activeOrg.type);
      setMessages([]); // Reset conversation when switching organization
    }
  }, [activeOrg?.type, activeOrg?.id]);

  // Initial welcome message when widget is opened
  useEffect(() => {
    if (isWidgetOpen && messages.length === 0) {
      const orgName = activeOrg?.name || currentOrgConfig.label;
      setMessages([
        {
          id: 'welcome',
          sender: 'copilot',
          text: `👋 Hello! I am **EcoCopilot**, the unified AI technical advisor for **${orgName}**.\n\nI cover all facility infrastructure across our estate:\n- 💧 **Water & STP Recycling** (MBR pumps, sumps, reuse loops, pH/TDS purity)\n- ⚡ **Energy & Rooftop Solar** (11kV substation, grid load, power factor, DG backup)\n- 🍃 **Air Quality & CPCB** (CAAQMS sensors, PM2.5/PM10, compliance)\n- 🗑️ **Smart Waste Logistics** (RFID bins, wet/dry segregation, composting)\n- ❄️ **HVAC & Chillers** (cooling loops, AHU air filtration, thermal comfort)\n- 🛠️ **Preventive Maintenance** (ISO 10816 vibration limits, motor health, spares)\n\nAsk me any question about water, energy, or any infrastructure for this organization!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  }, [isWidgetOpen, activeOrg?.name, currentOrgConfig.label, messages.length]);

  // Scroll to bottom on each new message or status change
  useEffect(() => {
    if (isWidgetOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isWidgetOpen]);

  // Hidden for unauthenticated users and on login page
  if (!isAuthReady || !currentUser || pathname === '/login') {
    return null;
  }

  const handleSendMessage = async (overrideQuery?: string) => {
    const textToSend = (overrideQuery || userQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserQuery('');
    setIsLoading(true);

    try {
      const res = await DjangoApi.queryOrgCopilot({
        org_type: selectedOrg,
        cluster: 'ALL',
        sensor_telemetry: {},
        user_query: textToSend,
        org_name: activeOrg?.name || `EcoEstate ${selectedOrg} Campus`
      });

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'copilot',
        text: res.answer || 'Diagnostic evaluation completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgency: res.urgency,
        domain: (res as any).domain,
        immediate_actions: res.immediate_actions,
        maintenance_steps: res.maintenance_steps,
        spare_parts: res.spare_parts
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Diagnosis error', err);
      const errMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'copilot',
        text: '⚠️ Unable to complete AI evaluation. Please verify network connectivity or backend server status.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgency: 'WARNING'
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWidget = () => {
    setIsWidgetOpen(!isWidgetOpen);
  };

  return (
    <>
      {/* 1. Sleek Compact Floating Window (Bottom-Right Docked, Small Size) */}
      {isWidgetOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[430px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[84vh] rounded-3xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 backdrop-blur-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100">
          
          {/* Top Header */}
          <div className="px-4 py-3 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/30">
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold tracking-tight text-white">
                    EcoCopilot
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Groq Engine Active" />
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[210px]">
                  {activeOrg?.name || currentOrgConfig.label}
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsWidgetOpen(false);
                  setIsFullScreenOpen(true);
                }}
                title="Expand to Full Screen View"
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsWidgetOpen(false)}
                title="Minimize EcoCopilot"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Facility Header Badge (Unified for this Organization) */}
          <div className="px-3.5 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Facility:</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${currentOrgConfig.color}`}>
                <OrgIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate max-w-[210px]">{activeOrg?.name || currentOrgConfig.label}</span>
              </span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
              {selectedOrg}
            </span>
          </div>

          {/* Scrollable Chat Conversation Thread */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs no-scrollbar">
            
            {/* Quick Suggestion Pills */}
            {messages.length <= 2 && (
              <div className="space-y-1.5 pb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Suggested Inquiries:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentOrgConfig.quickPills.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      disabled={isLoading}
                      className="text-left text-[11px] px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-300 border border-slate-700/70 hover:border-cyan-500/50 hover:text-cyan-200 transition disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-in fade-in duration-200`}
                >
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 max-w-[92%] shadow-md ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm text-xs'
                        : 'bg-slate-950/90 border border-slate-800/90 text-slate-200 rounded-tl-sm text-xs space-y-2'
                    }`}
                  >
                    {/* Urgency Badge for Copilot */}
                    {!isUser && msg.urgency && msg.urgency !== 'NORMAL' && (
                      <div
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          msg.urgency === 'EMERGENCY'
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-500/50'
                            : msg.urgency === 'CRITICAL'
                            ? 'bg-red-950/70 text-red-300 border border-red-500/50'
                            : 'bg-amber-950/70 text-amber-300 border border-amber-500/50'
                        }`}
                      >
                        {msg.urgency === 'EMERGENCY' ? (
                          <AlertOctagon className="w-3 h-3 text-rose-400 animate-pulse" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                        )}
                        <span>{msg.urgency} STATUS</span>
                      </div>
                    )}

                    {/* Message Body */}
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    ) : (
                      renderMarkdown(msg.text)
                    )}

                    {/* Immediate Actions or Recommendations if present */}
                    {!isUser && msg.immediate_actions && msg.immediate_actions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-rose-400" /> Recommended Actions:
                        </span>
                        <ul className="space-y-1 pl-1">
                          {msg.immediate_actions.slice(0, 3).map((act, i) => (
                            <li key={i} className="text-[11px] text-rose-200/90 flex items-start gap-1.5">
                              <span className="text-rose-400 font-bold">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Maintenance Steps if present */}
                    {!isUser && msg.maintenance_steps && msg.maintenance_steps.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-cyan-400" /> Maintenance Protocol:
                        </span>
                        <ul className="space-y-1 pl-1">
                          {msg.maintenance_steps.slice(0, 3).map((st, i) => (
                            <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                              <span className="text-cyan-400 font-bold font-mono">{i + 1}.</span>
                              <span>{st}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Spare Parts if present */}
                    {!isUser && msg.spare_parts && msg.spare_parts.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <Package className="w-3 h-3 text-emerald-400" /> Required Spares / Tools:
                        </span>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {msg.spare_parts.map((p, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                  <span className="text-[9px] text-slate-500 px-1 font-mono">{msg.timestamp}</span>
                </div>
              );
            })}

            {/* Loading / Reasoning Bubble */}
            {isLoading && (
              <div className="flex items-start gap-2 animate-in fade-in duration-150">
                <div className="p-3 rounded-2xl rounded-tl-sm bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-cyan-300 text-xs shadow-md">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>EcoCopilot reasoning via Groq Engine...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Compact Bottom Input Bar */}
          <div className="p-3 bg-slate-950/95 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder={`Ask EcoCopilot about water, energy, or anything (${selectedOrg})...`}
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && userQuery.trim() && !isLoading) {
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              disabled={isLoading || !userQuery.trim()}
              onClick={() => handleSendMessage()}
              className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-40 cursor-pointer shadow-md shadow-cyan-600/30"
              title="Send to EcoCopilot"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* 2. Main Persistent Floating Button on Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        
        {/* Hover / Tooltip Tag */}
        {isHovered && !isWidgetOpen && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 text-xs font-semibold text-cyan-300 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-right-2 duration-200">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>EcoCopilot • Unified AI</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[10px] text-cyan-300 font-mono font-bold">
              {selectedOrg}
            </span>
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={handleToggleWidget}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title="Toggle EcoCopilot Assistant"
          className="group relative flex items-center gap-2.5 pl-3.5 pr-4 py-3 rounded-full bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-2xl shadow-cyan-500/40 border border-cyan-400/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xl"
          aria-label="Toggle EcoCopilot"
        >
          {/* Ambient Outer Glow Effect */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 opacity-40 blur-md group-hover:opacity-75 transition-opacity -z-10 animate-pulse" />

          {/* Icon with glowing badge */}
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/15 border border-white/20">
            <BrainCircuit className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
          </div>

          {/* Label & Status */}
          <div className="flex flex-col text-left leading-none">
            <span className="text-[13px] font-extrabold tracking-wide text-white drop-shadow">
              EcoCopilot
            </span>
            <span className="text-[9px] text-cyan-200 font-mono font-semibold tracking-wider flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              {selectedOrg}
            </span>
          </div>
        </button>
      </div>

      {/* 3. Optional Full Screen Modal (Opened only when user clicks the Maximize icon) */}
      <OrgCopilotModal
        isOpen={isFullScreenOpen}
        onClose={() => setIsFullScreenOpen(false)}
        initialOrgType={selectedOrg as any}
      />
    </>
  );
};
