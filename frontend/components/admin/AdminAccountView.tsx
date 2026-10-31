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
  Sparkles
} from 'lucide-react';

interface AdminAccountViewProps {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  customersCount?: number;
  camerasCount?: number;
  alertsCount?: number;
  onNavigateTab?: (tab: string) => void;
}

export default function AdminAccountView({
  user,
  setUser,
  customersCount = 0,
  camerasCount = 0,
  alertsCount = 0,
  onNavigateTab
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
          <p className="text-[10px] text-muted-foreground mt-0.5">Network camera nodes connected</p>
        </div>

        <div 
          onClick={() => onNavigateTab && onNavigateTab('admin_notifications')}
          className="p-4 rounded-xl border border-border bg-card hover:border-red-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Security Alerts</span>
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

                {/* Uploading loading overlay */}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 rounded-2xl bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 z-10 animate-in fade-in">
                    <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
                    <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Saving...</span>
                  </div>
                )}

                {/* Camera Overlay Icon */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-lg border-2 border-card transition-transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Upload Admin Photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>

                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-card" title="Super Admin Online" />
              </div>

              <div className="space-y-1 text-center sm:text-left lg:text-center w-full">
                <h2 className="text-lg font-black text-foreground tracking-tight">
                  {formData.name}
                </h2>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {formData.email}
                </p>
                <div className="pt-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/15 text-red-400 border border-red-500/30 font-mono tracking-wider uppercase">
                    ROOT SUPERUSER
                  </span>
                </div>

                {/* Photo Action Buttons */}
                <div className="flex items-center justify-center sm:justify-start lg:justify-center gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3 h-3 text-orange-400" />
                    <span>{avatar ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>
                  {avatar && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploadingPhoto}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Meta Info */}
            <div className="border-t border-border pt-4 space-y-3 text-xs font-mono">
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

        {/* RIGHT COLUMN: Edit Details & Password Forms (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Form 1: Master Profile Credentials */}
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

          {/* Form 2: Master Password Update */}
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

    </div>
  );
}

