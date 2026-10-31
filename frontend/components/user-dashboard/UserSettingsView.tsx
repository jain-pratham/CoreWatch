'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Bell, 
  Volume2, 
  VolumeX, 
  Video, 
  Globe, 
  Lock, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  RotateCcw, 
  Download, 
  Play, 
  Square, 
  Loader2, 
  Sparkles, 
  ExternalLink, 
  Info, 
  Check, 
  AlertTriangle, 
  Clock, 
  Layers, 
  HardDrive, 
  RefreshCw, 
  Cpu, 
  Activity,
  Save,
  Radio
} from 'lucide-react';
import { securityAudio } from '@/lib/securityAudio';
import { nativeNotifier } from '@/lib/nativeNotifier';
import CustomConfirmDialog from '../common/CustomConfirmDialog';

interface UserSettingsViewProps {
  user: any;
  customer?: any;
  activeCameraKey?: string;
  isTrialUser?: boolean;
  maxAllowedCameras?: number;
  onNavigateTab?: (tab: string) => void;
}

interface SystemSettingsState {
  // 1. AI Vision & Safety Engine
  aiSensitivity: 'high' | 'balanced' | 'recall';
  confidenceThreshold: number; // 50 to 95
  humanDetection: boolean;
  ppeDetection: boolean;
  perimeterIntrusion: boolean;
  loiteringDetection: boolean;
  cashCounterSecurity: boolean;
  nightVisionEnhancement: boolean;
  autoCaptureSnapshots: boolean;
  showAiOverlay: boolean;

  // 2. Audio & Notifications
  soundEnabled: boolean;
  masterVolume: number; // 0 to 100
  selectedAlarmSound: 'siren' | 'pulse' | 'radar' | 'beep';
  alarmRepeatInterval: number; // 5, 8, 10, 15, or 0 (once)
  nativeNotificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  escalationEmail: string;

  // 3. Stream Protocols & Ingestion
  rtspProtocol: 'tcp' | 'udp' | 'auto';
  latencyMode: 'low' | 'balanced' | 'stable';
  hardwareAcceleration: boolean;
  autoReconnectDelay: number; // 3, 5, 10, 15
  maxStreamResolution: '1080p' | '720p' | '480p';

  // 4. Regional & Workspace
  facilityName: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  gridRefreshInterval: number; // 1, 5, 10, 30, 0

  // 5. Retention & Security
  snapshotRetentionDays: number; // 7, 30, 90, 365
  autoSessionTimeout: number; // 15, 30, 60, 0
}

const DEFAULT_SETTINGS: SystemSettingsState = {
  aiSensitivity: 'balanced',
  confidenceThreshold: 75,
  humanDetection: true,
  ppeDetection: true,
  perimeterIntrusion: true,
  loiteringDetection: true,
  cashCounterSecurity: false,
  nightVisionEnhancement: true,
  autoCaptureSnapshots: true,
  showAiOverlay: true,

  soundEnabled: true,
  masterVolume: 80,
  selectedAlarmSound: 'siren',
  alarmRepeatInterval: 8,
  nativeNotificationsEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  escalationEmail: '',

  rtspProtocol: 'tcp',
  latencyMode: 'low',
  hardwareAcceleration: true,
  autoReconnectDelay: 5,
  maxStreamResolution: '1080p',

  facilityName: 'Main Surveillance Command',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  gridRefreshInterval: 5,

  snapshotRetentionDays: 30,
  autoSessionTimeout: 30,
};

export default function UserSettingsView({
  user,
  customer,
  activeCameraKey = '',
  isTrialUser = false,
  maxAllowedCameras = 5,
  onNavigateTab
}: UserSettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'audio' | 'stream' | 'regional' | 'retention'>('ai');
  const [settings, setSettings] = useState<SystemSettingsState>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false);
  const [audioTimer, setAudioTimer] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [cacheClearSuccess, setCacheClearSuccess] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    // 1. Check native notification permission
    if (nativeNotifier.isSupported()) {
      setNotificationPermission(nativeNotifier.getPermission());
    }

    // 2. Load from localStorage
    try {
      const stored = localStorage.getItem('corewatch_system_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsed }));
        if (parsed.masterVolume !== undefined) {
          securityAudio.updatePreferences({ masterVolume: parsed.masterVolume });
        }
      }
    } catch (err) {
      console.warn("Could not load local system settings:", err);
    }

    // 3. Load backend notification preferences if available
    const loadBackendPrefs = async () => {
      try {
        const token = user?.token || localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/user/notification-preferences', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setSettings(prev => ({
            ...prev,
            nativeNotificationsEnabled: data.data.nativeNotificationsEnabled ?? prev.nativeNotificationsEnabled,
            soundEnabled: data.data.soundEnabled ?? prev.soundEnabled,
            masterVolume: data.data.masterVolume ?? prev.masterVolume,
            alarmRepeatInterval: data.data.criticalAlarmRepeatInterval ?? prev.alarmRepeatInterval,
            quietHoursEnabled: data.data.quietHoursEnabled ?? prev.quietHoursEnabled,
            quietHoursStart: data.data.quietHoursStart ?? prev.quietHoursStart,
            quietHoursEnd: data.data.quietHoursEnd ?? prev.quietHoursEnd,
            escalationEmail: data.data.escalationSupervisorEmail ?? prev.escalationEmail,
          }));
          if (data.data.masterVolume !== undefined) {
            securityAudio.updatePreferences({ masterVolume: data.data.masterVolume });
          }
        }
      } catch (e) {
        console.warn("Could not sync backend preferences:", e);
      }
    };
    loadBackendPrefs();
  }, [user]);

  // Clean up audio test on unmount
  useEffect(() => {
    return () => {
      if (audioTimer) clearTimeout(audioTimer);
      securityAudio.stopCriticalAlarm();
    };
  }, [audioTimer]);

  // Handler for toggle switch
  const handleToggle = (key: keyof SystemSettingsState) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handler for direct value update
  const handleChange = (key: keyof SystemSettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'masterVolume') {
      securityAudio.updatePreferences({ masterVolume: Number(value) });
    }
  };

  // Audio Testing: Plays real sound via Web Audio API
  const handleToggleTestAudio = () => {
    if (isPlayingTestAudio) {
      securityAudio.stopCriticalAlarm();
      setIsPlayingTestAudio(false);
      if (audioTimer) clearTimeout(audioTimer);
    } else {
      securityAudio.updatePreferences({
        masterVolume: settings.masterVolume,
        soundEnabled: true,
        highSound: true
      });
      securityAudio.playAlarm('HIGH');
      setIsPlayingTestAudio(true);

      const timer = setTimeout(() => {
        securityAudio.stopCriticalAlarm();
        setIsPlayingTestAudio(false);
      }, 4000);
      setAudioTimer(timer);
    }
  };

  // Browser Notification Request
  const handleRequestNotificationPermission = async () => {
    const perm = await nativeNotifier.requestPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      setSettings(prev => ({ ...prev, nativeNotificationsEnabled: true }));
      nativeNotifier.sendNotification({
        cameraKey: "SYSTEM",
        severity: "HIGH",
        category: "System Settings",
        message: "Desktop notifications enabled for AI safety violations."
      });
    }
  };

  // Save Settings to localStorage and Backend API
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Write to localStorage
      localStorage.setItem('corewatch_system_settings', JSON.stringify(settings));

      // 2. Update local audio engine
      securityAudio.updatePreferences({
        soundEnabled: settings.soundEnabled,
        masterVolume: settings.masterVolume,
        criticalSound: settings.soundEnabled,
        highSound: settings.soundEnabled,
        mediumSound: settings.soundEnabled,
        criticalAlarmRepeatInterval: settings.alarmRepeatInterval,
      });

      // 3. Sync to API if token available
      const token = user?.token || localStorage.getItem('token');
      if (token) {
        await fetch('/api/user/notification-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            nativeNotificationsEnabled: settings.nativeNotificationsEnabled,
            soundEnabled: settings.soundEnabled,
            masterVolume: settings.masterVolume,
            criticalAlarmRepeatInterval: settings.alarmRepeatInterval,
            quietHoursEnabled: settings.quietHoursEnabled,
            quietHoursStart: settings.quietHoursStart,
            quietHoursEnd: settings.quietHoursEnd,
            escalationSupervisorEmail: settings.escalationEmail,
          })
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Defaults
  const handleConfirmReset = () => {
    setSettings(DEFAULT_SETTINGS);
    securityAudio.updatePreferences({
      soundEnabled: DEFAULT_SETTINGS.soundEnabled,
      masterVolume: DEFAULT_SETTINGS.masterVolume,
    });
    localStorage.setItem('corewatch_system_settings', JSON.stringify(DEFAULT_SETTINGS));
    setShowResetConfirm(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Clear Stream Cache & Resync
  const handleConfirmClearCache = () => {
    sessionStorage.clear();
    setCacheClearSuccess(true);
    setShowClearCacheConfirm(false);
    setTimeout(() => setCacheClearSuccess(false), 3000);
  };

  // Export Audit Log
  const handleExportAuditLog = () => {
    const auditData = {
      platform: "CoreWatch AI Surveillance Platform",
      generatedAt: new Date().toISOString(),
      account: {
        name: user?.name || customer?.name,
        email: user?.email,
        role: user?.role,
        company: customer?.company || user?.company,
        plan: customer?.plan || (isTrialUser ? 'Demo Free' : 'Enterprise Pro')
      },
      systemConfiguration: settings,
      telemetry: {
        maxCamerasAllowed: maxAllowedCameras,
        activeCameraKey,
        audioSupported: typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window),
        browserNotificationPermission: notificationPermission,
      }
    };

    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `corewatch_system_settings_audit_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & GLOBAL ACTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27293d] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center border border-orange-500/30 shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                System Settings
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                AI detection sensitivity, audio sirens, RTSP stream protocols, regional format, and privacy retention.
              </p>
            </div>
          </div>
        </div>

        {/* Global Save & Reset Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2 rounded-xl border border-[#2b304c] bg-[#161828] hover:bg-[#1e2238] text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveSettings()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>✓ System settings updated successfully and applied across your surveillance grid!</span>
        </div>
      )}

      {cacheClearSuccess && (
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>✓ Local stream cache and temporary video buffers cleared successfully.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TABS NAVIGATION BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#141624] border border-[#27293d]">
        {[
          { id: 'ai', label: 'AI Vision & Detection', icon: Cpu, badge: `${settings.confidenceThreshold}%` },
          { id: 'audio', label: 'Audio Alarms & Alerts', icon: Bell, badge: settings.soundEnabled ? 'Active' : 'Muted' },
          { id: 'stream', label: 'Stream Protocols & RTSP', icon: Video, badge: settings.rtspProtocol.toUpperCase() },
          { id: 'regional', label: 'Regional & Workspace', icon: Globe, badge: settings.timeFormat },
          { id: 'retention', label: 'Storage & Security', icon: Lock, badge: `${settings.snapshotRetentionDays}d` },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isActive ? 'bg-black/30 text-white' : 'bg-[#1e2238] text-slate-400'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: AI VISION & DETECTION ENGINE */}
      {/* ========================================================================= */}
      {activeSubTab === 'ai' && (
        <div className="space-y-6">
          {/* AI Sensitivity Profiles */}
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Cpu className="w-4 h-4 text-orange-400" />
                <span>Detection Sensitivity Profile</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjusts the neural network model inference threshold for triggering safety violations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { 
                  id: 'high', 
                  title: 'High Precision (85%)', 
                  desc: 'Minimizes false triggers. Best for restricted perimeter gates and high-value counters.', 
                  threshold: 85,
                  tag: 'Strict'
                },
                { 
                  id: 'balanced', 
                  title: 'Balanced (75%)', 
                  desc: 'Recommended enterprise default for warehouse floors, logistics zones, and lobbies.', 
                  threshold: 75,
                  tag: 'Recommended'
                },
                { 
                  id: 'recall', 
                  title: 'High Recall (60%)', 
                  desc: 'Maximum alert capture. Flags distant or partially obscured subjects in low-light.', 
                  threshold: 60,
                  tag: 'Sensitive'
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    handleChange('aiSensitivity', opt.id);
                    handleChange('confidenceThreshold', opt.threshold);
                  }}
                  className={`p-4.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    settings.aiSensitivity === opt.id
                      ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                      : 'border-[#27293d] bg-[#131524] hover:border-[#383d5c]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{opt.title}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      settings.aiSensitivity === opt.id ? 'bg-orange-500 text-white' : 'bg-[#1e2238] text-slate-400'
                    }`}>
                      {opt.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</p>
                </div>
              ))}
            </div>

            {/* Custom Confidence Threshold Slider */}
            <div className="pt-2 border-t border-[#27293d] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200">Custom Confidence Score Threshold</span>
                <span className="font-mono font-bold text-orange-400 bg-orange-500/15 px-2.5 py-0.5 rounded-md border border-orange-500/30">
                  {settings.confidenceThreshold}% Minimum
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={settings.confidenceThreshold}
                onChange={(e) => handleChange('confidenceThreshold', parseInt(e.target.value, 10))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-[#27293d] rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>50% (High Alert Volume)</span>
                <span>75% (Balanced)</span>
                <span>95% (Extreme Accuracy)</span>
              </div>
            </div>
          </div>

          {/* Active AI Modules (Checklist) */}
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Active AI Detection Modules
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle individual AI inference models executing in real time on active RTSP camera feeds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  key: 'humanDetection' as const,
                  title: 'Human Body & Intruder Tracking',
                  desc: 'Detects unauthorized individuals entering designated zones.',
                },
                {
                  key: 'ppeDetection' as const,
                  title: 'Helmet & Safety Gear (PPE) Audit',
                  desc: 'Scans workforce for mandatory hardhats and safety gear.',
                },
                {
                  key: 'perimeterIntrusion' as const,
                  title: 'Perimeter Tripwire Crossing',
                  desc: 'Instant trigger when boundaries or security fences are crossed.',
                },
                {
                  key: 'loiteringDetection' as const,
                  title: 'Loitering & Dwell Time Anomaly',
                  desc: 'Alerts when personnel remain in high-risk zones longer than permitted.',
                },
                {
                  key: 'cashCounterSecurity' as const,
                  title: 'Cash Drawer & Valuable Asset Monitoring',
                  desc: 'Surveillance oversight for transactions and vault access.',
                },
                {
                  key: 'nightVisionEnhancement' as const,
                  title: 'Low-Light & Night Frame Enhancement',
                  desc: 'Optimizes dynamic contrast and gamma for dark environments.',
                },
              ].map((mod) => {
                const isEnabled = settings[mod.key];
                return (
                  <div
                    key={mod.key}
                    onClick={() => handleToggle(mod.key)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isEnabled
                        ? 'border-[#2d4b39] bg-[#12221b]/60'
                        : 'border-[#27293d] bg-[#131524]/60 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white block">{mod.title}</span>
                      <span className="text-[11px] text-slate-400 block">{mod.desc}</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors shrink-0 ${
                      isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overlays and Evidence toggles */}
            <div className="pt-4 border-t border-[#27293d] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => handleToggle('autoCaptureSnapshots')}
                className="p-4 rounded-xl border border-[#27293d] bg-[#131524] flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-white block">Auto-Capture Incident Snapshots</span>
                  <span className="text-[11px] text-slate-400 block">Saves HD frame evidence to MongoDB on violation</span>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors shrink-0 ${
                  settings.autoCaptureSnapshots ? 'bg-orange-500' : 'bg-slate-700'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.autoCaptureSnapshots ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              <div 
                onClick={() => handleToggle('showAiOverlay')}
                className="p-4 rounded-xl border border-[#27293d] bg-[#131524] flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-white block">Show AI Bounding Box Overlays</span>
                  <span className="text-[11px] text-slate-400 block">Renders colored detection boxes over video feeds</span>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors shrink-0 ${
                  settings.showAiOverlay ? 'bg-orange-500' : 'bg-slate-700'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.showAiOverlay ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 2: AUDIO ALARMS & NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeSubTab === 'audio' && (
        <div className="space-y-6">
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Master Sound Switch */}
            <div className="flex items-center justify-between pb-5 border-b border-[#27293d]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-orange-400" />
                  <span>Audible Siren & Sound Alarms</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Plays audio chime in operator browser when critical violations are detected.
                </p>
              </div>

              <div 
                onClick={() => handleToggle('soundEnabled')}
                className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                  settings.soundEnabled ? 'bg-orange-500' : 'bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </div>

            {/* Master Volume Slider with Test Button */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-2">
                  {settings.masterVolume === 0 ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
                  <span>Master Siren Volume</span>
                </span>
                <span className="font-mono font-bold text-orange-400">{settings.masterVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                disabled={!settings.soundEnabled}
                value={settings.masterVolume}
                onChange={(e) => handleChange('masterVolume', parseInt(e.target.value, 10))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-[#27293d] rounded-lg disabled:opacity-40"
              />

              {/* Working Live Test Audio Button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Verify browser speaker output:
                </span>
                <button
                  type="button"
                  onClick={handleToggleTestAudio}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isPlayingTestAudio
                      ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                      : 'bg-[#202538] hover:bg-[#2b324c] text-white border border-[#384166]'
                  }`}
                >
                  {isPlayingTestAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlayingTestAudio ? '■ Stop Audio Test' : '▶ Test Alarm Sound'}</span>
                </button>
              </div>
            </div>

            {/* Siren Repeat Interval */}
            <div className="pt-4 border-t border-[#27293d] space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                Critical Siren Repeat Interval
              </label>
              <p className="text-[11px] text-slate-400">
                Repeats siren sound until incident is acknowledged by operator in Alert Center.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {[
                  { label: 'Every 5 Seconds', val: 5 },
                  { label: 'Every 8 Seconds', val: 8 },
                  { label: 'Every 15 Seconds', val: 15 },
                  { label: 'Once Only (No Repeat)', val: 0 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleChange('alarmRepeatInterval', item.val)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      settings.alarmRepeatInterval === item.val
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                        : 'border-[#27293d] bg-[#121422] text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Operating System Native Notifications */}
            <div className="pt-4 border-t border-[#27293d] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Browser Desktop Notifications</h4>
                  <p className="text-[11px] text-slate-400">Pushes system banner alerts when browser is minimized.</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    notificationPermission === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    Permission: {notificationPermission.toUpperCase()}
                  </span>

                  {notificationPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestNotificationPermission}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Enable Desktop Alerts
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quiet Hours / DND */}
            <div className="pt-4 border-t border-[#27293d] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Quiet Hours / Do Not Disturb (DND)</h4>
                  <p className="text-[11px] text-slate-400">Silences audible sirens during non-operational facility hours.</p>
                </div>
                <div 
                  onClick={() => handleToggle('quietHoursEnabled')}
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    settings.quietHoursEnabled ? 'bg-orange-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.quietHoursEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              {settings.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Start Time</label>
                    <input
                      type="time"
                      value={settings.quietHoursStart}
                      onChange={(e) => handleChange('quietHoursStart', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#2b304c] bg-[#121422] text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">End Time</label>
                    <input
                      type="time"
                      value={settings.quietHoursEnd}
                      onChange={(e) => handleChange('quietHoursEnd', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#2b304c] bg-[#121422] text-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: STREAM PROTOCOLS & VIDEO */}
      {/* ========================================================================= */}
      {activeSubTab === 'stream' && (
        <div className="space-y-6">
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* RTSP Transport Protocol */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Video className="w-4 h-4 text-orange-400" />
                  <span>RTSP Stream Transport Protocol</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select network layer transport method for CCTV camera feeds.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'tcp', label: 'TCP Transport (Recommended)', desc: 'Guarantees zero packet loss and frame integrity over corporate networks.' },
                  { id: 'udp', label: 'UDP Transport (Low Latency)', desc: 'Best for local low-latency streams where packet retransmission is not required.' },
                  { id: 'auto', label: 'Adaptive Auto-Negotiate', desc: 'Automatically tests TCP first and falls back to UDP if blocked.' },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleChange('rtspProtocol', item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      settings.rtspProtocol === item.id
                        ? 'border-orange-500 bg-orange-500/10 shadow-md'
                        : 'border-[#27293d] bg-[#131524] hover:border-[#383d5c]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{item.label}</span>
                      <Radio className={`w-3.5 h-3.5 ${settings.rtspProtocol === item.id ? 'text-orange-400' : 'text-slate-600'}`} />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Latency & Buffer Profile */}
            <div className="pt-4 border-t border-[#27293d] space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white">Stream Latency & Jitter Buffer</h4>
                <p className="text-[11px] text-slate-400">Balance real-time immediacy with playback smoothness.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'low', label: 'Ultra-Low Latency (<1s buffer)', desc: 'Instant response for active security guards.' },
                  { id: 'balanced', label: 'Balanced Stability (2s buffer)', desc: 'Smooth frame rendering without micro-stutters.' },
                  { id: 'stable', label: 'High Resilience (5s buffer)', desc: 'Buffers frames for high packet loss environments.' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleChange('latencyMode', item.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.latencyMode === item.id
                        ? 'border-orange-500 bg-orange-500/15 text-white'
                        : 'border-[#27293d] bg-[#121422] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block">{item.label}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hardware Acceleration & Reconnect */}
            <div className="pt-4 border-t border-[#27293d] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => handleToggle('hardwareAcceleration')}
                className="p-4 rounded-xl border border-[#27293d] bg-[#131524] flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-white block">GPU Hardware Acceleration</span>
                  <span className="text-[11px] text-slate-400 block">Uses WebGL & Canvas GPU pipeline for decoding</span>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors shrink-0 ${
                  settings.hardwareAcceleration ? 'bg-orange-500' : 'bg-slate-700'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.hardwareAcceleration ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#27293d] bg-[#131524] space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Auto-Reconnect Delay</span>
                  <span className="font-mono text-orange-400 font-bold">{settings.autoReconnectDelay}s</span>
                </div>
                <p className="text-[11px] text-slate-400">Retry time when camera disconnects.</p>
                <div className="flex gap-2 pt-1">
                  {[3, 5, 10, 15].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleChange('autoReconnectDelay', s)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                        settings.autoReconnectDelay === s
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-[#27293d] bg-[#181926] text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Max Stream Resolution Cap */}
            <div className="pt-4 border-t border-[#27293d] space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                Video Grid Max Resolution Cap
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: '1080p', label: '1080p Full HD (Original Resolution)' },
                  { id: '720p', label: '720p HD (Balanced Bandwidth)' },
                  { id: '480p', label: '480p SD (Low Bandwidth Mode)' },
                ].map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleChange('maxStreamResolution', res.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      settings.maxStreamResolution === res.id
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                        : 'border-[#27293d] bg-[#121422] text-slate-400 hover:text-white'
                    }`}
                  >
                    {res.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 4: REGIONAL & WORKSPACE PREFERENCES */}
      {/* ========================================================================= */}
      {activeSubTab === 'regional' && (
        <div className="space-y-6">
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Globe className="w-4 h-4 text-orange-400" />
                <span>Regional & Grid Environment</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure facility name, timezone alignment for security timestamps, and date format.
              </p>
            </div>

            {/* Facility Name */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Surveillance Facility / Site Name
              </label>
              <input
                type="text"
                value={settings.facilityName}
                onChange={(e) => handleChange('facilityName', e.target.value)}
                placeholder="e.g. North Plant Logistics Center"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Timezone & Date Format Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Workspace Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+05:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST, UTC-05:00)</option>
                  <option value="Europe/London">Europe/London (GMT, UTC+00:00)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST, UTC+04:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+08:00)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Date Format
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (31/10/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (10/31/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-10-31)</option>
                </select>
              </div>
            </div>

            {/* Time Format (12h vs 24h) */}
            <div className="pt-3 border-t border-[#27293d] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Clock Time Display Format</span>
                <span className="text-[11px] text-slate-400 block">Choose 12-Hour (AM/PM) or 24-Hour Military format</span>
              </div>
              <div className="flex rounded-xl bg-[#121422] p-1 border border-[#2b2e46]">
                <button
                  type="button"
                  onClick={() => handleChange('timeFormat', '12h')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settings.timeFormat === '12h' ? 'bg-orange-500 text-white' : 'text-slate-400'
                  }`}
                >
                  12-Hour (AM/PM)
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('timeFormat', '24h')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settings.timeFormat === '24h' ? 'bg-orange-500 text-white' : 'text-slate-400'
                  }`}
                >
                  24-Hour Military
                </button>
              </div>
            </div>

            {/* Grid Auto-Refresh Rate */}
            <div className="pt-3 border-t border-[#27293d] space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                Camera Stream Grid Refresh Interval
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Realtime (1s)', val: 1 },
                  { label: 'Every 5s', val: 5 },
                  { label: 'Every 15s', val: 15 },
                  { label: 'Manual Only', val: 0 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleChange('gridRefreshInterval', item.val)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      settings.gridRefreshInterval === item.val
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                        : 'border-[#27293d] bg-[#121422] text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 5: STORAGE, RETENTION & AUDIT */}
      {/* ========================================================================= */}
      {activeSubTab === 'retention' && (
        <div className="space-y-6">
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Snapshot Retention Days */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-orange-400" />
                  <span>Incident Evidence Retention Policy</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-definition violation frames older than this duration will be automatically purged to conserve database storage.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {[
                  { label: '7 Days', days: 7 },
                  { label: '30 Days (Standard)', days: 30 },
                  { label: '90 Days (Quarterly)', days: 90 },
                  { label: '1 Year (Compliance)', days: 365 },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => handleChange('snapshotRetentionDays', item.days)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      settings.snapshotRetentionDays === item.days
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400 shadow-sm'
                        : 'border-[#27293d] bg-[#121422] text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Session Auto-Lock */}
            <div className="pt-4 border-t border-[#27293d] space-y-2">
              <label className="text-xs font-bold text-slate-200 block">
                Session Inactivity Auto-Lock
              </label>
              <p className="text-[11px] text-slate-400">
                Automatically prompts for security pin/password if the surveillance terminal is idle.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {[
                  { label: '15 Minutes', val: 15 },
                  { label: '30 Minutes', val: 30 },
                  { label: '1 Hour', val: 60 },
                  { label: 'Never (Kiosk Mode)', val: 0 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleChange('autoSessionTimeout', item.val)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      settings.autoSessionTimeout === item.val
                        ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                        : 'border-[#27293d] bg-[#121422] text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Logs & Cache Maintenance */}
            <div className="pt-4 border-t border-[#27293d] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#27293d] bg-[#131524] space-y-3">
                <div>
                  <span className="text-xs font-bold text-white block">Export System Audit Configuration</span>
                  <span className="text-[11px] text-slate-400 block">Download complete system settings log in JSON format</span>
                </div>
                <button
                  type="button"
                  onClick={handleExportAuditLog}
                  className="px-4 py-2 rounded-xl bg-[#202538] hover:bg-[#2b324c] text-white text-xs font-bold border border-[#384166] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-orange-400" />
                  <span>Download Audit Log (JSON)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-[#27293d] bg-[#131524] space-y-3">
                <div>
                  <span className="text-xs font-bold text-white block">Purge Local Video Stream Cache</span>
                  <span className="text-[11px] text-slate-400 block">Clears temporary browser memory buffers and resets feeds</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearCacheConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Purge Stream Cache</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. CONFIRMATION MODALS */}
      {/* ========================================================================= */}
      <CustomConfirmDialog
        isOpen={showResetConfirm}
        title="Reset System Settings?"
        message="Are you sure you want to restore all system configuration parameters, AI thresholds, and audio preferences to factory recommended defaults?"
        confirmText="Reset to Defaults"
        cancelText="Cancel"
        variant="warning"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />

      <CustomConfirmDialog
        isOpen={showClearCacheConfirm}
        title="Purge Stream Cache?"
        message="This will clear temporary browser memory buffers, reset local session flags, and re-fetch clean RTSP stream metadata. Active video feeds will momentarily reconnect."
        confirmText="Clear Cache"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmClearCache}
        onCancel={() => setShowClearCacheConfirm(false)}
      />

    </div>
  );
}
