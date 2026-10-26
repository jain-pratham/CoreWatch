'use client';

import React, { useState, useEffect, useMemo } from 'react';
import UserNavbar from './UserNavbar';
import UserOverviewView from './UserOverviewView';
import UserCameraManagementView from './UserCameraManagementView';
import UserContentManagementView from './UserContentManagementView';
import UserSettingsView from './UserSettingsView';
import ZoneManagementView from '../zones/ZoneManagementView';
import TestCameraConnectModal from './TestCameraConnectModal';
import CriticalAlertBanner from './CriticalAlertBanner';
import SecurityAlertCenterView from './SecurityAlertCenterView';
import { securityAudio } from '@/lib/securityAudio';
import { 
  X, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Video, 
  PlusCircle, 
  UserPlus,
  Bell,
  UserCircle,
  History,
  CreditCard,
  Settings,
  Shield,
  ArrowUpCircle,
  HardDrive
} from 'lucide-react';

interface UserDashboardContainerProps {
  user: any;
  customer: any;
  cameras: any[];
  setCameras: React.Dispatch<React.SetStateAction<any[]>>;
  dbAlerts: any[];
  setDbAlerts?: React.Dispatch<React.SetStateAction<any[]>>;
  dbInvoices: any[];
  activeCameraKey: string;
  setActiveCameraKey: (key: string) => void;
  isTrialUser: boolean;
  maxAllowedCameras: number;
  isCameraLimitReached: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  // Camera Modal functions from page
  openViewModal: (cam: any) => void;
  openSettingsModal: (cam: any) => void;
  handleDeleteCamera: (camKey: string) => void;
  selectedViewCamera: any;
  setSelectedViewCamera: (cam: any) => void;
  selectedSettingsCamera: any;
  setSelectedSettingsCamera: (cam: any) => void;
  settingsTab: 'ai' | 'device';
  setSettingsTab: (tab: 'ai' | 'device') => void;
  handleToggleModalFeature: (featureName: string, currentValue: boolean) => Promise<void>;
  editForm: any;
  setEditForm: (form: any) => void;
  handleSaveDeviceSettings: (e: React.FormEvent) => Promise<void>;
  isSavingDeviceSettings: boolean;
  settingsSuccessMsg: string | null;
  settingsErrorMsg: string | null;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  // Add camera form state
  camName: string;
  setCamName: (v: string) => void;
  camIp: string;
  setCamIp: (v: string) => void;
  camPort: string;
  setCamPort: (v: string) => void;
  camUsername: string;
  setCamUsername: (v: string) => void;
  camPassword: string;
  setCamPassword: (v: string) => void;
  camRtsp: string;
  setCamRtsp: (v: string) => void;
  camMfg: string;
  setCamMfg: (v: string) => void;
  camLocation: string;
  setCamLocation: (v: string) => void;
  isTesting: boolean;
  isAdding: boolean;
  connectionStatus: { success: boolean; message: string } | null;
  testCameraConnection: () => Promise<void>;
  handleAddCameraSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function UserDashboardContainer({
  user,
  customer,
  cameras,
  setCameras,
  dbAlerts,
  setDbAlerts,
  dbInvoices,
  activeCameraKey,
  setActiveCameraKey,
  isTrialUser,
  maxAllowedCameras,
  isCameraLimitReached,
  activeTab,
  setActiveTab,
  onLogout,
  openViewModal,
  openSettingsModal,
  handleDeleteCamera,
  selectedViewCamera,
  setSelectedViewCamera,
  selectedSettingsCamera,
  setSelectedSettingsCamera,
  settingsTab,
  setSettingsTab,
  handleToggleModalFeature,
  editForm,
  setEditForm,
  handleSaveDeviceSettings,
  isSavingDeviceSettings,
  settingsSuccessMsg,
  settingsErrorMsg,
  showPassword,
  setShowPassword,
  camName,
  setCamName,
  camIp,
  setCamIp,
  camPort,
  setCamPort,
  camUsername,
  setCamUsername,
  camPassword,
  setCamPassword,
  camRtsp,
  setCamRtsp,
  camMfg,
  setCamMfg,
  camLocation,
  setCamLocation,
  isTesting,
  isAdding,
  connectionStatus,
  testCameraConnection,
  handleAddCameraSubmit,
}: UserDashboardContainerProps) {
  const [addCameraModalOpen, setAddCameraModalOpen] = useState(false);
  const [inviteUserModalOpen, setInviteUserModalOpen] = useState(false);

  // Active Critical Alert and severity counts for professional security response
  const activeCriticalAlert = useMemo(() => {
    return dbAlerts.find(
      (a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED' && a.status !== 'ACKNOWLEDGED'
    ) || null;
  }, [dbAlerts]);

  const criticalCount = useMemo(() => {
    return dbAlerts.filter(
      (a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED'
    ).length;
  }, [dbAlerts]);

  const unacknowledgedCount = useMemo(() => {
    return dbAlerts.filter(
      (a) => a.status === 'NEW' || !a.status
    ).length;
  }, [dbAlerts]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '')}`
        },
        body: JSON.stringify({ alertId, action: 'ACKNOWLEDGE' })
      });
      const data = await res.json();
      if (data.success && data.data && setDbAlerts) {
        setDbAlerts((prev) => prev.map(a => a._id === alertId ? { ...a, ...data.data, status: 'ACKNOWLEDGED' } : a));
      }
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
    }
  };

  const handleResolveAlert = async (alertId: string, notes: string) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '')}`
        },
        body: JSON.stringify({ alertId, action: 'RESOLVE', notes })
      });
      const data = await res.json();
      if (data.success && data.data && setDbAlerts) {
        setDbAlerts((prev) => prev.map(a => a._id === alertId ? { ...a, ...data.data, status: 'RESOLVED', resolutionNotes: notes } : a));
      }
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };

  // Test User Direct Camera Stream Modal
  const isTestUser = user?.email === 'test@gmail.com';
  const [testCameraModalOpen, setTestCameraModalOpen] = useState(false);

  useEffect(() => {
    if (isTestUser) {
      const pendingPopup = sessionStorage.getItem('openDirectConnectModal');
      // If user just logged in or fresh session
      if (pendingPopup === 'true' || pendingPopup === null) {
        setTestCameraModalOpen(true);
        sessionStorage.setItem('openDirectConnectModal', 'false');
      }
    }
  }, [isTestUser, user?.email]);

  const handleTestCameraSuccess = (connectedCam: any) => {
    setCameras((prev) => {
      const idx = prev.findIndex((c) => c.cameraKey === connectedCam.cameraKey);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = connectedCam;
        return updated;
      }
      return [connectedCam, ...prev];
    });
    setActiveCameraKey(connectedCam.cameraKey);
    setActiveTab('live_camera');
  };

  const activeCam = cameras.find((c) => c.cameraKey === activeCameraKey) || cameras[0];
  const currentStreamUrl = activeCam?.streamUrl || activeCam?.rtspUrl || 'http://192.0.0.4:8080/video';

  return (
    <div className="min-h-screen bg-[#0e0f18] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* 1. TOP HORIZONTAL NAVBAR */}
      <UserNavbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        onLogout={onLogout}
        activeCameraKey={activeCameraKey}
        isTrialUser={isTrialUser}
        cameraCount={cameras.length}
        isCameraLimitReached={isCameraLimitReached}
        criticalCount={criticalCount}
        unacknowledgedCount={unacknowledgedCount}
        onOpenAddCamera={() => setAddCameraModalOpen(true)}
        onOpenDirectConnect={() => setTestCameraModalOpen(true)}
      />

      {/* 2. MAIN CONTAINER AREA */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* PERSISTENT CRITICAL SECURITY INCIDENT BANNER */}
        <CriticalAlertBanner
          criticalAlert={activeCriticalAlert}
          onAcknowledge={handleAcknowledgeAlert}
          onViewCamera={(camKey) => {
            setActiveCameraKey(camKey);
            setActiveTab('live_camera');
          }}
          onOpenAlertCenter={() => setActiveTab('notification')}
        />
        
        {/* ========================================================================= */}
        {/* 1. DASHBOARD OVERVIEW (NEW REFERENCE IMAGE UI) */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <UserOverviewView
            user={user}
            cameras={cameras}
            dbAlerts={dbAlerts}
            onNavigateTab={setActiveTab}
            onOpenAddCamera={() => setAddCameraModalOpen(true)}
            onOpenInviteUser={() => setInviteUserModalOpen(true)}
          />
        )}

        {/* ========================================================================= */}
        {/* 2. LIVE CAMERA VIEW */}
        {/* ========================================================================= */}
        {activeTab === 'live_camera' && (
          <UserCameraManagementView
            cameras={cameras}
            setCameras={setCameras}
            activeCameraKey={activeCameraKey}
            setActiveCameraKey={setActiveCameraKey}
            user={user}
            customer={customer}
            isTrialUser={isTrialUser}
            maxAllowedCameras={maxAllowedCameras}
            isCameraLimitReached={isCameraLimitReached}
            onOpenAddCamera={() => setAddCameraModalOpen(true)}
            onOpenDirectConnect={() => setTestCameraModalOpen(true)}
            openSettingsModal={openSettingsModal}
            openViewModal={openViewModal}
            handleDeleteCamera={handleDeleteCamera}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* ========================================================================= */}
        {/* 3. CAMERA HUB (ALL CAMERAS & ADD CAMERA) */}
        {/* ========================================================================= */}
        {(activeTab === 'all_cameras' || activeTab === 'camera_hub' || activeTab === 'add_camera') && (
          <UserCameraManagementView
            cameras={cameras}
            setCameras={setCameras}
            activeCameraKey={activeCameraKey}
            setActiveCameraKey={setActiveCameraKey}
            user={user}
            customer={customer}
            isTrialUser={isTrialUser}
            maxAllowedCameras={maxAllowedCameras}
            isCameraLimitReached={isCameraLimitReached}
            onOpenAddCamera={() => setAddCameraModalOpen(true)}
            onOpenDirectConnect={() => setTestCameraModalOpen(true)}
            openSettingsModal={openSettingsModal}
            openViewModal={openViewModal}
            handleDeleteCamera={handleDeleteCamera}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* ========================================================================= */}
        {/* 4. SECURITY ZONES */}
        {/* ========================================================================= */}
        {activeTab === 'zones' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27293d] pb-5">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Security Zones Configuration
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Draw perimeter zones, define restricted access areas, and configure intrusion boundaries.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#181926] border border-[#27293d] p-6 shadow-xl">
              <ZoneManagementView
                activeCameraKey={activeCameraKey}
                setActiveCameraKey={setActiveCameraKey}
                cameras={cameras}
                user={user}
                apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. BILLING & INVOICES & SUBSCRIPTION */}
        {/* ========================================================================= */}
        {(activeTab === 'invoices' || activeTab === 'subscription_detail' || activeTab === 'billing') && (
          <UserSettingsView
            user={user}
            customer={customer}
            activeCameraKey={activeCameraKey}
            isTrialUser={isTrialUser}
            maxAllowedCameras={maxAllowedCameras}
            dbInvoices={dbInvoices}
            onUpgradePlan={() => setActiveTab('subscription_detail')}
          />
        )}

        {/* ========================================================================= */}
        {/* 6. EVENT HISTORY */}
        {/* ========================================================================= */}
        {activeTab === 'event_history' && (
          <UserContentManagementView dbAlerts={dbAlerts} />
        )}

        {/* ========================================================================= */}
        {/* 7. SECURITY INCIDENT ALERT CENTER */}
        {/* ========================================================================= */}
        {(activeTab === 'notification' || activeTab === 'alert_center') && (
          <SecurityAlertCenterView
            alerts={dbAlerts}
            cameras={cameras}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onResolveAlert={handleResolveAlert}
            onViewCamera={(camKey) => {
              setActiveCameraKey(camKey);
              setActiveTab('live_camera');
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 8. PROFILE & SETTINGS */}
        {/* ========================================================================= */}
        {(activeTab === 'profile' || activeTab === 'settings') && (
          <UserSettingsView
            user={user}
            customer={customer}
            activeCameraKey={activeCameraKey}
            isTrialUser={isTrialUser}
            maxAllowedCameras={maxAllowedCameras}
            dbInvoices={dbInvoices}
            onUpgradePlan={() => setActiveTab('subscription_detail')}
          />
        )}

      </main>

      {/* ========================================================================= */}
      {/* ADD CAMERA MODAL */}
      {/* ========================================================================= */}
      {addCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-[#161826] border border-[#2b304c] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#2b304c]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Connect New CCTV Camera</h3>
                  <p className="text-xs text-slate-400">Configure IP camera RTSP endpoint or hardware discovery</p>
                </div>
              </div>
              <button
                onClick={() => setAddCameraModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              await handleAddCameraSubmit(e);
              setAddCameraModalOpen(false);
            }} className="space-y-4 pt-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Camera Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Loading Bay 01"
                    value={camName}
                    onChange={(e) => setCamName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Location / Zone Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Warehouse North"
                    value={camLocation}
                    onChange={(e) => setCamLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    IP Address / Host <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.1.120"
                    value={camIp}
                    onChange={(e) => setCamIp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-mono font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Port
                  </label>
                  <input
                    type="text"
                    value={camPort}
                    onChange={(e) => setCamPort(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-mono font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    RTSP Username
                  </label>
                  <input
                    type="text"
                    placeholder="admin"
                    value={camUsername}
                    onChange={(e) => setCamUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    RTSP Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={camPassword}
                      onChange={(e) => setCamPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Manufacturer Preset
                </label>
                <select
                  value={camMfg}
                  onChange={(e) => setCamMfg(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                >
                  <option value="Hikvision">Hikvision (rtsp://admin:pass@ip:port/Streaming/Channels/101)</option>
                  <option value="Dahua">Dahua (rtsp://admin:pass@ip:port/cam/realmonitor?channel=1&subtype=0)</option>
                  <option value="Axis">Axis (rtsp://admin:pass@ip:port/axis-media/media.amp)</option>
                  <option value="CP Plus">CP Plus (rtsp://admin:pass@ip:port/cam/realmonitor)</option>
                  <option value="Custom">Custom RTSP URL</option>
                </select>
              </div>

              {connectionStatus && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  connectionStatus.success ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}>
                  {connectionStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{connectionStatus.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={testCameraConnection}
                  className="px-4 py-2 rounded-xl bg-[#202338] hover:bg-[#2b2f4c] text-white font-bold text-xs border border-[#2e3455] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{isTesting ? 'Testing Feed...' : 'Test Connection'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddCameraModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    <span>{isAdding ? 'Adding Node...' : 'Connect Camera'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INVITE USER MODAL */}
      {/* ========================================================================= */}
      {inviteUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#161826] border border-[#2b304c] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#2b304c]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Add / Invite User</h3>
              </div>
              <button
                onClick={() => setInviteUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              alert('Invitation successfully sent to user!');
              setInviteUserModalOpen(false);
            }} className="space-y-4 pt-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex.morgan@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Role
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Security Lead">Security Lead</option>
                  <option value="Operator">Operator</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInviteUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAMERA SETTINGS MODAL */}
      {/* ========================================================================= */}
      {selectedSettingsCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#161826] border border-[#2b304c] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#2b304c]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Camera Configuration</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedSettingsCamera.cameraKey}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSettingsCamera(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {[
                { 
                  key: 'zoneMonitoring', 
                  label: 'Zone Monitoring Alerts',
                  desc: 'Real-time alerts for restricted boundary breaches, dwell time, and zone intrusions'
                },
                { 
                  key: 'suspiciousMovement', 
                  label: 'Suspicious Movement',
                  desc: 'Alert on pacing, loitering, and irregular movement patterns across camera view'
                },
                { 
                  key: 'afterHoursSecurity', 
                  label: 'After-Hours Security',
                  desc: 'Instant alerts when human presence is detected outside business operating hours'
                },
                { 
                  key: 'cameraHealth', 
                  label: 'Camera Health & Hardware Security',
                  desc: 'Alert on stream drops, hardware disconnects, lens obstruction, and tampering'
                }
              ].map((feat) => {
                const isActive = selectedSettingsCamera[feat.key] !== false;
                return (
                  <div key={feat.key} className="flex items-center justify-between p-3.5 rounded-xl bg-[#121422] border border-[#27293d] gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">{feat.label}</span>
                      <span className="text-[11px] text-slate-400 block">{feat.desc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleModalFeature(feat.key, isActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                        isActive ? 'bg-orange-500' : 'bg-slate-700'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isActive ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSettingsCamera(null)}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAMERA FULLSCREEN VIEW MODAL */}
      {/* ========================================================================= */}
      {selectedViewCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl bg-[#121422] border border-[#27293d] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#27293d] bg-[#161826]">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {selectedViewCamera.name || 'CCTV Feed'} ({selectedViewCamera.cameraKey})
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedViewCamera.locationName} · 1920x1080 @ 30FPS · H.264
                </p>
              </div>
              <button
                onClick={() => setSelectedViewCamera(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              <img
                src={`http://localhost:8000/api/camera/stream/${selectedViewCamera.cameraKey}`}
                alt="Camera Stream"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/uploads/warehouse.jpg';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. TEST USER DIRECT CAMERA STREAM MODAL */}
      <TestCameraConnectModal
        isOpen={testCameraModalOpen}
        onClose={() => setTestCameraModalOpen(false)}
        userToken={user?.token || ''}
        currentStreamUrl={currentStreamUrl}
        activeCameraKey={activeCameraKey || activeCam?.cameraKey || 'CAM-1F8IPF'}
        onSuccess={handleTestCameraSuccess}
      />

    </div>
  );
}
