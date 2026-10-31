'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sun, 
  Users, 
  Camera, 
  UploadCloud, 
  ExternalLink, 
  ChevronDown, 
  Clock, 
  Eye, 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Calendar,
  X,
  Download,
  Maximize2,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ArrowRight,
  Video,
  Layers,
  AlertCircle
} from 'lucide-react';

interface UserOverviewViewProps {
  user: any;
  customer?: any;
  cameras: any[];
  dbAlerts: any[];
  dbPlans?: any[];
  isTrialUser?: boolean;
  maxAllowedCameras?: number;
  onNavigateTab: (tab: any) => void;
  onOpenAddCamera: () => void;
  onOpenInviteUser?: () => void;
}

export default function UserOverviewView({
  user,
  customer,
  cameras = [],
  dbAlerts = [],
  dbPlans = [],
  isTrialUser = false,
  maxAllowedCameras,
  onNavigateTab,
  onOpenAddCamera,
  onOpenInviteUser
}: UserOverviewViewProps) {
  // 1. Role & Plan Recognition
  const isDemo = user?.role === 'demo' || isTrialUser;
  const effectiveMaxCameras = maxAllowedCameras !== undefined 
    ? maxAllowedCameras 
    : (customer?.cameras !== undefined ? customer.cameras : (isDemo ? 1 : 5));

  // 2. Live Realtime Clock
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format date with ordinal suffix (e.g. 31st October 2026)
  const getFormattedDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();

    const suffix = (d: number) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    return `${day}${suffix(day)} ${month} ${year}`;
  };

  // 3. Real Dynamic Statistics Calculations
  const totalCamerasCount = cameras.length;
  const activeCamerasCount = cameras.filter(c => c.status !== 'OFFLINE' && c.status !== 'INACTIVE').length;
  const inactiveCamerasCount = Math.max(0, totalCamerasCount - activeCamerasCount);
  
  const activePercentage = totalCamerasCount > 0 
    ? Math.round((activeCamerasCount / totalCamerasCount) * 100) 
    : 0;
  const inactivePercentage = totalCamerasCount > 0 
    ? 100 - activePercentage 
    : 0;

  const totalAlertsCount = dbAlerts.length;
  const highAlertsCount = dbAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
  const newAlertsCount = dbAlerts.filter(a => a.status === 'NEW').length;

  const incidentSnapshots = useMemo(() => {
    return dbAlerts
      .filter(a => a.imageUrl && typeof a.imageUrl === 'string' && a.imageUrl.trim() !== '')
      .slice(0, 4);
  }, [dbAlerts]);

  // 4. Dynamic AI Security Detection Activity Chart (Yearly / Monthly / Weekly)
  const [chartTimeframe, setChartTimeframe] = useState<'Yearly' | 'Monthly' | 'Weekly'>('Yearly');
  const [timeframeDropdownOpen, setTimeframeDropdownOpen] = useState(false);

  const activeChartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();

    if (chartTimeframe === 'Yearly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((month, idx) => {
        const count = dbAlerts.filter(a => {
          if (!a.timestamp) return false;
          const d = new Date(a.timestamp);
          return d.getFullYear() === currentYear && d.getMonth() === idx;
        }).length;
        return {
          label: month,
          value: count,
          isCurrent: idx === currentMonthIdx,
        };
      });
    } else if (chartTimeframe === 'Monthly') {
      const currentDay = now.getDate();
      const currentWeek = Math.min(Math.floor((currentDay - 1) / 7) + 1, 4);
      return [1, 2, 3, 4].map(week => {
        const count = dbAlerts.filter(a => {
          if (!a.timestamp) return false;
          const d = new Date(a.timestamp);
          if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonthIdx) return false;
          const day = d.getDate();
          return Math.min(Math.floor((day - 1) / 7) + 1, 4) === week;
        }).length;
        return {
          label: `Wk ${week}`,
          value: count,
          isCurrent: week === currentWeek,
        };
      });
    } else {
      // Weekly: Last 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        const count = dbAlerts.filter(a => {
          if (!a.timestamp) return false;
          const alertDate = new Date(a.timestamp);
          return alertDate.toDateString() === d.toDateString();
        }).length;
        return {
          label: dayLabel,
          value: count,
          isCurrent: i === 6,
        };
      });
    }
  }, [chartTimeframe, dbAlerts]);

  // Chart coordinates mapping (SVG viewBox 0 0 700 240)
  const svgWidth = 700;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 35;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const highestAlertCount = Math.max(...activeChartData.map(d => d.value), 0);
  const maxValue = highestAlertCount > 0 ? Math.max(10, Math.ceil(highestAlertCount * 1.25)) : 10;

  const points = activeChartData.map((d, index) => {
    const x = paddingLeft + (index / (activeChartData.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - (d.value / maxValue) * plotHeight;
    return { x, y, label: d.label, value: d.value, isCurrent: d.isCurrent };
  });

  const defaultHoverIdx = useMemo(() => {
    const curIdx = points.findIndex(p => p.isCurrent);
    return curIdx >= 0 ? curIdx : points.length - 1;
  }, [points]);

  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const chartSvgRef = useRef<SVGSVGElement>(null);

  // Generate smooth cubic bezier SVG path
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = generateSmoothPath(points);
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`
    : '';

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoveredPointIndex(closestIdx);
  };

  const activeHoverIdx = hoveredPointIndex !== null ? hoveredPointIndex : defaultHoverIdx;
  const activePoint = points[activeHoverIdx] || points[0];

  // 5. Camera Status Gauge Dropdown State
  const [cameraStatusPeriod, setCameraStatusPeriod] = useState<'Today' | 'Weekly' | 'Monthly'>('Today');
  const [cameraStatusDropdownOpen, setCameraStatusDropdownOpen] = useState(false);

  // 6. Lightbox Preview Modal for Incident Snapshots
  const [selectedUploadPreview, setSelectedUploadPreview] = useState<any | null>(null);

  // Circumference for Donut Chart with radius 70: 2 * PI * 70 = 439.82
  const circumference = 439.82;
  const activeDashOffset = totalCamerasCount > 0 
    ? circumference * (1 - (activePercentage / 100)) 
    : circumference;
  const inactiveDashOffset = totalCamerasCount > 0 
    ? circumference * (1 - (inactivePercentage / 100)) 
    : circumference;

  return (
    <div className="space-y-6 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. DEMO TRIAL / RESTRICTION NOTIFICATION BANNER */}
      {/* ========================================================================= */}
      {isDemo && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/20 animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Free Trial Mode Active (Demo Free)</span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  {totalCamerasCount}/{effectiveMaxCameras} Camera Node Active
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Your demo workspace is connected to verified live database records. Upgrade to Enterprise to unlock multi-camera grid and custom zones.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('subscription_detail')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs transition-all cursor-pointer shrink-0 shadow-md flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-black" />
            <span>Upgrade to Enterprise</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DASHBOARD OVERVIEW HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dashboard Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
              {isDemo ? 'Demo Evaluation' : (customer?.plan || 'Enterprise Live')}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            {isDemo
              ? 'Real-time surveillance metrics, camera stream health, and trial AI detection logs.'
              : 'Live surveillance intelligence, camera stream health, and real-time AI safety violations.'}
          </p>
        </div>

        {/* Header Right Status Pill */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#181926] border border-[#27293d] text-xs font-medium text-slate-300 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${totalCamerasCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-mono font-semibold">
              {totalCamerasCount > 0 ? `${activeCamerasCount}/${totalCamerasCount} Feeds Online` : 'No Cameras Connected'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOP ROW KPI CARDS (4 CARDS GRID) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: Live Realtime Surveillance Clock */}
        <div className="relative rounded-2xl bg-gradient-to-br from-[#c85a2b] via-[#ba5025] to-[#993b16] p-5.5 text-white shadow-xl shadow-orange-950/20 overflow-hidden flex flex-col justify-between min-h-[150px]">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="flex items-start gap-3.5 relative z-10">
            <div className="p-2 rounded-xl bg-white/15 text-white backdrop-blur-sm shrink-0 border border-white/20">
              <Sun className="w-5 h-5 text-amber-200" />
            </div>
            <div className="flex flex-col">
              <div className="text-2xl sm:text-2xl font-black tracking-tight font-mono">
                {currentTime ? currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) : '--:--:--'}
              </div>
              <span className="text-xs text-orange-100 font-medium tracking-wide">
                Surveillance Clock
              </span>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/20 mt-4">
            <div className="text-xs text-orange-100/90 font-medium">
              Today:
            </div>
            <div className="text-sm font-bold text-white tracking-wide">
              {currentTime ? getFormattedDate(currentTime) : 'Real-time Active'}
            </div>
          </div>
        </div>

        {/* CARD 2: Total AI Safety Alerts */}
        <div className="rounded-2xl bg-[#181926] border border-[#27293d] p-5.5 shadow-lg flex flex-col justify-between min-h-[150px] hover:border-[#383b56] transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#2b171c] text-[#f43f5e] flex items-center justify-center border border-[#4c1d27]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Verified Database
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">AI Safety Alerts</p>
              <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">
                {totalAlertsCount}
              </h2>
            </div>
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              highAlertsCount > 0 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              <span>{highAlertsCount > 0 ? `${highAlertsCount} High Priority` : 'All Clear'}</span>
            </div>
          </div>
        </div>

        {/* CARD 3: Total Connected CCTV Cameras */}
        <div className="rounded-2xl bg-[#181926] border border-[#27293d] p-5.5 shadow-lg flex flex-col justify-between min-h-[150px] hover:border-[#383b56] transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#362719] text-[#f59e0b] flex items-center justify-center border border-[#4d3622]">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Plan Limit: {effectiveMaxCameras}
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Connected Cameras</p>
              <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">
                {totalCamerasCount}
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#143023] text-[#22c55e] border border-[#22c55e]/30">
              <span>{totalCamerasCount}/{effectiveMaxCameras} Allocated</span>
            </div>
          </div>
        </div>

        {/* CARD 4: Visual Incident Snapshots */}
        <div className="rounded-2xl bg-[#181926] border border-[#27293d] p-5.5 shadow-lg flex flex-col justify-between min-h-[150px] hover:border-[#383b56] transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#1a3327] text-[#10b981] flex items-center justify-center border border-[#234937]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-400 font-medium">
              AI Evidence
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Incident Snapshots</p>
              <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">
                {dbAlerts.filter(a => a.imageUrl && a.imageUrl.trim() !== '').length}
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#162a3f] text-[#38bdf8] border border-[#38bdf8]/30">
              <span>Cloud Archived</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. MIDDLE ROW (AI Activity Area Chart, Quick Action, Camera Status Gauge) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 4A: AI SAFETY VIOLATION DETECTION ACTIVITY CHART (Span 6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#181926] border border-[#27293d] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                AI Security Alert Activity
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregated safety violations from database records ({chartTimeframe})
              </p>
            </div>

            {/* Timeframe Dropdown */}
            <div className="relative">
              <button
                onClick={() => setTimeframeDropdownOpen(!timeframeDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202234] border border-[#2f334d] text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <span>{chartTimeframe}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {timeframeDropdownOpen && (
                <div className="absolute right-0 mt-1 w-28 rounded-xl bg-[#202234] border border-[#2f334d] shadow-xl py-1 z-30">
                  {(['Yearly', 'Monthly', 'Weekly'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setChartTimeframe(t);
                        setTimeframeDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="relative w-full overflow-hidden select-none">
            <svg
              ref={chartSvgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 cursor-crosshair overflow-visible"
              onMouseMove={handleChartMouseMove}
              onMouseLeave={() => setHoveredPointIndex(null)}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#ea580c" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
                </linearGradient>

                <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Horizontal Gridlines & Y-axis labels */}
              {[maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0].map((val) => {
                const y = paddingTop + plotHeight - (val / maxValue) * plotHeight;
                return (
                  <g key={val}>
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="#27293d"
                      strokeWidth="1"
                      strokeDasharray={val === 0 ? 'none' : '2,2'}
                    />
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

              {/* Smooth Orange Stroke Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="url(#lineGlow)"
                />
              )}

              {/* X-axis labels */}
              {points.map((p, idx) => (
                <text
                  key={idx}
                  x={p.x}
                  y={paddingTop + plotHeight + 20}
                  fill={activeHoverIdx === idx ? '#f97316' : '#64748b'}
                  fontSize="11"
                  fontWeight={activeHoverIdx === idx ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {p.label}
                </text>
              ))}

              {/* Active Hover Guideline & Indicator */}
              {activePoint && (
                <g>
                  <line
                    x1={activePoint.x}
                    y1={activePoint.y}
                    x2={activePoint.x}
                    y2={paddingTop + plotHeight}
                    stroke="#f97316"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />

                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="4.5"
                    fill="#f97316"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="animate-pulse"
                  />

                  {/* Tooltip Bubble */}
                  <g transform={`translate(${Math.min(svgWidth - 120, Math.max(paddingLeft + 10, activePoint.x - 55))}, ${Math.max(10, activePoint.y - 48)})`}>
                    <rect
                      x="0"
                      y="0"
                      width="110"
                      height="38"
                      rx="8"
                      fill="#12131d"
                      stroke="#2f3248"
                      strokeWidth="1"
                      className="shadow-xl"
                    />
                    <text x="55" y="15" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle">
                      {activePoint.label} ({chartTimeframe})
                    </text>
                    <text x="55" y="30" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                      {activePoint.value} Safety Alerts
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>

          {totalAlertsCount === 0 && (
            <div className="mt-2 text-center text-xs text-slate-400 py-1 border-t border-[#27293d]/60 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>No safety violations recorded in current timeframe. All security zones normal.</span>
            </div>
          )}
        </div>

        {/* 4B: QUICK OPERATIONAL ACTIONS (Span 3 cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-[#181926] border border-[#27293d] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight mb-1">
              Quick Operations
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Direct access to camera streams, zones, and notifications.
            </p>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            
            {/* Button 1: Add Camera */}
            <button
              onClick={onOpenAddCamera}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#543b18] bg-[#22180e]/60 hover:bg-[#332212] hover:border-[#7c5623] transition-all duration-200 group cursor-pointer text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3b2c1f] text-[#f59e0b] flex items-center justify-center border border-[#523d2b] group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-100 group-hover:text-white">
                  Add Camera
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>

            {/* Button 2: Live Camera Grid */}
            <button
              onClick={() => onNavigateTab('live_camera')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#26355d] bg-[#141829]/60 hover:bg-[#1b2342] hover:border-[#385194] transition-all duration-200 group cursor-pointer text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#202947] text-[#4d7cfe] flex items-center justify-center border border-[#2d3a68] group-hover:scale-105 transition-transform">
                  <Video className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-100 group-hover:text-white">
                  Live Camera Grid
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>

            {/* Button 3: Security Inspection Zones */}
            <button
              onClick={() => onNavigateTab('zones')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#1b4330] bg-[#102219]/60 hover:bg-[#183626] hover:border-[#286b4a] transition-all duration-200 group cursor-pointer text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1c372a] text-[#10b981] flex items-center justify-center border border-[#29543e] group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-100 group-hover:text-white">
                  Security Zones
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>

            {/* Button 4: Alert Incident Center */}
            <button
              onClick={() => onNavigateTab('notification')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#4c1d27] bg-[#241217]/60 hover:bg-[#381620] hover:border-[#732235] transition-all duration-200 group cursor-pointer text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3d1822] text-[#f43f5e] flex items-center justify-center border border-[#5c2131] group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-100 group-hover:text-white">
                  Alert Incident Center
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>

          </div>
        </div>

        {/* 4C: REAL CAMERA STREAM STATUS DONUT GAUGE (Span 3 cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-[#181926] border border-[#27293d] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Camera Status
            </h3>

            {/* Period indicator */}
            <span className="text-xs font-mono font-bold text-slate-400 bg-[#202234] px-2.5 py-1 rounded-lg border border-[#2f334d]">
              Live
            </span>
          </div>

          {/* Donut Chart SVG */}
          <div className="relative flex items-center justify-center py-2 select-none">
            <svg viewBox="0 0 200 200" className="w-48 h-48">
              {/* Background track circle */}
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#222538"
                strokeWidth="20"
              />

              {totalCamerasCount > 0 && inactiveCamerasCount > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="20"
                  strokeDasharray={circumference}
                  strokeDashoffset={inactiveDashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  className="transition-all duration-700"
                />
              )}

              {totalCamerasCount > 0 && activeCamerasCount > 0 && (
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="20"
                  strokeDasharray={circumference}
                  strokeDashoffset={activeDashOffset}
                  strokeLinecap="round"
                  transform="rotate(54 100 100)"
                  className="transition-all duration-700"
                />
              )}

              {/* Center Content */}
              <text x="100" y="93" fill="#94a3b8" fontSize="11" fontWeight="500" textAnchor="middle">
                Total Cameras
              </text>
              <text x="100" y="118" fill="#ffffff" fontSize="22" fontWeight="900" textAnchor="middle">
                {totalCamerasCount}
              </text>
            </svg>

            {/* Floating Active Cameras Badge */}
            <div className="absolute top-4 right-1 px-2.5 py-1 rounded-lg bg-[#141523] border border-[#2d304a] text-white text-[10px] font-bold shadow-lg flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${totalCamerasCount > 0 ? 'bg-[#22c55e]' : 'bg-slate-500'}`} />
              <span>
                {totalCamerasCount > 0 ? `${activePercentage}% Active Cameras` : '0 Cameras Registered'}
              </span>
            </div>
          </div>

          {/* Bottom Legend */}
          <div className="flex items-center justify-center gap-6 pt-2 border-t border-[#27293d]/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
              <span className="text-xs text-slate-300 font-medium">{activeCamerasCount} Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className="text-xs text-slate-300 font-medium">{inactiveCamerasCount} Offline</span>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM ROW (Real Incident Snapshots & Real Security Activity) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 5A: RECENT INCIDENT SNAPSHOTS STRIP (Span 6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#181926] border border-[#27293d] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Recent Incident Snapshots
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentic visual evidence frames captured by AI models
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('content')}
              className="text-xs font-bold text-[#f97316] hover:text-[#fb923c] transition-colors cursor-pointer"
            >
              View Gallery
            </button>
          </div>

          {/* Snapshots Strip */}
          {incidentSnapshots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {incidentSnapshots.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedUploadPreview({
                    title: item.message || 'Security Incident',
                    camera: item.cameraKey,
                    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: new Date(item.timestamp).toLocaleDateString(),
                    src: item.imageUrl,
                    severity: item.severity,
                    resolution: '1920x1080'
                  })}
                  className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-black/40 border border-[#2b2d42] cursor-pointer hover:border-orange-500/50 transition-all duration-200"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.message || 'Alert Frame'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                  <div className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 text-left">
                    <p className="text-[10px] font-bold text-white truncate leading-tight">
                      {item.cameraKey}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono truncate">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#2b304c] rounded-xl p-8 text-center space-y-2.5 my-auto">
              <div className="w-10 h-10 rounded-full bg-[#202538] text-slate-400 flex items-center justify-center mx-auto">
                <Camera className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-xs font-bold text-slate-200">
                No Cloud Evidence Photos Archived
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                Connect Google Drive or Microsoft OneDrive in Cloud Storage settings to automatically capture and archive visual photo evidence for security alarms.
              </p>
            </div>
          )}
        </div>

        {/* 5B: REAL RECENT SECURITY ACTIVITY FEED (Span 6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#181926] border border-[#27293d] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Recent Security Activity
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time event stream from active surveillance nodes
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('notification')}
              className="text-xs font-bold text-[#f97316] hover:text-[#fb923c] transition-colors cursor-pointer"
            >
              View All ({totalAlertsCount})
            </button>
          </div>

          {/* Activity items */}
          {dbAlerts.length > 0 ? (
            <div className="space-y-3">
              {dbAlerts.slice(0, 4).map((act) => {
                const isHigh = act.severity === 'CRITICAL' || act.severity === 'HIGH';
                return (
                  <div
                    key={act._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1d1f30]/60 border border-[#282b42] hover:bg-[#22253a] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        isHigh 
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' 
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {isHigh ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-100 truncate">
                          {act.message}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          Camera: <span className="font-mono text-slate-300">{act.cameraKey}</span> · {act.category || 'Zone Safety'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        isHigh ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {act.severity || 'HIGH'}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-[#2b304c] rounded-xl p-8 text-center space-y-2.5 my-auto">
              <div className="w-10 h-10 rounded-full bg-[#1c2e24] text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-xs font-bold text-slate-200">
                All Surveillance Systems Secure
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                No active safety violations or security breaches detected. AI algorithms are actively monitoring all connected camera streams.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. LIGHTBOX MODAL (FOR VIEWING REAL SNAPSHOTS) */}
      {/* ========================================================================= */}
      {selectedUploadPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#161826] border border-[#2b304c] rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b304c] bg-[#1a1d2e]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedUploadPreview.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Camera: {selectedUploadPreview.camera} · {selectedUploadPreview.time} ({selectedUploadPreview.date})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedUploadPreview.src}
                  download="cctv_snapshot.jpg"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedUploadPreview(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Image */}
            <div className="p-4 bg-black/60 flex items-center justify-center">
              <img
                src={selectedUploadPreview.src}
                alt={selectedUploadPreview.title}
                className="max-h-[65vh] w-auto rounded-lg object-contain border border-[#2b304c]"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#2b304c] bg-[#1a1d2e] flex items-center justify-between text-xs text-slate-400">
              <span>Severity: <strong className="text-rose-400">{selectedUploadPreview.severity || 'HIGH'}</strong></span>
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> High Definition Frame
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
