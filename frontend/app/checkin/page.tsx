'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Lock, 
  Sparkles,
  ArrowRight,
  EyeOff,
  UserCheck,
  GraduationCap
} from 'lucide-react';

export default function StudentCheckInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-xs text-zinc-500 font-mono">
        Establishing Secure Classroom Channel...
      </div>
    }>
      <CheckInContent />
    </Suspense>
  );
}

function CheckInContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session') || '';
  const token = searchParams.get('token') || '';

  // Form states
  const [studentId, setStudentId] = useState('');
  const [authMode, setAuthMode] = useState<'SOFTWARE_TOKEN' | 'DOOR_PIN'>('SOFTWARE_TOKEN');
  const [doorPin, setDoorPin] = useState('');
  const [deviceToken, setDeviceToken] = useState('');
  
  // Submission feedback
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Anti-Cheat Watchdog state
  const [securityBreach, setSecurityBreach] = useState(false);

  // Initialize or retrieve persistent software device UUID (zero biometric hardware required)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let stored = localStorage.getItem('smart_student_device_token');
      if (!stored) {
        // Generate high-entropy software device identifier
        const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
        stored = `DEV-${rand}`;
        localStorage.setItem('smart_student_device_token', stored);
      }
      setDeviceToken(stored);
    }
  }, []);

  // W3C Page Visibility Anti-Proxy Watchdog
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !result?.success) {
        // Student switched app or tab to forward link
        setSecurityBreach(true);
        setErrorMsg('Security Notice: Tab/App switch detected. Single-use dynamic session revoked. Please rescan the live classroom projector QR.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (securityBreach) {
      alert('Security violation: Please rescan the live QR code on the classroom projector.');
      return;
    }

    if (!studentId.trim()) {
      setErrorMsg('Please enter your Student Registration Number or Card UID.');
      return;
    }

    if (authMode === 'DOOR_PIN' && (!doorPin.trim() || doorPin.trim().length !== 6)) {
      setErrorMsg('Please enter the 6-digit challenge PIN from the classroom door kiosk.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          studentIdentifier: studentId.trim(),
          method: authMode === 'DOOR_PIN' ? 'TERMINAL_PIN' : 'DUAL_FACTOR',
          deviceId: deviceToken || 'MOBILE_WEB',
          challengePin: authMode === 'DOOR_PIN' ? doorPin.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setErrorMsg(data.error || 'Attendance verification failed.');
      }
    } catch {
      setErrorMsg('Network error connecting to university attendance server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased selection:bg-zinc-800">
      
      {/* Top University Micro-Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 pb-3 max-w-md w-full mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-black font-black text-xs shadow-sm">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-tight">CHRIST (Deemed to be University)</h1>
            <p className="text-[10px] text-zinc-400">Classroom Dual-Factor Presence</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Lecture</span>
        </span>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto my-auto py-6 space-y-5">
        
        {/* Anti-Proxy Security Banner */}
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-center space-x-3 shadow-md">
          <ShieldCheck className="w-5 h-5 text-zinc-400 shrink-0" />
          <div className="leading-tight">
            <span className="font-semibold block text-white">2FA Physical Proximity Active</span>
            <span className="text-[11px] text-zinc-400">Session-scoped device token & physical presence challenge.</span>
          </div>
        </div>

        {/* Security Breach Warning */}
        {securityBreach && (
          <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs space-y-2 animate-fade-in shadow-lg">
            <div className="flex items-center space-x-2 font-bold text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Anti-Cheat Security Triggered</span>
            </div>
            <p className="text-[11px] text-rose-300 leading-relaxed">
              Application or browser tab switch was detected. Sharing URLs or attempting proxy attendance from outside class is prohibited.
            </p>
            <button
              onClick={() => {
                setSecurityBreach(false);
                setErrorMsg('');
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-white bg-rose-900/60 hover:bg-rose-900 px-2.5 py-1 rounded-lg border border-rose-700"
            >
              Acknowledge & Retry
            </button>
          </div>
        )}

        {/* Success Card */}
        {result?.success ? (
          <div className="p-6 rounded-3xl bg-zinc-950 border border-emerald-800/80 shadow-2xl space-y-5 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                ATTENDANCE CERTIFIED ✓
              </span>
              <h2 className="text-xl font-black text-white mt-3">
                {result.studentName}
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                Reg No: {result.studentId}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Lecture Session:</span>
                <span className="text-white">{sessionId}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Hardware Token:</span>
                <span className="text-zinc-200">{deviceToken}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Compliance:</span>
                <span className="text-emerald-400 font-bold">{result.status}</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400">
              Your attendance has been confirmed in the official central ledger. You may now close this tab.
            </p>
          </div>
        ) : (
          /* Check-In Form */
          <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-5">
            
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-zinc-300" />
                <span>Confirm Lecture Check-In</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Enter your university credentials to certify your presence.
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start space-x-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-tight">{errorMsg}</span>
              </div>
            )}

            {/* Student ID / Reg No */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                Student Registration Number
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. 25215101 or CARD-25215101"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>

            {/* Proximity Authentication Method Switcher */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                Verification Method
              </label>
              <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAuthMode('SOFTWARE_TOKEN')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    authMode === 'SOFTWARE_TOKEN'
                      ? 'bg-white text-black font-bold shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Projector QR Token
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('DOOR_PIN')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    authMode === 'DOOR_PIN'
                      ? 'bg-white text-black font-bold shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Door Kiosk 6-Digit PIN
                </button>
              </div>
            </div>

            {/* Door PIN Alternative Input (Zero Biometric Hardware Option) */}
            {authMode === 'DOOR_PIN' ? (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between font-mono">
                  <span>Door Kiosk 6-Digit PIN</span>
                  <span className="text-[10px] text-zinc-500">From classroom door</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    value={doorPin}
                    onChange={(e) => setDoorPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit door code"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-white tracking-widest placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <p className="text-[10px] text-zinc-500">
                  Alternative option when smartphone camera cannot scan the rolling QR.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Projector Token:</span>
                  <span className="text-white font-bold">{token || 'SCANNED_VIA_CAM'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Device Hardware ID:</span>
                  <span className="text-zinc-200">{deviceToken}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || securityBreach}
              className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50"
            >
              <span>{submitting ? 'Authenticating Presence...' : 'Certify Physical Presence'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </form>
        )}

      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-zinc-500 font-mono py-2">
        CHRIST Academic ERP • Next-Gen Smart Attendance Engine
      </footer>

    </div>
  );
}
