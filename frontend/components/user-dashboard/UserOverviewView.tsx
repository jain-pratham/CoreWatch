'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Maximize2
} from 'lucide-react';

interface UserOverviewViewProps {
  user: any;
  cameras: any[];
  dbAlerts: any[];
  onNavigateTab: (tab: any) => void;
  onOpenAddCamera: () => void;
  onOpenInviteUser: () => void;
}

export default function UserOverviewView({
  user,
  cameras,
  dbAlerts,
  onNavigateTab,
  onOpenAddCamera,
  onOpenInviteUser
}: UserOverviewViewProps) {
  // 1. Live Realtime Clock
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format date with ordinal suffix (e.g. 2nd August 2023 or 25th October 2026)
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

  // 2. Interactive Area Chart Data & Hover State
  const [chartTimeframe, setChartTimeframe] = useState<'Yearly' | 'Monthly' | 'Weekly'>('Yearly');
  const [timeframeDropdownOpen, setTimeframeDropdownOpen] = useState(false);

  const yearlyChartData = [
    { label: 'Jan', value: 80 },
    { label: 'Feb', value: 200 },
    { label: 'Mar', value: 160 },
    { label: 'Apr', value: 240 },
    { label: 'May', value: 400 },
    { label: 'Jun', value: 360 },
    { label: 'Jul', value: 480, highlight: true },
    { label: 'Aug', value: 450 },
    { label: 'Sep', value: 680 },
    { label: 'Oct', value: 640 },
    { label: 'Nov', value: 720 },
    { label: 'Dec', value: 760 },
  ];

  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(6); // Default highlight July as in image
  const chartSvgRef = useRef<SVGSVGElement>(null);

  // Chart coordinates mapping (SVG viewBox 0 0 700 240)
  const svgWidth = 700;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 35;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;
  const maxValue = 1000;

  const points = yearlyChartData.map((d, index) => {
    const x = paddingLeft + (index / (yearlyChartData.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - (d.value / maxValue) * plotHeight;
    return { x, y, label: d.label, value: d.value };
  });

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
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`;

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

  // 3. Camera Status Gauge Data & Dropdown
  const [cameraStatusPeriod, setCameraStatusPeriod] = useState<'Today' | 'Weekly' | 'Monthly'>('Today');
  const [cameraStatusDropdownOpen, setCameraStatusDropdownOpen] = useState(false);

  const totalCamerasCount = cameras.length > 0 ? cameras.length : 1180;
  const activePercentage = 60;
  const inactivePercentage = 40;

  // 4. Recent Uploads & Lightbox Preview
  const [uploadsTimeframe, setUploadsTimeframe] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [selectedUploadPreview, setSelectedUploadPreview] = useState<any | null>(null);

  const recentUploads = [
    {
      id: 'upl-1',
      title: 'Roof Deck Perimeter',
      camera: 'CAM 07 - ROOF NE',
      time: '13:48:15 UTC',
      date: 'Today',
      src: '/uploads/sky.jpg',
      fps: '30 FPS',
      resolution: '1920x1080'
    },
    {
      id: 'upl-2',
      title: 'Commercial Tower Facade',
      camera: 'CAM 04 - TOWER',
      time: '14:15:32 UTC',
      date: 'Today',
      src: '/uploads/building.jpg',
      fps: '30 FPS',
      resolution: '1920x1080'
    },
    {
      id: 'upl-3',
      title: 'Warehouse Bay 1 & 2',
      camera: 'CAM 12 - DOCK B12',
      time: '14:18:34 CST',
      date: 'Yesterday',
      src: '/uploads/warehouse.jpg',
      fps: '30 FPS',
      resolution: '1920x1080'
    },
    {
      id: 'upl-4',
      title: 'Ground Floor Lobby',
      camera: 'CAM 04 - LOBBY',
      time: '09:34:12 GMT',
      date: 'Yesterday',
      src: '/uploads/lobby.jpg',
      fps: '30 FPS',
      resolution: '1920x1080'
    }
  ];

  // 5. Recent Activity List
  const recentActivities = [
    {
      id: 'act-1',
      title: 'New HEP templates added',
      subtitle: 'Sarah Khan added 4 new captures',
      time: 'April 22, 2025 — 10:15 AM',
      type: 'template'
    },
    {
      id: 'act-2',
      title: 'Perimeter intrusion check passed',
      subtitle: 'CAM 01 Entrance Gate verified clearance',
      time: 'April 22, 2025 — 09:30 AM',
      type: 'security'
    },
    {
      id: 'act-3',
      title: 'Daily CCTV frame archive synced',
      subtitle: 'Warehouse Zone 3 - 240 frames uploaded to cloud',
      time: 'April 21, 2025 — 06:45 PM',
      type: 'sync'
    },
    {
      id: 'act-4',
      title: 'Night Vision calibrated',
      subtitle: 'Auto-adjusted sensor illumination for Low-Light',
      time: 'April 21, 2025 — 04:12 PM',
      type: 'setting'
    }
  ];

  const activePoint = hoveredPointIndex !== null ? points[hoveredPointIndex] : points[6];

  return (
    <div className="space-y-6 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. DASHBOARD OVERVIEW HEADER */}
      {/* ========================================================================= */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-sm text-slate-400">
          Track and compare team learning performance with in-depth insights.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP ROW CARDS (4 CARDS GRID) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: Terracotta Realtime Insight */}
        <div className="relative rounded-2xl bg-gradient-to-br from-[#c85a2b] via-[#ba5025] to-[#993b16] p-5.5 text-white shadow-xl shadow-orange-950/20 overflow-hidden flex flex-col justify-between min-h-[150px]">
          {/* Subtle background glow circle */}
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="flex items-start gap-3.5 relative z-10">
            <div className="p-2 rounded-xl bg-white/15 text-white backdrop-blur-sm shrink-0 border border-white/20">
              <Sun className="w-5 h-5 text-amber-200" />
            </div>
            <div className="flex flex-col">
              <div className="text-2xl sm:text-2xl font-black tracking-tight font-mono">
                {currentTime ? currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) : '8:02:09 AM'}
              </div>
              <span className="text-xs text-orange-100 font-medium tracking-wide">
                Realtime Insight
              </span>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/20 mt-4">
            <div className="text-xs text-orange-100/90 font-medium">
              Today:
            </div>
            <div className="text-sm font-bold text-white tracking-wide">
              {currentTime ? getFormattedDate(currentTime) : '2nd August 2023'}
            </div>
          </div>
        </div>

        {/* CARD 2: Total Users */}
        <div className="rounded-2xl bg-[#181926] border border-[#27293d] p-5.5 shadow-lg flex flex-col justify-between min-h-[150px] hover:border-[#383b56] transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#202742] text-[#4d7cfe] flex items-center justify-center border border-[#2e375c]">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-400 font-medium">
              This month
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Users</p>
              <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">
                1180
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#143023] text-[#22c55e] border border-[#22c55e]/30">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>10%</span>
            </div>
          </div>
        </div>

        {/* CARD 3: Total Cameras */}
        <div className="rounded-2xl bg-[#181926] border border-[#27293d] p-5.5 shadow-lg flex flex-col justify-between min-h-[150px] hover:border-[#383b56] transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#362719] text-[#f59e0b] flex items-center justify-center border border-[#4d3622]">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-400 font-medium">
              This month
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Cameras</p>
              <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">
                {cameras.length > 0 ? cameras.length : '286'}
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#143023] text-[#22c55e] border border-[#22c55e]/30">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>10%</span>
            </div>
          </div>
        </div>

        {/* CARD 4: Recent Uploads */}
        <div className="rounded-2xl bg-[#181926] border border-[#27293d] p-5.5 shadow-lg flex flex-col justify-between min-h-[150px] hover:border-[#383b56] transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#1a3327] text-[#10b981] flex items-center justify-center border border-[#234937]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-400 font-medium">
              This month
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Recent Uploads</p>
              <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">
                2000
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#143023] text-[#22c55e] border border-[#22c55e]/30">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>10%</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE ROW (3 COLUMNS: Active Users, Quick Action, Camera Status) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 3A: ACTIVE USERS AREA CHART (Span 6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#181926] border border-[#27293d] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white tracking-tight">
              Active Users
            </h3>

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
              onMouseLeave={() => setHoveredPointIndex(6)}
            >
              <defs>
                {/* Gradient for area under line */}
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#0284c7" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </linearGradient>

                {/* Glow filter for stroke */}
                <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Horizontal Gridlines & Y-axis labels */}
              {[1000, 800, 600, 400, 200, 0].map((val) => {
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
              <path d={areaPath} fill="url(#areaGradient)" />

              {/* Smooth Blue Stroke Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#lineGlow)"
              />

              {/* X-axis labels */}
              {points.map((p, idx) => (
                <text
                  key={idx}
                  x={p.x}
                  y={paddingTop + plotHeight + 20}
                  fill={hoveredPointIndex === idx ? '#38bdf8' : '#64748b'}
                  fontSize="11"
                  fontWeight={hoveredPointIndex === idx ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {p.label}
                </text>
              ))}

              {/* Active Hover Guideline & Indicator */}
              {activePoint && (
                <g>
                  {/* Vertical dashed red line */}
                  <line
                    x1={activePoint.x}
                    y1={activePoint.y}
                    x2={activePoint.x}
                    y2={paddingTop + plotHeight}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />

                  {/* Marker Circle */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="4.5"
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="animate-pulse"
                  />

                  {/* Tooltip Bubble */}
                  <g transform={`translate(${Math.min(svgWidth - 110, Math.max(paddingLeft + 10, activePoint.x - 45))}, ${Math.max(10, activePoint.y - 48)})`}>
                    <rect
                      x="0"
                      y="0"
                      width="90"
                      height="38"
                      rx="8"
                      fill="#12131d"
                      stroke="#2f3248"
                      strokeWidth="1"
                      className="shadow-xl"
                    />
                    <text x="45" y="15" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle">
                      {yearlyChartData[hoveredPointIndex ?? 6]?.label === 'Jul' ? 'July' : yearlyChartData[hoveredPointIndex ?? 6]?.label}
                    </text>
                    <text x="45" y="30" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                      Active Users:{hoveredPointIndex === 6 ? '100' : activePoint.value}
                    </text>
                  </g>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* 3B: QUICK ACTION CARD (Span 3 cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-[#181926] border border-[#27293d] p-6 shadow-xl flex flex-col justify-between">
          <h3 className="text-base font-bold text-white tracking-tight mb-4">
            Quick Action
          </h3>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            
            {/* Button 1: Add Users (Blue Border) */}
            <button
              onClick={onOpenInviteUser}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#26355d] bg-[#141829]/60 hover:bg-[#1b2342] hover:border-[#385194] transition-all duration-200 group cursor-pointer text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#202947] text-[#4d7cfe] flex items-center justify-center border border-[#2d3a68] group-hover:scale-105 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-100 group-hover:text-white">
                  Add Users
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>

            {/* Button 2: Add Cameras (Amber Border) */}
            <button
              onClick={onOpenAddCamera}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#543b18] bg-[#22180e]/60 hover:bg-[#332212] hover:border-[#7c5623] transition-all duration-200 group cursor-pointer text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3b2c1f] text-[#f59e0b] flex items-center justify-center border border-[#523d2b] group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-100 group-hover:text-white">
                  Add Cameras
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>

            {/* Button 3: View Library (Green Border) */}
            <button
              onClick={() => onNavigateTab('content')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#1b4330] bg-[#102219]/60 hover:bg-[#183626] hover:border-[#286b4a] transition-all duration-200 group cursor-pointer text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1c372a] text-[#10b981] flex items-center justify-center border border-[#29543e] group-hover:scale-105 transition-transform">
                  <Eye className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-100 group-hover:text-white">
                  View Library
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>

          </div>
        </div>

        {/* 3C: CAMERA STATUS DONUT GAUGE (Span 3 cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-[#181926] border border-[#27293d] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Camera Status
            </h3>

            {/* Period Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCameraStatusDropdownOpen(!cameraStatusDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202234] border border-[#2f334d] text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <span>{cameraStatusPeriod}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {cameraStatusDropdownOpen && (
                <div className="absolute right-0 mt-1 w-28 rounded-xl bg-[#202234] border border-[#2f334d] shadow-xl py-1 z-30">
                  {(['Today', 'Weekly', 'Monthly'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setCameraStatusPeriod(p);
                        setCameraStatusDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Donut Chart SVG */}
          <div className="relative flex items-center justify-center py-2 select-none">
            <svg viewBox="0 0 200 200" className="w-48 h-48">
              {/* Radius 70, Circumference = 2 * PI * 70 = 439.82 */}
              
              {/* Background track circle */}
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#222538"
                strokeWidth="20"
              />

              {/* In-Active Red Arc (40%) */}
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#ef4444"
                strokeWidth="20"
                strokeDasharray="439.82"
                strokeDashoffset={439.82 * (1 - 0.40)}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                className="transition-all duration-700"
              />

              {/* Active Green Arc (60%) */}
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="#22c55e"
                strokeWidth="20"
                strokeDasharray="439.82"
                strokeDashoffset={439.82 * (1 - 0.60)}
                strokeLinecap="round"
                transform="rotate(54 100 100)"
                className="transition-all duration-700"
              />

              {/* Center Content */}
              <text x="100" y="93" fill="#94a3b8" fontSize="11" fontWeight="500" textAnchor="middle">
                Total Cameras
              </text>
              <text x="100" y="118" fill="#ffffff" fontSize="22" fontWeight="900" textAnchor="middle">
                {totalCamerasCount}
              </text>
            </svg>

            {/* Floating 60% Active Cameras Badge */}
            <div className="absolute top-4 right-1 px-2.5 py-1 rounded-lg bg-[#141523] border border-[#2d304a] text-white text-[10px] font-bold shadow-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span>60% Active Cameras</span>
            </div>
          </div>

          {/* Bottom Legend */}
          <div className="flex items-center justify-center gap-6 pt-2 border-t border-[#27293d]/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
              <span className="text-xs text-slate-300 font-medium">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className="text-xs text-slate-300 font-medium">In-Active</span>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM ROW (Recent Uploads & Recent Activity) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 4A: RECENT UPLOADS STRIP (Span 6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#181926] border border-[#27293d] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white tracking-tight">
              Recent Uploads
            </h3>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202234] border border-[#2f334d] text-xs font-medium text-slate-300">
              <span>{uploadsTimeframe}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Uploads Thumbnails Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentUploads.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedUploadPreview(item)}
                className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-black/40 border border-[#2b2d42] cursor-pointer hover:border-orange-500/50 transition-all duration-200"
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                {/* Corner Expand Icon */}
                <div className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>

                {/* Bottom title & time */}
                <div className="absolute bottom-2 left-2 right-2 text-left">
                  <p className="text-[10px] font-bold text-white truncate leading-tight">
                    {item.camera}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono truncate">
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4B: RECENT ACTIVITY LIST (Span 6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#181926] border border-[#27293d] p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white tracking-tight">
              Recent Activity
            </h3>

            <button
              onClick={() => onNavigateTab('content')}
              className="text-xs font-bold text-[#f97316] hover:text-[#fb923c] transition-colors cursor-pointer"
            >
              View All
            </button>
          </div>

          {/* Activity items */}
          <div className="space-y-3.5">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#1d1f30]/60 border border-[#282b42] hover:bg-[#22253a] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#262940] text-slate-300 flex items-center justify-center shrink-0 border border-[#353957]">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100 truncate">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {act.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono shrink-0 pl-3">
                  {act.time}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. LIGHTBOX MODAL (FOR VIEWING SNAPSHOTS) */}
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
                    {selectedUploadPreview.camera} · {selectedUploadPreview.time} ({selectedUploadPreview.fps})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedUploadPreview.src}
                  download="cctv_snapshot.jpg"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
              <span>Resolution: {selectedUploadPreview.resolution}</span>
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
