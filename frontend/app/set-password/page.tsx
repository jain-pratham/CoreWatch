'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
    } else {
      setErrorMsg('Invalid or missing password configuration token.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!token) {
      setErrorMsg('Token is invalid or missing.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

    try {
      const res = await fetch(`${API_URL}/api/customers/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        setSuccessMsg('🎉 Password configured successfully! Redirecting you...');
        setTimeout(() => {
          router.push('/signup-steps');
        }, 2000);
      } else {
        setErrorMsg(data.message || 'Failed to configure password. Link might be expired.');
      }
    } catch (err) {
      setErrorMsg('Network error. Unable to connect to authorization server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-lg bg-card/60 border border-border shadow-2xl backdrop-blur-xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold-light mb-4">
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">Configure Password</h2>
        <p className="text-xs text-muted-foreground mt-2">Setup secure login password for your CoreWatch account.</p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground block">Choose New Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              type="password"
              required
              disabled={!token || loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground block">Confirm New Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            <input
              type="password"
              required
              disabled={!token || loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all duration-200 disabled:opacity-50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!token || loading}
          className="w-full py-3.5 rounded-lg bg-brand-gold hover:bg-brand-gold-light text-[#FAF6EE] text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-brand-gold/20 disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Configuring Account...</span>
            </>
          ) : (
            <span>Confirm & Continue</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 font-sans relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-brown/5 blur-[120px] pointer-events-none"></div>

      <Suspense fallback={
        <div className="w-full max-w-md p-8 rounded-lg bg-card/60 border border-border text-center text-muted-foreground text-xs">
          Loading authentication parameters...
        </div>
      }>
        <SetPasswordForm />
      </Suspense>
    </div>
  );
}
