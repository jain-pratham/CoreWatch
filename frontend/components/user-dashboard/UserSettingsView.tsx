'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Key, 
  CreditCard, 
  Bell, 
  Copy, 
  Check, 
  Shield, 
  ArrowUpCircle, 
  CheckCircle2, 
  Receipt,
  Download,
  Volume2,
  VolumeX,
  Play,
  ShieldAlert,
  Clock,
  Sliders
} from 'lucide-react';
import { securityAudio } from '@/lib/securityAudio';
import { nativeNotifier } from '@/lib/nativeNotifier';

interface UserSettingsViewProps {
  user: any;
  customer: any;
  activeCameraKey: string;
  isTrialUser: boolean;
  maxAllowedCameras: number;
  dbInvoices: any[];
  onUpgradePlan: () => void;
}

export default function UserSettingsView({
  user,
  customer,
  activeCameraKey,
  isTrialUser,
  maxAllowedCameras,
  dbInvoices,
  onUpgradePlan
}: UserSettingsViewProps) {
  const [subTab, setSubTab] = useState<'profile' | 'key' | 'billing' | 'notifications'>('profile');
  const [copiedKey, setCopiedKey] = useState(false);
  const [name, setName] = useState(user?.name || 'Asha Roya');
  const [company, setCompany] = useState(user?.company || customer?.company || 'CoreWatch Safety Systems');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notification Preferences State
  const [prefs, setPrefs] = useState({
    nativeNotificationsEnabled: true,
    soundEnabled: true,
    criticalSound: true,
    highSound: true,
    mediumSound: true,
    lowSound: false,
    masterVolume: 80,
    criticalAlarmRepeatInterval: 8,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    escalationTimeoutMinutes: 5,
    escalationSupervisorEmail: "",
  });
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  useEffect(() => {
    if (nativeNotifier.isSupported()) {
      setNotificationPermission(nativeNotifier.getPermission());
    }
    // Load preferences
    const loadPrefs = async () => {
      try {
        const token = user?.token || localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/user/notification-preferences', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setPrefs(prev => ({ ...prev, ...data.data }));
          securityAudio.updatePreferences(data.data);
        }
      } catch (e) {
        console.warn("Could not fetch notification preferences:", e);
      }
    };
    loadPrefs();
  }, [user]);

  const handleRequestNativePermission = async () => {
    const res = await nativeNotifier.requestPermission();
    setNotificationPermission(res);
  };

  const handleSaveNotificationPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefsSaving(true);
    setPrefsSuccess(false);
    try {
      const token = user?.token || localStorage.getItem('token');
      securityAudio.updatePreferences(prefs);
      const res = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(prefs)
      });
      const data = await res.json();
      if (data.success) {
        setPrefsSuccess(true);
        setTimeout(() => setPrefsSuccess(false), 2500);
      }
    } catch {
      alert("Failed to save preferences.");
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleCopyKey = () => {
    if (!activeCameraKey) return;
    navigator.clipboard.writeText(activeCameraKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27293d] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Settings & Account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal profile, secure AI engine camera integration keys, and subscription billing.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex rounded-xl bg-[#1e2136] p-1 border border-[#2d3252] self-start sm:self-auto">
          <button
            onClick={() => setSubTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'profile'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setSubTab('key')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'key'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>AI Camera Key</span>
          </button>
          <button
            onClick={() => setSubTab('billing')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'billing'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Subscription</span>
          </button>
          <button
            onClick={() => setSubTab('notifications')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'notifications'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Alert Preferences</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: PROFILE */}
      {subTab === 'profile' && (
        <div className="max-w-2xl border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-[#27293d]">
            <img
              src="/uploads/avatar_asha.jpg"
              alt={name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-orange-500/40"
            />
            <div>
              <h3 className="text-base font-bold text-white">{name}</h3>
              <p className="text-xs text-slate-400 font-mono">{user?.email || 'asha.roya@corewatch.ai'}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                ADMINISTRATIVE SUBSCRIBER
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Company / Organization
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Work Email (Read Only)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'asha.roya@corewatch.ai'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422]/50 text-slate-400 text-xs font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Profile saved successfully!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 2: AI CAMERA KEY CONFIGURATION */}
      {subTab === 'key' && (
        <div className="max-w-2xl border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#27293d]">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Key className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Active Camera Key</h3>
              <p className="text-xs text-slate-400">Unique cryptographic authentication token for your AI microservice edge agent.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121422] border border-[#27293d] space-y-3">
            <span className="text-xs font-bold text-slate-300 block">
              Configure this key in your AI Service .env file (CAMERA_KEY)
            </span>

            {activeCameraKey ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeCameraKey}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#2b2e46] bg-[#1a1d2e] text-orange-400 text-xs font-mono font-bold focus:outline-none"
                />
                <button
                  onClick={handleCopyKey}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-400 text-white transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-mono">Generating unique key...</div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#202742]/40 border border-[#2e375c] text-xs text-slate-300 space-y-2">
            <span className="font-bold text-[#4d7cfe] flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Instructions for Python AI Service
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              Open <span className="text-white">ai-service/.env</span> and ensure:
              <br />
              <span className="text-orange-400">CAMERA_KEY={activeCameraKey || 'YOUR_KEY_HERE'}</span>
              <br />
              <span className="text-slate-400">BACKEND_URL=http://localhost:5000</span>
            </p>
          </div>
        </div>
      )}

      {/* VIEW 3: SUBSCRIPTION & BILLING */}
      {subTab === 'billing' && (
        <div className="max-w-3xl space-y-6">
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27293d]">
              <div>
                <h3 className="text-base font-bold text-white">Current Subscription Tier</h3>
                <p className="text-xs text-slate-400">Real-time status of your AI processing quota and node licenses.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#121422] border border-[#27293d] space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Plan Tier</span>
                <p className="text-lg font-black text-white">{customer?.plan || (isTrialUser ? 'Demo Free' : 'Enterprise Pro')}</p>
                <span className="text-[10px] text-orange-400 font-medium">Billed Annually</span>
              </div>
              <div className="p-4 rounded-xl bg-[#121422] border border-[#27293d] space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Camera Quota</span>
                <p className="text-lg font-black text-white">{maxAllowedCameras} Nodes</p>
                <span className="text-[10px] text-slate-400 font-medium">Concurrent RTSP channels</span>
              </div>
              <div className="p-4 rounded-xl bg-[#121422] border border-[#27293d] space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">AI Safety Modules</span>
                <p className="text-lg font-black text-white">Full Suite</p>
                <span className="text-[10px] text-emerald-400 font-medium">PPE, Intrusion, Crowd</span>
              </div>
            </div>

            {isTrialUser && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={onUpgradePlan}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Upgrade to Enterprise Unlimited</span>
                </button>
              </div>
            )}
          </div>

          {/* Billing Receipts Table */}
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">
              Invoices & Payment Receipts
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#27293d] text-slate-400 uppercase font-mono text-[10px] bg-[#131524]">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27293d]/60 font-medium">
                  {[
                    { id: 'INV-2026-001', date: 'Oct 01, 2026', desc: 'Enterprise CCTV AI License - 5 Nodes', amt: '$499.00', status: 'Paid' },
                    { id: 'INV-2026-002', date: 'Sep 01, 2026', desc: 'Enterprise CCTV AI License - 5 Nodes', amt: '$499.00', status: 'Paid' },
                    { id: 'INV-2026-003', date: 'Aug 01, 2026', desc: 'Enterprise CCTV AI License - 5 Nodes', amt: '$499.00', status: 'Paid' },
                  ].map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-orange-400">{inv.id}</td>
                      <td className="py-3 px-4 text-slate-300">{inv.date}</td>
                      <td className="py-3 px-4 text-white">{inv.desc}</td>
                      <td className="py-3 px-4 font-bold text-white">{inv.amt}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: SECURITY ALERT & NOTIFICATION PREFERENCES */}
      {subTab === 'notifications' && (
        <form onSubmit={handleSaveNotificationPreferences} className="max-w-2xl space-y-6">
          
          {/* SECTION 1: NATIVE OPERATING SYSTEM NOTIFICATIONS */}
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27293d]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-400" /> Operating System Notifications
                </h3>
                <p className="text-xs text-slate-400">Receive real-time desktop notifications for security incidents.</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : notificationPermission === 'denied'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {notificationPermission === 'granted'
                  ? 'Permission Granted'
                  : notificationPermission === 'denied'
                  ? 'Blocked by Browser'
                  : 'Action Required'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#121422] border border-[#27293d]">
              <div>
                <span className="text-xs font-bold text-white block">Desktop Notifications API</span>
                <span className="text-[11px] text-slate-400 block">
                  {notificationPermission === 'granted'
                    ? 'Native OS popups are active for high & critical alarms.'
                    : 'Click button to allow system notifications in your browser.'}
                </span>
              </div>
              {notificationPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={handleRequestNativePermission}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
                >
                  Enable OS Alerts
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPrefs(prev => ({ ...prev, nativeNotificationsEnabled: !prev.nativeNotificationsEnabled }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                    prefs.nativeNotificationsEnabled ? 'bg-orange-500' : 'bg-slate-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    prefs.nativeNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              )}
            </div>
          </div>

          {/* SECTION 2: AUDIO ALARMS & SIRENS */}
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27293d]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-orange-400" /> Security Audio Alarms & Sirens
                </h3>
                <p className="text-xs text-slate-400">Synthesized Web Audio warning tones for operational and security incidents.</p>
              </div>
              <button
                type="button"
                onClick={() => setPrefs(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  prefs.soundEnabled
                    ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {prefs.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{prefs.soundEnabled ? 'Audio On' : 'All Muted'}</span>
              </button>
            </div>

            {/* Master Volume Slider */}
            <div className="p-3.5 rounded-xl bg-[#121422] border border-[#27293d] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Master Alarm Volume</span>
                <span className="font-mono text-orange-400 font-bold">{prefs.masterVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={prefs.masterVolume}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setPrefs(prev => ({ ...prev, masterVolume: val }));
                  securityAudio.updatePreferences({ masterVolume: val });
                }}
                className="w-full h-1.5 bg-[#27293d] rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            {/* Severity Sound Controls */}
            <div className="space-y-2.5">
              
              {/* Critical Sound */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#121422] border border-red-500/30 gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-600 text-white">CRITICAL</span>
                    <span className="text-xs font-bold text-white">Dual-Tone Repeating Siren</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">Repeats every {prefs.criticalAlarmRepeatInterval}s until acknowledged</span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => securityAudio.testTone('CRITICAL')}
                    className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Test Critical Siren Tone"
                  >
                    <Play className="w-3 h-3" /> Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrefs(prev => ({ ...prev, criticalSound: !prev.criticalSound }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                      prefs.criticalSound ? 'bg-red-600' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      prefs.criticalSound ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* High Sound */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#121422] border border-orange-500/30 gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-orange-500 text-white">HIGH</span>
                    <span className="text-xs font-bold text-white">Double Rising Warning Pulse</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">Suspicious pacing & after-hours security breach</span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => securityAudio.testTone('HIGH')}
                    className="p-1.5 rounded-lg bg-orange-950/60 hover:bg-orange-900 border border-orange-800 text-orange-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Test High Warning Tone"
                  >
                    <Play className="w-3 h-3" /> Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrefs(prev => ({ ...prev, highSound: !prev.highSound }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                      prefs.highSound ? 'bg-orange-500' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      prefs.highSound ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Medium Sound */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#121422] border border-[#27293d] gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">MEDIUM</span>
                    <span className="text-xs font-bold text-white">Single Operational Chime</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">Camera offline & hardware tampering alerts</span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => securityAudio.testTone('MEDIUM')}
                    className="p-1.5 rounded-lg bg-[#181a29] hover:bg-white/10 border border-[#2b304c] text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Test Medium Chime"
                  >
                    <Play className="w-3 h-3" /> Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrefs(prev => ({ ...prev, mediumSound: !prev.mediumSound }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                      prefs.mediumSound ? 'bg-orange-500' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      prefs.mediumSound ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 3: ESCALATION & POLICY */}
          <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="pb-3 border-b border-[#27293d]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" /> Incident Escalation Policy
              </h3>
              <p className="text-xs text-slate-400">Escalate unacknowledged critical incidents to senior supervisory personnel.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Escalation Threshold (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={prefs.escalationTimeoutMinutes}
                  onChange={(e) => setPrefs(prev => ({ ...prev, escalationTimeoutMinutes: parseInt(e.target.value, 10) || 5 }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b304c] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Supervisor Escalation Email
                </label>
                <input
                  type="email"
                  value={prefs.escalationSupervisorEmail}
                  onChange={(e) => setPrefs(prev => ({ ...prev, escalationSupervisorEmail: e.target.value }))}
                  placeholder="supervisor@securitylead.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b304c] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex items-center justify-between">
            {prefsSuccess ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Security notification preferences saved successfully!
              </span>
            ) : <div />}

            <button
              type="submit"
              disabled={prefsSaving}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              {prefsSaving ? 'Saving...' : 'Save Notification Preferences'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
