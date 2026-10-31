'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Video, 
  Map, 
  History, 
  Bell, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Menu, 
  X, 
  Shield, 
  PlusCircle, 
  Lock,
  ArrowUpCircle,
  Zap,
  Radio,
  ShieldAlert,
  Cloud
} from 'lucide-react';

export interface UserNavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  user: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
  customer?: {
    plan?: string;
    company?: string;
    status?: string;
    cameras?: number;
  } | null;
  onLogout: () => void;
  activeCameraKey?: string;
  isTrialUser?: boolean;
  maxAllowedCameras?: number;
  cameraCount?: number;
  isCameraLimitReached?: boolean;
  criticalCount?: number;
  unacknowledgedCount?: number;
  onOpenAddCamera?: () => void;
  onOpenDirectConnect?: () => void;
}

export default function UserNavbar({
  activeTab,
  onSelectTab,
  user,
  customer,
  criticalCount = 0,
  unacknowledgedCount = 0,
  onLogout,
  activeCameraKey,
  isTrialUser = false,
  maxAllowedCameras = 1,
  cameraCount = 0,
  isCameraLimitReached = false,
  onOpenAddCamera,
  onOpenDirectConnect,
}: UserNavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveCamDropdownOpen, setLiveCamDropdownOpen] = useState(false);
  const [zonesDropdownOpen, setZonesDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const liveCamRef = useRef<HTMLDivElement>(null);

  // Real plan state with localStorage and API fetch fallback
  const [localPlan, setLocalPlan] = useState<string | null>(customer?.plan || null);

  useEffect(() => {
    if (customer?.plan) {
      setLocalPlan(customer.plan);
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('customer');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.plan) {
            setLocalPlan(parsed.plan);
            return;
          }
        }
      } catch {}

      const token = (user as any)?.token || localStorage.getItem('token');
      if (token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
        fetch(`${apiUrl}/api/customers/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data?.plan) {
              setLocalPlan(data.data.plan);
              localStorage.setItem('customer', JSON.stringify(data.data));
            }
          })
          .catch(() => {});
      }
    }
  }, [customer?.plan, user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (liveCamRef.current && !liveCamRef.current.contains(event.target as Node)) {
        setLiveCamDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trial restriction: In trial mode with camera limit reached, adding camera is locked
  const isTrialLocked = isTrialUser && (cameraCount >= maxAllowedCameras || isCameraLimitReached);

  const displayName = user?.name || 'teesha jain';
  const rawPlan = customer?.plan || localPlan;
  const subscriptionType = rawPlan 
    ? (rawPlan.toLowerCase().includes('plan') || rawPlan.toLowerCase().includes('free') ? rawPlan : `${rawPlan} Plan`)
    : (isTrialUser ? 'Demo Free Trial' : (user?.role === 'admin' ? 'Enterprise Admin' : 'Enterprise Pro Plan'));

  const isLiveCamActive = ['live_camera', 'add_camera', 'all_cameras'].includes(activeTab);

  return (
    <header className="sticky top-0 z-50 bg-[#16192b] border-b border-[#252a45] shadow-lg">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LEFT: Brand Logo & Desktop Navigation */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none select-none"
            >
              <img 
                src="/logo.png" 
                alt="CoreWatch Logo" 
                className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]" 
              />
              <span className="text-xl font-black tracking-tight text-white group-hover:text-orange-400 transition-colors">
                CoreWatch
              </span>
            </button>

            {/* DESKTOP NAV TABS (Camera Hub is removed; Live Camera has Add Camera submenu) */}
            <nav className="hidden lg:flex items-center gap-1.5">
              
              {/* 1. Dashboard */}
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'text-[#f97316] font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutDashboard className={`w-3.5 h-3.5 ${activeTab === 'dashboard' ? 'text-[#f97316]' : 'text-slate-400'}`} />
                <span>Dashboard</span>
                {activeTab === 'dashboard' && (
                  <span className="absolute bottom-[-11px] left-2 right-2 h-0.5 bg-[#f97316] rounded-full shadow-[0_0_8px_#f97316]" />
                )}
              </button>

              {/* 2. Live Camera (Click opens live camera, chevron opens Add Camera submenu) */}
              <div className="relative" ref={liveCamRef}>
                <div className={`relative flex items-center rounded-lg transition-all duration-150 ${
                  isLiveCamActive
                    ? 'text-[#f97316] font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}>
                  {/* Main button: Clicking opens Live Camera directly */}
                  <button
                    onClick={() => {
                      onSelectTab('live_camera');
                      setLiveCamDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <Video className={`w-3.5 h-3.5 ${isLiveCamActive ? 'text-[#f97316]' : 'text-slate-400'}`} />
                    <span>Live Camera</span>
                  </button>

                  {/* Submenu toggle button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLiveCamDropdownOpen(!liveCamDropdownOpen);
                    }}
                    className="pr-2 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                    title="Camera Options"
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform ${liveCamDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isLiveCamActive && (
                    <span className="absolute bottom-[-11px] left-2 right-2 h-0.5 bg-[#f97316] rounded-full shadow-[0_0_8px_#f97316]" />
                  )}
                </div>

                {/* Live Camera Submenu (Includes Add Camera with Lock for Trial) */}
                {liveCamDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-xl bg-[#1b1f35] border border-[#2b3252] shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    
                    {/* Live Feeds Grid */}
                    <button
                      onClick={() => {
                        onSelectTab('live_camera');
                        setLiveCamDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                        activeTab === 'live_camera'
                          ? 'bg-orange-500/15 text-orange-400 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5 text-slate-400" />
                      <span>Live Video Feeds</span>
                    </button>

                    {/* Add Camera: Disabled with Lock icon if on Trial */}
                    {isTrialLocked ? (
                      <div
                        onClick={() => {
                          setLiveCamDropdownOpen(false);
                          onSelectTab('billing');
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-left text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer group"
                        title={`Plan quota reached (${cameraCount}/${maxAllowedCameras} nodes). Click to upgrade your quota.`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-slate-300 group-hover:text-amber-300 font-medium">Add Camera</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-mono">
                          <Lock className="w-2.5 h-2.5" /> {cameraCount}/{maxAllowedCameras}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setLiveCamDropdownOpen(false);
                          if (onOpenAddCamera) {
                            onOpenAddCamera();
                          } else {
                            onSelectTab('add_camera');
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                          activeTab === 'add_camera'
                            ? 'bg-orange-500/15 text-orange-400 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Add Camera</span>
                      </button>
                    )}

                    {/* Direct Stream Connect (for Test user / quick URL swap) */}
                    {onOpenDirectConnect && (
                      <button
                        onClick={() => {
                          setLiveCamDropdownOpen(false);
                          onOpenDirectConnect();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer text-orange-300 hover:text-white hover:bg-orange-500/10 border-t border-white/5"
                      >
                        <Zap className="w-3.5 h-3.5 text-orange-400" />
                        <span>Direct Connect URL</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-mono ml-auto">TEST</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Security Zones */}
              <button
                onClick={() => onSelectTab('zones')}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  activeTab === 'zones'
                    ? 'text-[#f97316] font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Map className={`w-3.5 h-3.5 ${activeTab === 'zones' ? 'text-[#f97316]' : 'text-slate-400'}`} />
                <span>Security Zones</span>
                {activeTab === 'zones' && (
                  <span className="absolute bottom-[-11px] left-2 right-2 h-0.5 bg-[#f97316] rounded-full shadow-[0_0_8px_#f97316]" />
                )}
              </button>

              {/* Security Incident Center */}
              <button
                onClick={() => onSelectTab('notification')}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  activeTab === 'notification' || activeTab === 'alert_center'
                    ? 'text-[#f97316] font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShieldAlert className={`w-3.5 h-3.5 ${
                  criticalCount > 0
                    ? 'text-red-500 animate-pulse'
                    : activeTab === 'notification' || activeTab === 'alert_center'
                    ? 'text-[#f97316]'
                    : 'text-slate-400'
                }`} />
                <span>Alert Center</span>

                {/* Dynamic Status Badges */}
                {criticalCount > 0 ? (
                  <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-red-600 text-white animate-pulse shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    {criticalCount}
                  </span>
                ) : unacknowledgedCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/25 text-amber-400 border border-amber-500/40">
                    {unacknowledgedCount}
                  </span>
                ) : null}

                {(activeTab === 'notification' || activeTab === 'alert_center') && (
                  <span className="absolute bottom-[-11px] left-2 right-2 h-0.5 bg-[#f97316] rounded-full shadow-[0_0_8px_#f97316]" />
                )}
              </button>

            </nav>
          </div>

          {/* RIGHT: User Profile Pill with Dropdown containing Billing, Settings & Logout */}
          <div className="flex items-center gap-3">
            {user?.email === 'test@gmail.com' && onOpenDirectConnect && (
              <button
                onClick={onOpenDirectConnect}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-400 font-bold text-xs shadow-sm cursor-pointer transition-all"
                title="Directly connect or update camera stream URL"
              >
                <Zap className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                <span>Connect Stream</span>
              </button>
            )}
            
            {/* User Profile Pill */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1 pr-2.5 rounded-full hover:bg-white/5 border border-transparent hover:border-[#2a3052] transition-all cursor-pointer focus:outline-none"
              >
                <div className="relative">
                  <img
                    src="/uploads/avatar_asha.jpg"
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-500/30"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#16192b]" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-orange-400 font-semibold">
                    {subscriptionType}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu (Exact match of reference screenshot) */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#181b2e] border border-[#2b304c] shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  
                  {/* Header info */}
                  <div className="px-5 pb-3 border-b border-[#252942] space-y-1.5">
                    <p className="text-sm font-bold text-white tracking-tight">{displayName}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{user?.email || 'user@corewatch.ai'}</p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-[#382618] text-[#f97316] border border-[#59381c]">
                        {subscriptionType}
                      </span>
                    </div>
                  </div>

                  {/* Menu Options: Profile, Billing, Subscription, AI Camera Settings */}
                  <div className="py-2 px-2 space-y-0.5 text-xs text-slate-200">
                    <button
                      onClick={() => {
                        onSelectTab('profile');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center px-3.5 py-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-colors text-left cursor-pointer font-medium"
                    >
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectTab('billing');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center px-3.5 py-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-colors text-left cursor-pointer font-medium"
                    >
                      <span>Subscription & Billing</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectTab('integrations');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-colors text-left cursor-pointer font-medium text-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <Cloud className="w-3.5 h-3.5 text-orange-400" />
                        <span>Cloud Storage & Drives</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                        Drive
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectTab('settings');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center px-3.5 py-2.5 rounded-xl hover:bg-white/5 hover:text-white transition-colors text-left cursor-pointer font-medium"
                    >
                      <span>System Settings</span>
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="pt-2 border-t border-[#252942] px-2">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center px-3.5 py-2.5 rounded-xl hover:bg-red-500/10 text-[#f87171] hover:text-red-300 transition-colors text-left cursor-pointer text-xs font-bold"
                    >
                      <span>Sign Out</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Dedicated Logout Icon Button */}
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#2a3052] transition-colors cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE DRAWER NAV */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#16192b] border-t border-[#252a45] px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => {
              onSelectTab('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'dashboard'
                ? 'bg-orange-500/15 text-[#f97316] font-bold border border-orange-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>Dashboard</span>
          </button>

          {/* Live Camera on Mobile */}
          <div className="space-y-1">
            <button
              onClick={() => {
                onSelectTab('live_camera');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                activeTab === 'live_camera'
                  ? 'bg-orange-500/15 text-[#f97316] font-bold border border-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Video className="w-4 h-4 text-slate-400" />
                <span>Live Camera</span>
              </div>
            </button>

            <div className="pl-6 space-y-1">
              {isTrialLocked ? (
                <div
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSelectTab('billing');
                  }}
                  className="flex items-center justify-between px-3 py-1.5 text-[11px] text-slate-400 hover:text-amber-300 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-amber-500" />
                    <span>Add Camera (Locked)</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">{cameraCount}/{maxAllowedCameras}</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSelectTab('add_camera');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-400 hover:text-white text-left"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>Add Camera</span>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              onSelectTab('zones');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'zones'
                ? 'bg-orange-500/15 text-[#f97316] font-bold border border-orange-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Map className="w-4 h-4 text-slate-400" />
            <span>Security Zones</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('notification');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'notification' || activeTab === 'alert_center'
                ? 'bg-orange-500/15 text-[#f97316] font-bold border border-orange-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              <span>Alert Center</span>
            </div>
            {criticalCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse">
                {criticalCount} CRITICAL
              </span>
            ) : unacknowledgedCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                {unacknowledgedCount}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => {
              onSelectTab('integrations');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
              activeTab === 'integrations' || activeTab === 'cloud_storage'
                ? 'bg-orange-500/15 text-[#f97316] font-bold border border-orange-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Cloud className="w-4 h-4 text-slate-400" />
              <span>Cloud Storage & Drives</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
              OAuth 2.0
            </span>
          </button>
        </div>
      )}
    </header>
  );
}
