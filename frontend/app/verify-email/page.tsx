'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
      verifyToken(t);
    } else {
      setErrorMsg('Invalid or missing email verification token.');
      setLoading(false);
    }
  }, [searchParams]);

  const verifyToken = async (verifyToken: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verifyToken }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setSuccessMsg('🎉 Email verified successfully! Logging you in...');
        
        // Save token and user details to localStorage
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));

        setTimeout(() => {
          router.push('/signup-steps');
        }, 2000);
      } else {
        setErrorMsg(data.message || 'Failed to verify email. The link might be expired.');
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
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold-light mb-4 animate-pulse">
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">Email Verification</h2>
        <p className="text-xs text-muted-foreground mt-2">Activating your CoreWatch credentials...</p>
      </div>

      {loading && (
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-muted-foreground">Verifying security token with auth node...</p>
        </div>
      )}

      {errorMsg && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
          <div className="text-center">
            <Link 
              href="/signup" 
              className="inline-block py-3 px-6 rounded-lg bg-brand-gold hover:bg-brand-gold-light text-[#FAF6EE] text-xs font-extrabold uppercase tracking-wider transition-all"
            >
              Try Registering Again
            </Link>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <div className="text-center text-xs text-muted-foreground animate-pulse">
            Configuring workspace environment, please wait...
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 font-sans relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-brown/5 blur-[120px] pointer-events-none"></div>

      <Suspense fallback={
        <div className="w-full max-w-md p-8 rounded-lg bg-card/60 border border-border text-center text-muted-foreground text-xs">
          Loading verification state...
        </div>
      }>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
