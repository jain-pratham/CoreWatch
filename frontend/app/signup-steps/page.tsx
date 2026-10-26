'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  Shield, 
  Users, 
  Flame, 
  DollarSign, 
  VideoOff, 
  MessageSquare, 
  Eye, 
  EyeOff,
  Check, 
  X,
  Camera,
  Radio,
  Activity,
  Cpu,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Info,
  Server,
  Lock,
  Wifi,
  Sliders,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Building,
  CheckCircle,
  ExternalLink,
  QrCode
} from "lucide-react";

const AVAILABLE_AI_FEATURES = [
  { key: "intrusion_detection", label: "Intrusion Detection", desc: "Real-time human intrusion alerts in restricted security zones" },
  { key: "fire_smoke", label: "Fire & Smoke Alert", desc: "Safety-oriented detection of active flames and smoke plumes" },
  { key: "cash_counter", label: "Cash Counter Monitoring", desc: "Commercial safety logs and cashier transaction area auditing" },
  { key: "camera_offline", label: "Camera Status Monitor", desc: "Automated notifications when camera video stream goes offline" },
  { key: "whatsapp_alerts", label: "WhatsApp Alerts dispatch", desc: "Real-time video clip webhook dispatcher to WhatsApp accounts" }
];

const getFeatureIcon = (key: string) => {
  switch (key) {
    case "intrusion_detection":
      return <Shield className="h-3 w-3" />;
    case "fire_smoke":
      return <Flame className="h-3 w-3" />;
    case "cash_counter":
      return <DollarSign className="h-3 w-3" />;
    case "camera_offline":
      return <VideoOff className="h-3 w-3" />;
    case "whatsapp_alerts":
      return <MessageSquare className="h-3 w-3" />;
    default:
      return <Check className="h-3 w-3" />;
  }
};

const getFeatureLabel = (key: string) => {
  const feat = AVAILABLE_AI_FEATURES.find((f) => f.key === key);
  return feat ? feat.label : key;
};


interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'demo';
}

interface DbPlan {
  _id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  maxCameras: number;
  trialDays?: number;
  features: string[];
  isPopular?: boolean;
  status: 'active' | 'inactive';
  sortOrder: number;
}

export default function SignupStepsPage() {
  const router = useRouter();

  // Wizard state: 1: Account, 2: Address, 3: Choose Plan, 4: Camera Setup / Payment, 5: Success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auth context
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Plans list loaded from DB
  const [plans, setPlans] = useState<DbPlan[]>([]);

  // Camera form extras
  const [showCamPassword, setShowCamPassword] = useState(false);
  const [isTestingCam, setIsTestingCam] = useState(false);
  const [camTestStatus, setCamTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Razorpay Checkout State
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    paymentId: string;
    orderId: string;
    invoiceNumber: string;
    amount: number;
  } | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    
    // Step 2: Address Info
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',

    // Step 3: Plan Info
    plan: 'Demo Free', // Default selected
    
    // Step 4: Camera Setup (For Demo Free)
    cameraName: '',
    cameraLocation: '',
    cameraManufacturer: 'Hikvision',
    cameraModel: '',
    cameraType: 'RTSP Stream',
    cameraIp: '',
    cameraPort: '554',
    cameraUsername: '',
    cameraPassword: '',
    cameraRtspUrl: '',
    camerasCount: 1,

    // AI Vision Features
    aiHumanDetection: true,
    aiZoneMonitoring: true,
    aiAfterHoursSecurity: true,
    aiSuspiciousMovement: true,
    aiCameraHealth: true,

    // Step 4: Payment Details (For Paid Plans)
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  const [countdown, setCountdown] = useState(3);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

  // 1. Fetch current authentication and prefill customer info if exists
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as UserData;
      setUser(parsedUser);
      setToken(storedToken);

      // Fetch active plans first
      fetch(`${API_URL}/api/plans?status=active`)
        .then((res) => res.json())
        .then((plansData) => {
          if (plansData.success && plansData.data?.plans) {
            // Sort by sortOrder
            const sortedPlans = [...plansData.data.plans].sort((a, b) => a.sortOrder - b.sortOrder);
            setPlans(sortedPlans);
          }
        })
        .catch((err) => console.log('Error loading plans:', err));

      // Fetch customer profile to prefill
      fetch(`${API_URL}/api/customers/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const customer = data.data;
            const nameParts = (customer.user?.name || parsedUser.name || '').split(' ');
            const fName = nameParts[0] || '';
            const lName = nameParts.slice(1).join(' ') || '';

            setFormData((prev) => ({
              ...prev,
              firstName: fName,
              lastName: lName,
              email: customer.user?.email || parsedUser.email,
              phone: customer.phone || '',
              company: customer.company || '',
              addressLine1: customer.addressLine1 || '',
              addressLine2: customer.addressLine2 || '',
              city: customer.city || '',
              state: customer.state || '',
              country: customer.country || 'India',
              pincode: customer.pincode || '',
              plan: customer.plan || 'Demo Free',
              camerasCount: customer.cameras || 1,
            }));
          } else {
            // No customer profile, prefill name and email from User session
            const nameParts = (parsedUser.name || '').split(' ');
            const fName = nameParts[0] || '';
            const lName = nameParts.slice(1).join(' ') || '';
            
            setFormData((prev) => ({
              ...prev,
              firstName: fName,
              lastName: lName,
              email: parsedUser.email,
            }));
          }
        })
        .catch((err) => console.log('Error loading customer:', err))
        .finally(() => setLoading(false));
    } catch (err) {
      router.push('/login');
    }
  }, [router, API_URL]);

  // Handle countdown redirection for Step 5
  useEffect(() => {
    if (step === 5) {
      const timer = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === 5 && countdown === 0) {
      router.push('/dashboard');
    }
  }, [countdown, step, router]);

  // Input Change Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Step Navigations & Submissions
  const nextStep = () => {
    setErrorMessage(null);
    const newErrors: Record<string, string> = {};

    // Validation for Step 1
    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Mobile number is required';
      }
      if (!formData.company.trim()) {
        newErrors.company = 'Company name is required';
      }
    }

    // Validation for Step 2
    if (step === 2) {
      if (!formData.addressLine1.trim()) {
        newErrors.addressLine1 = 'Address Line 1 is required';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      }
      if (!formData.state.trim()) {
        newErrors.state = 'State is required';
      }
      if (!formData.pincode.trim()) {
        newErrors.pincode = 'Postal code is required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setErrorMessage(null);
    setErrors({});
    setStep((prev) => prev - 1);
  };

  const handleAutoConstructRtsp = () => {
    const u = formData.cameraUsername.trim();
    const p = formData.cameraPassword.trim();
    const ip = formData.cameraIp.trim() || '192.168.1.100';
    const port = formData.cameraPort.trim() || '554';
    const mfg = formData.cameraManufacturer;

    const userPart = u ? (p ? `${encodeURIComponent(u)}:${encodeURIComponent(p)}@` : `${encodeURIComponent(u)}@`) : '';
    const hostPart = `${ip}:${port}`;
    let path = '/Streaming/Channels/101';
    if (mfg === 'Dahua' || mfg === 'CP Plus') path = '/cam/realmonitor?channel=1&subtype=0';
    else if (mfg === 'Axis') path = '/axis-media/media.amp';
    else if (mfg === 'Uniview') path = '/unicast/c1/s0/live';
    else if (mfg === 'Other') path = '/live/ch0';

    const constructed = `rtsp://${userPart}${hostPart}${path}`;
    setFormData((prev) => ({ ...prev, cameraRtspUrl: constructed }));
  };

  const handleQuickFillDemo = () => {
    setFormData((prev) => ({
      ...prev,
      cameraName: 'Front Entrance CCTV Node',
      cameraLocation: 'Front Office Entrance',
      cameraManufacturer: 'Hikvision',
      cameraModel: 'DS-2CD2043G2-I',
      cameraType: 'RTSP Stream',
      cameraIp: '192.168.1.108',
      cameraPort: '554',
      cameraUsername: 'admin',
      cameraPassword: 'DemoPass#2026',
      cameraRtspUrl: 'rtsp://admin:DemoPass%232026@192.168.1.108:554/Streaming/Channels/101',
      aiHumanDetection: true,
      aiZoneMonitoring: true,
      aiAfterHoursSecurity: true,
      aiSuspiciousMovement: true,
      aiCameraHealth: true,
    }));
    setCamTestStatus({
      success: true,
      message: '✓ Verified demo RTSP stream profile loaded.',
    });
  };

  const handleTestCameraConnection = async () => {
    if (!formData.cameraIp.trim() || !formData.cameraPort.trim() || !formData.cameraUsername.trim() || !formData.cameraRtspUrl.trim()) {
      setCamTestStatus({
        success: false,
        message: 'Please fill in Camera IP, Port, Username, and RTSP URL before testing.',
      });
      return;
    }
    setIsTestingCam(true);
    setCamTestStatus(null);
    try {
      const res = await fetch('/api/cameras/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ipAddress: formData.cameraIp.trim(),
          port: formData.cameraPort.trim(),
          username: formData.cameraUsername.trim(),
          password: formData.cameraPassword.trim() || 'demo',
          rtspUrl: formData.cameraRtspUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCamTestStatus({ success: true, message: '✓ Camera network socket & RTSP endpoint verified!' });
      } else {
        setCamTestStatus({
          success: false,
          message: data.error || 'Unable to connect to camera on this network. Please check host/port accessibility.',
        });
      }
    } catch (err) {
      setCamTestStatus({
        success: false,
        message: 'Network verification timed out or server unavailable.',
      });
    } finally {
      setIsTestingCam(false);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (isSimulatedDemo = false) => {
    if (!token) {
      setErrorMessage("Authentication session expired. Please log in again.");
      return;
    }

    setIsProcessingPayment(true);
    setErrorMessage(null);

    try {
      const selectedPlanObj = plans.find(p => p.name === formData.plan);
      const basePrice = selectedPlanObj 
        ? (billingCycle === 'yearly' ? selectedPlanObj.yearlyPrice : selectedPlanObj.monthlyPrice)
        : (billingCycle === 'yearly' ? 14999 : 1499);
      
      const gstAmount = Math.round(basePrice * 0.18);
      const totalAmount = basePrice + gstAmount;

      // 1. Create order on backend
      const orderRes = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planName: formData.plan,
          billingCycle,
          amount: totalAmount,
          currency: 'INR',
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || orderData.error || "Unable to initiate payment order");
      }

      const { orderId, keyId, isDemo } = orderData;

      // Check if user requested mock simulation or keys are demo
      if (isSimulatedDemo || isDemo || !keyId || keyId.includes("sample") || keyId.includes("demo")) {
        // Run Instant Simulated Razorpay Verification
        const mockPaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const mockSignature = `sig_demo_${Date.now()}`;

        const verifyRes = await fetch(`${API_URL}/api/payment/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpay_order_id: orderId,
            razorpay_payment_id: mockPaymentId,
            razorpay_signature: mockSignature,
            planName: formData.plan,
            billingCycle,
            amount: totalAmount,
            camerasCount: selectedPlanObj ? selectedPlanObj.maxCameras : 10,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.success) {
          setPaymentSuccessData({
            paymentId: mockPaymentId,
            orderId,
            invoiceNumber: verifyData.data?.invoiceNumber || `INV-${Date.now()}`,
            amount: totalAmount,
          });
        } else {
          throw new Error(verifyData.message || verifyData.error || "Payment verification failed");
        }
        return;
      }

      // Live Razorpay Checkout
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const options = {
        key: keyId,
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        name: "CoreWatch AI Systems",
        description: `${formData.plan} (${billingCycle}) Security Subscription`,
        image: "/logo.png",
        order_id: orderId,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim() || user?.name,
          email: formData.email || user?.email,
          contact: formData.phone || "9876543210",
        },
        theme: {
          color: "#0284c7",
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${API_URL}/api/payment/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planName: formData.plan,
                billingCycle,
                amount: totalAmount,
                camerasCount: selectedPlanObj ? selectedPlanObj.maxCameras : 10,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setPaymentSuccessData({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                invoiceNumber: verifyData.data?.invoiceNumber || `INV-${Date.now()}`,
                amount: totalAmount,
              });
            } else {
              setErrorMessage(verifyData.message || "Payment verification error");
            }
          } catch (err: any) {
            setErrorMessage(err.message || "Error verifying payment signature");
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setErrorMessage(resp.error?.description || "Payment was declined or cancelled");
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay checkout error:", err);
      setErrorMessage(err.message || "Unable to proceed with Razorpay checkout.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const selectedPlanObj = plans.find(p => p.name === formData.plan);
  const isFreePlan = selectedPlanObj 
    ? (selectedPlanObj.monthlyPrice === 0 && selectedPlanObj.yearlyPrice === 0) 
    : (formData.plan === 'Demo Free');

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setErrorMessage(null);
    const newErrors: Record<string, string> = {};
    setIsSubmitting(true);

    // Validation for Step 4
    if (!isFreePlan) {
      if (!paymentSuccessData) {
        setErrorMessage("Please complete your Razorpay payment before completing registration setup.");
        setIsSubmitting(false);
        return;
      }
    } else {
      // Demo free camera validations
      if (!formData.cameraName.trim()) {
        newErrors.cameraName = 'Camera name is required';
      }
      if (!formData.cameraLocation.trim()) {
        newErrors.cameraLocation = 'Camera location is required';
      }
      if (!formData.cameraIp.trim()) {
        newErrors.cameraIp = 'Camera IP Address or Host is required';
      }
      if (!formData.cameraPort.trim() || isNaN(Number(formData.cameraPort))) {
        newErrors.cameraPort = 'Valid RTSP port is required (e.g. 554)';
      }
      if (!formData.cameraRtspUrl.trim()) {
        newErrors.cameraRtspUrl = 'RTSP URL is required';
      } else if (!formData.cameraRtspUrl.trim().startsWith('rtsp://')) {
        newErrors.cameraRtspUrl = 'RTSP URL must begin with rtsp://';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});

    try {
      // 1. If user selected a free/trial plan, automatically register their full first camera in database
      if (isFreePlan) {
        try {
          await fetch('/api/cameras', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: formData.cameraName.trim(),
              locationName: formData.cameraLocation.trim(),
              ipAddress: formData.cameraIp.trim(),
              port: Number(formData.cameraPort) || 554,
              username: formData.cameraUsername.trim() || 'admin',
              password: formData.cameraPassword.trim() || 'admin123',
              rtspUrl: formData.cameraRtspUrl.trim(),
              manufacturer: formData.cameraManufacturer || 'Hikvision',
              cameraModel: formData.cameraModel.trim() || 'Standard HD',
              streamType: formData.cameraType || 'RTSP Stream',
              humanDetection: formData.aiHumanDetection,
              zoneMonitoring: formData.aiZoneMonitoring,
              afterHoursSecurity: formData.aiAfterHoursSecurity,
              suspiciousMovement: formData.aiSuspiciousMovement,
              cameraHealth: formData.aiCameraHealth,
            }),
          });
        } catch (err) {
          console.warn('Auto camera provisioning note:', err);
        }
      }

      // 2. Submit customer details to Backend database
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const res = await fetch(`${API_URL}/api/customers/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: fullName,
          phone: formData.phone.trim(),
          company: formData.company.trim(),
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
          pincode: formData.pincode.trim(),
          plan: formData.plan,
          cameras: isFreePlan ? Number(formData.camerasCount) : (selectedPlanObj ? selectedPlanObj.maxCameras : 5),
          status: 'Active', // Setup is complete!
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStep(5); // Go to final success screen
      } else {
        setErrorMessage(data.message || 'Failed to complete registration setup. Please check your inputs.');
      }
    } catch (err) {
      setErrorMessage('Network connection error. Please ensure the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm">Configuring security nodes & profile databases...</p>
        </div>
      </div>
    );
  }

  // Stepper Header Rendering
  const stepsList = [
    { num: 1, label: 'Account Info' },
    { num: 2, label: 'Business Address' },
    { num: 3, label: 'Choose Plan' },
    { num: 4, label: isFreePlan ? 'Camera Setup' : 'Payment' },
    { num: 5, label: 'Complete' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-y-auto flex flex-col items-center justify-center py-6 px-4">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

      {/* Decorative Glow */}
      <div className="absolute top-0 w-[500px] h-[500px] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 w-[500px] h-[500px] rounded-full bg-brand-brown/5 blur-[120px] pointer-events-none"></div>

      {/* Centered Top Header Logo */}
      <div className="w-full max-w-4xl px-4 z-10 relative flex flex-col items-center justify-center my-auto">
        {/* Centered Logo */}
        <div className="flex flex-col items-center gap-1 mb-3">
          <img src="/logo.png" alt="CoreWatch" className="h-10 w-auto object-contain" />
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Create Account</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Step {step} of 5</p>
        </div>

        {/* Stepper Horizontal Progress Bar */}
        <div className="w-full max-w-2xl mb-6 flex items-center justify-between relative px-2">
          {/* Connector lines behind circles */}
          <div className="absolute left-6 right-6 top-4.5 h-0.5 bg-border -z-10"></div>
          <div 
            className="absolute left-6 top-4.5 h-0.5 bg-primary -z-10 transition-all duration-300"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          ></div>

          {stepsList.map((s) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div key={s.num} className="flex flex-col items-center space-y-1 select-none">
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-primary border-primary text-[#FAF6EE] shadow-md shadow-brand-gold/15'
                      : isActive
                        ? 'bg-primary border-primary text-[#FAF6EE] ring-4 ring-primary/20 font-extrabold scale-110'
                        : 'bg-card border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? '✓' : s.num}
                </div>
                <span className={`text-[8px] uppercase font-bold tracking-wider hidden sm:block ${
                  isActive ? 'text-primary font-extrabold' : isCompleted ? 'text-foreground/80' : 'text-muted-foreground/60'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Main Card */}
        <div className="w-full bg-card/65 border border-border rounded-xl p-4 md:p-5 shadow-xl backdrop-blur-xl">
          
          {/* Form Error Message */}
          {errorMessage && (
            <div className="mb-3 p-2 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive text-[10px] font-semibold flex items-center gap-2">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* WIZARD STEPS */}

          {/* STEP 1: Account Information */}
          {step === 1 && (
            <div className="space-y-3">
              <h2 className="text-xs md:text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-1 h-3 bg-primary rounded-full"></span>
                1. Account Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                      errors.firstName 
                        ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                      errors.lastName 
                        ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Work Email Address</label>
                  <input
                    type="email"
                    name="email"
                    disabled
                    value={formData.email}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-card/50 text-muted-foreground text-xs font-semibold focus:outline-none opacity-80 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Mobile Number *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                    className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                      errors.phone 
                        ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Company / Organization Name *</label>
                <input
                  type="text"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                    errors.company 
                      ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                      : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
                {errors.company && (
                  <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.company}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Address Information */}
          {step === 2 && (
            <div className="space-y-3">
              <h2 className="text-xs md:text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-1 h-3 bg-primary rounded-full"></span>
                2. Business Address
              </h2>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Address Line 1 *</label>
                <input
                  type="text"
                  name="addressLine1"
                  required
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="Enter street address, suite, unit"
                  className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                    errors.addressLine1 
                      ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                      : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
                {errors.addressLine1 && (
                  <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.addressLine1}</p>
                )}
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  placeholder="Apartment, building, floor etc."
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">City / Town *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                      errors.city 
                        ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  {errors.city && (
                    <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.city}</p>
                  )}
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">State / Region *</label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter state"
                    className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                      errors.state 
                        ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  {errors.state && (
                    <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.state}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Country *</label>
                  <input
                    type="text"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Enter country"
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">ZIP / Postal Code *</label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Enter postal code"
                    className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                      errors.pincode 
                        ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  {errors.pincode && (
                    <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.pincode}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Choose Plan */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xs md:text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-1 h-3 bg-primary rounded-full"></span>
                3. Select Subscription Plan
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-xs text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading available plans...
                  </div>
                ) : (
                  plans.map((plan) => {
                    const isPlanFree = plan.monthlyPrice === 0 && plan.yearlyPrice === 0;
                    const isSelected = formData.plan === plan.name;

                    return (
                      <div 
                        key={plan._id}
                        onClick={() => setFormData({ ...formData, plan: plan.name })}
                        className={`relative flex flex-col rounded-2xl border transition-all duration-300 cursor-pointer bg-card/85 select-none ${
                          isSelected
                            ? isPlanFree
                              ? 'border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                              : 'border-primary shadow-md shadow-primary/10 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/40 shadow-sm'
                        }`}
                      >
                        {plan.isPopular && (
                          <div className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#FAF6EE] shadow-sm z-10">
                            <Sparkles className="h-2.5 w-2.5" />
                            Most Popular
                          </div>
                        )}
                        {isPlanFree && !plan.isPopular && (
                          <div className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#FAF6EE] shadow-sm z-10">
                            <Check className="h-2.5 w-2.5" />
                            Recommended
                          </div>
                        )}

                        {/* Card Header */}
                        <div className="p-4 pb-3 border-b border-border/80">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-foreground">{plan.name}</h3>
                            {/* Selected Indicator */}
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? isPlanFree
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'bg-primary border-primary text-[#FAF6EE]'
                                : 'border-muted-foreground/30 bg-transparent'
                            }`}>
                              {isSelected && <span className="text-[9px] font-bold">✓</span>}
                            </div>
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed min-h-[30px] line-clamp-2">
                            {plan.description}
                          </p>
                          <div className="mt-3 flex items-baseline text-foreground">
                            {isPlanFree ? (
                              <span className="text-xl font-black text-emerald-500">Free Trial</span>
                            ) : (
                              <>
                                <span className="text-2xl font-black text-foreground">${plan.monthlyPrice}</span>
                                <span className="ml-0.5 text-[10px] text-muted-foreground font-normal">/mo</span>
                                <span className="ml-2 text-[9px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded font-mono">
                                  ${plan.yearlyPrice}/yr
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 py-3 flex-1 flex flex-col space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>Camera Limit: <strong className="text-foreground">{plan.maxCameras} camera nodes</strong></span>
                            </div>
                            {(plan.trialDays ?? 0) > 0 && (
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span>Trial Period: <strong className="text-foreground">{plan.trialDays} days</strong></span>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-border/60" />

                          <div>
                            <div className="text-[8px] font-bold text-muted-foreground uppercase font-mono mb-1.5 tracking-wider">
                              Enabled AI Capabilities
                            </div>
                            <ul className="space-y-1.5">
                              {plan.features?.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-[10px] text-foreground/80">
                                  <span className="text-primary mt-0.5 bg-primary/10 p-0.5 rounded shrink-0">
                                    {getFeatureIcon(feature)}
                                  </span>
                                  <span className="line-clamp-1">{getFeatureLabel(feature)}</span>
                                </li>
                              ))}
                              {(!plan.features || plan.features.length === 0) && (
                                <li className="text-[10px] text-muted-foreground italic">No AI features enabled</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Camera Setup OR Payment Form (Conditional) */}
          {step === 4 && (
            <div className="space-y-3">
              
              {/* CONDITIONAL SUB-WIZARD A: CAMERA SETUP (DEMO PLAN) */}
              {isFreePlan ? (
                <div className="space-y-4">
                  {/* Sub-wizard Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
                    <div>
                      <h2 className="text-xs md:text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full"></span>
                        4. Setup Your First Camera (Free Demo)
                      </h2>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Configure your initial CCTV / RTSP video stream node with real-time AI computer vision security.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleQuickFillDemo}
                      className="self-start sm:self-auto px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Zap className="w-3 h-3" />
                      ⚡ Fill Sample Demo Stream
                    </button>
                  </div>

                  {/* SECTION 1: Camera Identification Card */}
                  <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-3">
                    <div className="flex items-center gap-2 text-foreground text-xs font-bold">
                      <Camera className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Camera Identity & Physical Placement</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Camera Name */}
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Camera Display Name *</label>
                        <input
                          type="text"
                          name="cameraName"
                          required
                          value={formData.cameraName}
                          onChange={handleChange}
                          placeholder="e.g. Main Entrance Gate CCTV"
                          className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                            errors.cameraName 
                              ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                              : 'border-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                          }`}
                        />
                        {errors.cameraName && (
                          <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.cameraName}</p>
                        )}
                      </div>

                      {/* Location Name */}
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Installation Area / Zone *</label>
                        <input
                          type="text"
                          name="cameraLocation"
                          required
                          value={formData.cameraLocation}
                          onChange={handleChange}
                          placeholder="e.g. Reception / Lobby / Warehouse"
                          className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                            errors.cameraLocation 
                              ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                              : 'border-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                          }`}
                        />
                        {errors.cameraLocation && (
                          <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.cameraLocation}</p>
                        )}
                      </div>

                      {/* Manufacturer */}
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Brand / Manufacturer</label>
                        <select
                          name="cameraManufacturer"
                          value={formData.cameraManufacturer}
                          onChange={handleChange}
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        >
                          <option value="Hikvision">Hikvision</option>
                          <option value="Dahua">Dahua</option>
                          <option value="Axis">Axis Communications</option>
                          <option value="CP Plus">CP Plus</option>
                          <option value="Uniview">Uniview</option>
                          <option value="Hanwha">Hanwha Techwin</option>
                          <option value="Other">Other / Generic ONVIF</option>
                        </select>
                      </div>

                      {/* Camera Model */}
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Hardware Model</label>
                        <input
                          type="text"
                          name="cameraModel"
                          value={formData.cameraModel}
                          onChange={handleChange}
                          placeholder="e.g. DS-2CD2043G2-I (Optional)"
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Network & Streaming Protocol Card */}
                  <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-foreground text-xs font-bold">
                        <Server className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Stream Protocol & Network Credentials</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                        Port 554 (RTSP)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Stream Protocol */}
                      <div className="space-y-0.5 sm:col-span-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Stream Protocol</label>
                        <select
                          name="cameraType"
                          value={formData.cameraType}
                          onChange={handleChange}
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        >
                          <option value="RTSP Stream">RTSP Network Stream (H.264/H.265)</option>
                          <option value="ONVIF Camera">ONVIF IP Network Camera</option>
                          <option value="HTTP / MJPEG Web Stream">HTTP / MJPEG Web Stream</option>
                          <option value="USB Camera">USB Direct Feed / Local Device</option>
                        </select>
                      </div>

                      {/* IP Address */}
                      <div className="space-y-0.5 sm:col-span-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Camera IP / Hostname *</label>
                        <input
                          type="text"
                          name="cameraIp"
                          required
                          value={formData.cameraIp}
                          onChange={handleChange}
                          placeholder="e.g. 192.168.1.108"
                          className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-mono font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                            errors.cameraIp 
                              ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                              : 'border-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                          }`}
                        />
                        {errors.cameraIp && (
                          <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.cameraIp}</p>
                        )}
                      </div>

                      {/* RTSP Port */}
                      <div className="space-y-0.5 sm:col-span-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">RTSP Port *</label>
                        <input
                          type="number"
                          name="cameraPort"
                          required
                          value={formData.cameraPort}
                          onChange={handleChange}
                          placeholder="554"
                          className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-mono font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                            errors.cameraPort 
                              ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                              : 'border-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                          }`}
                        />
                        {errors.cameraPort && (
                          <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.cameraPort}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Stream Username */}
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Stream Username</label>
                        <input
                          type="text"
                          name="cameraUsername"
                          value={formData.cameraUsername}
                          onChange={handleChange}
                          placeholder="e.g. admin"
                          className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>

                      {/* Stream Password */}
                      <div className="space-y-0.5">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Stream Password</label>
                        <div className="relative">
                          <input
                            type={showCamPassword ? "text" : "password"}
                            name="cameraPassword"
                            value={formData.cameraPassword}
                            onChange={handleChange}
                            placeholder="Enter RTSP camera password"
                            className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCamPassword(!showCamPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            {showCamPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* RTSP Stream URL with Auto-Build Helper */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Full RTSP Stream URI *</label>
                        <button
                          type="button"
                          onClick={handleAutoConstructRtsp}
                          className="text-[9px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          Auto-construct from credentials
                        </button>
                      </div>
                      <input
                        type="text"
                        name="cameraRtspUrl"
                        required
                        value={formData.cameraRtspUrl}
                        onChange={handleChange}
                        placeholder="rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101"
                        className={`w-full px-3 py-1.5 rounded-lg border bg-background text-foreground text-xs font-mono font-semibold placeholder:text-muted-foreground/60 focus:outline-none transition-all duration-200 ${
                          errors.cameraRtspUrl 
                            ? 'border-destructive focus:ring-1 focus:ring-destructive/30' 
                            : 'border-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                      />
                      {errors.cameraRtspUrl && (
                        <p className="text-[9px] text-destructive mt-0 font-semibold">{errors.cameraRtspUrl}</p>
                      )}
                    </div>

                    {/* Test Connection Action & Status */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40">
                      <div className="flex-1">
                        {camTestStatus && (
                          <div className={`p-2 rounded-md text-[10px] font-medium flex items-center gap-1.5 ${
                            camTestStatus.success 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' 
                              : 'bg-destructive/10 text-destructive border border-destructive/30'
                          }`}>
                            {camTestStatus.success ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{camTestStatus.message}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleTestCameraConnection}
                        disabled={isTestingCam}
                        className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
                      >
                        {isTestingCam ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                            <span>Verifying stream...</span>
                          </>
                        ) : (
                          <>
                            <Wifi className="w-3 h-3 text-emerald-500" />
                            <span>Test Connection</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* SECTION 3: AI Vision Sentinel Modules (Active AI Features) */}
                  <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-2.5">
                    <div className="flex items-center gap-2 text-foreground text-xs font-bold">
                      <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Active AI Vision Security Modules (Free Demo)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* Human Detection */}
                      <label className="flex items-start gap-2.5 p-2 rounded-lg border border-border/60 bg-background/50 hover:bg-background cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.aiHumanDetection}
                          onChange={(e) => setFormData({ ...formData, aiHumanDetection: e.target.checked })}
                          className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500 mt-0.5"
                        />
                        <div>
                          <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-emerald-500" />
                            Human & Intrusion Sentinel
                          </div>
                          <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                            Real-time person tracking and restricted access alerts.
                          </p>
                        </div>
                      </label>

                      {/* After-Hours Security */}
                      <label className="flex items-start gap-2.5 p-2 rounded-lg border border-border/60 bg-background/50 hover:bg-background cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.aiAfterHoursSecurity}
                          onChange={(e) => setFormData({ ...formData, aiAfterHoursSecurity: e.target.checked })}
                          className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500 mt-0.5"
                        />
                        <div>
                          <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-emerald-500" />
                            After-Hours Night Guard
                          </div>
                          <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                            Automated perimeter alerts outside business hours.
                          </p>
                        </div>
                      </label>

                      {/* Zone Monitoring */}
                      <label className="flex items-start gap-2.5 p-2 rounded-lg border border-border/60 bg-background/50 hover:bg-background cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.aiZoneMonitoring}
                          onChange={(e) => setFormData({ ...formData, aiZoneMonitoring: e.target.checked })}
                          className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500 mt-0.5"
                        />
                        <div>
                          <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-emerald-500" />
                            Virtual Zone Tripwire
                          </div>
                          <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                            Monitors virtual bounding polygons & checkout lines.
                          </p>
                        </div>
                      </label>

                      {/* Camera Health */}
                      <label className="flex items-start gap-2.5 p-2 rounded-lg border border-border/60 bg-background/50 hover:bg-background cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.aiCameraHealth}
                          onChange={(e) => setFormData({ ...formData, aiCameraHealth: e.target.checked })}
                          className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500 mt-0.5"
                        />
                        <div>
                          <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                            <Cpu className="w-3 h-3 text-emerald-500" />
                            Camera Health & Signal Monitor
                          </div>
                          <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                            Instant alert if camera is disconnected or tampered.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Provisioning Info Banner */}
                  <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-foreground text-[10px] leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Provisioning Note:</strong> Upon finalizing setup, a dedicated <strong>CAM-XXXXXX</strong> token key is created in your database and securely paired with your AI video analytics node.
                    </span>
                  </div>
                </div>
              ) : (
                // CONDITIONAL SUB-WIZARD B: RAZORPAY SECURE CHECKOUT (PAID PLANS)
                <div className="space-y-4">
                  {/* Header & Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
                    <div>
                      <h2 className="text-xs md:text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="w-1.5 h-3.5 bg-sky-500 rounded-full"></span>
                        4. Secure Checkout (Powered by Razorpay)
                      </h2>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Complete your subscription payment using Razorpay UPI, Cards, NetBanking, or Wallets.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/30 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>256-Bit SSL Encrypted</span>
                    </div>
                  </div>

                  {/* Billing Cycle Toggle */}
                  <div className="p-3 rounded-xl border border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide block">Select Billing Term</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">Choose your subscription frequency</p>
                    </div>

                    <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          billingCycle === 'monthly'
                            ? 'bg-primary text-[#FAF6EE] shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          billingCycle === 'yearly'
                            ? 'bg-primary text-[#FAF6EE] shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span>Yearly</span>
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-extrabold">
                          Save 20%
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Plan Details & Cost Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Left: Plan Summary Card */}
                    <div className="md:col-span-7 p-3.5 rounded-xl border border-border bg-card/60 space-y-3">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div>
                          <span className="text-[8px] uppercase font-mono font-bold text-primary tracking-wider">Chosen Subscription</span>
                          <h3 className="text-sm font-black text-foreground">{formData.plan}</h3>
                        </div>
                        <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                          {selectedPlanObj ? `${selectedPlanObj.maxCameras} Cameras Included` : "5 Cameras"}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Base Plan Price ({billingCycle})</span>
                          <span className="font-semibold text-foreground">
                            ₹{(selectedPlanObj 
                              ? (billingCycle === 'yearly' ? selectedPlanObj.yearlyPrice : selectedPlanObj.monthlyPrice) 
                              : (billingCycle === 'yearly' ? 14999 : 1499)
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>GST / Taxes (18%)</span>
                          <span className="font-semibold text-foreground">
                            ₹{Math.round((selectedPlanObj 
                              ? (billingCycle === 'yearly' ? selectedPlanObj.yearlyPrice : selectedPlanObj.monthlyPrice) 
                              : (billingCycle === 'yearly' ? 14999 : 1499)) * 0.18
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="border-t border-border/40 pt-2 flex items-center justify-between font-black text-xs text-foreground">
                          <span>Total Amount Payable</span>
                          <span className="text-sm text-primary">
                            ₹{(
                              (selectedPlanObj 
                                ? (billingCycle === 'yearly' ? selectedPlanObj.yearlyPrice : selectedPlanObj.monthlyPrice) 
                                : (billingCycle === 'yearly' ? 14999 : 1499)) +
                              Math.round((selectedPlanObj 
                                ? (billingCycle === 'yearly' ? selectedPlanObj.yearlyPrice : selectedPlanObj.monthlyPrice) 
                                : (billingCycle === 'yearly' ? 14999 : 1499)) * 0.18)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Included Features List */}
                      <div className="pt-2 border-t border-border/40">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase font-mono block mb-1.5">Package Inclusions</span>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-foreground/80 font-medium">
                          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Human Tracking</span>
                          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> After-Hours Sentinel</span>
                          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> WhatsApp Alerts</span>
                          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Priority Support</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Razorpay Checkout Terminal Card */}
                    <div className="md:col-span-5 p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-foreground text-xs font-bold mb-1">
                          <CreditCard className="w-4 h-4 text-sky-500" />
                          <span>Razorpay Payment Gateway</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Instant activation with official Razorpay checkout integration.
                        </p>

                        {/* Supported Payment Logos / Pills */}
                        <div className="mt-3 p-2 rounded-lg bg-background/70 border border-border space-y-1.5">
                          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">Supported Channels</span>
                          <div className="flex flex-wrap gap-1 text-[9px] font-bold text-foreground">
                            <span className="bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">UPI / QR</span>
                            <span className="bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">Cards</span>
                            <span className="bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">NetBanking</span>
                            <span className="bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">Wallets</span>
                            <span className="bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">EMI</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Action States */}
                      {!paymentSuccessData ? (
                        <div className="space-y-2 pt-2 border-t border-sky-500/20">
                          {/* Live Razorpay Popup Trigger */}
                          <button
                            type="button"
                            disabled={isProcessingPayment}
                            onClick={() => handleRazorpayPayment(false)}
                            className="w-full py-2.5 px-3 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                          >
                            {isProcessingPayment ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Opening Razorpay...</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Pay ₹{(
                                  (selectedPlanObj 
                                    ? (billingCycle === 'yearly' ? selectedPlanObj.yearlyPrice : selectedPlanObj.monthlyPrice) 
                                    : (billingCycle === 'yearly' ? 14999 : 1499)) +
                                  Math.round((selectedPlanObj 
                                    ? (billingCycle === 'yearly' ? selectedPlanObj.yearlyPrice : selectedPlanObj.monthlyPrice) 
                                    : (billingCycle === 'yearly' ? 14999 : 1499)) * 0.18)
                                ).toLocaleString()} with Razorpay</span>
                              </>
                            )}
                          </button>

                          {/* 1-Click Instant Demo Sandbox Payment */}
                          <button
                            type="button"
                            disabled={isProcessingPayment}
                            onClick={() => handleRazorpayPayment(true)}
                            className="w-full py-1.5 px-2.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                          >
                            <Zap className="w-3 h-3" />
                            <span>⚡ 1-Click Razorpay Demo Sandbox Payment</span>
                          </button>
                        </div>
                      ) : (
                        /* Payment Completed State */
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                          <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Payment Verified Successfully!</span>
                          </div>
                          <div className="text-[10px] space-y-0.5 text-foreground/80 font-mono">
                            <div>Payment ID: <strong className="text-foreground">{paymentSuccessData.paymentId}</strong></div>
                            <div>Invoice: <strong className="text-foreground">{paymentSuccessData.invoiceNumber}</strong></div>
                            <div>Amount: <strong className="text-emerald-500">₹{paymentSuccessData.amount.toLocaleString()}</strong></div>
                          </div>
                          <div className="text-[9px] text-muted-foreground pt-1">
                            ✓ Your subscription is active. Click <strong>"Complete Setup"</strong> below to enter your dashboard.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Success & Redirect countdown */}
          {step === 5 && (
            <div className="py-2 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold shadow-lg shadow-emerald-500/10 animate-bounce">
                ✓
              </div>
              
              <div className="space-y-0.5">
                <h2 className="text-lg font-black text-foreground tracking-tight">Account Activated!</h2>
                <p className="text-[10px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Congratulations, your CoreWatch profile is active. Your compute nodes have been provisioned and your streams are ready for safety check logs.
                </p>
              </div>

              <div className="max-w-xs mx-auto p-2 rounded-lg border border-border bg-background font-mono text-[10px] text-primary flex justify-between items-center">
                <span>REDIRECTING SECURELY:</span>
                <span className="font-bold font-black text-sm animate-pulse">{countdown}s</span>
              </div>

              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}

        </div>

        {/* Action Buttons Row - outside the card */}
        {step < 5 && (
          <div className="w-full mt-3 flex gap-3 select-none">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={isSubmitting}
                className="w-1/3 md:w-1/4 py-2 rounded-lg border border-border bg-card text-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                Back
              </button>
            )}
            
            {step === 4 ? (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-2 rounded-lg text-[#FAF6EE] text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                  isFreePlan
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10'
                    : 'bg-primary hover:bg-brand-gold-light shadow-primary/10'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Activating...</span>
                  </>
                ) : (
                  <span>Complete Registration</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 py-2 rounded-lg bg-primary hover:bg-brand-gold-light text-[#FAF6EE] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-md flex items-center justify-center"
              >
                Next
              </button>
            )}
          </div>
        )}

        {/* Footnote Redirect - below buttons */}
        {step < 5 && (
          <p className="text-center text-[10px] text-muted-foreground mt-3">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-primary hover:underline transition-colors">
              Login
            </Link>
          </p>
        )}

      </div>
    </div>
  );
}
