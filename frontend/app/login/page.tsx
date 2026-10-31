'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomConfirmDialog from '../../components/common/CustomConfirmDialog';
import CoreWatchLogo from '../../components/common/CoreWatchLogo';

export default function LoginPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setLoginSuccess(true);
        setUserRole(data.data.role);

        // Store JWT token and authenticated user details
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));

        // When test user logs in, flag session to auto-open direct camera connect modal
        if (data.data.email === 'test@gmail.com' || formData.email.toLowerCase().trim() === 'test@gmail.com') {
          sessionStorage.setItem('openDirectConnectModal', 'true');
        }

        // Auto redirect after brief success indicator
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      } else {
        setErrorMessage(data.message || 'Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      console.error('Authentication network error:', err);
      setErrorMessage('Unable to connect to authentication server. Please ensure backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex text-foreground bg-background font-sans transition-colors duration-300 relative">
      {/* Grid Background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      {/* LEFT FORM COLUMN */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-12 z-10 bg-card/90 dark:bg-brand-navy/90 backdrop-blur-md border-r border-border shadow-xl overflow-y-auto">
        
        {/* Navigation Bar inside panel */}
        <div className="flex justify-between items-center w-full mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <svg className="w-4 h-4 text-muted-foreground group-hover:text-brand-gold-light transition-colors transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
              Back to home
            </span>
          </Link>

          {/* Theme switcher */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border bg-card/50 dark:bg-[#0E0F12]/50 text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707-.707M6.343 4.343l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Auth Box Center Container */}
        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CoreWatchLogo className="h-11 w-auto" />
              <span className="text-md font-bold tracking-tight text-foreground">CoreWatch</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Login In to Dashboard</h1>
            <p className="text-xs text-muted-foreground">Enter your credentials to access your enterprise role workspace.</p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium leading-relaxed">
              ⚠️ {errorMessage}
            </div>
          )}

          {!loginSuccess ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground" htmlFor="login-email">Work Email</label>
                <input 
                  id="login-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground" htmlFor="login-password">Password</label>
                  <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotDialog(true); }} className="text-[11px] font-semibold text-brand-gold-light hover:text-brand-gold hover:underline">
                    Forgot password?
                  </a>
                </div>
                <input 
                  id="login-password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200"
                />
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input 
                  id="remember-me"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-brand-gold focus:ring-brand-gold dark:bg-card"
                />
                <label htmlFor="remember-me" className="text-xs text-muted-foreground select-none">
                  Keep me signed in for 30 days
                </label>
              </div>

              {/* Submit CTA */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg text-sm font-bold bg-brand-gold text-[#FAF6EE] hover:bg-brand-gold-light shadow-md shadow-brand-gold/10 hover:shadow-brand-gold/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Sign In'
                )}
              </button>

            </form>
          ) : (
            <div className="py-8 text-center space-y-4 border border-brand-gold/20 bg-brand-gold/5 rounded-lg p-6">
              <div className="w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold-light flex items-center justify-center mx-auto text-xl font-bold animate-bounce">
                ✓
              </div>
              <h2 className="text-lg font-bold text-foreground">Authenticated</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Role classified: <span className="font-bold text-brand-gold-light uppercase">{userRole}</span>. Loading dashboard...
              </p>
              <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}

          {/* Footnotes Redirect */}
          <p className="text-center text-xs text-muted-foreground pt-2">
            Don't have an enterprise account?{' '}
            <Link href="/signup" className="font-bold text-brand-gold-light hover:text-brand-gold hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-muted-foreground/60 font-mono mt-8">
          CoreWatch Enterprise Auth Security v2.14 · DPDP Compliant
        </div>

      </div>

      {/* RIGHT PREVIEW COLUMN */}
      <div className="hidden lg:flex lg:w-7/12 bg-brand-background dark:bg-brand-deep-navy flex-col justify-between p-16 relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 -left-10 w-[300px] h-[300px] bg-brand-gold/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top visual detail */}
        <div className="flex justify-between items-center text-xs tracking-wider text-muted-foreground font-mono z-10">
          <div>// REGION: INBOUND NCR NETWORK</div>
          <div>STATUS: 100% DISPATCH SECURE</div>
        </div>

        {/* Center Mockup representation of core watch dashboard */}
        <div className="max-w-xl w-full mx-auto z-10 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-brand-gold-light tracking-widest block font-mono">COREWATCH CONSOLE MOCKUP</span>
            <h2 className="text-3xl font-black text-foreground leading-tight">AI video analytics that turn ordinary cameras into intelligent inspectors</h2>
          </div>

          {/* Interactive Bounding box diagram container */}
          <div className="border border-border bg-card/90 backdrop-blur-md rounded-lg p-6 shadow-2xl relative">
            <div className="flex justify-between items-center text-xs font-mono text-muted-foreground border-b border-border pb-3 mb-4">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                CAM 03 FEED - ACTIVE MONITORING
              </span>
              <span>1080P · 30 FPS</span>
            </div>

            {/* Simulated Stream Grid */}
            <div className="aspect-video w-full bg-background rounded-lg border border-border overflow-hidden relative flex items-center justify-around">
               <div className="absolute inset-0 bg-radial-[circle_at_center,hsl(var(--muted))_20%,hsl(var(--background))_85%] opacity-90"></div>
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff0003_1px,transparent_1px),linear-gradient(to_bottom,#00ff0003_1px,transparent_1px)] bg-[size:8px_8px]"></div>

              {/* Bounding box mock worker */}
              <div className="border border-brand-gold bg-brand-gold/10 p-3 rounded text-center text-xs text-white max-w-[120px] font-mono">
                <div className="bg-brand-gold text-[#FAF6EE] text-[9px] px-1 font-bold rounded mb-1">
                  HELMET: OK (98%)
                </div>
                <svg className="w-10 h-10 text-brand-gold mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-[10px] text-brand-cream">Staff #012</span>
              </div>

              {/* Bounding box mock alert */}
              <div className="border border-red-500 bg-red-500/15 p-3 rounded text-center text-xs text-white max-w-[120px] font-mono animate-pulse">
                <div className="bg-red-600 text-white text-[9px] px-1 font-bold rounded mb-1 animate-bounce">
                  NO HELMET! (99%)
                </div>
                <svg className="w-10 h-10 text-red-500 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-[10px] text-red-300">Staff #044</span>
              </div>
            </div>
            
            {/* Live event logs */}
            <div className="mt-4 font-mono text-[9px] text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-950/40 border border-red-500/20 dark:border-red-900/50 p-2.5 rounded-lg">
              🚨 ALERT: Safety policy violation detected. Dispatch supervisor notification clip via WhatsApp.
            </div>
          </div>
        </div>

        {/* Bottom Testimonial */}
        <div className="max-w-xl w-full mx-auto z-10 border-t border-border pt-6">
          <blockquote className="space-y-2">
            <p className="text-muted-foreground text-sm leading-relaxed italic">
              "CoreWatch turned our existing security cameras into a proactive risk-prevention engine. Setup was seamless, and alerts integrate straight into our managers' mobile feeds."
            </p>
            <footer className="text-xs font-mono text-muted-foreground/80">
              — VP Operations, Gurgaon Manufacturing Hub
            </footer>
          </blockquote>
        </div>

      </div>

      <CustomConfirmDialog
        isOpen={showForgotDialog}
        title="Password Reset Request"
        message="A password reset request has been logged and sent to the administrator. You will receive assistance shortly."
        confirmText="OK"
        variant="info"
        hideCancel
        onConfirm={() => setShowForgotDialog(false)}
      />

    </div>
  );
}
