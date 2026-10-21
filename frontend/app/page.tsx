'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Lock, 
  User, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // State
  const [portalRole, setPortalRole] = useState<'FACULTY' | 'ADMIN'>('FACULTY');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('7K9P');
  const [captchaInput, setCaptchaInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Fetch initial Captcha
  const refreshCaptcha = async () => {
    try {
      const res = await fetch('/api/auth/captcha');
      const data = await res.json();
      if (data.code) {
        setCaptchaCode(data.code);
        setCaptchaInput('');
      }
    } catch {
      setCaptchaCode(Math.random().toString(36).substring(2, 6).toUpperCase());
    }
  };

  useEffect(() => {
    refreshCaptcha();
    const stored = localStorage.getItem('smart_theme');
    if (stored === 'light') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smart_theme', 'light');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('smart_theme', 'dark');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId,
          password,
          captchaInput,
          portalRole,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Authentication failed. Please check credentials.');
        refreshCaptcha();
        setIsLoading(false);
        return;
      }

      setSuccessMsg(`Welcome, ${data.user.name}! Access authorized.`);
      setTimeout(() => {
        router.push(data.redirectTo || '/dashboard');
      }, 500);
    } catch {
      setErrorMsg('Failed to connect to authentication server.');
      setIsLoading(false);
    }
  };

  // Quick Demo Credentials Selector
  const fillDemo = (id: string, pass: string, role: 'FACULTY' | 'ADMIN') => {
    setPortalRole(role);
    setLoginId(id);
    setPassword(pass);
    setCaptchaInput(captchaCode);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 selection:bg-zinc-800 selection:text-white antialiased font-sans transition-colors duration-200">
      
      {/* Top Header - Authentic University ERP Header */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black flex items-center justify-center font-black text-sm shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-zinc-900 dark:text-white text-sm">CHRIST</span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">(Deemed to be University)</span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded">
                ESPro ERP
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium leading-none mt-0.5">
              Smart University Attendance & Academic Management System
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-800" />}
          </button>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono hidden md:inline">Server Online</span>
          </div>
        </div>
      </header>

      {/* Main Content Split - Directly Inspired by Christ University Portal Reference */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex items-center justify-center z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          
          {/* Left Side: University Announcement Showcase (As in ESPro/KnowledgePro reference) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5 shadow-xl dark:shadow-2xl">
              
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>Enterprise AI Biometrics & n8n Automation SaaS</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
                Dual-Factor Physical Attendance. <br />
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">Edge AI Biometrics & n8n.</span>
              </h1>

              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Classroom Door RFID tap + sub-35ms Edge 128-D facial/iris vector matching. Zero phone reliance, 100% proxy elimination, autonomous compliance intelligence, n8n event pipelines, and CRM integration.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white block">Edge Biometric Kiosk</span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">128-D Cosine similarity matching (&ge; 0.85) in &lt;35ms.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white block">AI Compliance & n8n</span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Automated breach forecasts, HubSpot CRM, & Twilio SMS.</p>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href="/architecture"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                >
                  <span>Explore Interactive Architecture Mind-Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Quick Demo Credentials */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-900 space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-500 block">
                  Quick Demo Access (1-Click Fill)
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemo('F001', 'faculty123', 'FACULTY')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    Dr. Anita Rao (<code className="font-mono text-zinc-500 dark:text-zinc-400">F001</code>)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo('F002', 'faculty123', 'FACULTY')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    Prof. Sanjay Mehta (<code className="font-mono text-zinc-500 dark:text-zinc-400">F002</code>)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo('ADM001', 'admin123', 'ADMIN')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    Dean Office (<code className="font-mono text-zinc-500 dark:text-zinc-400">ADM001</code>)
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Side: Authentic University Portal Card */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl space-y-6">
              
              {/* Official Seal Branding */}
              <div className="text-center space-y-2 border-b border-zinc-100 dark:border-zinc-900 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black flex items-center justify-center font-black text-lg mx-auto shadow-md">
                  CU
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-wider uppercase">
                    CHRIST (Deemed to be University)
                  </h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    Bangalore • Delhi NCR • Pune
                  </p>
                </div>
              </div>

              {/* Portal Role Selector Tabs */}
              <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setPortalRole('FACULTY'); setErrorMsg(''); }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    portalRole === 'FACULTY'
                      ? 'bg-white text-black dark:bg-zinc-100 dark:text-black shadow-sm font-bold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Faculty ERP Login
                </button>
                <button
                  type="button"
                  onClick={() => { setPortalRole('ADMIN'); setErrorMsg(''); }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    portalRole === 'ADMIN'
                      ? 'bg-white text-black dark:bg-zinc-100 dark:text-black shadow-sm font-bold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Academic Dean Office
                </button>
              </div>

              {/* Error & Success Alerts */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Login ID Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>{portalRole === 'ADMIN' ? 'Dean Administrator ID' : 'Faculty ID / Login ID'}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {portalRole === 'ADMIN' ? 'e.g. ADM001' : 'e.g. F001 or F002'}
                    </span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder={portalRole === 'ADMIN' ? 'ADM001' : 'F001 or F002'}
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Security Visual Captcha (Directly as in KnowledgePro reference) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Security Verification Captcha
                  </label>
                  <div className="flex items-center space-x-2">
                    {/* Visual Distorted Captcha Box */}
                    <div className="h-10 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-mono font-black text-lg tracking-[0.3em] text-zinc-900 dark:text-white select-none relative overflow-hidden">
                      <span className="relative z-10">{captchaCode}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-200/50 dark:via-zinc-800/50 to-transparent pointer-events-none" />
                    </div>

                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                      title="Refresh Captcha"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      required
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                      placeholder="Type Captcha"
                      maxLength={6}
                      className="flex-1 py-2.5 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono tracking-widest text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </form>

            </div>
          </div>

        </div>
      </main>

      {/* University Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-900 py-4 px-6 text-center text-[10px] text-zinc-500 font-mono">
        CHRIST (Deemed to be University) • Centre for Digital Innovation & Academic Governance • ESPro v2.4
      </footer>

    </div>
  );
}
