'use client';

import React, { useState, useEffect, useRef } from 'react';
import CoreWatchLogo from '../components/common/CoreWatchLogo';

// Interfaces for Capability and Industry data structures
interface Capability {
  id: string;
  title: string;
  description: string;
  camFeedName: string;
  badge: string;
  simOverlay: React.ReactNode;
}

interface Industry {
  name: string;
  tagline: string;
  features: string[];
  cta: string;
}

export default function CoreWatchLandingPage() {
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Interactive Capabilities Grid state
  const [activeCapability, setActiveCapability] = useState<number>(0);
  
  // Interactive Industries tab state
  const [activeIndustry, setActiveIndustry] = useState<number>(0);
  
  // FAQ accordion active states
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true, // Default first FAQ open
  });
  
  // Live Event Log state (generated dynamically to simulate camera analytics)
  const [logs, setLogs] = useState<string[]>([
    'COREWATCH LIVE: System initiated. 4 cameras online.',
    'CAM 01 (Restricted Zone): Scanning perimeter...',
    'CAM 02 (Loading Bay): Normal operations.'
  ]);
  
  // Form submission state
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    industry: 'Manufacturing',
    cameras: '',
    goals: ''
  });

  // Track page scroll for navbar shadow/blur
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Detect theme class on <html> on mount
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme toggle handler
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

  // Add random logs to live stream console to feel alive
  useEffect(() => {
    const logPool = [
      'CAM 01 (Entrance): Face recognition verified - Staff #1209',
      'CAM 03 (Fabrication Area): PPE Warning - No helmet detected',
      'CAM 02 (Warehouse): Restricted area intrusion detected - Raised Alert',
      'CAM 04 (Lobby): Crowd density threshold reached (12 people/zone)',
      'CAM 03 (Fabrication Area): Helmet check passed - Worker safe',
      'CAM 02 (Warehouse): Forklift proximity alert triggered',
      'CAM 01 (Entrance): Unknown visitor flagged',
      'CAM 04 (Lobby): Space occupancy cleared.'
    ];

    const interval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
      setLogs((prev) => [`[${timestamp}] ${randomLog}`, ...prev.slice(0, 7)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Form submission handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email) return;
    
    setIsSubmitting(true);
    // Simulate API request to backend
    setTimeout(() => {
      setIsSubmitting(false);
      setFormSubmitted(true);
    }, 1500);
  };

  // Mock overlays for the Live Camera Simulator based on Selected Capability
  const capabilities: Capability[] = [
    {
      id: 'ppe',
      title: 'PPE & helmet detection',
      description: 'Spot missing helmets, vests or safety gear in operational areas in real time.',
      camFeedName: 'CAM 03 - WELDING FLOOR',
      badge: 'SAFETY COMPLIANCE',
      simOverlay: (
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none font-mono">
          {/* Top Camera HUD */}
          <div className="flex justify-between items-start text-xs text-emerald-400 bg-zinc-950/60 p-2 rounded backdrop-blur-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-red-600 rounded-full animate-ping mr-2"></span>
              REC: LIVE FEED
            </div>
            <div>FPS: 30 · LATENCY: 24ms</div>
          </div>
          {/* Visual Bounding Boxes */}
          <div className="relative flex-1 flex items-center justify-around">
            {/* Safe Worker */}
            <div className="relative group border border-emerald-500 bg-emerald-500/10 p-3 rounded text-center text-xs text-white max-w-[120px]">
              <div className="absolute -top-6 left-0 bg-emerald-500 text-zinc-950 text-[10px] px-1 font-bold rounded">
                HELMET: OK (98%)
              </div>
              <div className="absolute -bottom-6 left-0 bg-emerald-500 text-zinc-950 text-[10px] px-1 font-bold rounded">
                VEST: OK (94%)
              </div>
              <svg className="w-12 h-12 mx-auto text-emerald-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Worker #04</span>
            </div>
            {/* Unsafe Worker */}
            <div className="relative group border border-red-500 bg-red-500/10 p-3 rounded text-center text-xs text-white max-w-[120px] animate-pulse">
              <div className="absolute -top-6 left-0 bg-red-600 text-white text-[10px] px-1.5 py-0.5 font-bold rounded animate-bounce">
                NO HELMET! (99%)
              </div>
              <div className="absolute -bottom-6 left-0 bg-emerald-500 text-zinc-950 text-[10px] px-1 font-bold rounded">
                VEST: OK (91%)
              </div>
              <svg className="w-12 h-12 mx-auto text-red-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-red-300">Worker #07</span>
            </div>
          </div>
          {/* Footer warning bar */}
          <div className="bg-red-950/80 border border-red-800 text-red-200 text-xs px-3 py-2 rounded flex justify-between items-center">
            <span>ALERT [12:43:08]: Safety compliance violation at Sector 4.</span>
            <span className="font-bold underline">Clip Sent to Supervisor</span>
          </div>
        </div>
      )
    },
    {
      id: 'intrusion',
      title: 'Restricted area intrusion',
      description: 'Instant alerts when someone enters a no-entry or unauthorised zone.',
      camFeedName: 'CAM 02 - PERIMETER WALL B',
      badge: 'SECURITY SECURITY',
      simOverlay: (
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none font-mono">
          <div className="flex justify-between items-start text-xs text-orange-400 bg-zinc-950/60 p-2 rounded backdrop-blur-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping mr-2"></span>
              ACTIVE MONITORING - SECURE ZONE
            </div>
            <div>CAM 02 B</div>
          </div>
          {/* Intrusion Area Highlight & Bounding Box */}
          <div className="relative flex-1">
            {/* Poly Zone */}
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-dashed border-red-500 bg-red-500/5 flex items-center justify-center">
              <span className="text-red-500 text-[10px] tracking-widest font-bold">RESTRICTED ZONE ALPHA</span>
            </div>
            {/* Intruder */}
            <div className="absolute bottom-1/3 left-1/3 border border-red-500 bg-red-500/20 p-2 rounded text-xs text-white animate-bounce">
              <div className="absolute -top-6 left-0 bg-red-600 text-white text-[9px] px-1 font-bold rounded">
                INTRUDER DETECTED (97%)
              </div>
              <svg className="w-8 h-8 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="bg-red-950/80 border border-red-800 text-red-200 text-xs px-3 py-2 rounded flex justify-between items-center">
            <span>INTRUSION WARNING: Perimeter breach detected at fence B-3.</span>
            <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] animate-pulse">SIREN ACTIVE</span>
          </div>
        </div>
      )
    },
    {
      id: 'compliance',
      title: 'Zone compliance',
      description: 'Know when a worker leaves a workstation or a monitored area stays unattended.',
      camFeedName: 'CAM 05 - ASSEMBLY LINE 2',
      badge: 'OPERATIONS',
      simOverlay: (
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none font-mono">
          <div className="flex justify-between items-start text-xs text-emerald-400 bg-zinc-950/60 p-2 rounded backdrop-blur-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2"></span>
              COMPLIANCE LOGGING ACTIVE
            </div>
            <div>KPI MEASUREMENT</div>
          </div>
          <div className="relative flex-1 flex justify-around items-center">
            <div className="border border-emerald-500 bg-emerald-500/10 p-3 rounded text-center text-xs text-white">
              <div className="bg-emerald-500 text-zinc-950 text-[10px] px-1 font-bold rounded mb-1">STATION 1: FILLED</div>
              <span className="text-emerald-300">Dwell Time: 02h 45m</span>
            </div>
            <div className="border border-yellow-500 bg-yellow-500/10 p-3 rounded text-center text-xs text-white animate-pulse">
              <div className="bg-yellow-500 text-zinc-950 text-[10px] px-1 font-bold rounded mb-1">STATION 2: UNATTENDED</div>
              <span className="text-yellow-200">Idle Alert: 18m 10s</span>
            </div>
          </div>
          <div className="bg-zinc-900/95 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded">
            <span>Station 2 has exceeded unattended policy of 15 minutes. Alert logged.</span>
          </div>
        </div>
      )
    },
    {
      id: 'face',
      title: 'Face recognition',
      description: 'Recognise known staff or flag unknown faces at entries and sensitive areas.',
      camFeedName: 'CAM 01 - LOBBY RECEPTION',
      badge: 'ACCESS CONTROL',
      simOverlay: (
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none font-mono">
          <div className="flex justify-between items-start text-xs text-blue-400 bg-zinc-950/60 p-2 rounded backdrop-blur-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full mr-2"></span>
              FACIAL RECOGNITION DATABASE ON
            </div>
            <div>VERIFIED LIST</div>
          </div>
          <div className="relative flex-1 flex items-center justify-around">
            <div className="border border-emerald-500 bg-emerald-500/15 p-2 rounded text-center text-xs text-white">
              <div className="bg-emerald-500 text-zinc-950 text-[10px] px-1 font-bold rounded mb-1">STAFF #021 (Rohan M.)</div>
              <div className="w-16 h-16 border-2 border-emerald-400 rounded-full mx-auto my-1 flex items-center justify-center bg-zinc-800">
                <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[10px]">Access Level: ALL</span>
            </div>
            <div className="border border-orange-500 bg-orange-500/15 p-2 rounded text-center text-xs text-white animate-pulse">
              <div className="bg-orange-500 text-zinc-950 text-[10px] px-1 font-bold rounded mb-1">UNKNOWN VISITOR</div>
              <div className="w-16 h-16 border-2 border-orange-400 rounded-full mx-auto my-1 flex items-center justify-center bg-zinc-800">
                <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8v4" />
                </svg>
              </div>
              <span className="text-orange-300 text-[10px]">Sec Audit Triggered</span>
            </div>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-700 text-zinc-300 text-xs px-2 py-1.5 rounded flex justify-between">
            <span>Database matching success rate: 99.4%</span>
            <span className="text-emerald-400">Log Synced</span>
          </div>
        </div>
      )
    },
    {
      id: 'crowding',
      title: 'Crowding & occupancy',
      description: 'Detect overcrowding or count people in any zone in real time.',
      camFeedName: 'CAM 04 - DISPATCH STAGING',
      badge: 'DENSITY & COUNTING',
      simOverlay: (
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none font-mono">
          <div className="flex justify-between items-start text-xs text-yellow-400 bg-zinc-950/60 p-2 rounded backdrop-blur-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-yellow-500 rounded-full mr-2"></span>
              STAGING ZONE CAP MEASURE
            </div>
            <div>COUNT: 14 PEOPLE</div>
          </div>
          <div className="relative flex-1 flex flex-col justify-center items-center">
            <div className="bg-yellow-950/70 border border-yellow-700 px-4 py-3 rounded text-center text-white max-w-sm">
              <span className="text-xs uppercase tracking-wider text-yellow-400 block font-bold mb-1">CROWDING THRESHOLD WARN</span>
              <p className="text-xs text-yellow-200">Zone Limit: 10 people. Active occupancy exceeds policy by 40%.</p>
              <div className="mt-2 text-xl font-black text-yellow-400">14 / 10</div>
            </div>
          </div>
          <div className="bg-zinc-900/95 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded">
            <span>Alert dispatched: \"Dispatch Loading Area overcrowding flagged\"</span>
          </div>
        </div>
      )
    },
    {
      id: 'fire',
      title: 'Fire & smoke detection',
      description: 'Early visual warning of fire or smoke, before physical sensors spread it.',
      camFeedName: 'CAM 06 - STORAGE WAREHOUSE C',
      badge: 'CRITICAL HAZARD',
      simOverlay: (
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none font-mono">
          <div className="flex justify-between items-start text-xs text-red-500 bg-zinc-950/60 p-2 rounded backdrop-blur-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-red-600 rounded-full animate-ping mr-2"></span>
              THERMAL / OPTICAL ANALYTICS ACTIVE
            </div>
            <div>HAZARD CHECK</div>
          </div>
          <div className="relative flex-1">
            {/* Simulated Hotspot */}
            <div className="absolute top-1/3 right-1/4 border-2 border-red-600 bg-red-600/30 p-4 rounded text-center text-white animate-pulse">
              <div className="bg-red-600 text-white font-black text-[11px] px-2 py-0.5 rounded animate-bounce">
                CRITICAL WARNING: SMOKE DETECTED
              </div>
              <span className="text-xs text-red-100">CONFIDENCE: 92%</span>
            </div>
          </div>
          <div className="bg-red-950 text-white border border-red-700 text-xs px-3 py-2 rounded flex justify-between items-center animate-pulse">
            <span className="font-bold">🚨 EMERGENCY BROADCAST: Fire/Smoke signature at Zone C-2.</span>
            <span className="bg-white text-red-950 font-black px-2 py-0.5 rounded text-[10px]">SMS & SIREN TRIPPED</span>
          </div>
        </div>
      )
    },
    {
      id: 'vehicle',
      title: 'Vehicle & ANPR',
      description: 'Read number plates and flag vehicles entering pedestrian or restricted zones.',
      camFeedName: 'CAM 08 - NORTH INBOUND DOCK',
      badge: 'VEHICLE LOGISTICS',
      simOverlay: (
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none font-mono">
          <div className="flex justify-between items-start text-xs text-blue-400 bg-zinc-950/60 p-2 rounded backdrop-blur-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full mr-2"></span>
              AUTOMATIC NUMBER PLATE RECOGNITION (ANPR)
            </div>
            <div>CAM 08 GATE</div>
          </div>
          <div className="relative flex-1 flex flex-col justify-center items-end pr-10">
            <div className="border border-blue-500 bg-blue-500/10 p-3 rounded text-left text-xs text-white w-48">
              <div className="bg-blue-600 text-white text-[9px] px-1 font-bold rounded mb-1">VEHICLE DETECTED</div>
              <div className="border border-zinc-700 bg-black/60 p-1.5 font-bold text-center tracking-widest text-sm text-yellow-300 rounded mb-1.5">
                HR 26 DM 8794
              </div>
              <div className="text-[10px] space-y-0.5">
                <p>Type: Commercial Truck</p>
                <p className="text-emerald-400">Database match: Approved Carrier</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded">
            <span>Gate 4 opened for HR-26-DM-8794. Automated entry logged.</span>
          </div>
        </div>
      )
    },
    {
      id: 'people_counting',
      title: 'People counting',
      description: 'Count visitors, measure footfall, occupancy and dwell time.',
      camFeedName: 'CAM 07 - MAIN SHOWROOM LOBBY',
      badge: 'FOOTFALL TELEMETRY',
      simOverlay: (
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none font-mono">
          <div className="flex justify-between items-start text-xs text-emerald-400 bg-zinc-950/60 p-2 rounded backdrop-blur-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2"></span>
              REALTIME FOOTFALL STREAMING
            </div>
            <div>METRIC HUB</div>
          </div>
          <div className="relative flex-1 flex justify-around items-center">
            <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded text-center w-28">
              <span className="text-[10px] text-zinc-400 uppercase">Total In</span>
              <div className="text-2xl font-black text-emerald-400">1,489</div>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded text-center w-28">
              <span className="text-[10px] text-zinc-400 uppercase">Total Out</span>
              <div className="text-2xl font-black text-zinc-300">1,345</div>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded text-center w-28">
              <span className="text-[10px] text-zinc-400 uppercase">Current Inside</span>
              <div className="text-2xl font-black text-emerald-500">144</div>
            </div>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded">
            <span>Hourly conversion rate estimate: 34.2%</span>
          </div>
        </div>
      )
    },
    {
      id: 'dwell',
      title: 'Footfall & dwell',
      description: 'Measure where people spend time to optimise layout and service.',
      camFeedName: 'CAM 09 - RETAIL ZONE B',
      badge: 'MARKETING INSIGHTS',
      simOverlay: (
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none font-mono">
          <div className="flex justify-between items-start text-xs text-purple-400 bg-zinc-950/60 p-2 rounded backdrop-blur-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-purple-500 rounded-full mr-2"></span>
              ZONE ENGAGEMENT MEASURE
            </div>
            <div>DWELL TIMER</div>
          </div>
          <div className="relative flex-1 flex justify-around items-center">
            <div className="border border-purple-500 bg-purple-500/10 p-2 rounded text-center text-xs text-white">
              <div className="bg-purple-600 text-white text-[9px] px-1 font-bold rounded">COSMETICS RACK A</div>
              <p className="mt-1 font-bold">Avg Dwell: 4m 12s</p>
              <span className="text-[10px] text-purple-300">Traffic: High</span>
            </div>
            <div className="border border-zinc-500 bg-zinc-500/10 p-2 rounded text-center text-xs text-white">
              <div className="bg-zinc-600 text-white text-[9px] px-1 font-bold rounded">PROMO AISLE 2</div>
              <p className="mt-1 font-bold">Avg Dwell: 42s</p>
              <span className="text-[10px] text-zinc-400">Traffic: Low</span>
            </div>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded">
            <span>Optimization Suggestion: Re-route layout to direct traffic to Aisle 2.</span>
          </div>
        </div>
      )
    },
    {
      id: 'phone',
      title: 'Phone & distraction',
      description: 'Detect phone use in zones where focus or safety policy requires it.',
      camFeedName: 'CAM 10 - CASHIER / PACKING STATION',
      badge: 'PRODUCTIVITY & FOCUS',
      simOverlay: (
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none font-mono">
          <div className="flex justify-between items-start text-xs text-red-400 bg-zinc-950/60 p-2 rounded backdrop-blur-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full animate-ping mr-2"></span>
              POLICY ENFORCEMENT MONITORING
            </div>
            <div>CAM 10 FEED</div>
          </div>
          <div className="relative flex-1 flex justify-center items-center">
            <div className="border border-red-500 bg-red-500/25 p-3 rounded text-center text-xs text-white animate-pulse">
              <div className="bg-red-600 text-white text-[10px] px-2 py-0.5 font-bold rounded animate-bounce mb-2">
                MOBILE DISTRACTION DETECTED
              </div>
              <p className="font-bold">Operator Station 03</p>
              <span className="text-red-200">Duration: 45s consecutive use</span>
            </div>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded">
            <span>Alert pushed to supervisor dashboard (Operational Distraction Policy).</span>
          </div>
        </div>
      )
    },
    {
      id: 'attendance',
      title: 'Attendance tracking',
      description: 'Face-based check-in and check-out reports for your team.',
      camFeedName: 'CAM 01 - ENTRY GATE G1',
      badge: 'HR / COMPLIANCE',
      simOverlay: (
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none font-mono">
          <div className="flex justify-between items-start text-xs text-emerald-400 bg-zinc-950/60 p-2 rounded backdrop-blur-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2"></span>
              BIOMETRIC ATTENDANCE STREAMING
            </div>
            <div>CAM 01 GATE</div>
          </div>
          <div className="relative flex-1 flex items-center justify-around">
            <div className="border border-emerald-500 bg-emerald-500/10 p-3 rounded text-center text-xs text-white">
              <div className="bg-emerald-500 text-zinc-950 text-[9px] px-1 font-bold rounded">CHECK-IN DETECTED</div>
              <p className="mt-1 font-black text-emerald-400">Amit Sharma</p>
              <span className="text-[10px] text-zinc-300">Time: 08:58:12 AM</span>
              <span className="block text-[9px] text-emerald-300 font-bold mt-1">STATUS: PRESENT (ON TIME)</span>
            </div>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded">
            <span>Attendance spreadsheet auto-updated. 89 personnel clocked in.</span>
          </div>
        </div>
      )
    },
    {
      id: 'custom',
      title: 'Custom detections',
      description: 'Have a specific need? We configure detections custom to your environment.',
      camFeedName: 'CAM 12 - CLIENT CUSTOM MODULE',
      badge: 'ON-DEMAND AI',
      simOverlay: (
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none font-mono">
          <div className="flex justify-between items-start text-xs text-purple-400 bg-zinc-950/60 p-2 rounded backdrop-blur-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-purple-500 rounded-full mr-2"></span>
              CUSTOM CLASSIFICATION TRAINED MODEL
            </div>
            <div>SANDBOX ACTIVE</div>
          </div>
          <div className="relative flex-1 flex flex-col justify-center items-center">
            <div className="border border-purple-500 bg-purple-500/10 p-3 rounded text-center text-xs text-white">
              <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 font-bold rounded mb-2">
                CUSTOM TRIGGER ALIGNED
              </div>
              <p className="text-zinc-200 font-bold text-xs">Define your own triggers:</p>
              <p className="text-purple-300 text-[11px] mt-1">Spill detection · Box stacking height · Conveyor blockages</p>
            </div>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded">
            <span>Talk to our engineers to deploy custom logic models in days.</span>
          </div>
        </div>
      )
    }
  ];

  // Industry sectors with custom metrics & feature subsets
  const industries: Industry[] = [
    {
      name: 'Manufacturing',
      tagline: 'Secure high-risk machinery, track worker compliance, and prevent operational disruptions.',
      features: [
        'Worker zone compliance (workstation occupancy monitoring)',
        'PPE & helmet checks in heavy machinery bays',
        'Machine-area safety bounding zones to prevent proximity accidents',
        'Restricted hazard zones entry visual alarm triggers',
        'Early visual fire & smoke alerts before traditional sprinklers register'
      ],
      cta: 'Explore Manufacturing'
    },
    {
      name: 'Warehouse & Logistics',
      tagline: 'Enhance dockyard safety, monitor loading flows, and secure high-value inventory.',
      features: [
        'Forklift-pedestrian proximity safety warnings',
        'Loading bay queue monitoring & loading dwell times',
        'Restricted inventory zones and locked vault coverage',
        'Dock & gate commercial vehicle flow log reporting (ANPR)',
        'After-hours theft/intrusion active warnings'
      ],
      cta: 'Explore Warehouse & Logistics'
    },
    {
      name: 'Retail & Showrooms',
      tagline: 'Turn security cameras into visual sensors to analyze buyer behavior and store performance.',
      features: [
        'Footfall & dwell analytics across critical aisles',
        'Customer conversion insights & service engagement timers',
        'Staff presence & front-counter service readiness tracking',
        'Queue & checkout counter crowding threshold alarms',
        'After-hours security intrusion visual alerts'
      ],
      cta: 'Explore Retail & Showrooms'
    },
    {
      name: 'Healthcare',
      tagline: 'Protect sensitive storage facilities, assist patient safety, and manage flow compliance.',
      features: [
        'Restricted medication vault/pharmacy zone alarms',
        'Patient fall detection alerts in corridors & wards',
        'Pharmacy & high-value equipment vault security auditing',
        'Critical sector nursing staff coverage heatmaps',
        'Visitor flow monitoring and automated registration checks'
      ],
      cta: 'Explore Healthcare'
    },
    {
      name: 'Banking & Finance',
      tagline: 'Fully local network surveillance. Ensure ironclad security and regulatory compliance.',
      features: [
        'ATM lobby & main vault zone security audits',
        'Lobby intrusion and after-hours vault coverage',
        'Queue length and customer wait-time analytics',
        'Unknown-face alerting at sensitive server rooms/archives',
        'Compliance-ready full on-premise deployments (No footage leaving the network)'
      ],
      cta: 'Explore Banking & Finance'
    },
    {
      name: 'Construction',
      tagline: 'Enforce safety compliance dynamically across sprawling, dangerous workspaces.',
      features: [
        'Hard helmet & safety vest compliance checking on workers',
        'Unsafe restricted zone proximity safety alert triggers',
        'Heavy vehicle and operational crane perimeter security checks',
        'After-hours theft & inventory loss alerts via smart visual sensors',
        'Site crowding and shift-transition counts'
      ],
      cta: 'Explore Construction'
    },
    {
      name: 'Education',
      tagline: 'Keep campus perimeters safe and restrict unauthorized entrance to labs or dorms.',
      features: [
        'Campus perimeter wall intrusion alerting',
        'After-hours lobby & admin desk monitoring',
        'Restricted laboratories & archive rooms security',
        'Main entry gates crowding and bottleneck warning triggers',
        'School bus and campus visitor parking vehicle monitoring'
      ],
      cta: 'Explore Education'
    },
    {
      name: 'Hospitality',
      tagline: 'Keep customer zones peaceful and monitor back-of-house operations seamlessly.',
      features: [
        'Guest-area perimeter safety audits',
        'Reception & billing desk staff service delay flags',
        'Kitchen food prep safety & back-office storage coverage',
        'Lobby crowd density checking during peak check-in hours',
        'Valet parking lot vehicle logistics monitoring'
      ],
      cta: 'Explore Hospitality'
    },
    {
      name: 'Residential & Societies',
      tagline: 'Ensure peace of mind for residents. Automate boundary and parking security.',
      features: [
        'Boundary wall climbing perimeter intrusion warning clips',
        'Visitor check and resident vehicle license plate parsing (ANPR)',
        'Common-area playground & pool safety alarms after-hours',
        'Direct WhatsApp alerts to society security gate and estate managers',
        'Restricted electrical rooms access logs'
      ],
      cta: 'Explore Residential & Societies'
    }
  ];

  // FAQ contents
  const faqs = [
    {
      question: "Do we need to replace our existing CCTV cameras to run CoreWatch?",
      answer: "No, absolutely not. CoreWatch layers intelligent AI directly onto your existing security infrastructure. We connect to your existing CCTV or NVR (Network Video Recorder) over the local network via standard IP protocols (RTSP/ONVIF). There is zero rip-and-replace, meaning no expensive hardware purchases are required."
    },
    {
      question: "How does the full on-premise option ensure data privacy?",
      answer: "For security-sensitive industries like banking, healthcare, and corporate complexes, we deploy CoreWatch on local server hardware inside your private network. In this deployment mode, 100% of the video streams, analysis databases, and alerts stay strictly within your local environment. CoreWatch servers have zero outbound internet connections to outside servers, ensuring full compliance with DPDP data privacy acts."
    },
    {
      question: "What is the timeline for deployment?",
      answer: "CoreWatch can go live in days, not months. Once we have network access to your IP camera streams, we configure the detection models, tune the sensitivity levels for your environment, and hand over the active alerts dashboard to your team. Setup is managed completely by our field engineers."
    },
    {
      question: "How are the instant alerts delivered?",
      answer: "When a target event is triggered (e.g., worker leaves safety helmet off or vehicle enters pedestrian zone), CoreWatch generates an instant push notification with a brief 5-10 second video clip proving the event. This proof-clip alert is sent directly to your cloud dashboard, desktop control panels, or straight to target supervisor mobile phones via a WhatsApp message."
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark text-zinc-100 bg-zinc-950' : 'bg-zinc-50 text-zinc-900'} transition-colors duration-300 font-sans`}>
      
      {/* Dynamic Grid Background overlay for Dark Mode */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      {/* HEADER NAVBAR */}
      <header className={`sticky top-0 z-50 transition-all duration-300 border-b ${scrolled ? 'backdrop-blur-lg bg-brand-offwhite/95 dark:bg-brand-dark-navy/95 shadow-md border-brand-navy/10 dark:border-brand-navy/40' : 'bg-transparent border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <div className="relative">
              <CoreWatchLogo className="h-16 w-auto" />
              {/* Pulse Indicator */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 z-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold/75 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-gold border border-zinc-950"></span>
              </span>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-brand-navy dark:text-brand-offwhite">CoreWatch</span>
              <span className="block text-[9px] font-bold text-brand-gold tracking-widest uppercase">Live AI Analytics</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-brand-blue dark:hover:text-brand-gold transition-colors cursor-pointer">How it works</button>
            <button onClick={() => scrollToSection('capabilities')} className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-brand-blue dark:hover:text-brand-gold transition-colors cursor-pointer">Solutions</button>
            <button onClick={() => scrollToSection('industries')} className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-brand-blue dark:hover:text-brand-gold transition-colors cursor-pointer">Industries</button>
            <button onClick={() => scrollToSection('deployment')} className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-brand-blue dark:hover:text-brand-gold transition-colors cursor-pointer">Deployment</button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-brand-blue dark:hover:text-brand-gold transition-colors cursor-pointer">FAQ</button>
            <button onClick={() => scrollToSection('locations')} className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-brand-blue dark:hover:text-brand-gold transition-colors cursor-pointer">About</button>
            <button onClick={() => scrollToSection('talk-to-us')} className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-brand-blue dark:hover:text-brand-gold transition-colors cursor-pointer">Talk to us</button>
          </nav>

          {/* Theme Switcher & Main CTA */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              aria-label="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? (
                // Sun Icon
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707-.707M6.343 4.343l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
                </svg>
              ) : (
                // Moon Icon
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Login link */}
            <a 
              href="/login" 
              className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-brand-blue dark:hover:text-brand-gold transition-colors cursor-pointer mr-2"
            >
              Login
            </a>

            {/* Book A Demo button */}
            <button 
              onClick={() => scrollToSection('talk-to-us')} 
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-navy hover:bg-brand-dark-navy text-white hover:scale-[1.02] active:scale-98 transition-all shadow-md shadow-brand-navy/10 hover:shadow-brand-navy/20 cursor-pointer"
            >
              Book a demo
            </button>
          </div>

          {/* Mobile Menu Actions */}
          <div className="lg:hidden flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707-.707M6.343 4.343l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-50"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-brand-offwhite dark:bg-brand-dark-navy border-b border-brand-navy/10 dark:border-brand-navy/40 px-4 py-4 space-y-3 shadow-xl">
            <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left py-2 text-base font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">How it works</button>
            <button onClick={() => scrollToSection('capabilities')} className="block w-full text-left py-2 text-base font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">Solutions</button>
            <button onClick={() => scrollToSection('industries')} className="block w-full text-left py-2 text-base font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">Industries</button>
            <button onClick={() => scrollToSection('deployment')} className="block w-full text-left py-2 text-base font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">Deployment</button>
            <button onClick={() => scrollToSection('faq')} className="block w-full text-left py-2 text-base font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">FAQ</button>
            <button onClick={() => scrollToSection('locations')} className="block w-full text-left py-2 text-base font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">About</button>
            <button onClick={() => scrollToSection('talk-to-us')} className="block w-full text-left py-2 text-base font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">Talk to us</button>
            <a href="/login" className="block w-full text-left py-2 text-base font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer border-t border-zinc-150 dark:border-zinc-800 pt-3">Login</a>
            <button onClick={() => scrollToSection('talk-to-us')} className="block w-full py-2.5 text-center text-base font-bold bg-brand-blue text-white rounded-lg cursor-pointer">Book a demo</button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section id="hero" className="relative pt-12 pb-24 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Copy Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left z-10">
              
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/10 text-brand-navy dark:text-brand-light-gold text-xs font-semibold tracking-wider uppercase animate-fade-in mx-auto lg:mx-0">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse"></span>
                AI Video Analytics · Made in India
              </div>
              
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-brand-navy dark:text-brand-offwhite">
                Every camera,<br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-gold font-extrabold">an AI inspector.</span>
              </h1>
              
              {/* Subheading */}
              <p className="max-w-2xl text-base sm:text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed mx-auto lg:mx-0">
                CoreWatch turns the CCTV cameras you already own into intelligent, around-the-clock monitoring — for safety, security and operations. No new hardware. Alerts and proof clips, the moment something matters.
              </p>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <button 
                  onClick={() => scrollToSection('talk-to-us')} 
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-brand-gold to-brand-light-gold text-brand-navy hover:brightness-110 shadow-lg shadow-brand-gold/20 hover:shadow-brand-gold/30 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Book a demo 
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                
                <a 
                  href="https://wa.me/919871329295"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-white dark:bg-brand-navy border border-zinc-200 dark:border-brand-navy/60 text-zinc-800 dark:text-brand-offwhite hover:bg-zinc-50 dark:hover:bg-brand-navy/80 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp us
                </a>
              </div>

              {/* USP Badges Row */}
              <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                {[
                  { label: "Works with existing cameras", desc: "No camera replacements needed" },
                  { label: "On-premise option", desc: "100% video storage privacy" },
                  { label: "Rapid deployment", desc: "Live in days, not months" },
                  { label: "COREWATCH · LIVE", desc: "Continuous monitoring 24/7", pulse: true }
                ].map((item, idx) => (
                  <div key={idx} className="border border-zinc-200/50 dark:border-brand-navy/60 bg-white/65 dark:bg-brand-navy/60 p-3.5 rounded-xl backdrop-blur-sm flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-1">
                      {item.pulse && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold/75 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold"></span>
                        </span>
                      )}
                      <span className="text-[11px] font-black uppercase text-brand-navy dark:text-brand-offwhite tracking-wider leading-tight">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Live Camera Simulator Column */}
            <div className="lg:col-span-5 relative w-full max-w-md lg:max-w-none mx-auto">
              
              {/* Camera Stream Widget */}
              <div className="relative aspect-video w-full rounded-2xl bg-zinc-955 border border-zinc-800 shadow-2xl overflow-hidden group">
                {/* Background Camera Image Simulation via pure CSS grid patterns */}
                <div className="absolute inset-0 bg-radial-[circle_at_center,#111827_20%,#030712_85%] opacity-90"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff0005_1px,transparent_1px),linear-gradient(to_bottom,#00ff0005_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"></div>
                
                {/* Diagonal scanning line */}
                <div className="absolute left-0 right-0 h-0.5 bg-emerald-500/15 top-0 animate-[bounce_8s_infinite] pointer-events-none"></div>

                {/* Cam details tag */}
                <div className="absolute bottom-4 right-4 bg-zinc-900/90 text-[10px] font-mono text-zinc-400 px-2 py-1 rounded border border-zinc-800">
                  {capabilities[activeCapability].camFeedName}
                </div>

                {/* Display specific overlay */}
                {capabilities[activeCapability].simOverlay}
              </div>

              {/* Interactive Controller underneath */}
              <div className="mt-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    Simulated Event Log
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    Auto Refreshing
                  </span>
                </div>
                {/* Log Terminal Screen */}
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 h-28 overflow-y-auto font-mono text-[10px] leading-relaxed text-zinc-300 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
                  {logs.map((log, idx) => (
                    <div key={idx} className={log.includes('Alert') || log.includes('Warning') || log.includes('Intrusion') ? 'text-orange-400' : 'text-zinc-400'}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 md:py-28 border-t border-brand-navy/10 dark:border-brand-navy/40 bg-brand-offwhite/50 dark:bg-brand-navy/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Headers */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-black tracking-wider text-brand-gold uppercase">DEPLOYMENT LIFECYCLE</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-offwhite mt-2 mb-4">
              Live in days, not months
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              CoreWatch sits alongside your existing cameras and does the watching for you — so your team only sees what needs immediate attention.
            </p>
          </div>

          {/* Steps Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: "STEP 01",
                title: "Connect your cameras",
                description: "We connect to your existing CCTV or NVR over the local network. No rip-and-replace, no new camera hardware required.",
                icon: (
                  <svg className="w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              {
                step: "STEP 02",
                title: "AI watches 24/7",
                description: "Our AI analyses every feed continuously — detecting people, zones, objects and events you define, without fatigue or dropouts.",
                icon: (
                  <svg className="w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )
              },
              {
                step: "STEP 03",
                title: "Get instant alerts + proof",
                description: "The moment something matters, you get an alert with a short video clip as proof — on your dashboard, phone, or WhatsApp.",
                icon: (
                  <svg className="w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                )
              }
            ].map((stepObj, idx) => (
              <div key={idx} className="relative border border-zinc-200/60 dark:border-brand-navy/60 bg-white dark:bg-brand-navy/20 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                <div className="absolute -top-5 left-8 w-10 h-10 rounded-xl bg-brand-navy dark:bg-brand-offwhite text-white dark:text-brand-navy flex items-center justify-center font-mono text-xs font-black shadow-md">
                  {stepObj.icon}
                </div>
                <div className="mt-4 space-y-3">
                  <span className="text-[10px] font-black text-brand-gold tracking-widest block">
                    {stepObj.step}
                  </span>
                  <h3 className="text-xl font-bold text-brand-navy dark:text-brand-offwhite group-hover:text-brand-blue dark:group-hover:text-brand-gold transition-colors">
                    {stepObj.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {stepObj.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CAPABILITIES SECTION */}
      <section id="capabilities" className="py-20 md:py-28 border-t border-brand-navy/10 dark:border-brand-navy/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Headers */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-black tracking-wider text-brand-gold uppercase">Detection Catalog</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-offwhite mt-2 mb-4">
              One platform, many eyes
            </h2>
            <p className="text-zinc-505 dark:text-zinc-400">
              Mix and match the detections you need, per camera stream. Pay only for the specific use cases you activate. Click any capability to view its live bounding box telemetry simulation above.
            </p>
          </div>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, index) => {
              const isSelected = activeCapability === index;
              return (
                <div 
                  key={cap.id}
                  onClick={() => {
                    setActiveCapability(index);
                    // Scroll up to Hero preview container on mobile so user sees the change
                    if (window.innerWidth < 1024) {
                      scrollToSection('hero');
                    }
                  }}
                  className={`p-6 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                    isSelected 
                      ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 shadow-lg shadow-brand-blue/5' 
                      : 'border-zinc-200 dark:border-brand-navy/60 bg-white dark:bg-brand-navy/20 hover:border-brand-blue/60 dark:hover:border-brand-gold/60 hover:shadow-md'
                  }`}
                >
                  {/* Decorative background glow for selected card */}
                  {isSelected && (
                    <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-brand-blue/20 blur-xl"></div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded ${
                        isSelected 
                          ? 'bg-brand-blue/20 text-brand-blue dark:text-brand-light-blue' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}>
                        {cap.badge}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] text-brand-blue dark:text-brand-light-blue font-bold flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-blue animate-ping"></span>
                          Preview Active
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className={`text-lg font-bold transition-colors ${
                        isSelected ? 'text-brand-blue dark:text-brand-light-blue' : 'text-brand-navy dark:text-brand-offwhite'
                      }`}>
                        {cap.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                        {cap.description}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-blue dark:text-brand-light-blue group-hover:underline">
                      <span>Interactive Live Demo</span>
                      <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* INDUSTRIES SECTION */}
      <section id="industries" className="py-20 md:py-28 border-t border-zinc-200/50 dark:border-zinc-900 bg-zinc-100/40 dark:bg-zinc-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Sect          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-black tracking-wider text-brand-gold uppercase">Operational Scopes</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-offwhite mt-2 mb-4">
              Built for every space worth watching
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              From heavy industry factory floors to banking vault security doors — CoreWatch adapts to what each specific environment needs to see.
            </p>
          </div>

          {/* Interactive tabs layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Tab Triggers */}
            <div className="lg:col-span-4 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 pb-4 lg:pb-0 scrollbar-none border-b lg:border-b-0 lg:border-r border-zinc-200/60 dark:border-brand-navy/60">
              {industries.map((ind, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndustry(idx)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex items-center justify-between cursor-pointer ${
                    activeIndustry === idx 
                      ? 'bg-brand-navy dark:bg-brand-offwhite text-white dark:text-brand-navy font-bold shadow-md shadow-brand-navy/10' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-brand-navy/20'
                  }`}
                >
                  <span>{ind.name}</span>
                  <svg className={`w-4 h-4 hidden lg:inline transform transition-transform ${activeIndustry === idx ? 'translate-x-1 text-brand-gold' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8 bg-white dark:bg-brand-navy p-8 rounded-2xl border border-zinc-200/60 dark:border-brand-navy/60 shadow-md">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase text-brand-gold tracking-wider">Sector Specific Suite</span>
                  <h3 className="text-2xl font-bold text-brand-navy dark:text-brand-offwhite mt-1">
                    {industries[activeIndustry].name} Compliance
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 font-medium">
                    {industries[activeIndustry].tagline}
                  </p>
                </div>

                <div className="border-t border-zinc-200 dark:border-brand-navy/60 pt-6">
                  <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-4">ACTIVE DETECTION MODULES</h4>
                  <ul className="space-y-3.5">
                    {industries[activeIndustry].features.map((feat, fidx) => (
                      <li key={fidx} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                        <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-brand-blue/10 text-brand-blue dark:text-brand-light-blue flex items-center justify-center">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-brand-navy/60 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">Model customized for {industries[activeIndustry].name}</span>
                  <button 
                    onClick={() => scrollToSection('talk-to-us')} 
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-blue/10 text-brand-blue dark:text-brand-light-blue hover:bg-brand-blue/20 border border-brand-blue/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Request demo for {industries[activeIndustry].name}</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* WHY COREWATCH SECTION */}
      <section className="py-20 md:py-28 border-t border-zinc-200/50 dark:border-brand-navy/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Why grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Col Info */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-black tracking-wider text-brand-gold uppercase">Core Architecture</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-offwhite">
                Intelligence without compromise
              </h2>
              <p className="text-zinc-505 dark:text-zinc-400 leading-relaxed text-sm">
                Most security cameras only record footage. The recordings sit on a hard drive, only accessed after something has already gone wrong. CoreWatch changes that — it layers local neural computing onto your infrastructure to interpret every feed live, raising alarms before risks escalate.
              </p>
              
              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-1">
                  <div className="text-2xl font-black text-brand-navy dark:text-brand-offwhite">24/7</div>
                  <div className="text-[11px] font-black uppercase text-zinc-400 tracking-wider">Continuous checks</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-black text-brand-navy dark:text-brand-offwhite">9+</div>
                  <div className="text-[11px] font-black uppercase text-zinc-400 tracking-wider">Industries served</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-black text-brand-navy dark:text-brand-offwhite">12+</div>
                  <div className="text-[11px] font-black uppercase text-zinc-400 tracking-wider">Detections loaded</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-black text-brand-navy dark:text-brand-offwhite">100%</div>
                  <div className="text-[11px] font-black uppercase text-zinc-400 tracking-wider">On-premise option</div>
                </div>
              </div>
            </div>

            {/* Right Col Features Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: "Your data, your network",
                  desc: "Choose full on-premise deployment where video feeds never leave your premises — built specifically for banking, healthcare, and security-first organizations."
                },
                {
                  title: "Works with what you have",
                  desc: "No need to buy new hardware or replace existing IP cameras. CoreWatch easily hooks into your active CCTV and NVR network configurations."
                },
                {
                  title: "Pay per use case",
                  desc: "Turn on only the specific detections you need, camera by camera. Custom, transparent scaling fees that protect operational budgets."
                },
                {
                  title: "Deployed in days",
                  desc: "From initial validation to active alert clips in days. We manage setup, model optimization, and team onboarding complete."
                }
              ].map((card, idx) => (
                <div key={idx} className="border border-zinc-200 dark:border-brand-navy/60 bg-white dark:bg-brand-navy/20 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-base font-bold text-brand-navy dark:text-brand-offwhite mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-zinc-505 dark:text-zinc-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DEPLOYMENT OPTIONS SECTION */}
      <section id="deployment" className="py-20 md:py-28 border-t border-brand-navy/10 dark:border-brand-navy/40 bg-brand-offwhite/50 dark:bg-brand-navy/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Headers */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-black tracking-wider text-brand-gold uppercase">SURVEILLANCE HOOKS</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-offwhite mt-2 mb-4">
              Deploy on your terms
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Run CoreWatch the way your organization requires — convenient hybrid cloud or fully self-contained on-premise local networks.
            </p>
          </div>

          {/* Deployment Cards Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Hybrid Cloud */}
            <div className="border border-zinc-200 dark:border-brand-navy/60 bg-white dark:bg-brand-navy/20 p-8 rounded-2xl relative shadow-md">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">BEST FOR GENERAL COMMERCIAL</span>
                  <h3 className="text-2xl font-bold text-brand-navy dark:text-brand-offwhite mt-2">Hybrid Cloud</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">AI runs on-site, alert dashboards accessed from anywhere.</p>
                </div>
                
                <ul className="space-y-3.5 border-t border-zinc-100 dark:border-brand-navy/40 pt-6">
                  {[
                    "AI processing runs locally on-site for speed",
                    "Access dashboard from any mobile or desktop web browser",
                    "Only metadata alerts & short proof clips uploaded to cloud",
                    "Low bandwidth impact, no constant stream uploads",
                    "We fully manage updates and cloud dashboard uptime"
                  ].map((li, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                      <svg className="w-4 h-4 text-brand-blue mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Full On-Premise */}
            <div className="border border-brand-gold/40 bg-brand-gold/[0.02] dark:bg-brand-gold/[0.04] p-8 rounded-2xl relative shadow-lg">
              {/* Highlight badge */}
              <div className="absolute top-4 right-4 bg-brand-gold text-brand-navy text-[9px] font-black px-2 py-0.5 rounded tracking-wide">
                MAXIMUM PRIVACY
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold">FOR GOVT, BANKS, MEDICAL</span>
                  <h3 className="text-2xl font-bold text-brand-navy dark:text-brand-offwhite mt-2">Full On-Premise</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Everything runs strictly inside your local area network.</p>
                </div>
                
                <ul className="space-y-3.5 border-t border-zinc-200/50 dark:border-brand-navy/60 pt-6">
                  {[
                    "100% of video processing and analytics runs inside your LAN",
                    "Video feeds and user databases never leave your premises",
                    "CoreWatch engineers have zero inbound access to footage",
                    "Fully aligned with Indian DPDP Act requirements",
                    "Structured as a one-time perpetual license with annual support"
                  ].map((li, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                      <svg className="w-4 h-4 text-brand-blue mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 md:py-28 border-t border-brand-navy/10 dark:border-brand-navy/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* FAQ Intro Left */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-black tracking-wider text-brand-gold uppercase">Knowledge Base</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-offwhite">
                Questions, answered.
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                Everything you need to know about how CoreWatch integrates into your operational space. Have a different question? Speak with our Delhi NCR engineering desk directly.
              </p>
              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => scrollToSection('talk-to-us')} 
                  className="px-6 py-3 rounded-xl text-sm font-semibold bg-brand-navy hover:bg-brand-dark-navy text-white dark:bg-brand-offwhite dark:text-brand-navy hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-brand-navy/10"
                >
                  Book a free demo
                  <svg className="w-4 h-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Accordion List Right */}
            <div className="lg:col-span-7 space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = !!faqOpen[index];
                return (
                  <div 
                    key={index}
                    className="border border-zinc-200 dark:border-brand-navy/60 bg-white dark:bg-brand-navy/20 rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setFaqOpen((prev) => ({ ...prev, [index]: !isOpen }))}
                      className="w-full text-left px-6 py-4 flex justify-between items-center gap-4 hover:bg-zinc-50 dark:hover:bg-brand-navy/40 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-bold text-brand-navy dark:text-brand-offwhite">{faq.question}</span>
                      <svg className={`w-5 h-5 text-zinc-400 transform transition-transform ${isOpen ? 'rotate-180 text-brand-gold' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 text-xs text-zinc-505 dark:text-zinc-450 leading-relaxed border-t border-zinc-150 dark:border-brand-navy/40 pt-4 bg-zinc-50/50 dark:bg-brand-navy/10 font-medium">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </section>

      {/* DYNAMIC CONTACT FORM & TALK TO US */}
      <section id="talk-to-us" className="py-20 md:py-28 border-t border-brand-navy/10 dark:border-brand-navy/40 bg-brand-offwhite/50 dark:bg-brand-navy/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Contact Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-black tracking-wider text-brand-gold uppercase">Consulting desk</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-navy dark:text-brand-offwhite">
                Let's talk.
              </h2>
              <p className="text-zinc-505 dark:text-zinc-400 text-sm leading-relaxed">
                Tell us about your space, operational risks, or compliance mandates. We will set up a customized proof-of-concept feed using your cameras to demonstrate exact detection outputs.
              </p>

              {/* Call/Social items */}
              <div className="space-y-4 pt-4">
                
                {/* WhatsApp */}
                <a href="https://wa.me/919871329295" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-brand-navy/60 bg-white dark:bg-brand-navy/20 hover:border-brand-blue/40 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">WhatsApp chat</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">+91 98713 29295</span>
                  </div>
                </a>

                {/* Email */}
                <a href="mailto:info@corewatch.ai" className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-brand-navy/60 bg-white dark:bg-brand-navy/20 hover:border-brand-blue/40 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-50/10 text-brand-blue dark:text-brand-light-blue flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Sales & Queries</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200 font-mono">info@corewatch.ai</span>
                  </div>
                </a>

                {/* Direct Line */}
                <a href="tel:+919871329295" className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-brand-navy/60 bg-white dark:bg-brand-navy/20 hover:border-brand-blue/40 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-purple-50/10 text-purple-650 dark:text-purple-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Call Directly</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">+91-9871329295</span>
                  </div>
                </a>

              </div>
            </div>

            {/* Right Booking Form Column */}
            <div className="lg:col-span-7 bg-white dark:bg-brand-navy p-8 rounded-2xl border border-zinc-200/60 dark:border-brand-navy/60 shadow-lg">
              
              {!formSubmitted ? (
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400" htmlFor="form-name">Name</label>
                      <input 
                        id="form-name"
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-brand-navy/60 bg-zinc-50 dark:bg-brand-dark-navy text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm focus:outline-none focus:bg-white dark:focus:bg-brand-dark-navy focus:border-brand-blue dark:focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400" htmlFor="form-company">Company</label>
                      <input 
                        id="form-company"
                        type="text" 
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Company name"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-brand-navy/60 bg-zinc-50 dark:bg-brand-dark-navy text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm focus:outline-none focus:bg-white dark:focus:bg-brand-dark-navy focus:border-brand-blue dark:focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400" htmlFor="form-phone">Phone / WhatsApp</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-zinc-200 dark:border-brand-navy/60 bg-zinc-100 dark:bg-brand-navy text-zinc-500 dark:text-zinc-400 text-sm font-bold">
                          +91
                        </span>
                        <input 
                          id="form-phone"
                          type="tel" 
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="98765 43210"
                          className="w-full px-4 py-3 rounded-r-xl border border-zinc-200 dark:border-brand-navy/60 bg-zinc-50 dark:bg-brand-dark-navy text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm focus:outline-none focus:bg-white dark:focus:bg-brand-dark-navy focus:border-brand-blue dark:focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400" htmlFor="form-email">Email</label>
                      <input 
                        id="form-email"
                        type="email" 
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@company.com"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-brand-navy/60 bg-zinc-50 dark:bg-brand-dark-navy text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm focus:outline-none focus:bg-white dark:focus:bg-brand-dark-navy focus:border-brand-blue dark:focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400" htmlFor="form-industry">Industry</label>
                      <select 
                        id="form-industry"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-brand-navy/60 bg-zinc-50 dark:bg-brand-dark-navy text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:bg-white dark:focus:bg-brand-dark-navy focus:border-brand-blue dark:focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
                      >
                        <option>Manufacturing</option>
                        <option>Warehouse & Logistics</option>
                        <option>Retail & Showrooms</option>
                        <option>Healthcare</option>
                        <option>Banking & Finance</option>
                        <option>Construction</option>
                        <option>Education</option>
                        <option>Hospitality</option>
                        <option>Residential & Societies</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400" htmlFor="form-cameras">Approx. number of cameras</label>
                      <input 
                        id="form-cameras"
                        type="text"
                        value={formData.cameras}
                        onChange={(e) => setFormData({ ...formData, cameras: e.target.value })}
                        placeholder="e.g. 12"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-brand-navy/60 bg-zinc-50 dark:bg-brand-dark-navy text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm focus:outline-none focus:bg-white dark:focus:bg-brand-dark-navy focus:border-brand-blue dark:focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400" htmlFor="form-goals">What would you like to monitor?</label>
                    <textarea 
                      id="form-goals"
                      rows={4}
                      value={formData.goals}
                      onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                      placeholder="Tell us about your space and goals..."
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-brand-navy/60 bg-zinc-50 dark:bg-brand-dark-navy text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm focus:outline-none focus:bg-white dark:focus:bg-brand-dark-navy focus:border-brand-blue dark:focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all duration-200"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-brand-gold to-brand-light-gold text-brand-navy hover:brightness-110 shadow-lg shadow-brand-gold/20 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        Request a demo
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>

                  <span className="block text-[10px] text-zinc-400 text-center font-semibold">
                    We will respond within one business day. No spam, ever.
                  </span>
                </form>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto text-2xl animate-bounce font-black">
                    ✓
                  </div>
                  <h3 className="text-xl font-bold text-brand-navy dark:text-brand-offwhite">Demo Request Submitted!</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto font-medium">
                    Thanks for booking, <strong>{formData.name}</strong>. Our Delhi NCR engineering desk will contact you via WhatsApp (+91 {formData.phone}) or email ({formData.email}) within one business day to organize your proof-of-concept.
                  </p>
                  <button 
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({
                        name: '',
                        company: '',
                        phone: '',
                        email: '',
                        industry: 'Manufacturing',
                        cameras: '',
                        goals: ''
                      });
                    }}
                    className="mt-4 px-4 py-2 border border-zinc-200 dark:border-brand-navy/60 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-brand-navy/40 cursor-pointer"
                  >
                    Submit another request
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* REGIONAL COVERAGE SECTION */}
      <section id="locations" className="py-20 border-t border-zinc-200/50 dark:border-brand-navy/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-black tracking-wider text-brand-gold uppercase">On-Site Deployments</span>
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy dark:text-brand-offwhite mt-1">
              Serving businesses across Delhi NCR
            </h2>
            <p className="text-zinc-505 dark:text-zinc-400 text-sm mt-2">
              A Gurgaon-based hardware and deployment team, providing on-premise installation and AI model calibration across the National Capital Region.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { city: "Gurgaon", scope: "Corporate · Retail · Industrial" },
              { city: "Manesar", scope: "Auto · Heavy manufacturing" },
              { city: "Noida", scope: "IT · Warehousing · Manufacturing" },
              { city: "Faridabad", scope: "Industrial · MSME" },
              { city: "Delhi NCR", scope: "Region-wide Coverage", highlight: true }
            ].map((loc, idx) => (
              <div 
                key={idx} 
                className={`p-6 rounded-2xl border text-center relative overflow-hidden transition-all ${
                  loc.highlight 
                    ? 'border-brand-blue bg-brand-blue/[0.02] dark:bg-brand-blue/[0.04]' 
                    : 'border-zinc-200 dark:border-brand-navy/60 bg-white dark:bg-brand-navy/20'
                }`}
              >
                <h3 className={`text-base font-bold ${loc.highlight ? 'text-brand-blue dark:text-brand-light-blue' : 'text-brand-navy dark:text-brand-offwhite'}`}>
                  {loc.city}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1 font-bold">
                  {loc.scope}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-brand-navy dark:bg-brand-dark-navy text-zinc-400 border-t border-brand-navy/40 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CoreWatchLogo className="h-12 w-auto" />
              <span className="text-lg font-black text-white">CoreWatch</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              CoreWatch turns your existing CCTV infrastructure into intelligent monitoring for safety, compliance, and asset protection.
            </p>
            <span className="block text-[10px] text-zinc-550 font-mono">
              © {new Date().getFullYear()} CoreWatch.ai. All rights reserved.
            </span>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-widest mb-4">NAVIGATE</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-brand-gold transition-colors cursor-pointer">How it works</button></li>
              <li><button onClick={() => scrollToSection('capabilities')} className="hover:text-brand-gold transition-colors cursor-pointer">Solutions</button></li>
              <li><button onClick={() => scrollToSection('industries')} className="hover:text-brand-gold transition-colors cursor-pointer">Industries</button></li>
              <li><button onClick={() => scrollToSection('deployment')} className="hover:text-brand-gold transition-colors cursor-pointer">Deployment</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-widest mb-4">RESOURCES</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => scrollToSection('faq')} className="hover:text-brand-gold transition-colors cursor-pointer">FAQ</button></li>
              <li><a href="#" className="hover:text-brand-gold transition-colors">About team</a></li>
              <li><a href="#" className="hover:text-brand-gold transition-colors">Engineering blog</a></li>
              <li><button onClick={() => scrollToSection('talk-to-us')} className="hover:text-brand-gold transition-colors cursor-pointer">Talk to us</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase text-white tracking-widest mb-4">LOCATIONS NCR</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>Gurgaon corporate hub</li>
              <li>Manesar industrial area</li>
              <li>Noida tech parks</li>
              <li>Faridabad manufacturing sector</li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
}
