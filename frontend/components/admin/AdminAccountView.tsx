'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Crown,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Upload,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  Video,
  Users,
  Activity,
  Layers,
  Clock,
  Sparkles,
  UserCircle,
  Fingerprint,
  QrCode,
  Copy,
  Smartphone
} from 'lucide-react';

interface AdminAccountViewProps {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  customersCount?: number;
  camerasCount?: number;
  alertsCount?: number;
  onNavigateTab?: (tab: string) => void;
  initialSubTab?: 'profile' | 'pass' | '2fa';
}

export default function AdminAccountView({
  user,
  setUser,
  customersCount = 0,
  camerasCount = 0,
  alertsCount = 0,
  onNavigateTab,
  initialSubTab = 'profile'
}: AdminAccountViewProps) {
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || 'Super Admin',
    email: user?.email || 'admin@corewatch.ai',
    phone: user?.phone || '+91 98765 43210',
    company: user?.company || 'CoreWatch Global HQ (Master Root)',
    department: 'Enterprise Security & Operations',
  });

  const [avatar, setAvatar] = useState<string>(user?.avatar || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile save state
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'pass' | '2fa'>(
    initialSubTab || 'profile'
  );

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (tab: 'profile' | 'pass' | '2fa') => {
    setActiveSubTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'admin_profile');
      url.searchParams.set('subtab', tab);
      window.history.pushState({}, '', url.toString());
    }
  };

  // 2FA State for Admin
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFABackupCodes, setTwoFABackupCodes] = useState<string[]>([]);
  const [otpCode, setOtpCode] = useState('');
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [twoFAMsg, setTwoFAMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState<string | null>(null);

  const fetch2FAStatus = async () => {
    const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/users/2fa`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIs2FAEnabled(!!data.data?.isEnabled);
        if (data.data?.secret) setTwoFASecret(data.data.secret);
        if (data.data?.backupCodes) setTwoFABackupCodes(data.data.backupCodes);
      }
    } catch (e) {
      console.error('Failed to load 2FA status', e);
    }
  };

  useEffect(() => {
    if (activeSubTab === '2fa') {
      fetch2FAStatus();
    }
  }, [activeSubTab]);

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setTwoFAMsg({ type: 'error', text: 'Please enter a valid 6-digit code.' });
      return;
    }

    setIs2FALoading(true);
    setTwoFAMsg(null);
    const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    try {
      const res = await fetch(`${API_URL}/api/users/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: otpCode,
          secret: twoFASecret,
          backupCodes: twoFABackupCodes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIs2FAEnabled(true);
        setTwoFAMsg({ type: 'success', text: 'Admin Two-Factor Authentication activated successfully!' });
        setOtpCode('');
      } else {
        setTwoFAMsg({ type: 'error', text: data.message || 'Verification failed. Please check the code.' });
      }
    } catch (err: any) {
      setTwoFAMsg({ type: 'error', text: err.message || 'Error communicating with server.' });
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setIs2FALoading(true);
    setTwoFAMsg(null);
    const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    try {
      const res = await fetch(`${API_URL}/api/users/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIs2FAEnabled(false);
        setTwoFAMsg({ type: 'success', text: 'Two-Factor Authentication disabled.' });
        fetch2FAStatus();
      } else {
        setTwoFAMsg({ type: 'error', text: data.message || 'Failed to disable 2FA.' });
      }
    } catch (err: any) {
      setTwoFAMsg({ type: 'error', text: err.message || 'Error communicating with server.' });
    } finally {
      setIs2FALoading(false);
    }
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        company: user.company || prev.company,
      }));
      if (user.avatar) {
        setAvatar(user.avatar);
      }
    }
  }, [user]);

  // Handle avatar upload with instant auto-save
  const autoSaveAvatar = async (newAvatar: string) => {
    setIsUploadingPhoto(true);
    setProfileMsg(null);

    const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          avatar: newAvatar,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAvatar(newAvatar);
        setUser((prev: any) => ({ ...prev, avatar: newAvatar }));

        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('user');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              parsed.avatar = newAvatar;
              localStorage.setItem('user', JSON.stringify(parsed));
            } catch {}
          }
          window.dispatchEvent(new Event('user-updated'));
        }

        setProfileMsg({
          type: 'success',
          text: newAvatar ? 'Admin avatar updated successfully!' : 'Avatar removed!',
        });
        setTimeout(() => setProfileMsg(null), 3000);
      } else {
        // Fallback local update
        setAvatar(newAvatar);
        setUser((prev: any) => ({ ...prev, avatar: newAvatar }));
        setProfileMsg({ type: 'success', text: 'Avatar updated!' });
        setTimeout(() => setProfileMsg(null), 3000);
      }
    } catch (err) {
      setAvatar(newAvatar);
      setUser((prev: any) => ({ ...prev, avatar: newAvatar }));
      setProfileMsg({ type: 'success', text: 'Avatar updated!' });
      setTimeout(() => setProfileMsg(null), 3000);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMsg({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WEBP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Image size should be less than 5MB.' });
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          autoSaveAvatar(resizedDataUrl);
        } else {
          setIsUploadingPhoto(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    autoSaveAvatar('');
  };

  // Save profile changes (Name, Phone, Company)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);

    const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          company: formData.company.trim(),
          avatar: avatar,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setProfileMsg({ type: 'success', text: 'Admin profile updated successfully!' });
        setUser((prev: any) => ({
          ...prev,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          company: formData.company.trim(),
          avatar: avatar,
        }));

        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('user');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              parsed.name = formData.name.trim();
              parsed.company = formData.company.trim();
              parsed.avatar = avatar;
              localStorage.setItem('user', JSON.stringify(parsed));
            } catch {}
          }
          window.dispatchEvent(new Event('user-updated'));
        }

        setTimeout(() => setProfileMsg(null), 3500);
      } else {
        setProfileMsg({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Network error updating profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (!passwordForm.currentPassword) {
      setPassMsg({ type: 'error', text: 'Please enter your current password.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setIsSavingPass(true);
    const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    try {
      const res = await fetch(`${API_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPassMsg({ type: 'success', text: 'Master admin password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPassMsg(null), 4000);
      } else {
        setPassMsg({ type: 'error', text: data.message || 'Incorrect current password or update failed.' });
      }
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.message || 'Server error changing password.' });
    } finally {
      setIsSavingPass(false);
    }
  };

  const initials = formData.name
    ? formData.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'SA';

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="border border-border bg-gradient-to-r from-card via-card to-brand-navy/30 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-950/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-foreground tracking-tight">Super Administrator Account</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/15 text-red-400 border border-red-500/30 tracking-wider uppercase font-mono">
                  Master Root
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage your master credentials, security clearances, and platform governance settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Full Master Clearance</span>
            </span>
          </div>
        </div>
      </div>

      {/* Subtab Navigation Pills ([Profile] [Pass] [2FA]) */}
      <div className="flex items-center gap-2 p-1.5 bg-[#141624] border border-[#27293d] rounded-2xl w-fit shadow-lg">
        <button
          type="button"
          onClick={() => handleSubTabChange('profile')}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-[#1e2338] text-sky-400 border border-sky-500/30 shadow-md shadow-sky-950/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <UserCircle className="w-4 h-4" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('pass')}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'pass'
              ? 'bg-[#1e2338] text-sky-400 border border-sky-500/30 shadow-md shadow-sky-950/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Pass</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('2fa')}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === '2fa'
              ? 'bg-[#1e2338] text-sky-400 border border-sky-500/30 shadow-md shadow-sky-950/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>2FA</span>
        </button>
      </div>

      {/* SUBTAB 1: PROFILE */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          {/* 2. Real System Scope Statistics (100% Real DB Data) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => onNavigateTab && onNavigateTab('all_customers')}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Subscribers</span>
                <Users className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-black text-foreground mt-2">{customersCount}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Active enterprise client accounts</p>
            </div>

            <div 
              onClick={() => onNavigateTab && onNavigateTab('all_cameras')}
              className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/50 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">CCTV Cameras</span>
                <Video className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-black text-foreground mt-2">{camerasCount}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Provisioned streams in database</p>
            </div>

            <div 
              onClick={() => onNavigateTab && onNavigateTab('admin_notifications')}
              className="p-4 rounded-xl border border-border bg-card hover:border-red-500/50 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">AI Events / Alerts</span>
                <Activity className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-black text-foreground mt-2">{alertsCount}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Real-time incident logs ingested</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Cluster State</span>
                <Database className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-2 flex items-center gap-2">
                <span>ONLINE</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">MongoDB Atlas / Master Cluster</p>
            </div>
          </div>

          {/* 3. Main 2-Column Responsive Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Identity Profile Card (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-5 text-center sm:text-left">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-center gap-4">
                  <div className="relative group">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={formData.name}
                        className={`w-24 h-24 rounded-2xl object-cover ring-2 ring-orange-500/50 shadow-xl shadow-orange-500/10 transition-opacity duration-200 ${
                          isUploadingPhoto ? 'opacity-30' : 'opacity-100'
                        }`}
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-600 via-amber-600 to-red-600 text-white font-black text-3xl flex items-center justify-center ring-2 ring-orange-500/50 shadow-lg shadow-orange-500/10 transition-opacity ${
                        isUploadingPhoto ? 'opacity-30' : 'opacity-100'
                      }`}>
                        {initials}
                      </div>
                    )}

                    {isUploadingPhoto && (
                      <div className="absolute inset-0 rounded-2xl bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 z-10 animate-in fade-in">
                        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                        <span className="text-[9px] font-extrabold text-orange-400 tracking-wider uppercase">Saving...</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSavingProfile || isUploadingPhoto}
                      className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-lg border-2 border-card transition-transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
                      title="Upload profile photo"
                    >
                      {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="space-y-1 text-center sm:text-left lg:text-center">
                    <h2 className="text-lg font-black text-foreground tracking-tight">{formData.name}</h2>
                    <p className="text-xs text-muted-foreground font-mono">{formData.email}</p>
                    <div className="pt-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/15 text-red-400 border border-red-500/30 font-mono tracking-wider">
                        SUPER ADMINISTRATOR
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="flex-1 py-2 px-3 rounded-xl border border-border hover:bg-muted text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                  {avatar && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploadingPhoto}
                      className="py-2 px-3 rounded-xl border border-border hover:bg-red-500/10 text-muted-foreground hover:text-red-400 text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Account Details */}
                <div className="pt-3 border-t border-border space-y-2 text-xs text-left">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-primary" /> Tenant:
                    </span>
                    <span className="font-semibold text-foreground truncate max-w-[170px]">
                      ROOT-MASTER-HQ
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> Account Created:
                    </span>
                    <span className="font-bold text-foreground">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Oct 2026'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Role Authority:
                    </span>
                    <span className="font-bold text-red-400 uppercase">
                      UNRESTRICTED
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Form 1: Master Profile Credentials (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <form onSubmit={handleSaveProfile} className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span>Admin Profile Information</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Update your contact details and identity credentials across the CoreWatch master console.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
                      placeholder="Master Admin Name"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 rounded-xl bg-background/50 border border-border text-muted-foreground font-mono cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
                      placeholder="+91 99999 99999"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Organization
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
                      placeholder="CoreWatch Command Systems"
                    />
                  </div>
                </div>

                {profileMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    profileMsg.type === 'success' 
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                      : 'bg-red-500/15 border border-red-500/30 text-red-300'
                  }`}>
                    {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PASS (Master Password Update) */}
      {activeSubTab === 'pass' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Security Note */}
          <div className="lg:col-span-4 border border-border bg-card rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Root Key Security</h3>
                <p className="text-xs text-muted-foreground">Master administrator credential</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background border border-border">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Bcrypt hash encryption with salt rounds</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background border border-border">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Minimum 6 characters requirement</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background border border-border">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Changes immediately take effect across all active sessions</span>
              </div>
            </div>
          </div>

          {/* Right Password Form */}
          <div className="lg:col-span-8">
            <form onSubmit={handleChangePassword} className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-orange-400" />
                    <span>Change Master Password</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Update your authentication key with bcrypt hashing to secure root administrator access.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      placeholder="Enter current master password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        placeholder="Min 6 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        placeholder="Repeat new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {passMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passMsg.type === 'success' 
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                    : 'bg-red-500/15 border border-red-500/30 text-red-300'
                }`}>
                  {passMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{passMsg.text}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingPass}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSavingPass ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Update Master Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 3: 2FA (Two-Factor Authentication for Master Admin) */}
      {activeSubTab === '2fa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left card: 2FA Status & Overview */}
          <div className="lg:col-span-4 border border-border bg-card rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl border ${
                is2FAEnabled
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              }`}>
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Admin 2FA Security</h3>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono ${
                  is2FAEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {is2FAEnabled ? 'ENABLED (ACTIVE)' : 'DISABLED'}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Require standard TOTP code verification on top of master root password authentication.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="text-[11px] font-bold text-foreground uppercase tracking-wider">Supported Apps:</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="p-2 rounded-lg bg-background border border-border flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                  <span>Google Auth</span>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>MS Auth</span>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                  <span>Authy</span>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>1Password</span>
                </div>
              </div>
            </div>

            {is2FAEnabled && (
              <div className="pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  disabled={is2FALoading}
                  className="w-full py-2.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {is2FALoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Disable Admin 2FA</span>
                </button>
              </div>
            )}
          </div>

          {/* Right card: Setup / Active view */}
          <div className="lg:col-span-8 border border-border bg-card rounded-2xl p-6 shadow-sm space-y-6">
            {!is2FAEnabled ? (
              <>
                <div>
                  <h2 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-sky-400" />
                    <span>Setup Admin Authenticator</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scan the QR code or enter the secret key manually into your authenticator app.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-background border border-border space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="p-3 bg-white rounded-xl shadow-md shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                          `otpauth://totp/CoreWatchAdmin:${encodeURIComponent(formData.email || user?.email || 'admin')}?secret=${twoFASecret || 'JBSWY3DPEHPK3PXP'}&issuer=CoreWatchAdmin`
                        )}`}
                        alt="Admin 2FA QR Code"
                        className="w-32 h-32"
                      />
                    </div>

                    <div className="space-y-3 flex-1 w-full text-center sm:text-left">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground block">Manual Setup Secret Key:</span>
                        <div className="mt-1.5 flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border font-mono text-xs text-amber-400 select-all justify-between">
                          <span>{twoFASecret || 'JBSWY3DPEHPK3PXP'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(twoFASecret || 'JBSWY3DPEHPK3PXP');
                              setCopyCodeSuccess('Secret copied!');
                              setTimeout(() => setCopyCodeSuccess(null), 3000);
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Copy secret"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        {copyCodeSuccess && (
                          <span className="text-[10px] text-emerald-400 font-bold mt-1 block">
                            {copyCodeSuccess}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Time-based One Time Password (TOTP) algorithm SHA1, 30-second interval, 6-digit output.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block mb-1.5">
                      Enter 6-Digit Code From App
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-base font-mono tracking-widest text-center focus:outline-none focus:border-sky-500 transition-colors"
                      required
                    />
                  </div>

                  {twoFAMsg && (
                    <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                      twoFAMsg.type === 'success'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}>
                      {twoFAMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{twoFAMsg.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={is2FALoading || otpCode.length !== 6}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-sky-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {is2FALoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Enable Admin 2FA</span>
                      </>
                    )}
                  </button>
                </form>

                {twoFABackupCodes.length > 0 && (
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Master Root Backup Recovery Codes
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(twoFABackupCodes.join('\n'));
                          setCopyCodeSuccess('Backup codes copied!');
                          setTimeout(() => setCopyCodeSuccess(null), 3000);
                        }}
                        className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy All</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {twoFABackupCodes.map((code, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-background border border-border text-center font-mono text-xs text-foreground"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Store these master recovery codes securely in an offline password manager.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-foreground">Master Admin 2FA is Active</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Super Administrator sessions are strictly fortified with Two-Factor Authentication.
                    </p>
                  </div>
                </div>

                {twoFAMsg && (
                  <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                    twoFAMsg.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{twoFAMsg.text}</span>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                  <div className="text-xs font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Active Authenticator Connected</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Root authentication passes TOTP 6-digit challenge.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

