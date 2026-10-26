'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Check, 
  Clock, 
  Camera, 
  Search, 
  Filter, 
  Video, 
  Eye, 
  X, 
  ChevronRight, 
  RefreshCw, 
  FileText,
  Volume2,
  VolumeX,
  Calendar,
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';
import { securityAudio } from '@/lib/securityAudio';

interface SecurityAlertCenterViewProps {
  alerts: any[];
  cameras: any[];
  onAcknowledgeAlert: (alertId: string) => Promise<void>;
  onResolveAlert: (alertId: string, notes: string) => Promise<void>;
  onViewCamera: (cameraKey: string) => void;
  onRefreshAlerts?: () => void;
}

export default function SecurityAlertCenterView({
  alerts,
  cameras,
  onAcknowledgeAlert,
  onResolveAlert,
  onViewCamera,
  onRefreshAlerts
}: SecurityAlertCenterViewProps) {
  // Filters
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNRESOLVED' | 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [cameraFilter, setCameraFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeframeFilter, setTimeframeFilter] = useState<'ALL' | 'TODAY' | '24H' | '7D'>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Modals state
  const [previewSnapshot, setPreviewSnapshot] = useState<{ url: string; title: string; time: string; reason?: string } | null>(null);
  const [resolveModalAlert, setResolveModalAlert] = useState<any | null>(null);
  const [resolveNotes, setResolveNotes] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(securityAudio.getGlobalMute());

  const handleToggleGlobalMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    securityAudio.setGlobalMute(next);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const criticalActive = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
    const unacknowledged = alerts.filter(a => a.status === 'NEW').length;
    const acknowledged = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
    const resolved = alerts.filter(a => a.status === 'RESOLVED').length;
    return { criticalActive, unacknowledged, acknowledged, resolved, total: alerts.length };
  }, [alerts]);

  // Unique categories for filter dropdown
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    alerts.forEach(a => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [alerts]);

  // Filtering Logic
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      // 1. Severity
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) {
        return false;
      }

      // 2. Status
      if (statusFilter === 'UNRESOLVED') {
        if (a.status === 'RESOLVED') return false;
      } else if (statusFilter !== 'ALL' && a.status !== statusFilter) {
        return false;
      }

      // 3. Camera
      if (cameraFilter !== 'ALL' && a.cameraKey !== cameraFilter) {
        return false;
      }

      // 4. Category
      if (categoryFilter !== 'ALL' && a.category !== categoryFilter) {
        return false;
      }

      // 5. Timeframe
      if (timeframeFilter !== 'ALL' && a.timestamp) {
        const alertTime = new Date(a.timestamp).getTime();
        const now = Date.now();
        if (timeframeFilter === 'TODAY') {
          const todayStart = new Date().setHours(0, 0, 0, 0);
          if (alertTime < todayStart) return false;
        } else if (timeframeFilter === '24H') {
          if (now - alertTime > 24 * 60 * 60 * 1000) return false;
        } else if (timeframeFilter === '7D') {
          if (now - alertTime > 7 * 24 * 60 * 60 * 1000) return false;
        }
      }

      // 6. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const msg = (a.message || '').toLowerCase();
        const reason = (a.reason || '').toLowerCase();
        const desc = (a.description || '').toLowerCase();
        const cam = (a.cameraKey || '').toLowerCase();
        const camName = (a.cameraName || '').toLowerCase();
        const zone = (a.zoneName || '').toLowerCase();
        const cat = (a.category || '').toLowerCase();
        const notes = (a.resolutionNotes || '').toLowerCase();
        if (!msg.includes(q) && !reason.includes(q) && !desc.includes(q) && !cam.includes(q) && !camName.includes(q) && !zone.includes(q) && !cat.includes(q) && !notes.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, severityFilter, statusFilter, cameraFilter, categoryFilter, timeframeFilter, searchQuery]);

  // Paginated alerts
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage) || 1;
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAlerts.slice(start, start + itemsPerPage);
  }, [filteredAlerts, currentPage]);

  const handleAcknowledge = async (alertId: string) => {
    setActionLoadingId(alertId);
    try {
      await onAcknowledgeAlert(alertId);
      securityAudio.stopCriticalAlarm(alertId);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenResolveModal = (alert: any) => {
    setResolveModalAlert(alert);
    setResolveNotes(alert.resolutionNotes || '');
  };

  const handleConfirmResolve = async () => {
    if (!resolveModalAlert?._id) return;
    setActionLoadingId(resolveModalAlert._id);
    try {
      await onResolveAlert(resolveModalAlert._id, resolveNotes);
      setResolveModalAlert(null);
      setResolveNotes('');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER & METRICS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27293d] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Security Incident Center
              </h1>
              <p className="text-xs text-slate-400">
                Real-time security operations, incident triage, and forensic audit logs.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleGlobalMute}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
              isMuted
                ? 'bg-[#181a29] border-[#2b304c] text-slate-400 hover:text-white'
                : 'bg-orange-500/15 border-orange-500/40 text-orange-400'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
            <span>{isMuted ? 'Alarms Muted' : 'Audio Active'}</span>
          </button>

          {onRefreshAlerts && (
            <button
              type="button"
              onClick={onRefreshAlerts}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#181a29] border border-[#2b304c] hover:bg-[#202336] text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
              title="Refresh security incident log"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI STATUS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Critical */}
        <div className={`p-4 rounded-2xl border transition-all ${
          stats.criticalActive > 0
            ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
            : 'bg-[#161826] border-[#27293d]'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Critical Active</span>
            <span className={`w-2.5 h-2.5 rounded-full ${stats.criticalActive > 0 ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {stats.criticalActive}
          </div>
          <div className="text-[11px] text-red-400 font-medium mt-1">
            {stats.criticalActive > 0 ? 'Urgent attention required' : 'Zero unhandled criticals'}
          </div>
        </div>

        {/* Unacknowledged */}
        <div className="p-4 rounded-2xl border border-[#27293d] bg-[#161826]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Unacknowledged</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {stats.unacknowledged}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Pending operator review
          </div>
        </div>

        {/* In Progress / Acknowledged */}
        <div className="p-4 rounded-2xl border border-[#27293d] bg-[#161826]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Acknowledged</span>
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {stats.acknowledged}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Investigating on-site
          </div>
        </div>

        {/* Resolved */}
        <div className="p-4 rounded-2xl border border-[#27293d] bg-[#161826]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {stats.resolved}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Closed incidents with notes
          </div>
        </div>
      </div>

      {/* 3. MULTI-FACET FILTER CONTROLS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#161826] border border-[#27293d] space-y-4">
        
        {/* Row 1: Search & Quick Severity Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by camera, message, zone, or notes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#2b304c] bg-[#10121d] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity Segmented Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#10121d] border border-[#2b304c] self-start lg:self-auto overflow-x-auto max-w-full">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => (
              <button
                key={sev}
                type="button"
                onClick={() => {
                  setSeverityFilter(sev);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  severityFilter === sev
                    ? sev === 'CRITICAL'
                      ? 'bg-red-600 text-white shadow-sm'
                      : sev === 'HIGH'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev === 'ALL' ? 'All Severities' : sev}
              </button>
            ))}
          </div>

        </div>

        {/* Row 2: Status, Camera, Category, Timeframe Selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#23263b] text-xs">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-semibold mr-1 text-[11px] uppercase tracking-wider">Status:</span>
            {(['ALL', 'UNRESOLVED', 'NEW', 'ACKNOWLEDGED', 'RESOLVED'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {st === 'UNRESOLVED' ? 'Active / Unresolved' : st}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* Camera Filter Dropdown */}
          <select
            value={cameraFilter}
            onChange={(e) => {
              setCameraFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-[#2b304c] bg-[#10121d] text-slate-200 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="ALL">All Cameras ({cameras.length})</option>
            {cameras.map(c => (
              <option key={c.cameraKey} value={c.cameraKey}>
                {c.name || c.locationName || c.cameraKey} ({c.cameraKey})
              </option>
            ))}
          </select>

          {/* Category Filter Dropdown */}
          {categoriesList.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-[#2b304c] bg-[#10121d] text-slate-200 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          {/* Timeframe Filter */}
          <select
            value={timeframeFilter}
            onChange={(e) => {
              setTimeframeFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-[#2b304c] bg-[#10121d] text-slate-200 text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer ml-auto"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today Only</option>
            <option value="24H">Past 24 Hours</option>
            <option value="7D">Past 7 Days</option>
          </select>

        </div>

      </div>

      {/* 4. INCIDENT LOG LIST */}
      <div className="border border-[#27293d] bg-[#161826] rounded-2xl overflow-hidden shadow-xl">
        
        {/* Table / List Header */}
        <div className="px-5 py-3.5 bg-[#121422] border-b border-[#27293d] flex items-center justify-between text-xs font-bold text-slate-400">
          <span>Security Incidents ({filteredAlerts.length})</span>
          <span className="font-mono text-[11px]">
            Showing page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Items */}
        <div className="divide-y divide-[#23263b]">
          {paginatedAlerts.length > 0 ? (
            paginatedAlerts.map((alert) => {
              const isCritical = alert.severity === 'CRITICAL';
              const isHigh = alert.severity === 'HIGH';
              const isMedium = alert.severity === 'MEDIUM';
              const isNew = alert.status === 'NEW' || !alert.status;
              const isAck = alert.status === 'ACKNOWLEDGED';
              const isRes = alert.status === 'RESOLVED';

              const camName = alert.cameraName || alert.cameraKey;
              const timeFormatted = alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'N/A';

              return (
                <div
                  key={alert._id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-white/[0.02] ${
                    isCritical && isNew ? 'bg-red-950/20' : ''
                  }`}
                >
                  {/* Left: Severity badge, Thumbnail & Incident Text */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    
                    {/* Snapshot Thumbnail Preview */}
                    {alert.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewSnapshot({
                          url: alert.imageUrl,
                          title: alert.message,
                          reason: alert.reason || alert.description,
                          time: timeFormatted
                        })}
                        className="relative group w-14 h-12 rounded-xl overflow-hidden border border-[#2b304c] bg-black/60 shrink-0 cursor-pointer shadow-sm hover:border-orange-500 transition-all"
                        title="Click to view evidence snapshot"
                      >
                        <img
                          src={alert.imageUrl}
                          alt="Security snapshot"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-14 h-12 rounded-xl border border-dashed border-[#2b304c] bg-[#10121d] flex items-center justify-center text-slate-500 shrink-0">
                        <Camera className="w-5 h-5 text-slate-600" />
                      </div>
                    )}

                    {/* Incident Details */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      
                      {/* Tags Bar */}
                      <div className="flex flex-wrap items-center gap-2">
                        
                        {/* Severity Tag */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          isCritical
                            ? 'bg-red-600 text-white shadow-sm'
                            : isHigh
                            ? 'bg-orange-500 text-white shadow-sm'
                            : isMedium
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-200'
                        }`}>
                          {alert.severity || 'HIGH'}
                        </span>

                        {/* Status Tag */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isNew
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : isAck
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isNew ? 'bg-red-500 animate-ping' : isAck ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          {isNew ? 'NEW / UNACK' : isAck ? 'ACKNOWLEDGED' : 'RESOLVED'}
                        </span>

                        {/* Camera Name Tag */}
                        <span className="text-[11px] font-mono text-slate-300 font-semibold flex items-center gap-1">
                          <Camera className="w-3 h-3 text-orange-400" /> {camName}
                        </span>

                        {/* Category Tag */}
                        {alert.category && (
                          <span className="px-2 py-0.5 rounded bg-[#10121d] border border-[#2b304c] text-slate-400 text-[10px] font-medium">
                            {alert.category}
                          </span>
                        )}

                        {/* Zone Name */}
                        {alert.zoneName && (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-mono">
                            Zone: {alert.zoneName}
                          </span>
                        )}
                      </div>

                      {/* Main Message */}
                      <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                        {alert.message}
                      </p>

                      {/* Incident Trigger Reason */}
                      {(alert.reason || alert.description) && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-[#0e101a] border border-[#23273e] text-xs text-slate-300">
                          <span className="font-bold text-orange-400 uppercase tracking-wider text-[10px] shrink-0 mt-0.5 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-orange-400" /> Incident Reason:
                          </span>
                          <span className="leading-relaxed text-slate-200 font-medium">
                            {alert.reason || alert.description}
                          </span>
                        </div>
                      )}

                      {/* Timestamp & Operator Audit trail */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> {timeFormatted}
                        </span>

                        {isAck && alert.acknowledgedAt && (
                          <span className="text-amber-400/90">
                            · Acknowledged at {new Date(alert.acknowledgedAt).toLocaleTimeString()}
                          </span>
                        )}

                        {isRes && (
                          <span className="text-emerald-400/90 flex items-center gap-1">
                            · Resolved at {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleTimeString() : 'Recorded'}
                            {alert.resolutionNotes && (
                              <span className="text-slate-300 font-sans italic">
                                &mdash; &ldquo;{alert.resolutionNotes}&rdquo;
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Right: Security Incident Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    
                    {/* View Camera Button */}
                    <button
                      type="button"
                      onClick={() => onViewCamera(alert.cameraKey)}
                      className="px-3 py-1.5 rounded-xl bg-[#10121d] hover:bg-white/10 border border-[#2b304c] text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Inspect camera feed"
                    >
                      <Video className="w-3.5 h-3.5 text-orange-400" />
                      <span className="hidden sm:inline">Camera</span>
                    </button>

                    {/* Acknowledge Button */}
                    {!isRes && (
                      <button
                        type="button"
                        disabled={actionLoadingId === alert._id || isAck}
                        onClick={() => handleAcknowledge(alert._id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                          isAck
                            ? 'bg-amber-500/10 text-amber-400/60 border border-amber-500/20 cursor-default'
                            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === alert._id ? 'Saving...' : isAck ? 'Acknowledged' : 'Acknowledge'}</span>
                      </button>
                    )}

                    {/* Resolve Button */}
                    {!isRes ? (
                      <button
                        type="button"
                        disabled={actionLoadingId === alert._id}
                        onClick={() => handleOpenResolveModal(alert)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}

                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#121422] border border-[#2b304c] flex items-center justify-center mx-auto text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-white">No Security Incidents Match Filter</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No alerts found under the current filter selection. Adjust your filters or wait for new security events.
              </p>
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 bg-[#121422] border-t border-[#27293d] flex items-center justify-between">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-xl bg-[#161826] border border-[#2b304c] text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-xs font-mono text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 rounded-xl bg-[#161826] border border-[#2b304c] text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

      {/* 5. RESOLVE INCIDENT MODAL WITH AUDIT NOTES */}
      {resolveModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-[#161826] border border-[#2b304c] rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#2b304c]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Resolve Security Incident</h3>
                  <p className="text-xs text-slate-400 font-mono">{resolveModalAlert.cameraKey}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResolveModalAlert(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#10121d] border border-[#24273f] text-xs space-y-1">
              <span className="font-bold text-white block">{resolveModalAlert.message}</span>
              <span className="text-[11px] text-slate-400 font-mono block">
                {resolveModalAlert.category} · {new Date(resolveModalAlert.timestamp).toLocaleString()}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Resolution & Audit Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="e.g. Cleared by Security Lead - Authorized contractor with badge, no breach."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b304c] bg-[#10121d] text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setResolveModalAlert(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === resolveModalAlert._id}
                onClick={handleConfirmResolve}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {actionLoadingId === resolveModalAlert._id ? 'Resolving...' : 'Confirm Incident Resolution'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. SNAPSHOT EVIDENCE LIGHTBOX MODAL */}
      {previewSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full bg-[#161826] border border-[#2b304c] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#2b304c] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-400" /> Evidence Snapshot
                </h3>
                <p className="text-xs text-slate-400 font-mono">{previewSnapshot.time}</p>
                {previewSnapshot.reason && (
                  <p className="text-xs text-orange-300 font-medium mt-1 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold uppercase text-[9px]">Reason</span>
                    <span>{previewSnapshot.reason}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewSnapshot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black/85 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={previewSnapshot.url}
                alt="Security incident snapshot"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg border border-[#2b304c]"
              />
            </div>
            <div className="p-3 bg-[#121422] border-t border-[#2b304c] flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewSnapshot(null)}
                className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
