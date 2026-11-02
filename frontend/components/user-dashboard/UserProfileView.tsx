'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  Save, 
  Calendar,
  Lock,
  Layers,
  Sparkles,
  AlertCircle,
  Video,
  Check,
  Camera,
  Trash2,
  Upload,
  UserCircle,
  KeyRound,
  Fingerprint,
  Eye,
  EyeOff,
  QrCode,
  Copy,
  Smartphone
} from 'lucide-react';

interface UserProfileViewProps {
  user: any;
  customer?: any;
  onProfileUpdated?: (updatedData: any) => void;
  initialSubTab?: 'profile' | 'pass' | '2fa';
}

export default function UserProfileView({
  user,
  customer,
  onProfileUpdated,
  initialSubTab = 'profile'
}: UserProfileViewProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: customer?.phone || '',
    company: customer?.company || user?.company || '',
    addressLine1: customer?.addressLine1 || '',
    addressLine2: customer?.addressLine2 || '',
    city: customer?.city || '',
    state: customer?.state || '',
    country: customer?.country || 'India',
    pincode: customer?.pincode || '',
  });

  const [avatar, setAvatar] = useState<string>(
    user?.avatar || customer?.avatar || customer?.user?.avatar || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user || customer) {
      setFormData({
        name: user?.name || customer?.name || '',
        email: user?.email || customer?.email || '',
        phone: customer?.phone || '',
        company: customer?.company || user?.company || '',
        addressLine1: customer?.addressLine1 || '',
        addressLine2: customer?.addressLine2 || '',
        city: customer?.city || '',
        state: customer?.state || '',
        country: customer?.country || 'India',
        pincode: customer?.pincode || '',
      });
      const av = user?.avatar || customer?.avatar || customer?.user?.avatar;
      if (av) {
        setAvatar(av);
      }
    }
  }, [user, customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'pass' | '2fa'>(
    initialSubTab || 'profile'
  );

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFABackupCodes, setTwoFABackupCodes] = useState<string[]>([]);
  const [otpCode, setOtpCode] = useState('');
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [twoFAMsg, setTwoFAMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState<string | null>(null);

  const fetch2FAStatus = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
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

  const handleSubTabChange = (tab: 'profile' | 'pass' | '2fa') => {
    setActiveSubTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'profile');
      url.searchParams.set('subtab', tab);
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordStatusMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordStatusMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatusMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordStatusMsg(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
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
        setPasswordStatusMsg({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordStatusMsg(null), 4000);
      } else {
        setPasswordStatusMsg({ type: 'error', text: data.message || 'Incorrect current password or update failed.' });
      }
    } catch (err: any) {
      setPasswordStatusMsg({ type: 'error', text: err.message || 'Error communicating with server.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setTwoFAMsg({ type: 'error', text: 'Please enter a valid 6-digit code.' });
      return;
    }

    setIs2FALoading(true);
    setTwoFAMsg(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
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
        setTwoFAMsg({ type: 'success', text: 'Two-Factor Authentication activated successfully!' });
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
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

  // Immediate Auto-Save handler for Profile Photo
  const autoSavePhoto = async (newAvatar: string) => {
    setIsUploadingPhoto(true);
    setStatusMessage(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
    const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    try {
      const res = await fetch(`${API_URL}/api/customers/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: (formData.name || user?.name || '').trim(),
          avatar: newAvatar,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAvatar(newAvatar);
        setStatusMessage({
          type: 'success',
          text: newAvatar ? 'Profile photo saved successfully!' : 'Profile photo removed!',
        });

        // Instant update stored user and customer in localStorage
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              parsed.avatar = newAvatar;
              localStorage.setItem('user', JSON.stringify(parsed));
            } catch (err) {}
          }
          const storedCust = localStorage.getItem('customer');
          if (storedCust) {
            try {
              const parsedCust = JSON.parse(storedCust);
              parsedCust.avatar = newAvatar;
              localStorage.setItem('customer', JSON.stringify(parsedCust));
            } catch (err) {}
          }
          window.dispatchEvent(new Event('user-updated'));
        }

        if (onProfileUpdated) {
          onProfileUpdated({ avatar: newAvatar, customer: data.data });
        }

        setTimeout(() => setStatusMessage(null), 3500);
      } else {
        // Fallback update locally for immediate UX
        setAvatar(newAvatar);
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              parsed.avatar = newAvatar;
              localStorage.setItem('user', JSON.stringify(parsed));
            } catch (e) {}
          }
          window.dispatchEvent(new Event('user-updated'));
        }
        setStatusMessage({
          type: 'success',
          text: newAvatar ? 'Profile photo saved!' : 'Profile photo removed!',
        });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      setAvatar(newAvatar);
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            parsed.avatar = newAvatar;
            localStorage.setItem('user', JSON.stringify(parsed));
          } catch (e) {}
        }
        window.dispatchEvent(new Event('user-updated'));
      }
      setStatusMessage({
        type: 'success',
        text: 'Profile photo saved!',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WEBP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Image size should be less than 5MB.' });
      return;
    }

    setIsUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Optimize to max 400x400 to keep database fast & lightweight
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
          // Directly auto-save without needing to click Save Changes
          autoSavePhoto(resizedDataUrl);
        } else {
          setIsUploadingPhoto(false);
        }
      };
      img.onerror = () => {
        setIsUploadingPhoto(false);
        setStatusMessage({ type: 'error', text: 'Failed to process image.' });
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsUploadingPhoto(false);
      setStatusMessage({ type: 'error', text: 'Failed to read file.' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    autoSavePhoto('');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
    const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    try {
      const res = await fetch(`${API_URL}/api/customers/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          avatar: avatar,
          phone: formData.phone.trim(),
          company: formData.company.trim(),
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
          pincode: formData.pincode.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: 'Profile and photo updated successfully!',
        });

        // Update stored user in localStorage
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              parsed.name = formData.name.trim();
              parsed.company = formData.company.trim();
              parsed.avatar = avatar;
              localStorage.setItem('user', JSON.stringify(parsed));
            } catch (err) {
              console.warn('Could not update user in localStorage', err);
            }
          }
          const storedCust = localStorage.getItem('customer');
          if (storedCust) {
            try {
              const parsedCust = JSON.parse(storedCust);
              parsedCust.avatar = avatar;
              localStorage.setItem('customer', JSON.stringify(parsedCust));
            } catch (err) {}
          }
          window.dispatchEvent(new Event('user-updated'));
        }

        if (onProfileUpdated) {
          onProfileUpdated({ ...formData, avatar, customer: data.data });
        }

        setTimeout(() => setStatusMessage(null), 3500);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.message || data.error || 'Failed to update profile.',
        });
      }
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            parsed.name = formData.name.trim();
            parsed.company = formData.company.trim();
            parsed.avatar = avatar;
            localStorage.setItem('user', JSON.stringify(parsed));
          } catch (e) {}
        }
        window.dispatchEvent(new Event('user-updated'));
      }
      setStatusMessage({
        type: 'success',
        text: 'Profile saved successfully!',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const memberSinceFormatted = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Oct 2026';

  const userRoleDisplay = (user?.role === 'admin' 
    ? 'COMPANY ADMIN' 
    : (user?.role === 'demo' ? 'DEMO TESTER' : 'ADMINISTRATIVE SUBSCRIBER'));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27293d] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-orange-500" />
            <span>User Profile</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            View and manage your personal credentials, contact details, and organization information.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Account</span>
          </span>
        </div>
      </div>

      {/* 2. Subtab Navigation Pills ([Profile] [Pass] [2FA]) */}
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

      {/* 3. SUBTAB CONTENT */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Identity & Account Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Identity Card */}
            <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-5 text-center sm:text-left">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-center gap-4">
                <div className="relative group">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={formData.name || 'User Profile'}
                      className={`w-24 h-24 rounded-2xl object-cover ring-2 ring-orange-500/50 shadow-xl shadow-orange-500/10 transition-opacity duration-200 ${
                        isUploadingPhoto ? 'opacity-30' : 'opacity-100'
                      }`}
                    />
                  ) : (
                    <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-2xl flex items-center justify-center ring-2 ring-orange-500/50 shadow-lg shadow-orange-500/10 transition-opacity duration-200 ${
                      isUploadingPhoto ? 'opacity-30' : 'opacity-100'
                    }`}>
                      {(formData.name || user?.name || 'User').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Uploading loading spinner overlay */}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 rounded-2xl bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 z-10 animate-in fade-in duration-150">
                      <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
                      <span className="text-[10px] font-extrabold text-orange-400 tracking-wider uppercase">Saving...</span>
                    </div>
                  )}

                  {/* Camera overlay icon */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving || isUploadingPhoto}
                    className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-lg border-2 border-[#181926] transition-transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Change profile photo"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[#181926]" title="Online" />
                </div>

                <div className="space-y-1 text-center sm:text-left lg:text-center w-full">
                  <h2 className="text-lg font-black text-white tracking-tight">
                    {formData.name || user?.name || 'Enterprise User'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    {formData.email}
                  </p>
                  <div className="pt-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/15 text-orange-400 border border-orange-500/30 font-mono tracking-wider">
                      {userRoleDisplay}
                    </span>
                  </div>

                  {/* Photo Action Buttons */}
                  <div className="flex items-center justify-center sm:justify-start lg:justify-center gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving || isUploadingPhoto}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#222438] hover:bg-[#2b2e47] text-slate-200 hover:text-white border border-[#323652] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="w-3 h-3 text-orange-400 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3 text-orange-400" />
                      )}
                      <span>{isUploadingPhoto ? 'Uploading...' : (avatar ? 'Change Photo' : 'Upload Photo')}</span>
                    </button>
                    {avatar && !isUploadingPhoto && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={isSaving || isUploadingPhoto}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 text-center sm:text-left lg:text-center">
                    Instant auto-saved & synced to Cloud Storage
                  </p>
                </div>
              </div>

              <div className="border-t border-[#27293d] pt-4 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-orange-400" /> Organization:
                  </span>
                  <span className="font-semibold text-white truncate max-w-[160px]">
                    {formData.company || 'Enterprise'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Member Since:
                  </span>
                  <span className="font-bold text-white">
                    {memberSinceFormatted}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-orange-400" /> Plan Tier:
                  </span>
                  <span className="font-bold text-orange-400">
                    {customer?.plan || 'Enterprise Max'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <Video className="w-3.5 h-3.5 text-emerald-400" /> Camera Nodes:
                  </span>
                  <span className="font-bold text-emerald-400">
                    {customer?.cameras || 100} Streams
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Status:
                  </span>
                  <span className="font-bold text-emerald-400">
                    Active
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Form Details & Actions (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Box 1: Personal Credentials */}
            <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="pb-3 border-b border-[#27293d] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Personal Credentials
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Profile Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Full Name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Full Name <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* Email Address (Read-only) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                    <span>Work Email (Login ID)</span>
                    <span className="text-[10px] text-slate-500 font-mono font-normal flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" /> Read-only
                    </span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46]/80 bg-[#121422]/60 text-slate-400 text-xs font-mono cursor-not-allowed"
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 9999999999"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* Access Role */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                    <span>Enterprise Access Level</span>
                    <span className="text-[10px] text-slate-500 font-mono font-normal">System Role</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${userRoleDisplay} (Full Access)`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46]/80 bg-[#121422]/60 text-orange-400 text-xs font-bold cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Box 2: Organization & Location */}
            <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="pb-3 border-b border-[#27293d] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Organization & Location
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Business Info</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Company Name */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Company / Organization Name
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="e.g. CoreWatch Test Enterprise"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* Street Address */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Office / Street Address
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    placeholder="e.g. Tech Park Tower 4, Floor 6"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* Area / Landmark */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Area / Landmark
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    placeholder="e.g. Outer Ring Road, Phase 2"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    State / Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g. India"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* PIN Code */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    PIN / Postal Code
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="e.g. 560103"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Direct Save Button & Alert - NO ENCLOSING BOX / CARD */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="w-full sm:w-auto">
                {statusMessage && (
                  <div className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}>
                    {statusMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{statusMessage.text}</span>
                  </div>
                )}
              </div>

              {/* Clean Floating Save Button */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto ml-auto px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xs shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </form>
      )}

      {/* SUBTAB 2: PASS (Change Password) */}
      {activeSubTab === 'pass' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left card: Security guidelines */}
          <div className="lg:col-span-4 border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Password Security</h3>
                <p className="text-xs text-slate-400">Keep your master access safe</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#121422] border border-[#27293d]">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>At least 6 characters (8+ recommended)</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#121422] border border-[#27293d]">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Include uppercase and lowercase letters</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#121422] border border-[#27293d]">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Include numbers and special symbols (@, #, $)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
              <span className="font-bold block">Need Help?</span>
              <p className="text-slate-400 text-[11px]">
                If you forgot your current password, contact your administrator or use the password recovery link on the login page.
              </p>
            </div>
          </div>

          {/* Right card: Form */}
          <div className="lg:col-span-8 border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-500" />
                <span>Update Password</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your current password and choose a secure new password for your account.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Enter new secure password (min. 6 characters)"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-xs font-medium focus:outline-none focus:border-orange-500 transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {passwordStatusMsg && (
                <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                  passwordStatusMsg.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                }`}>
                  {passwordStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{passwordStatusMsg.text}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xs shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 3: 2FA (Two-Factor Authentication) */}
      {activeSubTab === '2fa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left card: 2FA Status & Overview */}
          <div className="lg:col-span-4 border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl border ${
                is2FAEnabled
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              }`}>
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Two-Factor Auth</h3>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono ${
                  is2FAEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                }`}>
                  {is2FAEnabled ? 'ENABLED (ACTIVE)' : 'DISABLED'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Two-Factor Authentication adds an extra layer of defense to your CoreWatch account. In addition to your password, you will be required to enter a 6-digit TOTP code generated on your mobile authenticator.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Supported Apps:</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="p-2 rounded-lg bg-[#121422] border border-[#27293d] flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                  <span>Google Auth</span>
                </div>
                <div className="p-2 rounded-lg bg-[#121422] border border-[#27293d] flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>MS Auth</span>
                </div>
                <div className="p-2 rounded-lg bg-[#121422] border border-[#27293d] flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                  <span>Authy</span>
                </div>
                <div className="p-2 rounded-lg bg-[#121422] border border-[#27293d] flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>1Password</span>
                </div>
              </div>
            </div>

            {is2FAEnabled && (
              <div className="pt-3 border-t border-[#27293d]">
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  disabled={is2FALoading}
                  className="w-full py-2.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {is2FALoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Disable Two-Factor Auth</span>
                </button>
              </div>
            )}
          </div>

          {/* Right card: Setup / Active view */}
          <div className="lg:col-span-8 border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-6">
            {!is2FAEnabled ? (
              <>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-sky-400" />
                    <span>Setup Authenticator App</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Scan the QR code or enter the secret key manually into your authenticator app.
                  </p>
                </div>

                {/* Secret Key & QR Code Display */}
                <div className="p-4 rounded-xl bg-[#121422] border border-[#27293d] space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Visual QR Code generated from Google Chart API / SVG */}
                    <div className="p-3 bg-white rounded-xl shadow-md shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                          `otpauth://totp/CoreWatch:${encodeURIComponent(formData.email || user?.email || 'user')}?secret=${twoFASecret || 'JBSWY3DPEHPK3PXP'}&issuer=CoreWatch`
                        )}`}
                        alt="2FA QR Code"
                        className="w-32 h-32"
                      />
                    </div>

                    <div className="space-y-3 flex-1 w-full text-center sm:text-left">
                      <div className="text-xs text-slate-300">
                        <span className="font-bold text-white block">Manual Setup Secret Key:</span>
                        <div className="mt-1.5 flex items-center gap-2 p-2.5 rounded-lg bg-[#0e101a] border border-[#2a2d42] font-mono text-xs text-amber-300 select-all justify-between">
                          <span>{twoFASecret || 'JBSWY3DPEHPK3PXP'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(twoFASecret || 'JBSWY3DPEHPK3PXP');
                              setCopyCodeSuccess('Secret copied!');
                              setTimeout(() => setCopyCodeSuccess(null), 3000);
                            }}
                            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                      <p className="text-[11px] text-slate-400">
                        Time-based One Time Password (TOTP) algorithm SHA1, 30-second interval, 6-digit output.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6-digit Verification Form */}
                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Enter 6-Digit Code From App
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-[#2b2e46] bg-[#121422] text-white text-base font-mono tracking-widest text-center focus:outline-none focus:border-sky-500 transition-colors"
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
                        <span>Verify & Enable 2FA</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Backup Recovery Codes */}
                {twoFABackupCodes.length > 0 && (
                  <div className="pt-4 border-t border-[#27293d] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Emergency Backup Recovery Codes
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
                          className="px-3 py-1.5 rounded-lg bg-[#121422] border border-[#27293d] text-center font-mono text-xs text-slate-300"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Save these backup codes in a safe place. You can use them to access your account if you lose access to your authenticator app.
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
                    <h3 className="text-base font-black text-white">Your Account is Protected with 2FA</h3>
                    <p className="text-xs text-emerald-200/80 leading-relaxed">
                      Two-Factor Authentication is currently active on this account. Whenever you sign in from a new browser or session, you will be prompted for your 6-digit TOTP code.
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

                <div className="p-4 rounded-xl bg-[#121422] border border-[#27293d] space-y-3">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Active Authenticator Method</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Primary verification device configured. If you change your phone or need to reconfigure your authenticator app, you can disable 2FA and set it up again.
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
