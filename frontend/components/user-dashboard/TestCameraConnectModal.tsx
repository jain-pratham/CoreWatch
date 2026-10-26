'use client';

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Video, 
  Wifi, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Play, 
  Sparkles, 
  Radio, 
  Plus, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface TestCameraConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToken: string;
  currentStreamUrl?: string;
  activeCameraKey?: string;
  onSuccess: (connectedCamera: any) => void;
}

export default function TestCameraConnectModal({
  isOpen,
  onClose,
  userToken,
  currentStreamUrl = '',
  activeCameraKey,
  onSuccess,
}: TestCameraConnectModalProps) {
  const [streamUrl, setStreamUrl] = useState('');
  const [createNew, setCreateNew] = useState(false);
  const [cameraName, setCameraName] = useState('Direct Test Camera');
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (currentStreamUrl) {
        setStreamUrl(currentStreamUrl);
      } else {
        setStreamUrl('http://192.0.0.4:8080/video');
      }
      setStatusMessage(null);
    }
  }, [isOpen, currentStreamUrl]);

  if (!isOpen) return null;

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = streamUrl.trim();
    if (!cleanUrl) {
      setStatusMessage({ type: 'error', text: 'Please enter a camera stream URL or IP webcam address.' });
      return;
    }

    setIsConnecting(true);
    setStatusMessage({ type: 'info', text: 'Connecting camera feed to AI inference pipeline...' });

    try {
      const res = await fetch('/api/cameras/direct-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          streamUrl: cleanUrl,
          name: cameraName.trim() || 'Direct Test Camera',
          cameraKey: activeCameraKey,
          createNew,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setStatusMessage({
          type: 'success',
          text: `Camera connected successfully! Real-time stream is live.`,
        });

        // Trigger parent callback
        setTimeout(() => {
          onSuccess(data.data);
          onClose();
        }, 800);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to connect camera stream. Please verify URL format.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Network connection error while connecting camera.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const setPreset = (url: string) => {
    setStreamUrl(url);
    setStatusMessage(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-gradient-to-b from-[#181a29] to-[#0f111a] border border-orange-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(249,115,22,0.18)] max-h-[90vh] overflow-y-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent pill */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Video className="w-6 h-6 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[#181a29]"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Test User Mode
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-ping" /> Instant Connect
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight mt-1">
                Connect Live Camera Feed
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational description */}
        <p className="text-xs text-slate-300 mt-4 leading-relaxed">
          No complex credentials, IP, or port setup required. Just enter your live camera URL (or IP Webcam URL), and CoreWatch AI connects directly to the stream.
        </p>

        {/* Quick Presets */}
        <div className="mt-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Stream Presets
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPreset('http://192.0.0.4:8080/video')}
              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Wifi className="w-3 h-3 text-orange-400" /> http://192.0.0.4:8080/video
            </button>
            <button
              type="button"
              onClick={() => setPreset('0')}
              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3 h-3 text-cyan-400" /> 0 (Default Webcam)
            </button>
          </div>
        </div>

        {/* Connection Form */}
        <form onSubmit={handleConnect} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Camera Stream URL <span className="text-orange-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="e.g. http://192.0.0.4:8080/video or rtsp://..."
                className="w-full px-4 py-3.5 rounded-2xl bg-[#0c0d15] border border-white/15 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-white placeholder-slate-500 text-sm font-mono tracking-tight transition-all"
              />
              {streamUrl && (
                <button
                  type="button"
                  onClick={() => setStreamUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Supports Android/iOS IP Webcam (<span className="text-orange-400 font-mono">/video</span>), RTSP (<span className="text-orange-400 font-mono">rtsp://</span>), or numeric device index.
            </p>
          </div>

          {/* Connection Mode Selection */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setCreateNew(false)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                !createNew 
                  ? 'bg-orange-500/15 border-orange-500/60 text-white shadow-md shadow-orange-950/30' 
                  : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className={`w-3.5 h-3.5 ${!createNew ? 'text-orange-400' : 'text-slate-500'}`} />
                <span className="text-xs font-bold">Update Active Stream</span>
              </div>
              <p className="text-[11px] text-slate-400">Directly switch primary live camera feed</p>
            </button>

            <button
              type="button"
              onClick={() => setCreateNew(true)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                createNew 
                  ? 'bg-orange-500/15 border-orange-500/60 text-white shadow-md shadow-orange-950/30' 
                  : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Plus className={`w-3.5 h-3.5 ${createNew ? 'text-orange-400' : 'text-slate-500'}`} />
                <span className="text-xs font-bold">Add As New Camera</span>
              </div>
              <p className="text-[11px] text-slate-400">Keep existing cameras and add this new node</p>
            </button>
          </div>

          {createNew && (
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                New Camera Label
              </label>
              <input
                type="text"
                value={cameraName}
                onChange={(e) => setCameraName(e.target.value)}
                placeholder="e.g. Warehouse 02 or Gate Camera"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0d15] border border-white/15 focus:border-orange-500 text-white text-xs"
              />
            </div>
          )}

          {/* Status Alert Banner */}
          {statusMessage && (
            <div className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-3 animate-in fade-in ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                : statusMessage.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isConnecting}
              className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Skip / Later
            </button>

            <button
              type="submit"
              disabled={isConnecting || !streamUrl.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xs shadow-lg shadow-orange-950/40 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting Stream...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Connect Camera Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
