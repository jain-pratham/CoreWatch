'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Eye, 
  Video, 
  CheckCircle, 
  Clock, 
  Camera, 
  ExternalLink,
  X,
  Info
} from 'lucide-react';
import { securityAudio } from '@/lib/securityAudio';

interface CriticalAlertBannerProps {
  criticalAlert: any | null;
  onAcknowledge: (alertId: string) => Promise<void>;
  onViewCamera: (cameraKey: string) => void;
  onOpenAlertCenter: () => void;
}


function getDisplayableImageUrl(url?: string, cloudFileId?: string): string {
  if (!url && !cloudFileId) return '';
  if (cloudFileId) {
    return `/api/evidence-image?fileId=${cloudFileId}`;
  }
  if (url && (url.includes('lh3.googleusercontent.com') || url.includes('drive.google.com'))) {
    return `/api/evidence-image?url=${encodeURIComponent(url)}`;
  }
  return url || '';
}

export default function CriticalAlertBanner({
  criticalAlert,
  onAcknowledge,
  onViewCamera,
  onOpenAlertCenter
}: CriticalAlertBannerProps) {
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isMuted, setIsMuted] = useState(securityAudio.getGlobalMute());
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!criticalAlert || criticalAlert.status === 'RESOLVED') {
    return null;
  }

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    securityAudio.setGlobalMute(nextMute);
  };

  const handleAcknowledgeClick = async () => {
    if (!criticalAlert._id) return;
    setIsAcknowledging(true);
    try {
      // Silence repeating critical audio siren immediately
      securityAudio.stopCriticalAlarm(criticalAlert._id);
      await onAcknowledge(criticalAlert._id);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const camName = criticalAlert.cameraName || criticalAlert.cameraKey || 'Camera Feed';
  const timestampStr = criticalAlert.timestamp ? new Date(criticalAlert.timestamp).toLocaleTimeString() : 'Just now';

  return (
    <>
      <div className="w-full mb-6 rounded-2xl bg-gradient-to-r from-red-950/90 via-red-900/80 to-[#1e0e14] border-2 border-red-500/80 shadow-[0_0_30px_rgba(239,68,68,0.35)] p-4 sm:p-5 text-white animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* LEFT: Pulsing badge & Incident Details */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="relative shrink-0 mt-0.5 sm:mt-0">
              <div className="w-11 h-11 rounded-xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-6 h-6 animate-pulse text-red-400" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-red-600 text-white shadow-sm">
                  CRITICAL LEVEL 1 INCIDENT
                </span>
                <span className="text-xs font-mono font-semibold text-red-200 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-red-400" /> {camName}
                </span>
                {criticalAlert.zoneName && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-900/60 border border-red-700/60 text-red-200">
                    Zone: {criticalAlert.zoneName}
                  </span>
                )}
                <span className="text-[11px] font-mono text-red-300/80 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-red-400" /> {timestampStr}
                </span>
              </div>

              <p className="text-sm sm:text-base font-bold text-white tracking-tight">
                {criticalAlert.message || 'Restricted perimeter intrusion detected in high-security zone!'}
              </p>

              {(criticalAlert.reason || criticalAlert.description) && (
                <div className="flex items-start gap-1.5 pt-1 text-xs text-red-100 bg-red-950/70 border border-red-700/60 rounded-xl px-3 py-1.5 mt-1.5 shadow-inner">
                  <Info className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span className="font-bold text-red-300 uppercase tracking-wider text-[10px] shrink-0">Trigger Reason:</span>
                  <span className="font-medium text-red-100 leading-snug">{criticalAlert.reason || criticalAlert.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Thumbnail Preview & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-end lg:self-center">
            
            {/* Snapshot Thumbnail if present */}
            {(criticalAlert.imageUrl || criticalAlert.cloudFileId) && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="relative group w-12 h-10 rounded-lg overflow-hidden border border-red-500/50 bg-black/60 shrink-0 cursor-pointer shadow-sm hover:border-red-400 transition-all"
                title="Click to view full snapshot"
              >
                <img
                  src={getDisplayableImageUrl(criticalAlert.imageUrl, criticalAlert.cloudFileId)} referrerPolicy="no-referrer"
                  alt="Incident snapshot"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3.5 h-3.5 text-white" />
                </div>
              </button>
            )}

            {/* Mute Alarm Toggle */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isMuted
                  ? 'bg-red-950/60 border-red-800 text-red-300 hover:text-white'
                  : 'bg-red-500/20 border-red-500 text-red-200 hover:bg-red-500/30'
              }`}
              title={isMuted ? 'Unmute security alarm' : 'Mute repeating siren'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-red-400 animate-bounce" />}
              <span className="hidden sm:inline text-[11px]">{isMuted ? 'Muted' : 'Siren Active'}</span>
            </button>

            {/* View Camera Button */}
            <button
              type="button"
              onClick={() => onViewCamera(criticalAlert.cameraKey)}
              className="px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Video className="w-3.5 h-3.5 text-orange-400" />
              <span>View Camera</span>
            </button>

            {/* Alert Center Button */}
            <button
              type="button"
              onClick={onOpenAlertCenter}
              className="px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Open Incident Center"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Incident Log</span>
            </button>

            {/* Acknowledge Button */}
            <button
              type="button"
              disabled={isAcknowledging || criticalAlert.status === 'ACKNOWLEDGED'}
              onClick={handleAcknowledgeClick}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{isAcknowledging ? 'Acknowledging...' : criticalAlert.status === 'ACKNOWLEDGED' ? 'Acknowledged' : 'Acknowledge Alert'}</span>
            </button>

          </div>
        </div>
      </div>

      {/* Snapshot Lightbox Preview Modal */}
      {previewOpen && (criticalAlert.imageUrl || criticalAlert.cloudFileId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full bg-[#161826] border border-[#2b304c] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#2b304c] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" /> Critical Incident Snapshot: {camName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">{timestampStr}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black/80 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={getDisplayableImageUrl(criticalAlert.imageUrl, criticalAlert.cloudFileId)} referrerPolicy="no-referrer"
                alt="Security incident evidence"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg border border-red-500/40"
              />
            </div>
            <div className="p-3 bg-[#121422] border-t border-[#2b304c] flex items-center justify-between">
              {(criticalAlert.cloudViewLink || criticalAlert.cloudFileId) ? (
                <a
                  href={criticalAlert.cloudViewLink || `https://drive.google.com/file/d/${criticalAlert.cloudFileId}/view?usp=sharing`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Google Drive</span>
                </a>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
