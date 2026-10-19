'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  GraduationCap, 
  LogOut, 
  ShieldCheck, 
  ChevronDown,
  Sun,
  Moon,
  Clock
} from 'lucide-react';

interface AuthUser {
  userId: string;
  loginId: string;
  name: string;
  email: string;
  role: 'FACULTY' | 'ADMIN';
  department?: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Live Digital Clock state
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    // Initialize Theme
    const stored = localStorage.getItem('smart_theme');
    if (stored === 'light') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }

    // Live clock ticker
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  // Don't render navbar on landing/login or standalone terminal/checkin pages
  if (pathname === '/' || pathname === '/terminal' || pathname === '/checkin') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Campus Identity */}
        <div className="flex items-center space-x-3">
          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-zinc-900 dark:text-white tracking-tight text-sm">SmartCampus</span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded">
                  ERP
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-medium leading-none">University Attendance Platform</p>
            </div>
          </Link>
        </div>

        {/* Center: Live Digital Clock */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-300 font-mono shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>{currentTime || '15:00:00'}</span>
          <span className="text-zinc-400 dark:text-zinc-600">•</span>
          <span className="text-zinc-600 dark:text-zinc-400 font-sans text-[11px]">{currentDate}</span>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center space-x-2.5">
          
          {/* PERSISTENT Dean Admin Console Button (Always visible for ADMIN role) */}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all shadow-xs ${
                pathname === '/admin'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-sm'
                  : 'text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Dean Admin Console</span>
            </Link>
          )}

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-800 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* User Profile */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center font-bold text-xs border border-zinc-300 dark:border-zinc-700">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-zinc-500 font-medium capitalize">{user.role.toLowerCase()} • {user.loginId}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 hidden lg:block" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1 z-50">
                  <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white">{user.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                      {user.role} ({user.loginId})
                    </span>
                  </div>

                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-xs text-zinc-900 dark:text-white font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      <span>Dean Admin Console</span>
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <span>Faculty Dashboard</span>
                  </Link>

                  <Link
                    href="/reports"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <span>Attendance Reports</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-t border-zinc-100 dark:border-zinc-900 mt-1 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
