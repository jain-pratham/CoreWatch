'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, 
  HardDrive, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  FolderOpen, 
  Trash2, 
  UploadCloud, 
  Check, 
  Layers, 
  Eye, 
  ShieldCheck,
  FileImage,
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';

interface IntegrationState {
  activeProvider: 'google_drive' | 'onedrive' | null;
  googleDrive: {
    isConnected: boolean;
    isEnabled: boolean;
    userEmail: string | null;
    rootFolderId: string | null;
    folderPath: string;
  };
  oneDrive: {
    isConnected: boolean;
    isEnabled: boolean;
    userEmail: string | null;
    rootFolderId: string | null;
    folderPath: string;
  };
}

interface CloudStorageIntegrationViewProps {
  user: {
    name?: string;
    email?: string;
    role?: string;
    token?: string;
  } | null;
  customer?: any;
}

export default function CloudStorageIntegrationView({
  user,
  customer,
}: CloudStorageIntegrationViewProps) {
  const [integrations, setIntegrations] = useState<IntegrationState>({
    activeProvider: null,
    googleDrive: {
      isConnected: false,
      isEnabled: false,
      userEmail: null,
      rootFolderId: null,
      folderPath: 'CoreWatch Evidence',
    },
    oneDrive: {
      isConnected: false,
      isEnabled: false,
      userEmail: null,
      rootFolderId: null,
      folderPath: 'CoreWatch Evidence',
    },
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);
  const [isTestingUpload, setIsTestingUpload] = useState<boolean>(false);

  // Notification banners
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Modal states
  const [confirmSwitchModal, setConfirmSwitchModal] = useState<{
    open: boolean;
    targetProvider: 'google_drive' | 'onedrive';
  }>({ open: false, targetProvider: 'google_drive' });

  const [confirmDisconnectModal, setConfirmDisconnectModal] = useState<{
    open: boolean;
    provider: 'google_drive' | 'onedrive';
  }>({ open: false, provider: 'google_drive' });

  const [testResultModal, setTestResultModal] = useState<{
    open: boolean;
    data: any;
  }>({ open: false, data: null });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

  const getAuthToken = () => {
    return user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '');
  };

  const getUserEmail = () => {
    if (user?.email) return user.email;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored) return JSON.parse(stored)?.email || '';
      } catch {}
    }
    return '';
  };

  // Fetch current integration statuses
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      const email = getUserEmail();
      const res = await fetch(`${apiUrl}/api/integrations/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-email': email,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve cloud storage integration status');
      }

      const data = await res.json();
      if (data.success) {
        setIntegrations({
          activeProvider: data.activeProvider,
          googleDrive: data.googleDrive,
          oneDrive: data.oneDrive,
        });
      }
    } catch (err: any) {
      console.warn('Status fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, user?.email]);

  // Handle URL query parameters after OAuth redirection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const integration = urlParams.get('integration');
    const message = urlParams.get('message');

    if (status === 'success') {
      const providerName = integration === 'googledrive' ? 'Google Drive' : 'Microsoft OneDrive';
      setToast({
        type: 'success',
        message: `🎉 Successfully connected to ${providerName}! Cloud storage is active for all surveillance evidence snapshots.`,
      });
      // Clean query parameters from URL without reloading
      const cleanUrl = window.location.pathname + (urlParams.get('tab') ? `?tab=${urlParams.get('tab')}` : '');
      window.history.replaceState({}, '', cleanUrl);
    } else if (status === 'error') {
      setToast({
        type: 'error',
        message: `OAuth Connection Failed: ${message || 'Access authorization was declined or expired.'}`,
      });
      const cleanUrl = window.location.pathname + (urlParams.get('tab') ? `?tab=${urlParams.get('tab')}` : '');
      window.history.replaceState({}, '', cleanUrl);
    }

    fetchStatus();
  }, [fetchStatus]);

  // Auto-dismiss toast after 7 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Initiate OAuth authorization for Google Drive
  const handleConnectGoogleDrive = async () => {
    // If OneDrive is already connected, ask for confirmation to satisfy mutual exclusion
    if (integrations.activeProvider === 'onedrive') {
      setConfirmSwitchModal({ open: true, targetProvider: 'google_drive' });
      return;
    }

    proceedGoogleDriveOAuth();
  };

  const proceedGoogleDriveOAuth = async () => {
    try {
      setIsConnecting('google_drive');
      const token = getAuthToken();
      const email = getUserEmail();
      const res = await fetch(`${apiUrl}/api/integrations/google-drive/auth-url`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-user-email': email,
        },
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        if (data.message?.includes('Not authorized') || data.message?.includes('user not found')) {
          throw new Error('User session expired. Please log out and log in again to sync cloud drives.');
        }
        throw new Error(data.message || 'Failed to generate Google Drive authorization URL');
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
      setIsConnecting(null);
    }
  };

  // Initiate OAuth authorization for OneDrive
  const handleConnectOneDrive = async () => {
    // If Google Drive is already connected, ask for confirmation
    if (integrations.activeProvider === 'google_drive') {
      setConfirmSwitchModal({ open: true, targetProvider: 'onedrive' });
      return;
    }

    proceedOneDriveOAuth();
  };

  const proceedOneDriveOAuth = async () => {
    try {
      setIsConnecting('onedrive');
      const token = getAuthToken();
      const email = getUserEmail();
      const res = await fetch(`${apiUrl}/api/integrations/onedrive/auth-url`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-user-email': email,
        },
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        if (data.message?.includes('Not authorized') || data.message?.includes('user not found')) {
          throw new Error('User session expired. Please log out and log in again to sync cloud drives.');
        }
        throw new Error(data.message || 'Failed to generate OneDrive authorization URL');
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
      setIsConnecting(null);
    }
  };

  // Disconnect provider
  const handleDisconnect = async (provider: 'google_drive' | 'onedrive') => {
    try {
      setIsDisconnecting(provider);
      const token = getAuthToken();
      const email = getUserEmail();
      const endpoint =
        provider === 'google_drive'
          ? `${apiUrl}/api/integrations/google-drive/disconnect`
          : `${apiUrl}/api/integrations/onedrive/disconnect`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-user-email': email,
        },
      });

      const data = await res.json();
      if (data.success) {
        setToast({
          type: 'info',
          message: `${provider === 'google_drive' ? 'Google Drive' : 'OneDrive'} has been disconnected.`,
        });
        await fetchStatus();
      } else {
        throw new Error(data.message || 'Failed to disconnect cloud provider');
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsDisconnecting(null);
      setConfirmDisconnectModal({ open: false, provider: 'google_drive' });
    }
  };

  // Run Test Evidence Upload
  const handleTestEvidenceUpload = async () => {
    if (!integrations.activeProvider) {
      setToast({
        type: 'error',
        message: 'No active cloud drive connected. Please connect Google Drive or OneDrive first.',
      });
      return;
    }

    try {
      setIsTestingUpload(true);
      const token = getAuthToken();
      const email = getUserEmail();
      const res = await fetch(`${apiUrl}/api/integrations/test-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-user-email': email,
        },
        body: JSON.stringify({
          category: 'Zone Monitoring',
          cameraKey: 'CAM-LIVE-INSPECTION',
          userEmail: email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResultModal({
          open: true,
          data: {
            provider: data.provider,
            webViewLink: data.webViewLink,
            folderPath: data.folderPath,
            filename: data.filename,
            fileId: data.fileId,
          },
        });
        setToast({
          type: 'success',
          message: 'Evidence snapshot uploaded successfully to your cloud drive!',
        });
      } else {
        throw new Error(data.message || 'Upload test failed');
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Upload test encountered an error' });
    } finally {
      setIsTestingUpload(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#15192c] via-[#1a1e36] to-[#15192c] border border-[#2b304c] p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Cloud className="w-3.5 h-3.5" />
              <span>Surveillance Evidence Archiving</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Cloud Storage & Drive Integrations
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Connect Google Drive or Microsoft OneDrive to automatically archive security incident screenshots, zone entry violations, and CCTV alert evidence in real time.
            </p>
          </div>

          {/* Quick Status Pill */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
              <span>Refresh</span>
            </button>

            {integrations.activeProvider ? (
              <button
                onClick={handleTestEvidenceUpload}
                disabled={isTestingUpload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                <UploadCloud className={`w-4 h-4 ${isTestingUpload ? 'animate-bounce' : ''}`} />
                <span>{isTestingUpload ? 'Uploading...' : 'Test Evidence Upload'}</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Mutual Exclusion Rule Info Callout */}
        <div className="mt-6 pt-5 border-t border-[#252942] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Mutual Exclusion Policy Active:</strong> Only one cloud provider can be active at a time to prevent duplicate uploads.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Storage Mode:</span>
            {integrations.activeProvider === 'google_drive' ? (
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Google Drive Active
              </span>
            ) : integrations.activeProvider === 'onedrive' ? (
              <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Microsoft OneDrive Active
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                Local Storage Fallback
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification Alert */}
      {toast && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : toast.type === 'error'
              ? 'bg-red-950/40 border-red-500/30 text-red-300'
              : 'bg-blue-950/40 border-blue-500/30 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <Cloud className="w-5 h-5 text-blue-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Provider Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Google Drive Card */}
        <div
          className={`relative rounded-2xl bg-[#181b2e] border transition-all duration-300 p-6 flex flex-col justify-between ${
            integrations.googleDrive.isEnabled
              ? 'border-emerald-500/50 shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-500/30'
              : 'border-[#2b304c] hover:border-[#3d436a]'
          }`}
        >
          <div>
            {/* Header info */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2.5 shadow-inner">
                  {/* Google Drive SVG Icon */}
                  <svg viewBox="0 0 87.3 78" className="w-full h-full">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3l12.3-21.3-16.15.05c-1.4 0-2.8-.7-3.2-2.1v13.4z" fill="#0066da"/>
                    <path d="m43.65 25-12.3-21.3c-1.3.8-2.4 1.9-3.2 3.3l-27.15 47c-.8 1.4-.9 2.9-.2 4.3l16.15-.05 26.7-46.65z" fill="#00ac47"/>
                    <path d="m73.55 76.8c1.3-.8 2.4-1.9 3.2-3.3l1.6-2.75 3.9-6.75c.8-1.4.7-2.9 0-4.3l-26.6-46.1h-24l26.7 46.65 15.2 16.55z" fill="#ea4335"/>
                    <path d="m43.65 25 12.3-21.3c-1.3-.8-2.8-1.2-4.3-1.2h-16c-1.5 0-3 .4-4.3 1.2l12.3 21.3z" fill="#00832d"/>
                    <path d="m59.35 52.4h-31.4l-12.3 21.3c1.3.8 2.8 1.2 4.3 1.2h47.4c1.5 0 3-.4 4.3-1.2l-12.3-21.3z" fill="#2684fc"/>
                    <path d="m73.55 76.8-14.2-24.4h-31.4l12.3 21.3c1.3.8 2.8 1.2 4.3 1.2h29z" fill="#ffba00"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    Google Drive
                    {integrations.googleDrive.isEnabled && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Active Provider
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">Google Workspace Cloud Storage</p>
                </div>
              </div>

              {/* Status Badge */}
              {integrations.googleDrive.isEnabled ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  Not Configured
                </span>
              )}
            </div>

            {/* Account Details Box */}
            <div className="mt-6 rounded-xl bg-[#121422] border border-[#252942] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Connected Account:</span>
                <span className="font-mono font-semibold text-slate-200 truncate max-w-[180px]">
                  {integrations.googleDrive.userEmail || user?.email || 'Not connected'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Evidence Vault Folder:</span>
                <span className="font-semibold text-orange-400 flex items-center gap-1">
                  <FolderOpen className="w-3.5 h-3.5" />
                  {integrations.googleDrive.folderPath}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Folder ID:</span>
                <span className="font-mono text-[11px] text-slate-400 truncate max-w-[160px]">
                  {integrations.googleDrive.rootFolderId || 'Will auto-create on first event'}
                </span>
              </div>
            </div>

            {/* Folder structure feature note */}
            <div className="mt-4 text-[11px] text-slate-400 leading-relaxed">
              <p>
                Snapshots captured during alarm triggers are automatically categorized into:
              </p>
              <code className="mt-1 block p-1.5 rounded bg-black/30 border border-white/5 font-mono text-slate-300 text-[10px]">
                CoreWatch Evidence / &#123;Category&#125; / &#123;CameraKey&#125; / evidence_&#123;timestamp&#125;.jpg
              </code>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-5 border-t border-[#252942] flex items-center justify-between gap-3">
            {integrations.googleDrive.isEnabled ? (
              <>
                <a
                  href={
                    integrations.googleDrive.rootFolderId
                      ? `https://drive.google.com/drive/folders/${integrations.googleDrive.rootFolderId}`
                      : 'https://drive.google.com'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Open in Drive</span>
                </a>

                <button
                  onClick={() => setConfirmDisconnectModal({ open: true, provider: 'google_drive' })}
                  disabled={isDisconnecting === 'google_drive'}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDisconnecting === 'google_drive' ? 'Disconnecting...' : 'Disconnect'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectGoogleDrive}
                disabled={isConnecting === 'google_drive'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>
                  {isConnecting === 'google_drive' ? 'Connecting to Google...' : 'Connect Google Drive'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Microsoft OneDrive Card */}
        <div
          className={`relative rounded-2xl bg-[#181b2e] border transition-all duration-300 p-6 flex flex-col justify-between ${
            integrations.oneDrive.isEnabled
              ? 'border-cyan-500/50 shadow-xl shadow-cyan-950/20 ring-1 ring-cyan-500/30'
              : 'border-[#2b304c] hover:border-[#3d436a]'
          }`}
        >
          <div>
            {/* Header info */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2.5 shadow-inner">
                  {/* OneDrive SVG Icon */}
                  <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
                    <path
                      d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
                      fill="#0078D4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    Microsoft OneDrive
                    {integrations.oneDrive.isEnabled && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        Active Provider
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">Microsoft 365 Cloud Vault</p>
                </div>
              </div>

              {/* Status Badge */}
              {integrations.oneDrive.isEnabled ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  Not Configured
                </span>
              )}
            </div>

            {/* Account Details Box */}
            <div className="mt-6 rounded-xl bg-[#121422] border border-[#252942] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Connected Account:</span>
                <span className="font-mono font-semibold text-slate-200 truncate max-w-[180px]">
                  {integrations.oneDrive.userEmail || (integrations.oneDrive.isEnabled ? user?.email : 'Not connected')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Evidence Vault Folder:</span>
                <span className="font-semibold text-cyan-400 flex items-center gap-1">
                  <FolderOpen className="w-3.5 h-3.5" />
                  {integrations.oneDrive.folderPath}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Folder ID:</span>
                <span className="font-mono text-[11px] text-slate-400 truncate max-w-[160px]">
                  {integrations.oneDrive.rootFolderId || 'Will auto-create on first event'}
                </span>
              </div>
            </div>

            {/* Folder structure feature note */}
            <div className="mt-4 text-[11px] text-slate-400 leading-relaxed">
              <p>
                Snapshots captured during alarm triggers are automatically categorized into:
              </p>
              <code className="mt-1 block p-1.5 rounded bg-black/30 border border-white/5 font-mono text-slate-300 text-[10px]">
                CoreWatch Evidence / &#123;Category&#125; / &#123;CameraKey&#125; / evidence_&#123;timestamp&#125;.jpg
              </code>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-5 border-t border-[#252942] flex items-center justify-between gap-3">
            {integrations.oneDrive.isEnabled ? (
              <>
                <a
                  href="https://onedrive.live.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Open in OneDrive</span>
                </a>

                <button
                  onClick={() => setConfirmDisconnectModal({ open: true, provider: 'onedrive' })}
                  disabled={isDisconnecting === 'onedrive'}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDisconnecting === 'onedrive' ? 'Disconnecting...' : 'Disconnect'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectOneDrive}
                disabled={isConnecting === 'onedrive'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>
                  {isConnecting === 'onedrive' ? 'Connecting to Microsoft...' : 'Connect Microsoft OneDrive'}
                </span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Cloud Storage Architecture and Safety Features Information */}
      <div className="rounded-2xl bg-[#141625] border border-[#272a44] p-6 sm:p-7 space-y-5">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-orange-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Surveillance Evidence Cloud Pipeline Architecture
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-4 rounded-xl bg-[#191c2e] border border-[#292e4a] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="font-bold text-white text-sm">Instant Alert Capture</h4>
            <p className="text-slate-400 leading-relaxed">
              When an AI inspection boundary is breached (human detection, restricted perimeter, cash counter loitering), a crisp HD evidence snapshot is captured immediately.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#191c2e] border border-[#292e4a] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="font-bold text-white text-sm">Auto-Hierarchy Upload</h4>
            <p className="text-slate-400 leading-relaxed">
              Files are automatically saved to your connected Google Drive or Microsoft OneDrive in designated subfolders organized by category and camera key.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#191c2e] border border-[#292e4a] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="font-bold text-white text-sm">Safe Zero-Footprint Sync</h4>
            <p className="text-slate-400 leading-relaxed">
              Local temp buffers are safely unlinked right after the cloud upload completes, preventing local disk bloat while keeping your evidence secure in your own cloud.
            </p>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CONFIRMATION MODAL: MUTUAL EXCLUSION SWITCH */}
      {/* ========================================================================= */}
      {confirmSwitchModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#181b2e] border border-[#2b304c] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Switch Cloud Storage Provider?</h3>
                <p className="text-xs text-slate-400">Mutual exclusion rule enforcement</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are currently using{' '}
              <strong className="text-white">
                {confirmSwitchModal.targetProvider === 'google_drive' ? 'Microsoft OneDrive' : 'Google Drive'}
              </strong>
              . Connecting{' '}
              <strong className="text-orange-400">
                {confirmSwitchModal.targetProvider === 'google_drive' ? 'Google Drive' : 'Microsoft OneDrive'}
              </strong>{' '}
              will automatically disconnect the current active provider and route all future surveillance snapshots to the new drive.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmSwitchModal({ open: false, targetProvider: 'google_drive' })}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmSwitchModal({ open: false, targetProvider: 'google_drive' });
                  if (confirmSwitchModal.targetProvider === 'google_drive') {
                    proceedGoogleDriveOAuth();
                  } else {
                    proceedOneDriveOAuth();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                Proceed & Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONFIRMATION MODAL: DISCONNECT */}
      {/* ========================================================================= */}
      {confirmDisconnectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#181b2e] border border-red-500/30 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Disconnect {confirmDisconnectModal.provider === 'google_drive' ? 'Google Drive' : 'OneDrive'}?
                </h3>
                <p className="text-xs text-slate-400">Stop cloud auto-sync for evidence</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to disconnect? Automated evidence archiving to this drive will cease immediately and CoreWatch will fall back to local server storage.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDisconnectModal({ open: false, provider: 'google_drive' })}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                Keep Connected
              </button>
              <button
                onClick={() => handleDisconnect(confirmDisconnectModal.provider)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Confirm Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TEST UPLOAD RESULT MODAL */}
      {/* ========================================================================= */}
      {testResultModal.open && testResultModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-[#181b2e] border border-emerald-500/30 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Snapshot Upload Verified!</h3>
                <p className="text-xs text-emerald-400 font-semibold">
                  Uploaded to {testResultModal.data.provider === 'google_drive' ? 'Google Drive' : 'OneDrive'}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[#121422] border border-[#252942] p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Folder Structure:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {testResultModal.data.folderPath}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">File Name:</span>
                <span className="font-mono text-slate-200">
                  {testResultModal.data.filename}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cloud File ID:</span>
                <span className="font-mono text-[11px] text-slate-400 truncate max-w-[200px]">
                  {testResultModal.data.fileId}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Your cloud drive hierarchy is active and ready. All incoming alarms will now store their snapshots into this organized folder structure.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setTestResultModal({ open: false, data: null })}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                Close
              </button>
              {testResultModal.data.webViewLink && (
                <a
                  href={testResultModal.data.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Evidence in Drive</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

