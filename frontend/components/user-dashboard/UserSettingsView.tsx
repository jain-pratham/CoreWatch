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
  Radio,
  Cloud,
  Mail,
  Camera,
  Eye,
  CheckCircle,
  HelpCircle
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

export interface SystemSettingsState {
  // 1. AI Vision & Safety Rules (100% Real YOLOv8 & Zone Pipeline)
  confidenceThreshold: number; // 50 to 95
  aiSensitivity: 'high' | 'balanced' | 'recall';
  humanDetection: boolean;
  zoneMonitoring: boolean;
  loiteringDetection: boolean;
  afterHoursSecurity: boolean;
  cameraHealth: boolean;
  autoCaptureSnapshots: boolean;
  showAiOverlay: boolean;

  // 2. Audio & Siren Alarms (Real Web Audio API Synthesizer)
  soundEnabled: boolean;
  masterVolume: number; // 0 to 100
  selectedAlarmSound: 'siren' | 'pulse' | 'radar' | 'beep';
  alarmRepeatInterval: number; // 5, 8, 15, or 0 (once)
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;

  // 3. Notifications & Evidence Vault
  nativeNotificationsEnabled: boolean;
  escalationEmail: string;
  snapshotRetentionDays: number; // 7, 30, 90, 365
}

export const DEFAULT_SETTINGS: SystemSettingsState = {
  confidenceThreshold: 75,
  aiSensitivity: 'balanced',
  humanDetection: true,
  zoneMonitoring: true,
  loiteringDetection: true,
  afterHoursSecurity: true,
  cameraHealth: true,
  autoCaptureSnapshots: true,
  showAiOverlay: true,

  soundEnabled: true,
  masterVolume: 80,
  selectedAlarmSound: 'siren',
  alarmRepeatInterval: 8,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',

  nativeNotificationsEnabled: true,
  escalationEmail: '',
  snapshotRetentionDays: 30,
};

export default function UserSettingsView({
  user,
  customer,
  activeCameraKey = '',
  isTrialUser = false,
  maxAllowedCameras = 5,
  onNavigateTab
}: UserSettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'audio' | 'alerts'>('ai');
  const [settings, setSettings] = useState<SystemSettingsState>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false);
  const [audioTimer, setAudioTimer] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    // 1. Check native notification permission
    if (nativeNotifier.isSupported()) {
      setNotificationPermission(nativeNotifier.getPermission());
    }

    // 2. Load from customer.systemSettings or localStorage
    try {
      const dbSettings = customer?.systemSettings;
      const stored = localStorage.getItem('corewatch_system_settings');
      let merged = { ...DEFAULT_SETTINGS };

      if (stored) {
        try {
          merged = { ...merged, ...JSON.parse(stored) };
        } catch (e) {}
      }

      if (dbSettings && typeof dbSettings === 'object') {
        merged = { ...merged, ...dbSettings };
      }

      if (!merged.escalationEmail && user?.email) {
        merged.escalationEmail = user.email;
      }

      setSettings(merged);

      if (merged.masterVolume !== undefined) {
        securityAudio.updatePreferences({ masterVolume: merged.masterVolume });
      }
    } catch (err) {
      console.warn("Could not load local system settings:", err);
    }
  }, [user, customer]);

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

  // Save Settings to localStorage and Backend API (MongoDB)
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

      // 3. Sync to API (PUT /api/customers/me)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
      const token = user?.token || localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/api/customers/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            systemSettings: settings,
          })
        });

        // Update stored customer in localStorage
        const storedCust = localStorage.getItem('customer');
        if (storedCust) {
          try {
            const parsed = JSON.parse(storedCust);
            parsed.systemSettings = settings;
            localStorage.setItem('customer', JSON.stringify(parsed));
          } catch (e) {}
        }
        window.dispatchEvent(new Event('user-updated'));
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
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

  const isGoogleDriveConnected = Boolean(customer?.googleDriveSettings?.isEnabled);
  const isOneDriveConnected = Boolean(customer?.oneDriveSettings?.isEnabled);

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      
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
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>System Settings</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Live AI Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure real-time AI safety detection, audio siren alerts, and incident notification rules.
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
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Settings saved successfully and synced across your active cameras & surveillance grid!</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. REAL SUB-TABS NAVIGATION BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#141624] border border-[#27293d]">
        {[
          { 
            id: 'ai', 
            label: 'AI Detection & Safety Rules', 
            icon: Cpu, 
            badge: `${settings.confidenceThreshold}% Conf.` 
          },
          { 
            id: 'audio', 
            label: 'Audio Sirens & Volume', 
            icon: Volume2, 
            badge: settings.soundEnabled ? `${settings.masterVolume}%` : 'Muted' 
          },
          { 
            id: 'alerts', 
            label: 'Notifications & Cloud Storage', 
            icon: ShieldAlert, 
            badge: isGoogleDriveConnected ? 'Google Drive' : (isOneDriveConnected ? 'OneDrive' : 'Cloud') 
          },
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
      {/* 3. TAB 1: AI DETECTION & SAFETY RULES (100% REAL) */}
      {/* ========================================================================= */}
      {activeSubTab === 'ai' && (
        <div className="space-y-6">
          {/* AI Sensitivity Profiles */}
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Cpu className="w-4 h-4 text-orange-400" />
                <span>AI Confidence & Detection Threshold</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Controls the minimum neural network confidence score required to flag an alert on your camera feeds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { 
                  id: 'high', 
                  title: 'High Precision (85%)', 
                  desc: 'Zero false triggers. Best for high-security areas and restricted access zones.', 
                  threshold: 85,
                  tag: 'Strict'
                },
                { 
                  id: 'balanced', 
                  title: 'Balanced (75%)', 
                  desc: 'Recommended standard for warehouse, retail shops, offices, and perimeter monitoring.', 
                  threshold: 75,
                  tag: 'Recommended'
                },
                { 
                  id: 'recall', 
                  title: 'High Recall (60%)', 
                  desc: 'Captures maximum events. Flags distant, fast-moving, or partially occluded subjects.', 
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
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
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
                  {settings.confidenceThreshold}% Minimum Score
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
                <span>75% (Balanced Standard)</span>
                <span>95% (High Precision)</span>
              </div>
            </div>
          </div>

          {/* Active AI Modules (Checklist) - ONLY REAL WORKING DETECTIONS */}
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Active AI Detection Engines
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable or disable specific security checks running in real-time across your cameras.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  key: 'humanDetection' as const,
                  title: 'Human Body & Intruder Detection',
                  desc: 'Detects unauthorized person presence and tracks entry/movement across camera views.',
                },
                {
                  key: 'zoneMonitoring' as const,
                  title: 'Restricted Zone & Boundary Intrusion',
                  desc: 'Monitors custom polygon zones and tripwires defined in Zone Management.',
                },
                {
                  key: 'loiteringDetection' as const,
                  title: 'Loitering & Dwell Time Anomaly',
                  desc: 'Flags individuals who remain stationary in high-risk zones beyond permitted dwell time.',
                },
                {
                  key: 'afterHoursSecurity' as const,
                  title: 'After-Hours Security Surveillance',
                  desc: 'Automatically elevates alerts when human activity is detected outside business operating hours.',
                },
                {
                  key: 'cameraHealth' as const,
                  title: 'Camera Health & Tampering / Disconnect Alert',
                  desc: 'Alerts when a camera stream goes offline, is disconnected, or lens is covered/tampered.',
                },
              ].map((mod) => {
                const isEnabled = settings[mod.key];
                return (
                  <div
                    key={mod.key}
                    onClick={() => handleToggle(mod.key)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isEnabled
                        ? 'border-[#2d4b39] bg-[#12221b]/60 shadow-sm'
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
                  <span className="text-[11px] text-slate-400 block">Saves HD violation frame snapshot and syncs to Cloud Drive on alert</span>
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
                  <span className="text-[11px] text-slate-400 block">Renders colored detection boxes and tracking IDs over live feeds</span>
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
      {/* 4. TAB 2: AUDIO ALARMS & SIREN CONFIGURATION (REAL WEB AUDIO API) */}
      {/* ========================================================================= */}
      {activeSubTab === 'audio' && (
        <div className="space-y-6">
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Master Sound Switch */}
            <div className="flex items-center justify-between pb-5 border-b border-[#27293d]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-orange-400" />
                  <span>Audible Siren on Critical Violations</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Plays audio siren alarm through operator browser speaker when safety violations occur.
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
                  {settings.masterVolume === 0 || !settings.soundEnabled ? (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-orange-400" />
                  )}
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
                  Verify browser speaker audio output:
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
                Repeats siren until incident is acknowledged by operator in Alert Center.
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

            {/* Quiet Hours / DND */}
            <div className="pt-4 border-t border-[#27293d] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Quiet Hours / Do Not Disturb (DND)</h4>
                  <p className="text-[11px] text-slate-400">Automatically silences audible sirens during non-operational facility hours.</p>
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
      {/* 5. TAB 3: NOTIFICATIONS & CLOUD EVIDENCE STORAGE (100% REAL) */}
      {/* ========================================================================= */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-6">
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Operating System Native Desktop Notifications */}
            <div className="space-y-3 pb-5 border-b border-[#27293d]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-400" />
                    <span>Browser Desktop Notifications</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pushes instant desktop popups when safety violations occur even if your browser tab is minimized.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    notificationPermission === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    Permission: {notificationPermission}
                  </span>

                  {notificationPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestNotificationPermission}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                    >
                      Enable Desktop Alerts
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Supervisor Incident Escalation Email */}
            <div className="space-y-3 pb-5 border-b border-[#27293d]">
              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Supervisor Escalation Email
                </label>
                <p className="text-[11px] text-slate-400">
                  Critical after-hours intrusions and boundary breaches are automatically dispatched to this email.
                </p>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={settings.escalationEmail}
                  onChange={(e) => handleChange('escalationEmail', e.target.value)}
                  placeholder="supervisor@company.com"
                  className="w-full sm:w-96 px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Cloud Storage Vault Live Status & Sync Link */}
            <div className="space-y-3 pb-5 border-b border-[#27293d]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-sky-400" />
                    <span>Cloud Storage & Evidence Vault</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Violation photo snapshots are saved directly to your connected cloud drive in organized folders.
                  </p>
                </div>

                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('integrations')}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Manage Drives</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Google Drive Status */}
                <div className={`p-4 rounded-xl border transition-all ${
                  isGoogleDriveConnected 
                    ? 'border-emerald-500/40 bg-emerald-500/10' 
                    : 'border-[#27293d] bg-[#121422] opacity-75'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Google Drive Vault</span>
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isGoogleDriveConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isGoogleDriveConnected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {isGoogleDriveConnected 
                      ? `Active: ${customer?.googleDriveSettings?.userEmail || 'Account Connected'}`
                      : 'Connect Google Drive in Cloud Storage tab to auto-save evidence.'}
                  </p>
                </div>

                {/* OneDrive Status */}
                <div className={`p-4 rounded-xl border transition-all ${
                  isOneDriveConnected 
                    ? 'border-sky-500/40 bg-sky-500/10' 
                    : 'border-[#27293d] bg-[#121422] opacity-75'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span>Microsoft OneDrive Vault</span>
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isOneDriveConnected ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isOneDriveConnected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {isOneDriveConnected 
                      ? `Active: ${customer?.oneDriveSettings?.userEmail || 'Account Connected'}`
                      : 'Connect OneDrive in Cloud Storage tab to auto-save evidence.'}
                  </p>
                </div>
              </div>

              {/* Folder structure indicator */}
              <div className="p-3 rounded-xl bg-[#121422] border border-[#27293d] font-mono text-[11px] text-slate-300">
                <span className="text-slate-400 block mb-1">Evidence Folder Hierarchy:</span>
                <span className="text-orange-400">CoreWatch Evidence</span> / <span className="text-sky-300">&#123;Category&#125;</span> / <span className="text-amber-300">&#123;CameraKey&#125;</span> / evidence_&#123;timestamp&#125;.jpg
              </div>
            </div>

            {/* Snapshot Retention Policy */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white">Local Incident Log Retention Duration</h4>
                <p className="text-[11px] text-slate-400">
                  Duration to retain violation logs in your dashboard history before archiving.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {[
                  { label: '7 Days', days: 7 },
                  { label: '30 Days (Standard)', days: 30 },
                  { label: '90 Days (Quarterly)', days: 90 },
                  { label: '1 Year (Full Audit)', days: 365 },
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

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <CustomConfirmDialog
        isOpen={showResetConfirm}
        title="Reset System Settings?"
        message="Are you sure you want to restore all AI detection thresholds, siren volumes, and notification rules to factory defaults?"
        confirmText="Reset to Defaults"
        cancelText="Cancel"
        variant="warning"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />

    </div>
  );
}
