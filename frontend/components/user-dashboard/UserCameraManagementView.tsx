'use client';

import React, { useState } from 'react';
import { 
  Camera, 
  Video, 
  PlusCircle, 
  Search, 
  Filter, 
  Trash2, 
  Settings, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  Lock, 
  ExternalLink,
  Copy,
  Check,
  Zap,
  ArrowUpCircle,
  Play,
  Radio
} from 'lucide-react';

interface UserCameraManagementViewProps {
  cameras: any[];
  setCameras: React.Dispatch<React.SetStateAction<any[]>>;
  activeCameraKey: string;
  setActiveCameraKey: (key: string) => void;
  user: any;
  customer: any;
  isTrialUser: boolean;
  maxAllowedCameras: number;
  isCameraLimitReached: boolean;
  onOpenAddCamera: () => void;
  openSettingsModal: (cam: any) => void;
  openViewModal: (cam: any) => void;
  handleDeleteCamera: (camKey: string) => void;
  onNavigateTab: (tab: any) => void;
  onOpenDirectConnect?: () => void;
}

export default function UserCameraManagementView({
  cameras,
  setCameras,
  activeCameraKey,
  setActiveCameraKey,
  user,
  customer,
  isTrialUser,
  maxAllowedCameras,
  isCameraLimitReached,
  onOpenAddCamera,
  openSettingsModal,
  openViewModal,
  handleDeleteCamera,
  onNavigateTab,
  onOpenDirectConnect,
}: UserCameraManagementViewProps) {
  const [subTab, setSubTab] = useState<'grid' | 'directory'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [mfgFilter, setMfgFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredCameras = cameras.filter((cam) => {
    const matchesSearch =
      (cam.name && cam.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cam.cameraKey && cam.cameraKey.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cam.ipAddress && cam.ipAddress.includes(searchQuery)) ||
      (cam.locationName && cam.locationName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMfg = mfgFilter === 'ALL' || cam.manufacturer === mfgFilter;
    return matchesSearch && matchesMfg;
  });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27293d] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Video className="w-6 h-6 text-orange-500" />
            <span>Live Camera</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time RTSP surveillance intelligence, multi-camera AI safety grid, and automated inspection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Direct Connect Button for Test Mode */}
          {user?.email === 'test@gmail.com' && onOpenDirectConnect && (
            <button
              onClick={onOpenDirectConnect}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs shadow-md shadow-orange-950/30 flex items-center gap-2 cursor-pointer transition-all"
              title="Directly connect or update camera stream URL"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Direct Connect Feed</span>
            </button>
          )}

          {/* Add Camera Button (Disabled with Lock for Trial limit) */}
          {isTrialUser && (cameras.length >= 1 || isCameraLimitReached) ? (
            <button
              onClick={() => onNavigateTab('subscription_detail')}
              className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
              title="Trial allows 1 camera only. Upgrade to connect more cameras."
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Add Camera (Locked)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">1/1 Node</span>
            </button>
          ) : (
            <button
              onClick={onOpenAddCamera}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-md shadow-orange-950/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Trial Notification Banner if trial user */}
      {isTrialUser && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Free Trial Active (Demo Free)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                  {cameras.length}/{maxAllowedCameras} Camera Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Your trial account includes 1 high-definition camera stream. Upgrade to Enterprise to connect up to 50 concurrent feeds.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Upgrade Plan</span>
          </button>
        </div>
      )}

      {/* VIEW 1: LIVE CAMERAS GRID */}
      {subTab === 'grid' && (
        <div className="space-y-6">
          {cameras.length > 0 ? (
            <div className={`grid grid-cols-1 ${cameras.length > 1 ? 'md:grid-cols-2' : 'max-w-4xl mx-auto'} gap-6`}>
              {cameras.map((camera) => (
                <div 
                  key={camera._id || camera.cameraKey} 
                  className="relative aspect-video w-full bg-[#0a0c16] rounded-2xl border border-[#27293d] overflow-hidden shadow-2xl group select-none hover:border-orange-500/50 transition-all duration-300"
                >
                  {/* Grid overlay & scanlines */}
                  <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-35" />
                  <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />

                  {/* HUD Metadata Overlay */}
                  <div className="absolute top-4 left-4 font-mono text-[9px] text-slate-300 bg-[#121424]/90 border border-[#27293d] px-2.5 py-1.5 rounded-lg z-20 space-y-0.5 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span>{(camera.locationName || camera.name || 'CCTV NODE').toUpperCase()} ({camera.cameraKey})</span>
                    </div>
                    <div>1920 × 1080 @ 30FPS · H.264 RTSP</div>
                    <div className="text-emerald-400 font-bold">● AI OVERLAY ACTIVE</div>
                  </div>

                  {/* Top Right Controls */}
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                    <button
                      onClick={() => openSettingsModal(camera)}
                      className="p-1.5 rounded-lg bg-[#121424]/90 border border-[#27293d] text-slate-300 hover:text-white hover:bg-orange-500 transition-colors cursor-pointer"
                      title="AI Settings"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openViewModal(camera)}
                      className="p-1.5 rounded-lg bg-[#121424]/90 border border-[#27293d] text-slate-300 hover:text-white hover:bg-orange-500 transition-colors cursor-pointer"
                      title="Fullscreen"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* MJPEG Stream Image */}
                  <img 
                    src={`http://localhost:8000/api/camera/stream/${camera.cameraKey}`}
                    alt={`CCTV Stream - ${camera.locationName || camera.name}`}
                    className="w-full h-full object-contain relative z-0"
                    onError={(e) => {
                      // Fallback to crisp high-res mock
                      (e.target as HTMLImageElement).src = "/uploads/warehouse.jpg";
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-2xl border border-dashed border-[#27293d] bg-[#181926]/40 text-center space-y-4 max-w-lg mx-auto shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/20">
                <Camera className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Cameras Connected</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add your first CCTV camera node using RTSP or connect an IP camera to begin streaming real-time AI safety analytics.
                </p>
              </div>
              <button
                onClick={onOpenAddCamera}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs transition-all shadow-lg cursor-pointer"
              >
                + Connect Camera Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: HARDWARE DIRECTORY TABLE */}
      {subTab === 'directory' && (
        <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search cameras by name, key, IP address, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={mfgFilter}
                onChange={(e) => setMfgFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="ALL">All Manufacturers</option>
                <option value="Hikvision">Hikvision</option>
                <option value="Dahua">Dahua</option>
                <option value="Axis">Axis</option>
                <option value="CP Plus">CP Plus</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#27293d] text-slate-400 uppercase font-mono text-[10px] bg-[#131524]">
                <tr>
                  <th className="py-3 px-4">Camera ID / Key</th>
                  <th className="py-3 px-4">Name & Location</th>
                  <th className="py-3 px-4">IP & Port</th>
                  <th className="py-3 px-4">Manufacturer</th>
                  <th className="py-3 px-4">RTSP Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27293d]/60 font-medium">
                {filteredCameras.length > 0 ? (
                  filteredCameras.map((cam) => (
                    <tr key={cam._id || cam.cameraKey} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-orange-400">
                        <div className="flex items-center gap-2">
                          <span>{cam.cameraKey}</span>
                          <button
                            onClick={() => handleCopyKey(cam.cameraKey)}
                            title="Copy Camera Key"
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                          >
                            {copiedKey === cam.cameraKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{cam.name || 'Security Camera'}</div>
                        <div className="text-[10px] text-slate-400">{cam.locationName || 'Main Zone'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {cam.ipAddress ? `${cam.ipAddress}:${cam.port || 554}` : '192.168.1.100:554'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {cam.manufacturer || 'Hikvision'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                        {cam.rtspUrl || `rtsp://.../${cam.cameraKey}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          ONLINE
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openSettingsModal(cam)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                            title="Camera AI Settings"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCamera(cam.cameraKey)}
                            className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-400 hover:text-red-400 cursor-pointer"
                            title="Delete Camera"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No cameras match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
