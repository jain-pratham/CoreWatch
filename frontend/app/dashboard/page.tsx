'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar, { NavItem } from '../../components/layout/Sidebar';
import { 
  LayoutDashboard, Users, UserPlus, Settings, CreditCard, Video, Camera, History, 
  UserCircle, Bell, Eye, EyeOff, ArrowUpCircle, Map, Info, CheckCircle, AlertCircle, 
  Loader2, PlusCircle, Trash2, Search, ExternalLink, Copy, Check, Filter, Play, X,
  ShieldCheck, ShieldAlert, Activity, Sliders, Lock, Calendar, Zap, CheckCircle2, 
  Shield, HardDrive, Sparkles, TrendingUp, Clock, ArrowRight, FileText, Building, 
  Layers, Receipt, RefreshCw
} from 'lucide-react';
import { securityAudio } from '@/lib/securityAudio';
import { nativeNotifier } from '@/lib/nativeNotifier';
import CustomConfirmDialog from '../../components/common/CustomConfirmDialog';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'demo';
  company?: string;
  avatar?: string;
  token?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  cameras: number;
  plan: string;
  status: 'Active' | 'Pending' | 'Suspended';
}

interface SecurityEvent {
  id: string;
  type: string;
  camera: string;
  severity: 'high' | 'medium' | 'low';
  time: string;
  status: 'unread' | 'read';
}


const NAVIGATION_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard?tab=dashboard', icon: LayoutDashboard, roles: ['admin', 'user', 'demo'] },
  { label: 'Customers', href: '/dashboard?tab=all_customers', icon: Users, roles: ['admin'], children: [
    { label: 'All Customers', href: '/dashboard?tab=all_customers', icon: Users },
    { label: 'Add Customer', href: '/dashboard?tab=add_customer', icon: UserPlus }
  ]},
  { label: 'Billing', href: '/dashboard?tab=billing_plans', icon: CreditCard, roles: ['admin'], children: [
    { label: 'Plans', href: '/dashboard?tab=billing_plans', icon: CreditCard },
    { label: 'Active Subscribers', href: '/dashboard?tab=active_subscribers', icon: Users },
    { label: 'Invoice', href: '/dashboard?tab=billing_invoices', icon: History }
  ]},
  { label: 'Notification', href: '/dashboard?tab=admin_notifications', icon: Bell, roles: ['admin'] },
  { label: 'My Account', href: '/dashboard?tab=admin_profile', icon: UserCircle, roles: ['admin'] },
  { label: 'Help & Guidelines', href: '/dashboard?tab=help_guidelines', icon: Info, roles: ['admin'] },
  { label: 'Live Camera', href: '/dashboard?tab=live_camera', icon: Video, roles: ['user'] },
  { label: 'Camera Hub', href: '/dashboard?tab=all_cameras', icon: Camera, roles: ['user'], children: [
    { label: 'All Cameras', href: '/dashboard?tab=all_cameras', icon: Video },
    { label: 'Add Camera', href: '/dashboard?tab=add_camera', icon: PlusCircle }
  ]},
  { label: 'Security Zones', href: '/dashboard?tab=zones', icon: Map, roles: ['user'], children: [
    { label: 'Configure Zones', href: '/dashboard?tab=zones', icon: Map }
  ]},
  { label: 'Billing', href: '/dashboard?tab=invoices', icon: CreditCard, roles: ['user'], children: [
    { label: 'Invoices', href: '/dashboard?tab=invoices' },
    { label: 'Subscription & Plan', href: '/dashboard?tab=subscription_detail' }
  ]},
  { label: 'Profile', href: '/dashboard?tab=profile', icon: UserCircle, roles: ['user'] },
  { label: 'Notification', href: '/dashboard?tab=notification', icon: Bell, roles: ['user'] },
  { label: 'Demo Overview', href: '/dashboard?tab=demo_overview', icon: Eye, roles: ['demo'] },
  { label: 'Upgrade Account', href: '/dashboard?tab=upgrade_account', icon: ArrowUpCircle, roles: ['demo'] },
  { label: 'Cloud Storage', href: '/dashboard?tab=integrations', icon: HardDrive, roles: ['user', 'admin'] },
  { label: 'Settings', href: '/dashboard?tab=settings', icon: Settings, roles: ['admin', 'user'] },
];

import { Suspense } from 'react';
import ZoneManagementView from '../../components/zones/ZoneManagementView';
import PlansManagementView from '../../components/billing/PlansManagementView';
import UserDashboardContainer from '../../components/user-dashboard/UserDashboardContainer';
import UserSettingsView from '../../components/user-dashboard/UserSettingsView';
import CloudStorageIntegrationView from '../../components/user-dashboard/CloudStorageIntegrationView';
import AdminAccountView from '../../components/admin/AdminAccountView';
import AdminNotificationsView from '../../components/admin/AdminNotificationsView';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<string>(urlTab || 'dashboard');

  const handleSelectTab = (newTab: string) => {
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      const targetUrl = newTab === 'dashboard' ? '/dashboard' : '/dashboard?tab=' + encodeURIComponent(newTab);
      window.history.pushState({ tab: newTab }, '', targetUrl);
      localStorage.setItem('activeTab', newTab);
    }
  };

  useEffect(() => {
    if (urlTab) setActiveTab(urlTab);
  }, [urlTab]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabFromUrl = params.get('tab') || 'dashboard';
      setActiveTab(tabFromUrl);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [tabLoaded, setTabLoaded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [previewUserMode, setPreviewUserMode] = useState(false);

  // Escape key press handler for mobile menu drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Next.js MongoDB multi-tenant camera & alert state
  const [cameras, setCameras] = useState<any[]>([]);
  const [dbAlerts, setDbAlerts] = useState<any[]>([]);
  const [dbInvoices, setDbInvoices] = useState<any[]>([]);
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [activeCameraKey, setActiveCameraKey] = useState<string>('');
  const [customer, setCustomer] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('customer');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  });
  const [copySuccess, setCopySuccess] = useState(false);
  const [camName, setCamName] = useState('');
  const [camIp, setCamIp] = useState('');
  const [camPort, setCamPort] = useState('554');
  const [camUsername, setCamUsername] = useState('');
  const [camPassword, setCamPassword] = useState('');
  const [camRtsp, setCamRtsp] = useState('');
  const [camMfg, setCamMfg] = useState('Hikvision');
  const [camModel, setCamModel] = useState('');
  const [camLocation, setCamLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Custom Confirmation & Alert Dialog States (replaces all window.confirm and alert)
  const [cameraToDelete, setCameraToDelete] = useState<{ cameraKey: string; name?: string } | null>(null);
  const [isDeletingCamera, setIsDeletingCamera] = useState(false);
  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);

  const showAlert = (
    title: string,
    message: string,
    variant: 'danger' | 'warning' | 'info' | 'success' = 'info',
    onConfirm?: () => void
  ) => {
    setCustomAlert({
      isOpen: true,
      title,
      message,
      variant,
      onConfirm,
    });
  };

  // Trial User and Camera Quota Helpers (Test user has unlimited quota and zero locks)
  const isTestUser = user?.email === 'test@gmail.com';
  const isTrialUser = !isTestUser && user?.role !== 'admin' && (
    customer?.plan === 'Demo Free' ||
    customer?.plan?.toLowerCase().includes('demo') ||
    customer?.plan?.toLowerCase().includes('trial') ||
    customer?.plan?.toLowerCase().includes('free')
  );

  // Match customer's active plan from dbPlans (saved/edited by Super Admin)
  const activePlanDoc = useMemo(() => {
    if (!customer?.plan || !Array.isArray(dbPlans)) return null;
    return dbPlans.find((p: any) => p.name?.toLowerCase() === (customer.plan || '').toLowerCase()) || null;
  }, [customer?.plan, dbPlans]);

  // Live camera limit directly governed by the plan saved in database by Super Admin
  const maxAllowedCameras = isTestUser 
    ? 9999 
    : (activePlanDoc?.maxCameras !== undefined 
        ? activePlanDoc.maxCameras 
        : (customer?.cameras !== undefined 
            ? customer.cameras 
            : (isTrialUser ? 1 : 5)));

  const isCameraLimitReached = isTestUser ? false : (cameras.length >= maxAllowedCameras);

  // Filter navigation items for trial users who already have their camera configured
  const computedNavItems = useMemo(() => {
    return NAVIGATION_ITEMS.map((item) => {
      if (item.label === 'Camera Hub') {
        if (isTrialUser && (cameras.length >= maxAllowedCameras || isCameraLimitReached)) {
          return {
            ...item,
            children: [
              { label: 'All Cameras', href: '/dashboard?tab=all_cameras', icon: Video },
              { label: 'Upgrade Plan', href: '/dashboard?tab=billing', icon: ArrowUpCircle }
            ]
          };
        }
      }
      return item;
    });
  }, [isTrialUser, cameras.length, maxAllowedCameras, isCameraLimitReached]);

  // Camera Directory Filter, Search and Action state
  const [cameraSearchQuery, setCameraSearchQuery] = useState('');
  const [cameraMfgFilter, setCameraMfgFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Camera Modal States (View & Settings)
  const [selectedViewCamera, setSelectedViewCamera] = useState<any | null>(null);
  const [selectedSettingsCamera, setSelectedSettingsCamera] = useState<any | null>(null);
  const [settingsTab, setSettingsTab] = useState<'ai' | 'device'>('ai');
  const [isSavingDeviceSettings, setIsSavingDeviceSettings] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);
  const [settingsErrorMsg, setSettingsErrorMsg] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    locationName: '',
    ipAddress: '',
    port: '554',
    username: '',
    password: '',
    rtspUrl: '',
    manufacturer: 'Hikvision',
    cameraModel: '',
  });

  const openViewModal = (cam: any) => {
    setSelectedViewCamera(cam);
  };

  const openSettingsModal = (cam: any) => {
    setSelectedSettingsCamera(cam);
    setSettingsTab('ai');
    setSettingsSuccessMsg(null);
    setSettingsErrorMsg(null);
    setEditForm({
      name: cam.name || '',
      locationName: cam.locationName || '',
      ipAddress: cam.ipAddress || '',
      port: cam.port ? String(cam.port) : '554',
      username: cam.username || '',
      password: '',
      rtspUrl: cam.rtspUrl || '',
      manufacturer: cam.manufacturer || 'Hikvision',
      cameraModel: cam.cameraModel || '',
    });
  };

  const handleToggleModalFeature = async (featureName: string, currentValue: boolean) => {
    if (!selectedSettingsCamera) return;
    try {
      const updatedValue = !currentValue;
      const res = await fetch('/api/cameras', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          cameraKey: selectedSettingsCamera.cameraKey,
          [featureName]: updatedValue
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCameras(cameras.map(c => c.cameraKey === selectedSettingsCamera.cameraKey ? data.data : c));
        setSelectedSettingsCamera(data.data);
      }
    } catch (err) {
      console.error("Failed to toggle feature:", err);
      showAlert("Settings Error", "Failed to update feature settings.", "danger");
    }
  };

  const handleSaveDeviceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettingsCamera) return;
    setIsSavingDeviceSettings(true);
    setSettingsSuccessMsg(null);
    setSettingsErrorMsg(null);

    try {
      const payload: any = {
        cameraKey: selectedSettingsCamera.cameraKey,
        name: editForm.name.trim(),
        locationName: editForm.locationName.trim() || editForm.name.trim(),
        ipAddress: editForm.ipAddress.trim(),
        port: parseInt(editForm.port, 10) || 554,
        username: editForm.username.trim(),
        rtspUrl: editForm.rtspUrl.trim(),
        manufacturer: editForm.manufacturer,
        cameraModel: editForm.cameraModel.trim(),
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await fetch('/api/cameras', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCameras(cameras.map(c => c.cameraKey === selectedSettingsCamera.cameraKey ? data.data : c));
        setSelectedSettingsCamera(data.data);
        setSettingsSuccessMsg("✓ Camera configuration updated successfully!");
        setTimeout(() => setSettingsSuccessMsg(null), 3000);
      } else {
        setSettingsErrorMsg(data.error || "Failed to update camera parameters.");
      }
    } catch (err) {
      setSettingsErrorMsg("An unexpected error occurred while saving device settings.");
    } finally {
      setIsSavingDeviceSettings(false);
    }
  };

  const filteredCameras = cameras.filter((cam) => {
    const query = cameraSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (cam.name?.toLowerCase() || '').includes(query) ||
      (cam.cameraKey?.toLowerCase() || '').includes(query) ||
      (cam.locationName?.toLowerCase() || '').includes(query) ||
      (cam.ipAddress?.toLowerCase() || '').includes(query);
    const matchesMfg = cameraMfgFilter === 'ALL' || (cam.manufacturer || 'Hikvision') === cameraMfgFilter;
    return matchesSearch && matchesMfg;
  });

  const handleDeleteCamera = (cameraKeyToDelete: string) => {
    const cam = cameras.find((c) => c.cameraKey === cameraKeyToDelete);
    setCameraToDelete({
      cameraKey: cameraKeyToDelete,
      name: cam?.locationName || cam?.name || cameraKeyToDelete,
    });
  };

  const confirmDeleteCamera = async () => {
    if (!cameraToDelete) return;
    const cameraKeyToDelete = cameraToDelete.cameraKey;
    setIsDeletingCamera(true);
    try {
      const res = await fetch(`/api/cameras?cameraKey=${cameraKeyToDelete}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setCameras((prev) => prev.filter((c) => c.cameraKey !== cameraKeyToDelete));
        if (activeCameraKey === cameraKeyToDelete) {
          const remaining = cameras.filter((c) => c.cameraKey !== cameraKeyToDelete);
          setActiveCameraKey(remaining.length > 0 ? remaining[0].cameraKey : '');
        }
        setCameraToDelete(null);
      } else {
        showAlert('Failed to Remove Camera', data.error || 'Failed to delete camera.', 'danger');
      }
    } catch (err) {
      showAlert('Network Error', 'Failed to delete camera. Please check your network connection.', 'danger');
    } finally {
      setIsDeletingCamera(false);
    }
  };

  const activeCamera = cameras.find((c) => c.cameraKey === activeCameraKey);

  const toggleCameraFeature = async (featureName: string, currentValue: boolean) => {
    if (!activeCameraKey) return;
    try {
      const updatedValue = !currentValue;
      const res = await fetch('/api/cameras', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          cameraKey: activeCameraKey,
          [featureName]: updatedValue
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCameras(cameras.map(c => c.cameraKey === activeCameraKey ? data.data : c));
      }
    } catch (err) {
      console.error("Failed to toggle feature:", err);
      showAlert("Settings Error", "Failed to update feature settings.", "danger");
    }
  };
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    customers: true,
  });

  // New Customer Form State (Admin)
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    cameras: 5,
    plan: 'Enterprise Pro',
    addressLine1: '',
    addressLine2: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
  });
  const [customerSuccessMsg, setCustomerSuccessMsg] = useState<string | null>(null);
  const [customerErrorMsg, setCustomerErrorMsg] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);

  // Customer Database State (Loaded from MongoDB /api/customers)
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Super Admin Real Analytics & MRR Calculation
  const totalCalculatedMRR = useMemo(() => {
    if (!Array.isArray(customers) || customers.length === 0) return 0;
    return customers.reduce((sum, c) => {
      const plan = Array.isArray(dbPlans) ? dbPlans.find((p: any) => p.name?.toLowerCase() === (c.plan || '').toLowerCase()) : null;
      const price = plan ? (plan.monthlyPrice || 0) : (c.plan?.toLowerCase().includes('max') ? 99 : c.plan?.toLowerCase().includes('pro') ? 49 : 0);
      return sum + price;
    }, 0);
  }, [customers, dbPlans]);

  const totalCalculatedNodes = useMemo(() => {
    const fromCustomers = (customers || []).reduce((sum, c) => sum + (Number(c.cameras) || 0), 0);
    return fromCustomers + (cameras ? cameras.length : 0);
  }, [customers, cameras]);


  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

  // 1. Initial User Authentication Check
  useEffect(() => {
    // Theme detection
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    // Auth verification
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser({ ...parsedUser, token: storedToken });

      // Verify profile with backend API
      fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const freshUser = data.data;
            setUser({ ...freshUser, token: storedToken });
            localStorage.setItem('user', JSON.stringify({ ...freshUser, token: storedToken }));

            if (freshUser.role !== 'admin') {
              // Fetch customer profile to check if setup is complete
              fetch(`${API_URL}/api/customers/me`, {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${storedToken}`,
                },
              })
                .then((cRes) => cRes.json())
                .then((cData) => {
                  if (cData.success && cData.data) {
                    setCustomer(cData.data);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('customer', JSON.stringify(cData.data));
                    }
                    if (cData.data.status === 'Active' || freshUser.email === 'test@gmail.com') {
                      // Allowed to enter dashboard
                      setLoading(false);
                    } else {
                      // Pending status: redirect to wizard
                      router.push('/signup-steps');
                    }
                  } else if (freshUser.email === 'test@gmail.com') {
                    setLoading(false);
                  } else {
                    router.push('/signup-steps');
                  }
                })
                .catch(() => {
                  if (freshUser.email === 'test@gmail.com') {
                    setLoading(false);
                  } else {
                    router.push('/signup-steps');
                  }
                });
            } else {
              setLoading(false);
            }
          } else {
            router.push('/login');
          }
        })
        .catch((err) => {
          console.log('Auth check note:', err);
          setLoading(false);
        });
    } catch {
      router.push('/login');
    }
  }, [router, API_URL]);

  // Persist active tab selection across refreshes and sync with URL
  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    } else {
      const savedTab = localStorage.getItem('activeTab');
      if (savedTab) {
        setActiveTab(savedTab);
        if (savedTab !== 'dashboard') {
          window.history.replaceState({ tab: savedTab }, '', '/dashboard?tab=' + encodeURIComponent(savedTab));
        }
      }
    }
    setTabLoaded(true);
  }, [urlTab]);

  useEffect(() => {
    if (tabLoaded) {
      localStorage.setItem('activeTab', activeTab);
    }
  }, [activeTab, tabLoaded]);

  // 2. Fetch Cameras and Poll Alerts from MongoDB (scoped to user)
  useEffect(() => {
    if (!user || !user.token) return;
    const token = user.token;

    const loadCameras = async () => {
      try {
        const res = await fetch('/api/cameras', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setCameras(data.data);
          if (data.data.length > 0) {
            setActiveCameraKey(data.data[0].cameraKey);
          } else {
            setActiveCameraKey('');
          }
        }
      } catch (err) {
        console.log("Failed to load cameras:", err);
      }
    };

    const loadAlerts = async () => {
      try {
        const res = await fetch('/api/alerts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setDbAlerts(data.data);
        }
      } catch (err) {
        console.log("Failed to load alerts:", err);
      }
    };

    const loadCustomers = async () => {
      if (user?.role !== 'admin') return;
      try {
        const res = await fetch(`${API_URL}/api/customers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setCustomers(data.data);
        }
      } catch (err) {
        console.log("Failed to load customers list:", err);
      }
    };

    const loadInvoices = async () => {
      try {
        setLoadingInvoices(true);
        const res = await fetch(`${API_URL}/api/invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          const list = Array.isArray(data.data) ? data.data : (Array.isArray(data.data.invoices) ? data.data.invoices : []);
          setDbInvoices(list);
        }
      } catch (err) {
        console.log("Failed to load invoices from DB:", err);
      } finally {
        setLoadingInvoices(false);
      }
    };

    const loadPlans = async () => {
      try {
        const res = await fetch(`${API_URL}/api/plans`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          const list = Array.isArray(data.data) ? data.data : (Array.isArray(data.data.plans) ? data.data.plans : []);
          setDbPlans(list);
        }
      } catch (err) {
        console.log("Failed to load plans from DB:", err);
      }
    };

    loadCameras();
    loadAlerts();
    loadCustomers();
    loadInvoices();
    loadPlans();

    // Real-Time Server-Sent Events (SSE) for instant alert push with ZERO polling overhead
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/alerts/events?token=${token}`);
      
      eventSource.addEventListener('alert', (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (!payload) return;

          // 1. Handle Real-Time Incident Status Updates (Acknowledge / Resolve)
          if (payload.isUpdate && payload.alertId) {
            setDbAlerts((prev) =>
              prev.map((a) =>
                a._id === payload.alertId
                  ? { ...a, ...(payload.updatedDoc || {}), status: payload.status, resolutionNotes: payload.resolutionNotes }
                  : a
              )
            );
            if (payload.status === 'ACKNOWLEDGED' || payload.status === 'RESOLVED') {
              securityAudio.stopCriticalAlarm(payload.alertId);
            }
            return;
          }

          // 2. Handle New Security Incident
          const newAlert = payload;
          if (newAlert && (newAlert._id || newAlert.cameraKey)) {
            setDbAlerts((prev) => {
              if (prev.some((a) => a._id === newAlert._id)) return prev;
              return [newAlert, ...prev];
            });

            // Play professional security alarm based on incident severity
            const severity = newAlert.severity || 'HIGH';
            securityAudio.playAlarm(severity, newAlert._id);

            // Dispatch native operating system notification where permitted
            nativeNotifier.sendNotification(
              {
                id: newAlert._id,
                cameraKey: newAlert.cameraKey,
                cameraName: newAlert.cameraName,
                severity: newAlert.severity || 'HIGH',
                category: newAlert.category,
                message: newAlert.message,
                reason: newAlert.reason || newAlert.description,
                timestamp: newAlert.timestamp,
                zoneName: newAlert.zoneName,
              },
              () => {
                if (newAlert.cameraKey) {
                  setActiveCameraKey(newAlert.cameraKey);
                  setActiveTab('live_camera');
                }
              }
            );
          }
        } catch (parseErr) {
          console.error("SSE security alert parse error:", parseErr);
        }
      });

      eventSource.onerror = () => {
        // EventSource automatically handles reconnecting in the background
      };
    } catch (sseErr) {
      console.warn("SSE connection error:", sseErr);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };

  }, [user]);


  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleUpgradeDemoToUser = async () => {
    if (!user || user.role !== 'demo') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setUpgrading(true);
    setUpgradeMsg(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'user' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = { ...user, role: 'user' as const };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUpgradeMsg('🎉 Account upgraded successfully from DEMO to USER role!');
      } else {
        setUpgradeMsg(`Upgrade failed: ${data.message || 'Error occurred'}`);
      }
    } catch {
      const updatedUser = { ...user, role: 'user' as const };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUpgradeMsg('🎉 Account upgraded successfully from DEMO to USER role!');
    } finally {
      setUpgrading(false);
    }
  };

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setCustomerSuccessMsg(null);
    setCustomerErrorMsg(null);
    const errors: Record<string, string> = {};
    
    if (!newCustomer.firstName.trim()) {
      errors.firstName = 'First Name is required.';
    }
    if (!newCustomer.lastName.trim()) {
      errors.lastName = 'Last Name is required.';
    }
    
    if (!newCustomer.email.trim()) {
      errors.email = 'Work Email Address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    
    const digitsOnly = newCustomer.phone.replace(/\D/g, '');
    if (!newCustomer.phone.trim()) {
      errors.phone = 'Phone Number is required.';
    } else if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      errors.phone = 'Please enter a valid phone number (8 to 15 digits).';
    }
    
    if (!newCustomer.company.trim()) {
      errors.company = 'Company / Organization Name is required.';
    }
    
    if (!newCustomer.addressLine1.trim()) {
      errors.addressLine1 = 'Address Line 1 is required.';
    }
    
    if (!newCustomer.country.trim()) {
      errors.country = 'Country is required.';
    }
    
    if (!newCustomer.state.trim()) {
      errors.state = 'State / Region is required.';
    }
    
    if (!newCustomer.city.trim()) {
      errors.city = 'City is required.';
    }
    
    const pinTrimmed = newCustomer.pincode.trim();
    if (!pinTrimmed) {
      errors.pincode = 'ZIP / Postal Code is required.';
    } else if (!/^[A-Za-z0-9\s\-]{4,10}$/.test(pinTrimmed)) {
      errors.pincode = 'Please enter a valid ZIP / Postal Code.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      
      // Smooth scroll to the first error field
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstErrorField}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Try focusing the inner input element
        const inputEl = element.querySelector('input, select');
        if (inputEl) {
          setTimeout(() => {
            (inputEl as HTMLElement).focus();
          }, 300);
        }
      }
      return;
    }

    setFormErrors({});
    setIsSubmittingCustomer(true);

    try {
      const customerToSubmit = {
        ...newCustomer,
        phone: `${selectedCountryCode} ${newCustomer.phone.trim()}`.trim(),
      };

      const res = await fetch(`${API_URL}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(customerToSubmit),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCustomerSuccessMsg(`Customer ${newCustomer.firstName} ${newCustomer.lastName} added successfully! Setup email sent.`);
        setNewCustomer({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          cameras: 5,
          plan: 'Enterprise Pro',
          addressLine1: '',
          addressLine2: '',
          country: '',
          state: '',
          city: '',
          pincode: '',
        });
        setSelectedCountryCode('+91');

        // Reload customer directory
        if (user?.token) {
          const resList = await fetch(`${API_URL}/api/customers`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const dataList = await resList.json();
          if (dataList.success && dataList.data) {
            setCustomers(dataList.data);
          }
        }
      } else {
        setCustomerErrorMsg(data.message || "Failed to create customer.");
        document.getElementById('add-customer-header')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (err) {
      setCustomerErrorMsg("Network error: failed to submit customer information.");
      document.getElementById('add-customer-header')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-xs font-mono">Loading CoreWatch Workspace...</p>
        </div>
      </div>
    );
  }

  // Define Navigation Menus for each Role
  const roleMenus: Record<string, any[]> = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      {
        id: 'customers',
        label: 'Customers',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        subItems: [
          { id: 'all_customers', label: 'All Customers', icon: 'M4 6h16M4 12h16M4 18h16' },
          { id: 'add_customer', label: 'Add Customer', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' }
        ]
      },
      { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
      {
        id: 'billing',
        label: 'Billing',
        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        subItems: [
          { id: 'billing_plans', label: 'Plans', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          { id: 'active_subscribers', label: 'Active Subscribers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { id: 'billing_invoices', label: 'Invoice', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
        ]
      },
      { id: 'admin_notifications', label: 'Notification', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
      { id: 'admin_profile', label: 'My Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      { id: 'help_guidelines', label: 'Help & Guidelines', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    ],
    user: [
      { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { id: 'live_camera', label: 'Live Camera', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
      {
        id: 'camera_hub',
        label: 'Camera Hub',
        icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
        subItems: [
          { id: 'all_cameras', label: 'All Cameras', icon: 'M4 6h16M4 12h16M4 18h16' },
          { id: 'add_camera', label: 'Add Camera', icon: 'M12 4v16m8-8H4' }
        ]
      },
      { id: 'zones', label: 'Security Zones', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
      { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
      {
        id: 'billing',
        label: 'Billing',
        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        subItems: [
          { id: 'invoices', label: 'Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { id: 'subscription_detail', label: 'Subscription & Plan', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
        ]
      },
      { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      { id: 'notification', label: 'Notification', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ],
    demo: [
      { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { id: 'demo_overview', label: 'Demo Overview', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { id: 'upgrade_account', label: 'Upgrade Account', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    ],
  };

  const currentRole = user?.role || 'user';
  const menuItems = roleMenus[currentRole];

  // Helper for User Badge Styling
  const roleBadgeStyle = {
    admin: { label: 'COMPANY ADMIN', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    user: { label: 'STANDARD USER', color: 'bg-brand-blue/20 text-brand-blue dark:text-brand-light-blue border-brand-blue/30' },
    demo: { label: 'DEMO TESTER', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  }[currentRole];

  const avatarInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CW';

  const handleTestConnection = async () => {
    if (!camIp || !camPort || !camUsername || !camPassword || !camRtsp) {
      showAlert("Missing Information", "Please enter all required camera details (IP, Port, Username, Password, RTSP URL).", "warning");
      return;
    }
    setIsTesting(true);
    setConnectionStatus(null);
    try {
      const res = await fetch('/api/cameras/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          ipAddress: camIp.trim(),
          port: camPort.trim(),
          username: camUsername.trim(),
          password: camPassword.trim(),
          rtspUrl: camRtsp.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setConnectionStatus({ success: true, message: "✓ Camera connected successfully" });
      } else {
        setConnectionStatus({
          success: false,
          message: data.error || "Unable to connect to camera. Please verify the IP address, port, credentials, and RTSP URL."
        });
      }
    } catch (err) {
      setConnectionStatus({
        success: false,
        message: "Unable to connect to the camera. Please verify the connection details."
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddCameraSubmitInternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camName || !camIp || !camPort || !camUsername || !camPassword || !camRtsp) {
      showAlert("Missing Information", "Please enter all required camera details.", "warning");
      return;
    }
    if (cameras.length >= (customer?.cameras || 5)) {
      showAlert("Camera Limit Reached", `Your current subscription allows up to ${customer?.cameras || 5} cameras. Please upgrade your plan to add more cameras.`, "warning", () => setActiveTab('billing'));
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/cameras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          name: camName.trim(),
          ipAddress: camIp.trim(),
          port: camPort.trim(),
          username: camUsername.trim(),
          password: camPassword.trim(),
          rtspUrl: camRtsp.trim(),
          manufacturer: camMfg,
          cameraModel: camModel.trim(),
          locationName: camLocation.trim() || camName.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCameras([data.data, ...cameras]);
        setActiveCameraKey(data.data.cameraKey);
        setCamName('');
        setCamIp('');
        setCamPort('554');
        setCamUsername('');
        setCamPassword('');
        setCamRtsp('');
        setCamMfg('Hikvision');
        setCamModel('');
        setCamLocation('');
        setConnectionStatus(null);
        showAlert("Camera Connected", "Camera registered successfully and linked to your security grid!", "success");
      } else {
        showAlert("Failed to Add Camera", data.error || "Failed to add camera.", "danger");
      }
    } catch (err) {
      showAlert("System Error", "An unexpected error occurred while adding the camera.", "danger");
    } finally {
      setIsAdding(false);
    }
  };

  const isUserMode: boolean = (currentRole as any) !== 'admin' || previewUserMode;
  if (isUserMode) {
    return (
      <div className="relative">
        {currentRole === 'admin' && (
          <div className="bg-orange-600 text-white text-xs font-bold py-1 px-4 flex items-center justify-between sticky top-0 z-[60]">
            <span>Admin Preview Mode (Viewing User Dashboard UI)</span>
            <button
              onClick={() => setPreviewUserMode(false)}
              className="bg-black/30 hover:bg-black/50 px-2.5 py-0.5 rounded text-[11px] cursor-pointer"
            >
              Exit Preview & Return to Admin View
            </button>
          </div>
        )}
        <UserDashboardContainer
          user={user}
          customer={customer}
          setUser={setUser}
          setCustomer={setCustomer}
          cameras={cameras}
          setCameras={setCameras}
          dbAlerts={dbAlerts}
          setDbAlerts={setDbAlerts}
          dbInvoices={dbInvoices}
          dbPlans={dbPlans}
          activeCameraKey={activeCameraKey}
          setActiveCameraKey={setActiveCameraKey}
          isTrialUser={isTrialUser}
          maxAllowedCameras={maxAllowedCameras}
          isCameraLimitReached={isCameraLimitReached}
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          onLogout={() => { localStorage.clear(); router.push('/login'); }}
          openViewModal={openViewModal}
          openSettingsModal={openSettingsModal}
          handleDeleteCamera={handleDeleteCamera}
          selectedViewCamera={selectedViewCamera}
          setSelectedViewCamera={setSelectedViewCamera}
          selectedSettingsCamera={selectedSettingsCamera}
          setSelectedSettingsCamera={setSelectedSettingsCamera}
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
          handleToggleModalFeature={handleToggleModalFeature}
          editForm={editForm}
          setEditForm={setEditForm}
          handleSaveDeviceSettings={handleSaveDeviceSettings}
          isSavingDeviceSettings={isSavingDeviceSettings}
          settingsSuccessMsg={settingsSuccessMsg}
          settingsErrorMsg={settingsErrorMsg}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          camName={camName}
          setCamName={setCamName}
          camIp={camIp}
          setCamIp={setCamIp}
          camPort={camPort}
          setCamPort={setCamPort}
          camUsername={camUsername}
          setCamUsername={setCamUsername}
          camPassword={camPassword}
          setCamPassword={setCamPassword}
          camRtsp={camRtsp}
          setCamRtsp={setCamRtsp}
          camMfg={camMfg}
          setCamMfg={setCamMfg}
          camLocation={camLocation}
          setCamLocation={setCamLocation}
          isTesting={isTesting}
          isAdding={isAdding}
          connectionStatus={connectionStatus}
          testCameraConnection={handleTestConnection}
          handleAddCameraSubmit={handleAddCameraSubmitInternal}
        />

        {/* Custom Delete Camera Confirmation Dialog (Matches Image 2) */}
        <CustomConfirmDialog
          isOpen={!!cameraToDelete}
          title="Delete Camera?"
          message={
            <>
              Are you sure you want to delete camera <strong className="text-foreground">&ldquo;{cameraToDelete?.cameraKey}&rdquo;</strong>{cameraToDelete?.name && cameraToDelete.name !== cameraToDelete.cameraKey ? ` (${cameraToDelete.name})` : ''}? This action cannot be undone and will stop AI alerting for this camera node.
            </>
          }
          confirmText="Delete Camera"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeletingCamera}
          onConfirm={confirmDeleteCamera}
          onCancel={() => {
            if (!isDeletingCamera) setCameraToDelete(null);
          }}
        />

        {/* Universal Custom Alert Modal */}
        <CustomConfirmDialog
          isOpen={!!customAlert?.isOpen}
          title={customAlert?.title || 'Notice'}
          message={customAlert?.message || ''}
          confirmText={customAlert?.confirmText || 'OK'}
          cancelText={customAlert?.cancelText}
          variant={customAlert?.variant || 'info'}
          hideCancel={!customAlert?.onCancel}
          onConfirm={() => {
            if (customAlert?.onConfirm) customAlert.onConfirm();
            setCustomAlert(null);
          }}
          onCancel={() => {
            if (customAlert?.onCancel) customAlert.onCancel();
            setCustomAlert(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`h-screen overflow-hidden flex font-sans bg-background text-foreground transition-colors duration-200 ${theme === 'dark' ? 'dark' : ''}`}>
      
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      <Sidebar
        items={computedNavItems}
        user={{ firstName: user?.name, email: user?.email, role: currentRole }}
        logoIcon={LayoutDashboard}
        logoTitle="COREWATCH"
        logoSubtitle="Control Center"
        profileHref="/dashboard?tab=profile"
        changePasswordHref="/dashboard?tab=profile"
        twoFactorHref="/dashboard?tab=profile"
        mobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        onLogout={() => { localStorage.clear(); router.push('/login'); }}
      />
      {/* ========================================================================= */}
      {/* RIGHT MAIN WORKSPACE AREA */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
           {/* TOP HEADER BAR */}
        <header className="h-16 border-b border-border bg-sidebar/90 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              title="Open Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
<h1 className="text-lg font-bold text-foreground capitalize">
              {activeTab.replace('_', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Admin toggle to preview User Dashboard */}
            <button
              onClick={() => setPreviewUserMode(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition-colors cursor-pointer"
              title="Preview the new User Dashboard UI"
            >
              <span>Preview User UI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle (Light / Dark Switch) */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className={`relative w-12 h-6.5 rounded-full p-1 transition-all duration-300 ease-in-out cursor-pointer flex items-center border border-border shadow-inner ${
                  theme === 'dark' ? 'bg-[#0E0F12]' : 'bg-muted'
                }`}
              >
                <div 
                  className={`w-4.5 h-4.5 rounded-full bg-[#3E160C] dark:bg-brand-gold shadow-md flex items-center justify-center transition-all duration-300 ease-in-out ${
                    theme === 'dark' ? 'translate-x-5 rotate-[360deg]' : 'translate-x-0 rotate-0'
                  }`}
                >
                  {theme === 'dark' ? (
                    <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10C2.2 6.8 6.5 2.5 12 2.2c.4 0 .7.2.9.5.2.3.2.7 0 1-.8 1.4-1.2 3.1-1.2 4.8 0 4.7 3.8 8.5 8.5 8.5 1.7 0 3.4-.4 4.8-1.2.3-.2.7-.2 1 0 .3.2.5.5.5.9-.3 5.5-4.6 9.8-10.2 9.8zm.9-17.6c-4.2.4-7.5 3.8-7.5 8.1 0 4.4 3.6 8 8 8 4.3 0 7.7-3.3 8.1-7.5-1.1.6-2.4.9-3.8.9-5.8 0-10.5-4.7-10.5-10.5 0-1.4.3-2.7.9-3.8z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-[#FAF6EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707-.707M6.343 4.343l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
                    </svg>
                  )}
                </div>
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer relative"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
              </button>

              {/* Notification Popover with REAL DB Alerts */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-xs font-bold text-foreground">Live Security Alerts</span>
                    <span className="text-[10px] text-primary font-bold">
                      {dbAlerts.filter(a => !a.isRead).length} Unread
                    </span>
                  </div>
                  <div className="space-y-2 pt-3 max-h-64 overflow-y-auto">
                    {dbAlerts.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No recent security alerts.</p>
                    ) : (
                      dbAlerts.slice(0, 4).map((alt: any, idx: number) => (
                        <div
                          key={alt._id || alt.id || idx}
                          onClick={() => {
                            handleSelectTab('admin_notifications');
                            setShowNotifications(false);
                          }}
                          className={`text-xs p-2.5 rounded-xl border cursor-pointer transition-colors ${
                            alt.severity === 'critical'
                              ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                              : 'bg-muted/60 border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span className="truncate">{alt.type || alt.category || 'Security Alert'}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{alt.cameraKey || alt.camera || ''}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{alt.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pt-3 border-t border-border mt-3">
                    <button
                      onClick={() => {
                        handleSelectTab('admin_notifications');
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-xs font-bold text-primary hover:underline cursor-pointer block"
                    >
                      View All Notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar Pill Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors cursor-pointer"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || 'User'} className="w-6 h-6 rounded-full object-cover ring-1 ring-primary/40" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#785D32] text-white font-black text-[10px] flex items-center justify-center">
                    {avatarInitials}
                  </div>
                )}
                <span className="text-xs font-bold text-foreground uppercase">{user?.role}</span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-card p-2 shadow-2xl z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-border">
                    <div className="font-bold text-foreground">{user?.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate font-mono">{user?.email}</div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/15 text-red-400 border border-red-500/30 mt-1 uppercase font-mono tracking-wider">
                      {user?.role}
                    </span>
                  </div>
                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        handleSelectTab('admin_profile');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted rounded-xl transition-colors cursor-pointer font-medium text-foreground flex items-center justify-between"
                    >
                      <span>My Account</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        handleSelectTab('admin_notifications');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted rounded-xl transition-colors cursor-pointer font-medium text-foreground flex items-center justify-between"
                    >
                      <span>Notifications</span>
                      {dbAlerts.filter(a => !a.isRead).length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                          {dbAlerts.filter(a => !a.isRead).length}
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="border-t border-border pt-1">
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-500 font-bold hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer">
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* WORKSPACE CONTENT BODY */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">

          {/* =================================================================== */}
          {/* 1. ADMIN ROLE TAB VIEWS */}
          {/* =================================================================== */}
          {currentRole === 'admin' && (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Executive Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                          Enterprise Operations & Control Command
                        </h2>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-500/20 text-red-500 border border-red-500/30">
                          Super Admin
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Live multi-tenant surveillance network, client camera node allocations, and real-time AI safety incident metrics.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActiveTab('add_customer')}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add Customer</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('billing_plans')}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Manage Plans</span>
                      </button>
                    </div>
                  </div>

                  {/* Executive Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2 hover:border-brand-blue/40 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Total Enterprise Clients</span>
                        <Users className="w-4 h-4 text-brand-blue dark:text-brand-light-blue" />
                      </div>
                      <div className="text-3xl font-black text-foreground">{customers.length}</div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{customers.filter(c => c.status === 'Active').length} Active · {customers.filter(c => c.status === 'Pending').length} Pending</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2 hover:border-brand-blue/40 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Network Camera Nodes</span>
                        <Camera className="w-4 h-4 text-[#f59e0b]" />
                      </div>
                      <div className="text-3xl font-black text-brand-blue dark:text-brand-light-blue">
                        {totalCalculatedNodes}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Allocated across registered enterprise accounts
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2 hover:border-brand-blue/40 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">AI Safety Incidents</span>
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="text-3xl font-black text-foreground">{dbAlerts.length}</div>
                      <div className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold">
                        {dbAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length} High Priority Dispatched
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2 hover:border-brand-blue/40 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Monthly Revenue (MRR)</span>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        ${totalCalculatedMRR.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Estimated from active client subscriptions
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Analytics & Live Monitoring Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Column 1: Enterprise Clients Roster Overview */}
                    <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h3 className="text-base font-bold text-foreground">Enterprise Client Directory</h3>
                            <p className="text-xs text-muted-foreground">Recent client accounts registered in database.</p>
                          </div>
                          <button
                            onClick={() => setActiveTab('all_customers')}
                            className="text-xs font-bold text-brand-blue dark:text-brand-light-blue hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>View All ({customers.length})</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {customers.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="border-b border-border text-muted-foreground uppercase font-mono text-[10px] bg-muted/40">
                                <tr>
                                  <th className="py-2.5 px-3">Company</th>
                                  <th className="py-2.5 px-3">Plan</th>
                                  <th className="py-2.5 px-3">Cameras</th>
                                  <th className="py-2.5 px-3 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60 font-medium">
                                {customers.slice(0, 5).map((c) => (
                                  <tr key={c.id || c.email} className="hover:bg-muted/30 transition-colors">
                                    <td className="py-2.5 px-3">
                                      <div className="font-bold text-foreground truncate max-w-[160px]">{c.company || c.name}</div>
                                      <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">{c.email}</div>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-muted text-foreground border border-border">
                                        {c.plan || 'Standard'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 font-mono font-bold text-brand-blue dark:text-brand-light-blue">
                                      {c.cameras || 1} Nodes
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                        c.status === 'Active' 
                                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                      }`}>
                                        {c.status || 'Active'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-3 my-2">
                            <Users className="w-8 h-8 text-muted-foreground mx-auto" />
                            <div className="text-xs font-bold text-foreground">No Enterprise Customers Registered Yet</div>
                            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                              Add your first enterprise customer to provision camera quotas and generate subscription invoices.
                            </p>
                            <button
                              onClick={() => setActiveTab('add_customer')}
                              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-brand-blue text-white shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Add First Customer</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                        <span>Database records synchronized</span>
                        <button
                          onClick={() => setActiveTab('add_customer')}
                          className="font-bold text-brand-blue dark:text-brand-light-blue hover:underline cursor-pointer"
                        >
                          + Add New Customer Account
                        </button>
                      </div>
                    </div>

                    {/* Column 2: Live AI Safety Incident Feed */}
                    <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h3 className="text-base font-bold text-foreground">Live AI Safety Incidents</h3>
                            <p className="text-xs text-muted-foreground">Real-time alerts across all client streams.</p>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        </div>

                        {dbAlerts.length > 0 ? (
                          <div className="space-y-2.5">
                            {dbAlerts.slice(0, 5).map((a) => {
                              const isHigh = a.severity === 'CRITICAL' || a.severity === 'HIGH';
                              return (
                                <div
                                  key={a._id || a.timestamp}
                                  className="p-3 rounded-xl border border-border bg-background/60 flex items-start justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isHigh ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                    <div className="min-w-0">
                                      <p className="font-bold text-foreground truncate">{a.message}</p>
                                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                                        Cam: {a.cameraKey} · {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono shrink-0 ${
                                    isHigh ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'
                                  }`}>
                                    {a.severity || 'HIGH'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-2.5 my-2">
                            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                            <div className="text-xs font-bold text-foreground">No Security Incidents Logged</div>
                            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                              All connected enterprise cameras are operating normally. No safety violations or zone breaches detected.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                        <span>Total Incidents: <strong className="text-foreground">{dbAlerts.length}</strong></span>
                        <button
                          onClick={() => setActiveTab('admin_notifications')}
                          className="font-bold text-brand-blue dark:text-brand-light-blue hover:underline cursor-pointer"
                        >
                          View Full History →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Infrastructure Services & Pipeline Health */}
                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-bold text-foreground">System Health & Microservice Pipeline</h3>
                        <p className="text-xs text-muted-foreground">Real-time status of backend inference nodes, database, and stream ingestion.</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>All Systems Operational</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                      <div className="p-4 rounded-xl border border-border bg-background/50 space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">Database Node</div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>MongoDB Atlas Cluster</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">Port 27017 · Latency &lt;5ms</div>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-background/50 space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">AI Inference Engine</div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>YOLOv8 & OpenCV Pipeline</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">Zero-shot object detection active</div>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-background/50 space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">RTSP Ingestion Hub</div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Multi-Camera Streaming</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">H.264 / MJPEG live transcoding</div>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-background/50 space-y-1">
                        <div className="text-xs text-muted-foreground font-medium">Alert Dispatcher</div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Real-time SSE Push</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">Instant security broadcast active</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'all_customers' && (
                <div className="space-y-6">
                  {/* Customer Directory Table */}
                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-base font-bold text-foreground">Enterprise Customer Directory</h2>
                        <p className="text-xs text-muted-foreground">Manage client accounts, camera quotas, and billing status.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('add_customer')}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white transition-all cursor-pointer shadow-md shadow-brand-blue/10"
                      >
                        + Add New Customer
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border text-muted-foreground uppercase font-mono text-[10px] bg-muted/50">
                          <tr>
                            <th className="py-3 px-4">Client ID</th>
                            <th className="py-3 px-4">Name & Email</th>
                            <th className="py-3 px-4">Company</th>
                            <th className="py-3 px-4">Cameras</th>
                            <th className="py-3 px-4">Plan Tier</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 font-medium">
                          {customers.map((c) => (
                            <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-brand-blue dark:text-brand-light-blue">{c.id}</td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-foreground">{c.name}</div>
                                <div className="text-[10px] text-muted-foreground">{c.email}</div>
                              </td>
                              <td className="py-3 px-4 text-foreground/80">{c.company}</td>
                              <td className="py-3 px-4 font-bold text-foreground/90">{c.cameras} Nodes</td>
                              <td className="py-3 px-4 text-foreground/80">{c.plan}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  c.status === 'Active' ? 'bg-brand-blue/20 text-brand-blue dark:text-brand-light-blue' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'add_customer' && (
                <div className="w-full space-y-6">
                  {/* Page Header */}
                  <div id="add-customer-header" className="flex justify-between items-center pb-4 border-b border-border">
                    <div>
                      <h2 className="text-xl font-extrabold text-foreground">Add New Enterprise Customer</h2>
                      <p className="text-xs text-muted-foreground">Register a new client organization and provision CCTV AI inspection licenses.</p>
                    </div>
                  </div>

                  {customerSuccessMsg && (
                    <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{customerSuccessMsg}</span>
                    </div>
                  )}

                  {customerErrorMsg && (
                    <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{customerErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddCustomerSubmit} noValidate className="space-y-6">
                     {/* Panel 1: Account Information */}
                    <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                        <div className="w-6 h-6 rounded-full bg-brand-gold text-[#FAF6EE] text-xs font-bold flex items-center justify-center shrink-0">
                          1
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">Account Information</h3>
                          <p className="text-[10px] text-muted-foreground">Primary administrative contact details for the customer account.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div id="field-firstName" className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">First Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newCustomer.firstName}
                            onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                            placeholder="John"
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
                          />
                          {formErrors.firstName && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 animate-fadeIn">
                              ⚠️ {formErrors.firstName}
                            </p>
                          )}
                        </div>

                        <div id="field-lastName" className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Last Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newCustomer.lastName}
                            onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                            placeholder="Doe"
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
                          />
                          {formErrors.lastName && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 animate-fadeIn">
                              ⚠️ {formErrors.lastName}
                            </p>
                          )}
                        </div>

                        <div id="field-email" className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Work Email Address <span className="text-red-500">*</span></label>
                          <input
                            type="email"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            placeholder="john.doe@company.com"
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
                          />
                          {formErrors.email && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 animate-fadeIn">
                              ⚠️ {formErrors.email}
                            </p>
                          )}
                        </div>

                        <div id="field-phone" className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Phone Number <span className="text-red-500">*</span></label>
                          <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden focus-within:ring-2 focus-within:ring-brand-gold/20 focus-within:border-brand-gold transition-all duration-200">
                            <div className="relative flex items-center bg-card/50 border-r border-border shrink-0">
                              <select
                                value={selectedCountryCode}
                                onChange={(e) => setSelectedCountryCode(e.target.value)}
                                className="pl-3 pr-7 py-2.5 bg-transparent text-xs font-bold text-muted-foreground focus:outline-none appearance-none cursor-pointer"
                              >
                                <option value="+91">🇮🇳 +91</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+44">🇬🇧 +44</option>
                                <option value="+971">🇦🇪 +971</option>
                                <option value="+65">🇸🇬 +65</option>
                                <option value="+61">🇦🇺 +61</option>
                                <option value="+49">🇩🇪 +49</option>
                              </select>
                              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-muted-foreground">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                            <input
                              type="tel"
                              value={newCustomer.phone}
                              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                              placeholder="99999 99999"
                              className="w-full px-3 py-2.5 bg-transparent text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none border-none outline-none"
                            />
                          </div>
                          {formErrors.phone && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 animate-fadeIn">
                              ⚠️ {formErrors.phone}
                            </p>
                          )}
                        </div>

                        <div id="field-company" className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Company / Organization Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newCustomer.company}
                            onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                            placeholder="Tiera India Logistics"
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
                          />
                          {formErrors.company && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 animate-fadeIn">
                              ⚠️ {formErrors.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Panel 2: Address Information */}
                    <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                        <div className="w-6 h-6 rounded-full bg-brand-gold text-[#FAF6EE] text-xs font-bold flex items-center justify-center shrink-0">
                          2
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">Address Details</h3>
                          <p className="text-[10px] text-muted-foreground">Physical location details for safety inspection deployments.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div id="field-addressLine1" className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Address Line 1 <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newCustomer.addressLine1}
                            onChange={(e) => setNewCustomer({ ...newCustomer, addressLine1: e.target.value })}
                            placeholder="Plot No, Street Name, Industry Area"
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
                          />
                          {formErrors.addressLine1 && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 animate-fadeIn">
                              ⚠️ {formErrors.addressLine1}
                            </p>
                          )}
                        </div>

                        <div id="field-addressLine2" className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Address Line 2</label>
                          <input
                            type="text"
                            value={newCustomer.addressLine2}
                            onChange={(e) => setNewCustomer({ ...newCustomer, addressLine2: e.target.value })}
                            placeholder="Suite, Block, Landmark, etc."
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
                          />
                        </div>

                        <div id="field-country" className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Country <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newCustomer.country}
                            onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
                            placeholder="India"
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
                          />
                          {formErrors.country && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 animate-fadeIn">
                              ⚠️ {formErrors.country}
                            </p>
                          )}
                        </div>

                        <div id="field-state" className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">State / Region <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newCustomer.state}
                            onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                            placeholder="Delhi"
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
                          />
                          {formErrors.state && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 animate-fadeIn">
                              ⚠️ {formErrors.state}
                            </p>
                          )}
                        </div>

                        <div id="field-city" className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">City <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newCustomer.city}
                            onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                            placeholder="New Delhi"
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
                          />
                          {formErrors.city && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 animate-fadeIn">
                              ⚠️ {formErrors.city}
                            </p>
                          )}
                        </div>

                        <div id="field-pincode" className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">ZIP / Postal Code <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newCustomer.pincode}
                            onChange={(e) => setNewCustomer({ ...newCustomer, pincode: e.target.value })}
                            placeholder="110001"
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
                          />
                          {formErrors.pincode && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 animate-fadeIn">
                              ⚠️ {formErrors.pincode}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={isSubmittingCustomer}
                        className="px-6 py-2.5 rounded-lg bg-brand-gold hover:bg-brand-gold-light disabled:bg-brand-gold/50 text-[#FAF6EE] font-semibold text-xs tracking-wider transition-all duration-200 cursor-pointer shadow-sm transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                      >
                        {isSubmittingCustomer ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-[#FAF6EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span>Add Customer</span>
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {activeTab === 'settings' && (
                <UserSettingsView
                  user={user}
                  customer={customer}
                  activeCameraKey={activeCameraKey}
                  onNavigateTab={handleSelectTab}
                />
              )}

              {(activeTab === 'integrations' || activeTab === 'cloud_storage') && (
                <CloudStorageIntegrationView
                  user={user}
                  customer={customer}
                />
              )}

              {activeTab === 'billing_plans' && (
                <PlansManagementView apiUrl={API_URL} user={user} />
              )}

              {activeTab === 'active_subscribers' && (
                <div className="space-y-6">
                  {/* Metrics Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">Active Subscribers</div>
                      <div className="text-3xl font-black text-foreground">
                        {customers.filter(c => c.status === 'Active').length}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Live billing active</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">Monthly Recurring Revenue</div>
                      <div className="text-3xl font-black text-brand-blue dark:text-brand-light-blue">
                        ${customers.filter(c => c.status === 'Active').reduce((acc, curr) => {
                          const val = curr.plan === 'Standard Tier' ? 499 : 1299;
                          return acc + val;
                        }, 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-muted-foreground">Based on active plans</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">Total Camera Licenses</div>
                      <div className="text-3xl font-black text-foreground">
                        {customers.filter(c => c.status === 'Active').reduce((acc, curr) => acc + (curr.cameras || 0), 0)}
                      </div>
                      <div className="text-[11px] text-brand-blue dark:text-brand-light-blue font-semibold">Active licenses</div>
                    </div>
                  </div>

                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-foreground">Active Subscription Customers</h2>
                      <p className="text-xs text-muted-foreground">List of clients with active licenses and billing statuses.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border text-muted-foreground uppercase font-mono text-[10px] bg-muted/50">
                          <tr>
                            <th className="py-3 px-4">Client ID</th>
                            <th className="py-3 px-4">Name & Email</th>
                            <th className="py-3 px-4">Company</th>
                            <th className="py-3 px-4">Plan Tier</th>
                            <th className="py-3 px-4">Cameras</th>
                            <th className="py-3 px-4">Monthly Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 font-medium">
                          {customers.filter(c => c.status === 'Active').length > 0 ? (
                            customers.filter(c => c.status === 'Active').map((c) => (
                              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-3 px-4 font-mono font-bold text-brand-blue dark:text-brand-light-blue">{c.id}</td>
                                <td className="py-3 px-4 font-sans">
                                  <div className="font-bold text-foreground">{c.name}</div>
                                  <div className="text-[10px] text-muted-foreground">{c.email}</div>
                                </td>
                                <td className="py-3 px-4 text-foreground/80 font-sans">{c.company}</td>
                                <td className="py-3 px-4 text-foreground/80 font-sans">{c.plan}</td>
                                <td className="py-3 px-4 font-bold text-foreground/90">{c.cameras} Nodes</td>
                                <td className="py-3 px-4 text-foreground/80 font-mono">
                                  {c.plan === 'Standard Tier' ? '$499/mo' : '$1,299/mo'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-muted-foreground font-sans">
                                No active subscribers found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing_invoices' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <div>
                      <h2 className="text-xl font-extrabold text-foreground font-sans">Invoices & Statements</h2>
                      <p className="text-xs text-muted-foreground">View and manage invoices for enterprise customers.</p>
                    </div>
                  </div>

                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border text-muted-foreground uppercase font-mono text-[10px] bg-muted/50">
                          <tr>
                            <th className="py-3 px-4">Invoice ID</th>
                            <th className="py-3 px-4">Customer</th>
                            <th className="py-3 px-4">Plan Tier</th>
                            <th className="py-3 px-4">Billing Date</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 font-medium">
                          {customers.length > 0 ? (
                            customers.map((c, index) => {
                              const amount = c.plan === 'Standard Tier' ? '$499.00' : '$1,299.00';
                              const invoiceId = `INV-2026-${(1000 + index).toString().substring(1)}`;
                              return (
                                <tr key={invoiceId} className="hover:bg-muted/30 transition-colors">
                                  <td className="py-3 px-4 font-mono font-bold text-foreground">{invoiceId}</td>
                                  <td className="py-3 px-4 font-sans">
                                    <div className="font-bold text-foreground">{c.company || 'Private Client'}</div>
                                    <div className="text-[10px] text-muted-foreground">{c.name}</div>
                                  </td>
                                  <td className="py-3 px-4 text-foreground/80 font-sans">{c.plan}</td>
                                  <td className="py-3 px-4 text-foreground/80 font-mono">Aug 01, 2026</td>
                                  <td className="py-3 px-4 font-bold text-foreground/90 font-mono">{amount}</td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      c.status === 'Active' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                                      c.status === 'Suspended' ? 'bg-red-500/20 text-red-700 dark:text-red-400' :
                                      'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                    }`}>
                                      {c.status === 'Active' ? 'Paid' : c.status === 'Suspended' ? 'Overdue' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button 
                                      onClick={() => showAlert("Invoice Download", `Generating and downloading PDF statement for ${invoiceId}...`, "info")}
                                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-border hover:bg-muted text-foreground transition-all cursor-pointer font-sans"
                                    >
                                      Download
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-6 text-center text-muted-foreground font-sans">
                                No invoices found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'admin_notifications' && (
                <AdminNotificationsView
                  dbAlerts={dbAlerts}
                  setDbAlerts={setDbAlerts}
                  customers={customers}
                  cameras={cameras}
                  dbInvoices={dbInvoices}
                  onNavigateTab={handleSelectTab}
                  token={user?.token}
                />
              )}

              {activeTab === 'admin_profile' && (
                <AdminAccountView
                  user={user}
                  setUser={setUser}
                  customersCount={customers.length}
                  camerasCount={cameras.length}
                  alertsCount={dbAlerts.length}
                  onNavigateTab={handleSelectTab}
                />
              )}

              {activeTab === 'help_guidelines' && (
                <div className="max-w-3xl border border-border bg-card rounded-2xl p-6 space-y-6 shadow-sm">
                  <div>
                    <h2 className="text-lg font-bold text-foreground font-sans">System Guidelines & Support Manual</h2>
                    <p className="text-xs text-muted-foreground">Technical guidelines for managing and operating the CoreWatch safety AI system.</p>
                  </div>

                  <div className="space-y-4">
                    <details className="group border border-border rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between text-xs font-bold text-foreground cursor-pointer font-sans">
                        <span>How do I configure the AI Service stream to point to a new camera?</span>
                        <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <p className="mt-3 text-xs text-muted-foreground leading-relaxed font-sans">
                        Administrators must first provision a unique Location and camera key in the **Settings** tab. 
                        Once created, copy the generated Access Key and place it inside your AI Service container or system environment configuration:
                        <br/>
                        <code className="block mt-2 p-2 bg-background border border-border rounded font-mono text-[10px] text-brand-gold-light">
                          CAMERA_KEY=CAM-XXXXXX
                        </code>
                      </p>
                    </details>

                    <details className="group border border-border rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between text-xs font-bold text-foreground cursor-pointer font-sans">
                        <span>How can I provision a new commercial client account?</span>
                        <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <p className="mt-3 text-xs text-muted-foreground leading-relaxed font-sans">
                        Navigate to the **Customers** menu option and select **Add Customer**. Provide their company details, 
                        desired Plan Tier (Standard vs Enterprise Pro), and select the number of camera license quotas allocated to them.
                        Upon submission, an invitation setup link will be automatically generated.
                      </p>
                    </details>

                    <details className="group border border-border rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between text-xs font-bold text-foreground cursor-pointer font-sans">
                        <span>What do the client statuses mean?</span>
                        <span className="transition group-open:rotate-180">▼</span>
                      </summary>
                      <p className="mt-3 text-xs text-muted-foreground leading-relaxed font-sans">
                        • <strong className="text-emerald-500 font-sans">Active:</strong> Client has verified their account, has positive billing status, and is actively streaming live CCTV nodes.
                        <br/>
                        • <strong className="text-amber-500 font-sans">Pending:</strong> Client has been provisioned, but has not completed their password/verification setup.
                        <br/>
                        • <strong className="text-red-500 font-sans">Suspended:</strong> Client account has been disabled manually or due to an overdue unpaid invoice. Streams are blocked.
                      </p>
                    </details>
                  </div>
                </div>
              )}
            </>
          )}

          {/* =================================================================== */}
          {/* 2. USER ROLE TAB VIEWS */}
          {/* =================================================================== */}
          {currentRole === 'user' && (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Trial User Status Notification Banner */}
                  {isTrialUser && (
                    <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground flex items-center gap-2">
                            <span>Free Trial Plan Active (Demo Free)</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold">
                              {cameras.length}/{maxAllowedCameras} Camera Connected
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Your trial account includes 1 camera node configured during signup. Adding more cameras requires upgrading your subscription.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('subscription_detail');
                          router.push('/dashboard?tab=subscription_detail');
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span>Upgrade Plan</span>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
                      <div className="text-xs text-muted-foreground">Active Cameras</div>
                      <div className="text-3xl font-black text-brand-blue dark:text-brand-light-blue">{cameras.length} Feeds</div>
                      <div className="text-[11px] text-muted-foreground">
                        {isTrialUser ? '1/1 Trial Node Connected' : '100% Active stream'}
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
                      <div className="text-xs text-muted-foreground">Today's Safety Violations</div>
                      <div className="text-3xl font-black text-red-600 dark:text-red-400">{dbAlerts.length} Alerts</div>
                      <div className="text-[11px] text-red-600 dark:text-red-400">Action required</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
                      <div className="text-xs text-muted-foreground">Account Subscription</div>
                      <div className="text-xl font-black text-foreground uppercase">
                        {isTrialUser ? 'Demo Free (Trial)' : (customer?.plan || (user?.role === 'admin' ? 'Enterprise Max' : 'Enterprise Pro'))}
                      </div>
                      <div className="text-[11px] text-brand-blue dark:text-brand-light-blue font-semibold">
                        {isTrialUser ? '14-Day Free Evaluation · 1 Node' : 'Active · Renews next month'}
                      </div>
                    </div>

                    {/* Camera Key Card (Main Dashboard View) */}
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3 col-span-1 sm:col-span-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-bold block">Your Active Camera Key</span>
                        <span className="text-[10px] text-muted-foreground">Configure this key in your AI Service .env file (CAMERA_KEY)</span>
                      </div>
                      {activeCameraKey ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={activeCameraKey}
                            className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono font-bold focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activeCameraKey);
                              setCopySuccess(true);
                              setTimeout(() => setCopySuccess(false), 2000);
                            }}
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-brand-blue hover:bg-brand-blue/90 text-white transition-all cursor-pointer shadow-md"
                          >
                            {copySuccess ? "Copied!" : "Copy Key"}
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground font-mono">Generating key...</div>
                      )}
                    </div>
                  </div>

                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-4">
                    <h2 className="text-base font-bold text-foreground">Recent Security Alerts (Live Feed)</h2>
                    <div className="space-y-3">
                      {dbAlerts.length > 0 ? (
                        dbAlerts.slice(0, 10).map((alert) => (
                          <div key={alert._id} className="p-4 rounded-xl border border-border bg-background/60 flex gap-4 items-center text-xs">
                            {alert.imageUrl && (
                              <img 
                                src={alert.imageUrl} 
                                alt="Alert Snapshot" 
                                className="w-16 h-12 object-cover rounded-lg border border-border shrink-0" 
                              />
                            )}
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="font-bold text-foreground truncate">{alert.message}</div>
                              <div className="text-muted-foreground font-mono truncate">
                                Camera: {alert.cameraKey} · {new Date(alert.timestamp).toLocaleTimeString()} ({new Date(alert.timestamp).toLocaleDateString()})
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded font-bold uppercase text-[10px] bg-red-500/20 text-red-600 dark:text-red-400 shrink-0">
                              HIGH
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                          No alerts received yet. Please configure your camera settings.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'live_camera' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-foreground">Multi-Camera Analytics Grid</h2>
                      <p className="text-xs text-muted-foreground">Monitoring all connected camera feeds simultaneously with real-time AI analytics.</p>
                    </div>
                    {cameras.length > 0 && (
                      <span className="px-3.5 py-1.5 rounded-full bg-red-500/10 text-red-500 font-mono text-xs font-bold flex items-center gap-2 border border-red-500/20 animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.7)] animate-ping"></span>
                        {cameras.length} FEEDS ACTIVE
                      </span>
                    )}
                  </div>

                  {cameras.length > 0 ? (
                    <div className={`grid grid-cols-1 ${cameras.length > 1 ? 'md:grid-cols-2' : 'max-w-4xl mx-auto'} gap-6`}>
                      {cameras.map((camera) => (
                        <div 
                          key={camera._id} 
                          className="relative aspect-video w-full bg-[#020415] rounded-2xl border border-border overflow-hidden shadow-2xl group select-none hover:border-brand-blue/40 transition-all duration-300"
                        >
                          {/* Grid overlay & scanlines */}
                          <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-35"></div>
                          <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]"></div>
                          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,93,50,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,93,50,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

                          {/* HUD Metadata Overlay */}
                          <div className="absolute top-4 left-4 font-mono text-[9px] text-zinc-400 bg-[#0A0B0E]/85 border border-[#16171D] px-2.5 py-1.5 rounded-lg z-20 space-y-0.5 shadow-lg">
                            <div className="flex items-center gap-1.5 font-bold text-zinc-100">
                              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                              <span>{camera.locationName.toUpperCase()} ({camera.cameraKey})</span>
                            </div>
                            <div>1920 × 1080 @ 10FPS · H.264 MJPEG</div>
                            <div>AI OVERLAY ACTIVE</div>
                          </div>

                          {/* MJPEG Stream Image */}
                          <img 
                            src={`http://localhost:8000/api/camera/stream/${camera.cameraKey}`}
                            alt={`CCTV Stream - ${camera.locationName}`}
                            className="w-full h-full object-contain relative z-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.offline-camera-banner')) {
                                const div = document.createElement('div');
                                div.className = 'offline-camera-banner absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-[#090b14] select-none';
                                div.innerHTML = `
                                  <div class="w-12 h-12 rounded-xl bg-[#141626] border border-orange-500/20 text-orange-400 flex items-center justify-center mb-2">
                                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                  </div>
                                  <span class="text-xs font-bold text-white mb-0.5">Camera Feed Inactive</span>
                                  <span class="text-[10px] text-zinc-400 font-mono">Stream Signal Offline</span>
                                `;
                                parent.appendChild(div);
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl border border-dashed border-border bg-card/50 text-center space-y-4 max-w-lg mx-auto shadow-md">
                      <div className="w-12 h-12 rounded-full bg-brand-blue/15 text-brand-blue flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground">No Cameras Configured</h3>
                        <p className="text-xs text-muted-foreground">You need to configure your camera key first to access the live video stream.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(activeTab === 'all_cameras' || activeTab === 'camera_hub') && (
                <div className="space-y-6">
                  {/* Top Quota / Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">Registered Cameras</div>
                      <div className="text-3xl font-black text-foreground">{cameras.length} Nodes</div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Active CCTV connections</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">Subscription Quota</div>
                      <div className="text-3xl font-black text-brand-blue dark:text-brand-light-blue">
                        {cameras.length} / {maxAllowedCameras}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {isTrialUser && isCameraLimitReached ? (
                          <span className="text-amber-500 font-semibold">Trial limit reached (1/1 camera configured)</span>
                        ) : (
                          `${Math.max(0, maxAllowedCameras - cameras.length)} license slots available`
                        )}
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">AI Stream Health</div>
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                        ONLINE (100%)
                      </div>
                      <div className="text-[11px] text-muted-foreground">All RTSP channels verified</div>
                    </div>
                  </div>

                  {/* Camera Directory Table */}
                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2">
                      <div>
                        <h2 className="text-base font-bold text-foreground">Camera Hub Directory</h2>
                        <p className="text-xs text-muted-foreground">Manage connected CCTV hardware nodes, network endpoints, and active streaming channels.</p>
                      </div>
                      {isTrialUser && isCameraLimitReached ? (
                        <button
                          onClick={() => {
                            setActiveTab('subscription_detail');
                            router.push('/dashboard?tab=subscription_detail');
                          }}
                          title="Your 1-camera trial limit is reached. Upgrade to connect more cameras."
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black transition-all cursor-pointer shadow-md flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                          <span>Upgrade for More Cameras</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveTab('add_camera');
                            router.push('/dashboard?tab=add_camera');
                          }}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white transition-all cursor-pointer shadow-md shadow-brand-blue/10 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Add Camera</span>
                        </button>
                      )}
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search cameras by name, key, IP address, or location..."
                          value={cameraSearchQuery}
                          onChange={(e) => setCameraSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <select
                          value={cameraMfgFilter}
                          onChange={(e) => setCameraMfgFilter(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-blue cursor-pointer"
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

                    {/* Directory Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border text-muted-foreground uppercase font-mono text-[10px] bg-muted/50">
                          <tr>
                            <th className="py-3 px-4">Camera ID / Key</th>
                            <th className="py-3 px-4">Camera Name & Location</th>
                            <th className="py-3 px-4">IP & Port</th>
                            <th className="py-3 px-4">Manufacturer</th>
                            <th className="py-3 px-4">RTSP URL</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 font-medium">
                          {filteredCameras.length > 0 ? (
                            filteredCameras.map((cam) => (
                              <tr key={cam._id || cam.cameraKey} className="hover:bg-muted/30 transition-colors">
                                <td className="py-3 px-4 font-mono font-bold text-brand-blue dark:text-brand-light-blue">
                                  <div className="flex items-center gap-2">
                                    <span>{cam.cameraKey}</span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(cam.cameraKey);
                                        setCopiedKey(cam.cameraKey);
                                        setTimeout(() => setCopiedKey(null), 2000);
                                      }}
                                      title="Copy Camera Key"
                                      className="p-1 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    >
                                      {copiedKey === cam.cameraKey ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-foreground">{cam.name || cam.locationName || 'Camera Feed'}</div>
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                    <span>📍 {cam.locationName || 'Main Area'}</span>
                                    {cam.cameraModel && (
                                      <span className="px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono text-[9px]">
                                        {cam.cameraModel}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-foreground/80">
                                  {cam.ipAddress ? (
                                    <span>{cam.ipAddress}:{cam.port || 554}</span>
                                  ) : (
                                    <span className="text-muted-foreground italic text-[11px]">Direct Stream</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted border border-border text-foreground/90">
                                    {cam.manufacturer || 'Hikvision'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground max-w-[180px]">
                                  {cam.rtspUrl ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="truncate max-w-[130px]" title={cam.rtspUrl}>
                                        {cam.rtspUrl}
                                      </span>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(cam.rtspUrl);
                                          setCopiedKey(cam.rtspUrl);
                                          setTimeout(() => setCopiedKey(null), 2000);
                                        }}
                                        title="Copy RTSP URL"
                                        className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                      >
                                        {copiedKey === cam.rtspUrl ? (
                                          <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="italic text-muted-foreground/60 text-[10px]">Auto Configured</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 w-fit border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Active
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => openViewModal(cam)}
                                      title="View Camera Feed & Details"
                                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue dark:text-brand-light-blue transition-colors flex items-center gap-1 cursor-pointer border border-brand-blue/20"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View</span>
                                    </button>
                                    <button
                                      onClick={() => openSettingsModal(cam)}
                                      title="Camera AI Rules & Device Settings"
                                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer border border-amber-500/20"
                                    >
                                      <Settings className="w-3.5 h-3.5" />
                                      <span>Settings</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCamera(cam.cameraKey)}
                                      title="Delete Camera"
                                      className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="text-center py-12">
                                <div className="max-w-sm mx-auto space-y-3">
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                                    <Video className="w-5 h-5" />
                                  </div>
                                  <div className="text-xs font-bold text-foreground">
                                    {cameraSearchQuery ? "No cameras match your search" : "No Cameras Connected"}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">
                                    {cameraSearchQuery
                                      ? "Try searching with different terms or resetting filters."
                                      : "Start by registering your first IP CCTV camera with your unique access key."}
                                  </p>
                                  {!cameraSearchQuery && (
                                    isTrialUser && isCameraLimitReached ? (
                                      <button
                                        onClick={() => {
                                          setActiveTab('subscription_detail');
                                          router.push('/dashboard?tab=subscription_detail');
                                        }}
                                        className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-black transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5 mt-2"
                                      >
                                        <ArrowUpCircle className="w-4 h-4" />
                                        <span>Upgrade Plan for More Cameras</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setActiveTab('add_camera');
                                          router.push('/dashboard?tab=add_camera');
                                        }}
                                        className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white transition-all cursor-pointer shadow-md shadow-brand-blue/15 inline-flex items-center gap-1.5 mt-2"
                                      >
                                        <PlusCircle className="w-4 h-4" />
                                        <span>+ Add Your First Camera</span>
                                      </button>
                                    )
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'add_camera' && (
                isTrialUser && isCameraLimitReached ? (
                  <div className="space-y-6 w-full max-w-2xl mx-auto py-6">
                    <div className="border border-border bg-card rounded-2xl p-8 shadow-sm text-center space-y-6">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto">
                        <Camera className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          DEMO FREE TRIAL · 1/1 CAMERA ACTIVE
                        </span>
                        <h2 className="text-xl font-black text-foreground pt-1">Trial Camera Limit Reached</h2>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                          Your <strong>Demo Free</strong> trial plan includes <strong>1 CCTV camera node</strong>, which was already configured during your account signup onboarding. New camera registration is disabled for this trial tier.
                        </p>
                      </div>

                      {/* Configured Camera Info */}
                      {cameras.length > 0 && (
                        <div className="bg-background/60 border border-border rounded-xl p-4 text-left max-w-md mx-auto space-y-2 text-xs">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase font-mono">Your Active Trial Camera:</div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-foreground">{cameras[0].name || cameras[0].locationName}</span>
                            <span className="font-mono text-[11px] text-brand-blue dark:text-brand-light-blue font-bold">{cameras[0].cameraKey}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground flex justify-between">
                            <span>{cameras[0].manufacturer || 'CCTV'} · {cameras[0].cameraModel || 'Standard'}</span>
                            <span>{cameras[0].ipAddress ? `${cameras[0].ipAddress}:${cameras[0].port}` : cameras[0].locationName}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => {
                            setActiveTab('live_camera');
                            router.push('/dashboard?tab=live_camera');
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          <span>View Live Stream</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('subscription_detail');
                            router.push('/dashboard?tab=subscription_detail');
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                          <span>Upgrade to Add More Cameras</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="space-y-6 w-full max-w-4xl mx-auto">
                  {/* Header & Camera Licenses Row (Parallel) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-foreground font-sans">Add Camera</h2>
                      <p className="text-xs text-muted-foreground font-sans">Add and configure a new security camera</p>
                    </div>

                    {/* TOP-RIGHT: Compact Camera Licenses Widget */}
                    <div className="w-full sm:w-80 border border-border bg-card rounded-2xl p-3.5 shadow-sm space-y-2 shrink-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">Camera Licenses</span>
                          {cameras.length >= (customer?.cameras || 5) ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
                              Full
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {(customer?.cameras || 5) - cameras.length} Available
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold font-mono text-muted-foreground">
                          {cameras.length} / {customer?.cameras || 5} Used
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            cameras.length >= (customer?.cameras || 5)
                              ? 'bg-red-500'
                              : 'bg-brand-blue'
                          }`}
                          style={{ width: `${Math.min(100, (cameras.length / (customer?.cameras || 5)) * 100)}%` }}
                        />
                      </div>

                      {cameras.length >= (customer?.cameras || 5) ? (
                        <div className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>Limit reached ({customer?.cameras || 5} max). Upgrade plan.</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span>{ (customer?.cameras || 5) - cameras.length } more slots available.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connection Test Results Card (if triggered) */}
                  {connectionStatus && (
                    <div className={`border rounded-2xl p-4 shadow-sm space-y-1.5 animate-fadeIn ${
                      connectionStatus.success 
                        ? 'border-emerald-500/30 bg-emerald-500/5' 
                        : 'border-red-500/30 bg-red-500/5'
                    }`}>
                      <div className="flex gap-2.5 items-start text-xs leading-relaxed font-sans">
                        {connectionStatus.success ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5">
                          <span className={`font-bold block ${connectionStatus.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {connectionStatus.success ? 'Connection Succeeded' : 'Connection Failed'}
                          </span>
                          <p className="text-muted-foreground text-[11px]">
                            {connectionStatus.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Centered Full Width Form Cards */}
                  <div className="space-y-6 w-full">
                    
                    {/* Panel 1: Camera Connection Card */}
                    <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-5">
                      <div className="border-b border-border/60 pb-3">
                        <h3 className="text-sm font-bold text-foreground">Camera Connection</h3>
                        <p className="text-xs text-muted-foreground">Network and credentials to interface with device</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Camera Name */}
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-bold text-muted-foreground block">Camera Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            placeholder="Enter camera name (e.g. Main Entrance)"
                            value={camName}
                            onChange={(e) => setCamName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
                          />
                        </div>

                        {/* IP Address */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground block">IP Address <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            placeholder="Enter camera IP address (e.g. 192.168.1.100)"
                            value={camIp}
                            onChange={(e) => setCamIp(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue font-mono"
                          />
                        </div>

                        {/* Port */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground block">Port <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            placeholder="554"
                            value={camPort}
                            onChange={(e) => setCamPort(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue font-mono"
                          />
                        </div>

                        {/* Username */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground block">Username <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            placeholder="Enter camera username"
                            value={camUsername}
                            onChange={(e) => setCamUsername(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
                          />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground block">Password <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter camera password"
                              value={camPassword}
                              onChange={(e) => setCamPassword(e.target.value)}
                              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none cursor-pointer"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* RTSP URL */}
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-bold text-muted-foreground block">RTSP URL <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            placeholder="rtsp://username:password@ip:port/stream1"
                            value={camRtsp}
                            onChange={(e) => setCamRtsp(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand-blue"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Panel 2: Camera Information Card */}
                    <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-5">
                      <div className="border-b border-border/60 pb-3">
                        <h3 className="text-sm font-bold text-foreground">Camera Information</h3>
                        <p className="text-xs text-muted-foreground">Manufacturer and hardware parameters (Optional)</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Manufacturer */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground block">Manufacturer</label>
                          <select
                            value={camMfg}
                            onChange={(e) => setCamMfg(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-blue cursor-pointer"
                          >
                            <option value="Hikvision">Hikvision</option>
                            <option value="Dahua">Dahua</option>
                            <option value="Axis">Axis</option>
                            <option value="CP Plus">CP Plus</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Camera Model */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground block">Camera Model</label>
                          <input
                            type="text"
                            placeholder="Enter camera model"
                            value={camModel}
                            onChange={(e) => setCamModel(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
                          />
                        </div>

                        {/* Camera Location */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-muted-foreground block">Camera Location</label>
                          <input
                            type="text"
                            placeholder="Enter camera location (e.g. Warehouse 1)"
                            value={camLocation}
                            onChange={(e) => setCamLocation(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex flex-wrap gap-4 items-center justify-end pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!camIp || !camPort || !camUsername || !camPassword || !camRtsp) {
                            showAlert("Missing Information", "Please enter all required camera details (IP, Port, Username, Password, RTSP URL).", "warning");
                            return;
                          }
                          setIsTesting(true);
                          setConnectionStatus(null);
                          try {
                            const res = await fetch('/api/cameras/test-connection', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${user?.token}`
                              },
                              body: JSON.stringify({
                                ipAddress: camIp.trim(),
                                port: camPort.trim(),
                                username: camUsername.trim(),
                                password: camPassword.trim(),
                                rtspUrl: camRtsp.trim()
                              })
                            });
                            const data = await res.json();
                            if (data.success) {
                              setConnectionStatus({ success: true, message: "✓ Camera connected successfully" });
                            } else {
                              setConnectionStatus({
                                success: false,
                                message: data.error || "Unable to connect to camera. Please verify the IP address, port, credentials, and RTSP URL."
                              });
                            }
                          } catch (err) {
                            setConnectionStatus({
                              success: false,
                              message: "Unable to connect to the camera. Please verify the connection details."
                            });
                          } finally {
                            setIsTesting(false);
                          }
                        }}
                        disabled={isTesting || isAdding}
                        className="px-6 py-3 rounded-xl border border-border hover:bg-muted text-foreground font-bold text-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isTesting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Testing Connection...
                          </>
                        ) : (
                          "Test Connection"
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!camName || !camIp || !camPort || !camUsername || !camPassword || !camRtsp) {
                            showAlert("Missing Information", "Please enter all required camera details.", "warning");
                            return;
                          }
                          if (cameras.length >= (customer?.cameras || 5)) {
                            showAlert("Camera Limit Reached", `Your current subscription allows up to ${customer?.cameras || 5} cameras. Please upgrade your plan to add more cameras.`, "warning", () => setActiveTab('billing'));
                            return;
                          }

                          setIsAdding(true);
                          try {
                            const res = await fetch('/api/cameras', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${user?.token}`
                              },
                              body: JSON.stringify({
                                name: camName.trim(),
                                ipAddress: camIp.trim(),
                                port: camPort.trim(),
                                username: camUsername.trim(),
                                password: camPassword.trim(),
                                rtspUrl: camRtsp.trim(),
                                manufacturer: camMfg,
                                cameraModel: camModel.trim(),
                                locationName: camLocation.trim() || camName.trim()
                              })
                            });
                            const data = await res.json();
                            if (data.success && data.data) {
                              // Add to list
                              setCameras([data.data, ...cameras]);
                              setActiveCameraKey(data.data.cameraKey);
                              
                              // Reset form
                              setCamName('');
                              setCamIp('');
                              setCamPort('554');
                              setCamUsername('');
                              setCamPassword('');
                              setCamRtsp('');
                              setCamMfg('Hikvision');
                              setCamModel('');
                              setCamLocation('');
                              setConnectionStatus(null);

                              showAlert("Camera Connected", "Camera registered successfully and linked to your security grid!", "success");
                              // Navigate to Live Camera stream
                              router.push('/dashboard?tab=live_camera');
                            } else {
                              showAlert("Failed to Add Camera", data.error || "Failed to add camera.", "danger");
                            }
                          } catch (err) {
                            showAlert("System Error", "An unexpected error occurred while adding the camera.", "danger");
                          } finally {
                            setIsAdding(false);
                          }
                        }}
                        disabled={isTesting || isAdding || cameras.length >= (customer?.cameras || 5)}
                        className="px-6 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted"
                      >
                        {isAdding ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding Camera...
                          </>
                        ) : (
                          "Add Camera"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                )
              )}

              {activeTab === 'zones' && (
                <ZoneManagementView
                  user={user}
                  cameras={cameras}
                  activeCameraKey={activeCameraKey}
                  setActiveCameraKey={setActiveCameraKey}
                  apiUrl={API_URL}
                  onNavigateToLiveCamera={() => setActiveTab('live_camera')}
                />
              )}

              {activeTab === 'invoices' && (
                <div className="space-y-6 max-w-5xl mx-auto w-full">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <div>
                      <h2 className="text-xl font-extrabold text-foreground font-sans">Billing Invoices & Statements</h2>
                      <p className="text-xs text-muted-foreground">Live billing history and receipts fetched directly from database.</p>
                    </div>
                  </div>

                  <div className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border text-muted-foreground uppercase font-mono text-[10px] bg-muted/50">
                          <tr>
                            <th className="py-3 px-4">Invoice ID</th>
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4">Billing Date</th>
                            <th className="py-3 px-4">Due Date</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 font-medium">
                          {dbInvoices.length > 0 ? (
                            dbInvoices.map((inv: any) => (
                              <tr key={inv._id || inv.invoiceNumber} className="hover:bg-muted/30 transition-colors">
                                <td className="py-3 px-4 font-mono font-bold text-foreground">{inv.invoiceNumber}</td>
                                <td className="py-3 px-4 text-foreground/90 font-sans">{inv.description || `${inv.planName} Subscription`}</td>
                                <td className="py-3 px-4 text-foreground/80 font-mono">
                                  {inv.billingDate ? new Date(inv.billingDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}
                                </td>
                                <td className="py-3 px-4 text-foreground/80 font-mono">
                                  {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}
                                </td>
                                <td className="py-3 px-4 font-bold text-foreground/90 font-mono">${Number(inv.amount).toFixed(2)}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                                    inv.status === 'Overdue' ? 'bg-red-500/20 text-red-700 dark:text-red-400' :
                                    'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button 
                                    onClick={() => showAlert("Invoice Download", `Generating and downloading PDF receipt for ${inv.invoiceNumber}...`, "info")}
                                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-border hover:bg-muted text-foreground transition-all cursor-pointer font-sans"
                                  >
                                    Download PDF
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-muted-foreground font-sans">
                                {loadingInvoices ? "Loading authentic database invoices..." : "No invoices recorded in the database yet."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'subscription_detail' && (() => {
                const plansList = Array.isArray(dbPlans) ? dbPlans : [];
                const activePlanDoc = plansList.find((p: any) => p.name?.toLowerCase() === (customer?.plan || '').toLowerCase()) 
                  || plansList.find((p: any) => p.name === "Enterprise Pro") 
                  || (plansList.length > 0 ? plansList[0] : null);

                const planTitle = customer?.plan || activePlanDoc?.name || "Enterprise Pro";
                const monthlyCost = activePlanDoc ? activePlanDoc.monthlyPrice : 1299;
                const yearlyCost = activePlanDoc ? activePlanDoc.yearlyPrice : (monthlyCost * 12 * 0.8);
                const cameraLimit = customer?.cameras || activePlanDoc?.maxCameras || 5;
                const planDesc = activePlanDoc?.description || "Enterprise CCTV video analytics engine with AI intrusion, tracking, and instant alerts.";
                const planFeatures = activePlanDoc?.features || ["intrusion_detection", "camera_offline", "whatsapp_alerts", "fire_smoke"];

                const renewalDateStr = customer?.createdAt
                  ? new Date(new Date(customer.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                  : 'Sept 01, 2026';

                return (
                  <div className="space-y-6 max-w-5xl mx-auto w-full">
                    {/* Top Header & Breadcrumbs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
                          <span>Billing</span>
                          <span>/</span>
                          <span className="text-foreground font-semibold">Subscription & Plan</span>
                        </div>
                        <h2 className="text-xl font-bold text-foreground tracking-tight">Subscription Overview</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Overview of your current plan tier, resource allocation, and payment details from database.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setActiveTab('invoices')}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Billing History ({dbInvoices.length})</span>
                        </button>
                        <button
                          onClick={() => showAlert("Enterprise Tier Upgrade", "Please contact enterprise sales at support@corewatch.ai to customize or upgrade your license tier.", "info")}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary)] hover:opacity-95 text-white transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Change Plan</span>
                        </button>
                      </div>
                    </div>

                    {/* 1. Main Subscription Status Card */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg font-bold text-foreground tracking-tight">
                              {planTitle} Plan
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              customer?.status === 'Active' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${customer?.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                              {customer?.status || 'Active'}
                            </span>
                            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                              Auto-Renew ON
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {planDesc}
                          </p>
                        </div>

                        <div className="text-left md:text-right flex-shrink-0">
                          <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
                            {monthlyCost === 0 ? (
                              <span className="text-emerald-500">Free Trial</span>
                            ) : (
                              <>
                                ${monthlyCost}<span className="text-xs font-normal text-muted-foreground font-sans"> / month</span>
                              </>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                            {monthlyCost === 0 ? "14-Day Free Evaluation" : `Billed annually ($${yearlyCost}/yr)`}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/60 text-xs">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Billing Interval</span>
                          <span className="font-semibold text-foreground">Annual Recurring</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Next Charge Date</span>
                          <span className="font-semibold text-foreground font-mono">{renewalDateStr}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Payment Method</span>
                          <span className="font-semibold text-foreground font-mono">
                            {dbInvoices.length > 0 ? dbInvoices[0].paymentMethod : "Visa •••• 4242"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Service SLA</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">99.95% Guaranteed</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Resource Utilization & Quotas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Camera Capacity Gauge */}
                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-foreground">Camera Streams Quota</h3>
                            <p className="text-xs text-muted-foreground">Live streams allocated to your account</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-foreground">
                            {cameras.length} / {cameraLimit} Channels
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                              style={{ width: `${Math.min(100, (cameras.length / cameraLimit) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                            <span>{Math.round((cameras.length / cameraLimit) * 100)}% utilized</span>
                            <span>{Math.max(0, cameraLimit - cameras.length)} channels remaining</span>
                          </div>
                        </div>

                        <div className="divide-y divide-border/50 text-xs pt-1">
                          <div className="flex justify-between py-2 text-muted-foreground">
                            <span>Provisioned Database Limit:</span>
                            <span className="font-semibold text-foreground font-mono">{cameraLimit} Feeds</span>
                          </div>
                          <div className="flex justify-between py-2 text-muted-foreground">
                            <span>Currently Active Cameras:</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{cameras.length} Feeds</span>
                          </div>
                          <div className="flex justify-between py-2 text-muted-foreground">
                            <span>Available Free Slots:</span>
                            <span className="font-semibold text-foreground font-mono">{Math.max(0, cameraLimit - cameras.length)} Feeds</span>
                          </div>
                        </div>

                        {isTrialUser && isCameraLimitReached ? (
                          <button
                            onClick={() => {
                              showAlert("Upgrade Required", "Please contact enterprise sales at support@corewatch.ai or choose an upgraded plan to increase your camera limit.", "warning", () => setActiveTab('billing'));
                            }}
                            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            <span>Upgrade Plan to Add More Cameras</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTab('add_camera')}
                            className="w-full py-2 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Provision New Camera Feed</span>
                          </button>
                        )}
                      </div>

                      {/* AI Engine & Storage Limits */}
                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">Storage & Processing Limits</h3>
                          <p className="text-xs text-muted-foreground">Cloud event history and inference capabilities</p>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="p-3 rounded-lg bg-background border border-border/70 flex items-start gap-3">
                            <HardDrive className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <div className="font-semibold text-foreground">30-Day Cloud Video Retention</div>
                              <div className="text-[11px] text-muted-foreground">Security violation snapshots & JSON telemetry stored for 30 days.</div>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-background border border-border/70 flex items-start gap-3">
                            <Activity className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <div className="font-semibold text-foreground">Unlimited Real-Time AI Inference</div>
                              <div className="text-[11px] text-muted-foreground">Sub-100ms ultra-low latency person detection and loitering analysis.</div>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-background border border-border/70 flex items-start gap-3">
                            <Bell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <div className="font-semibold text-foreground">Multi-Channel Dispatches</div>
                              <div className="text-[11px] text-muted-foreground">Zero-latency browser SSE events, email summaries, and WhatsApp alerts.</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Included Features & Entitlements Checklist */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Plan Entitlements & Features</h3>
                        <p className="text-xs text-muted-foreground">Capabilities enabled under the {planTitle} database plan.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-1">
                        <div className="space-y-3">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                            AI Analytics & Computer Vision
                          </div>

                          {[
                            { key: "intrusion_detection", title: "Real-Time Person & Zone Detection", desc: "Ultra-fast neural network identifying personnel and restricted zone tripwires." },
                            { key: "loitering", title: "DeepSORT Behavior & Loitering", desc: "Persistent multi-person track continuity and dwell threshold alerts." },
                            { key: "cctv_hub", title: "Multi-Camera Live Video Hub", desc: "Simultaneous live CCTV streams with AI HUD overlay inspection." },
                            { key: "fire_smoke", title: "Fire & Smoke Analytics", desc: "Safety detection for active flame and smoke plumes in work environments." }
                          ].map((item, idx) => {
                            const isIncluded = planFeatures.length === 0 || planFeatures.includes(item.key) || item.key === 'cctv_hub' || item.key === 'loitering' || item.key === 'intrusion_detection';
                            return (
                              <div key={idx} className="flex items-start gap-2.5 text-xs">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                  isIncluded ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                                }`}>
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                                <div>
                                  <span className="font-semibold text-foreground">{item.title}</span>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="space-y-3">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                            Enterprise Infrastructure & Security
                          </div>

                          {[
                            { key: "camera_offline", title: "Camera Status Monitor & Offline Watchdog", desc: "Automated instant notification when any camera video stream disconnects." },
                            { key: "dedicated_key", title: "Dedicated Cryptographic Camera Key", desc: "Per-stream authorization tokens securing camera connectivity." },
                            { key: "whatsapp_alerts", title: "Real-Time Webhook & WhatsApp Alerts", desc: "Instant automated dispatch pipelines with snapshot attachments." },
                            { key: "support", title: "24/7 Priority Technical Support", desc: "Dedicated enterprise account engineer with 1-hour SLA response." },
                          ].map((item, idx) => {
                            return (
                              <div key={idx} className="flex items-start gap-2.5 text-xs">
                                <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                                <div>
                                  <span className="font-semibold text-foreground">{item.title}</span>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 4. Payment Method & Billing Details (2-Column Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Payment Method Card */}
                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-foreground">Payment Method</h3>
                          <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                            Default
                          </span>
                        </div>

                        <div className="p-4 rounded-lg bg-background border border-border/80 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-7 rounded bg-muted border border-border flex items-center justify-center font-bold text-[10px] tracking-wider text-foreground font-mono">
                              VISA
                            </div>
                            <div>
                              <div className="text-xs font-bold text-foreground font-mono">
                                {dbInvoices.length > 0 ? dbInvoices[0].paymentMethod : "Visa •••• 4242"}
                              </div>
                              <div className="text-[11px] text-muted-foreground">Expires 09/2028 · Primary Card</div>
                            </div>
                          </div>
                          <button
                            onClick={() => showAlert("Payment Methods", "Payment gateway integration will open to manage your payment cards and billing preferences.", "info")}
                            className="text-xs font-semibold text-brand-blue dark:text-brand-light-blue hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </div>

                      {/* Billing Information Card */}
                      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-foreground">Billing Details</h3>
                          <button
                            onClick={() => setActiveTab('profile')}
                            className="text-xs font-semibold text-brand-blue dark:text-brand-light-blue hover:underline cursor-pointer flex items-center gap-1"
                          >
                            Update <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="p-4 rounded-lg bg-background border border-border/80 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">Company</span>
                            <span className="font-semibold text-foreground">{customer?.company || 'Not Configured'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">Customer ID</span>
                            <span className="font-semibold text-foreground font-mono">{customer?._id || customer?.id || user?._id || 'CUST-VERIFIED'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">Billing Email</span>
                            <span className="font-semibold text-foreground truncate block">{customer?.email || user?.email}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">Country</span>
                            <span className="font-semibold text-foreground">{customer?.country || 'India'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5. Recent Invoices Section */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">Recent Invoices</h3>
                          <p className="text-xs text-muted-foreground">Download receipts from previous billing periods (MongoDB records).</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('invoices')}
                          className="text-xs font-semibold text-brand-blue dark:text-brand-light-blue hover:underline cursor-pointer flex items-center gap-1"
                        >
                          View all invoices ({dbInvoices.length}) <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-border/70 rounded-lg">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-border/70 text-muted-foreground font-mono uppercase text-[10px] bg-muted/40">
                            <tr>
                              <th className="py-2.5 px-3.5">Invoice #</th>
                              <th className="py-2.5 px-3.5">Date</th>
                              <th className="py-2.5 px-3.5">Description</th>
                              <th className="py-2.5 px-3.5">Amount</th>
                              <th className="py-2.5 px-3.5">Status</th>
                              <th className="py-2.5 px-3.5 text-right">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {dbInvoices.length > 0 ? (
                              dbInvoices.slice(0, 3).map((inv: any) => (
                                <tr key={inv._id || inv.invoiceNumber} className="hover:bg-muted/20 transition-colors">
                                  <td className="py-2.5 px-3.5 font-mono font-semibold text-foreground">{inv.invoiceNumber}</td>
                                  <td className="py-2.5 px-3.5 text-muted-foreground font-mono">
                                    {inv.billingDate ? new Date(inv.billingDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}
                                  </td>
                                  <td className="py-2.5 px-3.5 text-foreground">{inv.description || `${inv.planName} Subscription`}</td>
                                  <td className="py-2.5 px-3.5 font-mono font-semibold text-foreground">${Number(inv.amount).toFixed(2)}</td>
                                  <td className="py-2.5 px-3.5">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                      {inv.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3.5 text-right">
                                    <button
                                      onClick={() => showAlert("Invoice Download", `Generating and downloading PDF receipt for invoice ${inv.invoiceNumber}...`, "info")}
                                      className="text-[11px] font-semibold text-brand-blue dark:text-brand-light-blue hover:underline cursor-pointer"
                                    >
                                      Download PDF
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="py-6 text-center text-muted-foreground font-sans">
                                  {loadingInvoices ? "Loading invoices from database..." : "No invoices found in database."}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'event_history' && (
                <div className="border border-border bg-card rounded-lg p-6 space-y-4 shadow-sm">
                  <h2 className="text-lg font-bold text-foreground">Security Event History Log</h2>
                  <div className="space-y-3">
                    {dbAlerts.length > 0 ? (
                      dbAlerts.map((alert) => (
                        <div key={alert._id} className="p-4 rounded-lg border border-border bg-background/60 flex gap-4 items-center text-xs">
                          {alert.imageUrl && (
                            <img 
                              src={alert.imageUrl} 
                              alt="Alert Snapshot" 
                              className="w-16 h-12 object-cover rounded-lg border border-border shrink-0" 
                            />
                          )}
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="font-bold text-foreground truncate">{alert.message}</div>
                            <div className="text-muted-foreground font-mono truncate">
                              Camera: {alert.cameraKey} · {new Date(alert.timestamp).toLocaleTimeString()} ({new Date(alert.timestamp).toLocaleDateString()})
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded bg-brand-navy border border-border font-bold text-muted-foreground shrink-0">
                            RECEIVED
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                        No historical events found.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="max-w-lg border border-border bg-card rounded-lg p-6 space-y-4 shadow-sm">
                  <h2 className="text-lg font-bold text-foreground">User Account Profile</h2>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Full Name</span>
                      <span className="font-bold text-sm text-foreground">{user?.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Email</span>
                      <span className="font-bold text-sm text-foreground">{user?.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Account Role</span>
                      <span className="font-bold text-sm text-brand-gold uppercase">{user?.role}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notification' && (
                <div className="max-w-lg border border-border bg-card rounded-lg p-6 space-y-4 shadow-sm">
                  <h2 className="text-lg font-bold text-foreground">Notification Preferences</h2>
                  <div className="space-y-3 text-xs text-foreground/80">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-brand-gold bg-background border-border text-brand-gold" />
                      <span>Email Alerts for High Severity Violations</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-brand-gold bg-background border-border text-brand-gold" />
                      <span>WhatsApp Supervisor Dispatches</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="max-w-xl border border-border bg-card rounded-2xl p-6 space-y-6 shadow-sm">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Camera Configuration</h2>
                    <p className="text-xs text-muted-foreground">Connect your Python camera stream to this account.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-muted-foreground block">Your Unique Camera Access Key</label>
                    {activeCameraKey ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={activeCameraKey}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono font-bold focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(activeCameraKey);
                            setCopySuccess(true);
                            setTimeout(() => setCopySuccess(false), 2000);
                          }}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-blue hover:bg-brand-blue/90 text-white transition-all cursor-pointer shadow-md"
                        >
                          {copySuccess ? "Copied!" : "Copy Key"}
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Generating camera access key...</div>
                    )}
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Instructions: Copy this key and paste it inside the `CAMERA_KEY` configuration of your AI Service environment variable.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-foreground">Register Another Camera Location</h3>
                      {isTrialUser && (
                        <span className="text-[10px] font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Trial Limit: 1 Location
                        </span>
                      )}
                    </div>
                    {isTrialUser && isCameraLimitReached ? (
                      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs space-y-2">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Your Demo Free account is limited to 1 camera stream (configured during onboarding). To add more camera locations, please upgrade your plan.
                        </p>
                        <button
                          onClick={() => {
                            setActiveTab('subscription_detail');
                            router.push('/dashboard?tab=subscription_detail');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          <span>Upgrade Plan</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          const name = prompt("Enter location name (e.g. Back Alley, Main Entrance):");
                          if (!name) return;
                          try {
                            const res = await fetch('/api/cameras', {
                              method: 'POST',
                              headers: { 
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${user?.token}` 
                              },
                              body: JSON.stringify({ locationName: name })
                            });
                            const data = await res.json();
                            if (data.success && data.data) {
                              setCameras([data.data, ...cameras]);
                              setActiveCameraKey(data.data.cameraKey);
                              showAlert("Key Provisioned", `Successfully provisioned new camera key: ${data.data.cameraKey}`, "success");
                            } else {
                              showAlert("Provisioning Failed", data.error || "Failed to provision new camera key.", "danger");
                            }
                          } catch (err) {
                            showAlert("Network Error", "Failed to provision new camera key.", "danger");
                          }
                        }}
                        className="px-4 py-2 text-xs font-bold border border-border hover:bg-muted rounded-xl transition-all cursor-pointer text-foreground"
                      >
                        + Add Camera Location
                      </button>
                    )}

                    {cameras.length > 1 && (
                      <div className="space-y-1 pt-2">
                        <span className="text-[10px] font-bold text-muted-foreground block">Switch Active Camera Key:</span>
                        <select
                          value={activeCameraKey}
                          onChange={(e) => setActiveCameraKey(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        >
                          {cameras.map((cam) => (
                            <option key={cam._id} value={cam.cameraKey}>
                              {cam.locationName} ({cam.cameraKey})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* AI Features Management Panel */}
                  <div className="pt-6 border-t border-border space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">AI Core Analytics Settings</h3>
                      <p className="text-[11px] text-muted-foreground">Selectively enable or disable advanced AI analytics features for this camera.</p>
                    </div>

                    {activeCamera ? (
                      <div className="space-y-3.5 bg-background/50 border border-border/85 rounded-2xl p-4 shadow-inner">
                        {/* 1. Human Detection & Tracking */}
                        <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <span>👤</span> Human Detection & Tracking
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-normal max-w-[280px] sm:max-w-sm">
                              Detect and track individuals in the camera view field.
                            </div>
                          </div>
                          <button
                            onClick={() => toggleCameraFeature('humanDetection', activeCamera.humanDetection !== false)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              activeCamera.humanDetection !== false ? 'bg-brand-gold' : 'bg-muted'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                activeCamera.humanDetection !== false ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* 2. Zone Monitoring */}
                        <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <span>🚧</span> Zone Monitoring
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-normal max-w-[280px] sm:max-w-sm">
                              Alert on unauthorized presence inside marked restricted zones.
                            </div>
                          </div>
                          <button
                            onClick={() => toggleCameraFeature('zoneMonitoring', activeCamera.zoneMonitoring !== false)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              activeCamera.zoneMonitoring !== false ? 'bg-brand-gold' : 'bg-muted'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                activeCamera.zoneMonitoring !== false ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* 3. After-Hours Security */}
                        <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <span>🌙</span> After-Hours Security
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-normal max-w-[280px] sm:max-w-sm">
                              Detect people during non-operational business hours automatically.
                            </div>
                          </div>
                          <button
                            onClick={() => toggleCameraFeature('afterHoursSecurity', activeCamera.afterHoursSecurity !== false)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              activeCamera.afterHoursSecurity !== false ? 'bg-brand-gold' : 'bg-muted'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                activeCamera.afterHoursSecurity !== false ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* 4. Suspicious Movement */}
                        <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <span>🔄</span> Suspicious Movement Detection
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-normal max-w-[280px] sm:max-w-sm">
                              Identify loitering, pacing, and back-and-forth patterns.
                            </div>
                          </div>
                          <button
                            onClick={() => toggleCameraFeature('suspiciousMovement', activeCamera.suspiciousMovement !== false)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              activeCamera.suspiciousMovement !== false ? 'bg-brand-gold' : 'bg-muted'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                activeCamera.suspiciousMovement !== false ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* 5. Camera Health & Tampering */}
                        <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <span>📹</span> Camera Health & Tampering Detection
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-normal max-w-[280px] sm:max-w-sm">
                              Notify when camera is offline, video freezes, is blocked, or orientation shifts.
                            </div>
                          </div>
                          <button
                            onClick={() => toggleCameraFeature('cameraHealth', activeCamera.cameraHealth !== false)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              activeCamera.cameraHealth !== false ? 'bg-brand-gold' : 'bg-muted'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                activeCamera.cameraHealth !== false ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Select a camera to configure settings.</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* =================================================================== */}
          {/* 3. DEMO ROLE TAB VIEWS */}
          {/* =================================================================== */}
          {currentRole === 'demo' && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {upgradeMsg && (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold text-center animate-bounce">
                  {upgradeMsg}
                </div>
              )}

              <div className="border border-amber-500/30 bg-amber-500/10 rounded-2xl p-8 text-center space-y-6 shadow-lg">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl font-bold">
                  ⚡
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-foreground">Demo Session Active</h2>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    You are exploring the CoreWatch enterprise console in Demo Preview mode. Click below to upgrade this demo account to a full <strong>USER</strong> account instantly!
                  </p>
                </div>

                <button
                  onClick={handleUpgradeDemoToUser}
                  disabled={upgrading}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-gold to-brand-light-gold text-brand-navy font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-xl shadow-brand-gold/20 cursor-pointer disabled:opacity-50"
                >
                  {upgrading ? 'Upgrading Role...' : '⚡ Upgrade Account to Full USER Role'}
                </button>
              </div>

              <div className="border border-dashed border-border rounded-2xl p-12 text-center text-xs text-muted-foreground font-mono">
                📌 Demo workspace canvas. Additional custom interactive demos will be loaded here.
              </div>

            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 1. CAMERA VIEW MODAL (PREVIEW & SPECS) */}
      {/* ========================================================================= */}
      {selectedViewCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-foreground">
                    {selectedViewCamera.name || selectedViewCamera.locationName || 'Camera Feed'}
                  </h2>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-brand-blue/20 text-brand-blue dark:text-brand-light-blue border border-brand-blue/30">
                    {selectedViewCamera.cameraKey}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    LIVE STREAM
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  📍 {selectedViewCamera.locationName || 'Main Area'} · {selectedViewCamera.manufacturer || 'Hikvision'} {selectedViewCamera.cameraModel || ''}
                </p>
              </div>

              <button
                onClick={() => setSelectedViewCamera(null)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-[#020415] rounded-xl border border-border overflow-hidden shadow-inner group select-none">
              {/* Scanline & Grid Effect */}
              <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-35"></div>
              <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]"></div>

              {/* Top Left HUD */}
              <div className="absolute top-3 left-3 font-mono text-[9px] text-zinc-300 bg-[#0A0B0E]/85 border border-[#16171D] px-2.5 py-1.5 rounded-lg z-20 space-y-0.5 shadow-lg">
                <div className="flex items-center gap-1.5 font-bold text-zinc-100">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  <span>{(selectedViewCamera.locationName || selectedViewCamera.name || 'CAM').toUpperCase()}</span>
                </div>
                <div>1920 × 1080 @ 10FPS · H.264 MJPEG</div>
                <div className="text-emerald-400 font-bold">AI ACTIVE ENGINE</div>
              </div>

              {/* Stream Image */}
              <img
                src={`http://localhost:8000/api/camera/stream/${selectedViewCamera.cameraKey}`}
                alt={selectedViewCamera.name || "Live Stream"}
                className="w-full h-full object-contain relative z-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.offline-camera-banner')) {
                    const div = document.createElement('div');
                    div.className = 'offline-camera-banner absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-[#090b14] select-none';
                    div.innerHTML = `
                      <div class="w-16 h-16 rounded-2xl bg-[#141626] border border-orange-500/20 text-orange-400 flex items-center justify-center mb-3">
                        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      </div>
                      <span class="text-sm font-bold text-white mb-1">Camera Feed Inactive</span>
                      <span class="text-xs text-zinc-400 font-mono">Stream Signal Offline · No Signal Received</span>
                    `;
                    parent.appendChild(div);
                  }
                }}
              />
            </div>

            {/* Technical Specs & AI Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box 1: Network & Connection Params */}
              <div className="p-4 rounded-xl border border-border bg-background/50 space-y-2.5 text-xs">
                <div className="font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-1.5">
                  <Activity className="w-4 h-4 text-brand-blue" />
                  <span>Connection & Hardware Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">IP & PORT</span>
                    <span className="font-mono font-bold text-foreground">
                      {selectedViewCamera.ipAddress ? `${selectedViewCamera.ipAddress}:${selectedViewCamera.port || 554}` : 'Default / Auto'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">MANUFACTURER</span>
                    <span className="font-semibold text-foreground">{selectedViewCamera.manufacturer || 'Hikvision'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">HARDWARE MODEL</span>
                    <span className="font-semibold text-foreground">{selectedViewCamera.cameraModel || 'Standard IP Camera'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">STREAM ENCODING</span>
                    <span className="font-mono text-foreground">H.264 RTSP Stream</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[10px]">RTSP ENDPOINT</span>
                    <span className="font-mono text-[10px] text-brand-gold break-all">
                      {selectedViewCamera.rtspUrl || 'rtsp://user:pass@camera-ip:554/stream1'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: AI Safety Policy Toggles */}
              <div className="p-4 rounded-xl border border-border bg-background/50 space-y-2.5 text-xs">
                <div className="font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Active AI Safety Modules</span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">PPE & Helmet Detection</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${selectedViewCamera.humanDetection !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      {selectedViewCamera.humanDetection !== false ? '✓ Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Zone Intrusion Monitoring</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${selectedViewCamera.zoneMonitoring !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      {selectedViewCamera.zoneMonitoring !== false ? '✓ Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">After-Hours Perimeter Guard</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${selectedViewCamera.afterHoursSecurity !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      {selectedViewCamera.afterHoursSecurity !== false ? '✓ Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Suspicious Motion Gate</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${selectedViewCamera.suspiciousMovement !== false ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      {selectedViewCamera.suspiciousMovement !== false ? '✓ Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-border">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const key = selectedViewCamera.cameraKey;
                    setSelectedViewCamera(null);
                    setActiveCameraKey(key);
                    setActiveTab('live_camera');
                    router.push('/dashboard?tab=live_camera');
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-brand-blue/15"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Open in Multi-Grid</span>
                </button>
                <button
                  onClick={() => {
                    const cam = selectedViewCamera;
                    setSelectedViewCamera(null);
                    openSettingsModal(cam);
                  }}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-foreground font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-500" />
                  <span>Edit / Configure Rules</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedViewCamera(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-muted-foreground font-semibold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CAMERA SETTINGS & EDIT MODAL */}
      {/* ========================================================================= */}
      {selectedSettingsCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-foreground">
                    Camera Settings: {selectedSettingsCamera.name || selectedSettingsCamera.locationName || 'Camera'}
                  </h2>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-muted text-foreground/80 border border-border">
                    {selectedSettingsCamera.cameraKey}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Manage safety analytics rules and device credentials for this CCTV node.
                </p>
              </div>

              <button
                onClick={() => setSelectedSettingsCamera(null)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert Messages */}
            {settingsSuccessMsg && (
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{settingsSuccessMsg}</span>
              </div>
            )}
            {settingsErrorMsg && (
              <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{settingsErrorMsg}</span>
              </div>
            )}

            {/* Tab Switcher */}
            <div className="flex rounded-xl bg-muted/60 p-1 border border-border">
              <button
                onClick={() => setSettingsTab('ai')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  settingsTab === 'ai'
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>AI & Safety Rules</span>
              </button>
              <button
                onClick={() => setSettingsTab('device')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  settingsTab === 'device'
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sliders className="w-4 h-4 text-brand-blue" />
                <span>Device & Network (Edit)</span>
              </button>
            </div>

            {/* TAB 1: AI & Safety Rules */}
            {settingsTab === 'ai' && (
              <div className="space-y-4">
                <div className="space-y-3 divide-y divide-border/50">
                  
                  {/* Toggle 1: PPE & Helmet */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span>👷</span> PPE & Helmet Detection
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Detect missing hardhats and safety gear in active work zones.
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleModalFeature('humanDetection', selectedSettingsCamera.humanDetection !== false)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        selectedSettingsCamera.humanDetection !== false ? 'bg-brand-blue' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          selectedSettingsCamera.humanDetection !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2: Zone Monitoring */}
                  <div className="flex justify-between items-center pt-3">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span>🚧</span> Security Zone Perimeter
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Alert immediately when workers cross into restricted hazard boundaries.
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleModalFeature('zoneMonitoring', selectedSettingsCamera.zoneMonitoring !== false)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        selectedSettingsCamera.zoneMonitoring !== false ? 'bg-brand-blue' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          selectedSettingsCamera.zoneMonitoring !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 3: After-Hours Security */}
                  <div className="flex justify-between items-center pt-3">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span>🌙</span> After-Hours Security Mode
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        High-sensitivity perimeter tracking outside operational shifts.
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleModalFeature('afterHoursSecurity', selectedSettingsCamera.afterHoursSecurity !== false)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        selectedSettingsCamera.afterHoursSecurity !== false ? 'bg-brand-blue' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          selectedSettingsCamera.afterHoursSecurity !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 4: Suspicious Motion */}
                  <div className="flex justify-between items-center pt-3">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span>🔄</span> Suspicious Movement & Loitering
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Filter false positives and flag prolonged loitering near key assets.
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleModalFeature('suspiciousMovement', selectedSettingsCamera.suspiciousMovement !== false)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        selectedSettingsCamera.suspiciousMovement !== false ? 'bg-brand-blue' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          selectedSettingsCamera.suspiciousMovement !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 5: Camera Health */}
                  <div className="flex justify-between items-center pt-3">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span>📹</span> Camera Stream Health Heartbeat
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Auto-alert if video stream disconnects, freezes, or encounters packet drop.
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleModalFeature('cameraHealth', selectedSettingsCamera.cameraHealth !== false)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        selectedSettingsCamera.cameraHealth !== false ? 'bg-brand-blue' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          selectedSettingsCamera.cameraHealth !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                </div>

                {/* Zone Calibration Banner */}
                <div className="p-4 rounded-xl border border-brand-blue/20 bg-brand-blue/5 flex items-center justify-between mt-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground">Configure Detection Zones</div>
                    <p className="text-[10px] text-muted-foreground">Draw and customize safety perimeter polygons on this camera feed.</p>
                  </div>
                  <button
                    onClick={() => {
                      const key = selectedSettingsCamera.cameraKey;
                      setSelectedSettingsCamera(null);
                      setActiveCameraKey(key);
                      setActiveTab('zones');
                      router.push('/dashboard?tab=zones');
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-blue text-white hover:bg-brand-blue/90 transition-all cursor-pointer shrink-0"
                  >
                    Open Zones →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Device & Network (Edit) */}
            {settingsTab === 'device' && (
              <form onSubmit={handleSaveDeviceSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Camera Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">Camera Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Main Entrance Cam"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>

                  {/* Location Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">Location / Area</label>
                    <input
                      type="text"
                      value={editForm.locationName}
                      onChange={(e) => setEditForm({ ...editForm, locationName: e.target.value })}
                      placeholder="Workshop Floor 1"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>

                  {/* IP Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">IP Address</label>
                    <input
                      type="text"
                      value={editForm.ipAddress}
                      onChange={(e) => setEditForm({ ...editForm, ipAddress: e.target.value })}
                      placeholder="192.168.1.100"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>

                  {/* Port */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">Port</label>
                    <input
                      type="number"
                      value={editForm.port}
                      onChange={(e) => setEditForm({ ...editForm, port: e.target.value })}
                      placeholder="554"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">Username</label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      placeholder="admin"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">New Password (Optional)</label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Leave blank to keep unchanged"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>

                  {/* RTSP URL */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground block">RTSP Stream URL</label>
                    <input
                      type="text"
                      value={editForm.rtspUrl}
                      onChange={(e) => setEditForm({ ...editForm, rtspUrl: e.target.value })}
                      placeholder="rtsp://user:password@ip:port/stream1"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>

                  {/* Manufacturer */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">Manufacturer</label>
                    <select
                      value={editForm.manufacturer}
                      onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-blue cursor-pointer"
                    >
                      <option value="Hikvision">Hikvision</option>
                      <option value="Dahua">Dahua</option>
                      <option value="Axis">Axis</option>
                      <option value="CP Plus">CP Plus</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Camera Model */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">Camera Model</label>
                    <input
                      type="text"
                      value={editForm.cameraModel}
                      onChange={(e) => setEditForm({ ...editForm, cameraModel: e.target.value })}
                      placeholder="DS-2CD2143G0-I"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>

                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setSelectedSettingsCamera(null)}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-muted-foreground font-semibold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingDeviceSettings}
                    className="px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-brand-blue/15 disabled:opacity-50"
                  >
                    {isSavingDeviceSettings ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Modal Bottom Close Button for AI tab */}
            {settingsTab === 'ai' && (
              <div className="flex justify-end pt-3 border-t border-border">
                <button
                  onClick={() => setSelectedSettingsCamera(null)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Custom Delete Camera Confirmation Dialog (Matches Image 2) */}
      <CustomConfirmDialog
        isOpen={!!cameraToDelete}
        title="Delete Camera?"
        message={
          <>
            Are you sure you want to delete camera <strong className="text-foreground">&ldquo;{cameraToDelete?.cameraKey}&rdquo;</strong>{cameraToDelete?.name && cameraToDelete.name !== cameraToDelete.cameraKey ? ` (${cameraToDelete.name})` : ''}? This action cannot be undone and will stop AI alerting for this camera node.
          </>
        }
        confirmText="Delete Camera"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingCamera}
        onConfirm={confirmDeleteCamera}
        onCancel={() => {
          if (!isDeletingCamera) setCameraToDelete(null);
        }}
      />

      {/* Universal Custom Alert Modal */}
      <CustomConfirmDialog
        isOpen={!!customAlert?.isOpen}
        title={customAlert?.title || 'Notice'}
        message={customAlert?.message || ''}
        confirmText={customAlert?.confirmText || 'OK'}
        cancelText={customAlert?.cancelText}
        variant={customAlert?.variant || 'info'}
        hideCancel={!customAlert?.onCancel}
        onConfirm={() => {
          if (customAlert?.onConfirm) customAlert.onConfirm();
          setCustomAlert(null);
        }}
        onCancel={() => {
          if (customAlert?.onCancel) customAlert.onCancel();
          setCustomAlert(null);
        }}
      />

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}


