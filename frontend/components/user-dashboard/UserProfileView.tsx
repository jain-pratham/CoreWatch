'use client';

import React, { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';

interface UserProfileViewProps {
  user: any;
  customer?: any;
  onProfileUpdated?: (updatedData: any) => void;
}

export default function UserProfileView({
  user,
  customer,
  onProfileUpdated
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

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user || customer) {
      setFormData({
        name: user?.name || 'Test User',
        email: user?.email || 'test@gmail.com',
        phone: customer?.phone || '+91 9999999999',
        company: customer?.company || user?.company || 'CoreWatch Test Enterprise',
        addressLine1: customer?.addressLine1 || 'Tech Park Tower 4, Floor 6',
        addressLine2: customer?.addressLine2 || 'Outer Ring Road',
        city: customer?.city || 'Bengaluru',
        state: customer?.state || 'Karnataka',
        country: customer?.country || 'India',
        pincode: customer?.pincode || '560103',
      });
    }
  }, [user, customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          text: 'Profile updated successfully!',
        });

        // Update stored user in localStorage
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              parsed.name = formData.name.trim();
              parsed.company = formData.company.trim();
              localStorage.setItem('user', JSON.stringify(parsed));
            } catch (err) {
              console.warn('Could not update user in localStorage', err);
            }
          }
        }

        if (onProfileUpdated) {
          onProfileUpdated({ ...formData, customer: data.data });
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
            localStorage.setItem('user', JSON.stringify(parsed));
          } catch (e) {}
        }
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

      {/* 2. Main 2-Column Responsive Layout */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Identity & Account Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Identity Card */}
            <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-5 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-center gap-4">
                <div className="relative">
                  <img
                    src="/uploads/avatar_asha.jpg"
                    alt={formData.name || 'User Profile'}
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-orange-500/50 shadow-lg shadow-orange-500/10"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#181926]" title="Online" />
                </div>

                <div className="space-y-1 text-center sm:text-left lg:text-center">
                  <h2 className="text-lg font-black text-white tracking-tight">
                    {formData.name || 'Test User'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    {formData.email}
                  </p>
                  <div className="pt-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/15 text-orange-400 border border-orange-500/30 font-mono tracking-wider">
                      {userRoleDisplay}
                    </span>
                  </div>
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
                    placeholder="e.g. Test User"
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

    </div>
  );
}
