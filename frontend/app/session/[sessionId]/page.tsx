'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { 
  Radio, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  UserCheck, 
  RefreshCw, 
  StopCircle, 
  Building, 
  ShieldCheck,
  Zap,
  ArrowLeft,
  Search,
  Check,
  X,
  Maximize2,
  Unlock,
  Lock,
  Copy,
  Sparkles,
  KeyRound,
  CreditCard
} from 'lucide-react';

export default function SessionControllerPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [pendingDoorTaps, setPendingDoorTaps] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRosterTab, setActiveRosterTab] = useState<'DOOR_LEDGER' | 'ALL_STUDENTS'>('DOOR_LEDGER');
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isTogglingWindow, setIsTogglingWindow] = useState(false);
  const [isSimulatingTaps, setIsSimulatingTaps] = useState(false);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);

  // Quick Simulation Scan input
  const [simStudentId, setSimStudentId] = useState('25215101');
  const [simMethod, setSimMethod] = useState('CARD');

  // Dynamic Rolling QR code state (15s rotation)
  const [rollingSeconds, setRollingSeconds] = useState(15);
  const [rollingToken, setRollingToken] = useState('AUTH-' + Math.random().toString(36).substring(2, 7).toUpperCase());
  const [qrSvg, setQrSvg] = useState<string>('');
  const [showFullscreenQr, setShowFullscreenQr] = useState(false);

  // Network Host Configuration for Smartphone Wi-Fi QR access
  const [networkHost, setNetworkHost] = useState('192.168.1.6:3000');
  const [isCustomizingHost, setIsCustomizingHost] = useState(false);
  const [tempHost, setTempHost] = useState('');

  // Discover and set reachable Wi-Fi host on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartcampus_network_host');
      if (saved) {
        setNetworkHost(saved);
        return;
      }
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setNetworkHost(window.location.host);
        return;
      }
    }
    fetch('/api/network/lan-ip')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.lanIp && !data.lanIp.startsWith('127.') && !data.lanIp.startsWith('172.')) {
          setNetworkHost(`${data.lanIp}:${data.port || '3000'}`);
        } else {
          setNetworkHost('192.168.1.6:3000');
        }
      })
      .catch(() => {
        setNetworkHost('192.168.1.6:3000');
      });
  }, []);

  useEffect(() => {
    loadSessionData();
    const interval = setInterval(loadSessionData, 3000); // Poll every 3 seconds for live updates
    return () => clearInterval(interval);
  }, [sessionId]);

  // Rolling QR code generator & 15s countdown
  useEffect(() => {
    const updateQr = async () => {
      // Ensure target is accessible over Wi-Fi
      const effectiveHost = networkHost || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.host : '192.168.1.6:3000');
      const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
      const checkinUrl = `${protocol}//${effectiveHost}/checkin?session=${sessionId}&token=${rollingToken}&ts=${Date.now()}`;
      try {
        const res = await fetch(`/api/qr?text=${encodeURIComponent(checkinUrl)}&width=320`);
        const svgText = await res.text();
        setQrSvg(svgText);
      } catch (err) {
        console.error('Failed to generate rolling QR SVG:', err);
      }
    };

    updateQr();

    const timer = setInterval(() => {
      setRollingSeconds((prev) => {
        if (prev <= 1) {
          const nextTok = 'AUTH-' + Math.random().toString(36).substring(2, 7).toUpperCase();
          setRollingToken(nextTok);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId, rollingToken, networkHost]);

  const loadSessionData = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setStats(data.stats);
        setStudents(data.students || []);
        setPendingDoorTaps(data.pendingDoorTaps || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!confirm('Are you sure you want to close this attendance session? The regulatory window will be permanently locked.')) {
      return;
    }
    setIsClosing(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      });
      const data = await res.json();
      if (data.success) {
        loadSessionData();
      }
    } catch {
      alert('Network error closing session');
    } finally {
      setIsClosing(false);
    }
  };

  const handleToggleWindowOverride = async () => {
    setIsTogglingWindow(true);
    try {
      const newStatus = session?.status === 'ACTIVE' ? 'WINDOW_OVERRIDE' : 'ACTIVE';
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        loadSessionData();
      }
    } catch {
      alert('Error updating attendance window policy');
    } finally {
      setIsTogglingWindow(false);
    }
  };

  // Door Tap Simulator: Simulates students tapping cards at the door
  const handleSimulateDoorTaps = async (mode: 'ALL' | 'PARTIAL' | 'RESET') => {
    setIsSimulatingTaps(true);
    setSimFeedback(null);
    try {
      const res = await fetch('/api/attendance/simulate-door-taps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, mode }),
      });
      const data = await res.json();
      if (data.success) {
        setSimFeedback(data.message);
        loadSessionData();
        setTimeout(() => setSimFeedback(null), 5000);
      } else {
        alert(data.error || 'Failed to simulate door taps');
      }
    } catch {
      alert('Network error connecting to door simulator');
    } finally {
      setIsSimulatingTaps(false);
    }
  };

  // 1-Click Faculty Presence Override for dead battery / slow network / manual mark
  const handleVerifyDoorStudent = async (studentId: string) => {
    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          studentIdentifier: studentId,
          method: 'FACULTY_VERIFIED',
          action: 'VERIFY',
          bypassWindow: true,
          deviceId: 'DESKTOP_CONTROLLER',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadSessionData();
      } else {
        alert(data.error || 'Failed to mark attendance');
      }
    } catch {
      alert('Network error verifying student');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id?.includes(searchQuery) ||
      s.user_id?.includes(searchQuery)
  );

  const displayedList = activeRosterTab === 'DOOR_LEDGER'
    ? filteredStudents.filter((s) => (s.status === 'TAPPED_PENDING' || s.attendance_status === 'TAPPED_PENDING'))
    : filteredStudents;

  const currentPendingCount = students.filter(
    (s) => (s.status === 'TAPPED_PENDING' || s.attendance_status === 'TAPPED_PENDING')
  ).length;

  const isLive = session?.status === 'ACTIVE' || session?.status === 'WINDOW_OVERRIDE';
  const isWindowOpen = isLive || session?.status === 'WINDOW_OVERRIDE';

  return (
    <div className="flex-1 flex w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 antialiased font-sans transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Uncramped Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm dark:shadow-2xl">
          <div className="flex items-start md:items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border flex items-center space-x-1.5 ${
                  isLive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400'
                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                  <span>{session?.status || 'ACTIVE'}</span>
                </span>
                <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">Session ID: {sessionId}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                {session?.subject_name || 'Data Structures & Algorithms'} ({session?.subject_code || 'CS201'})
              </h1>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {session?.class_name || 'CSE-A'} • Room {session?.room_number || '101'} ({session?.building || 'Main Academic Block'}) • Faculty: {session?.faculty_name || 'Dr. Anita Rao'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Live Window Override Toggle */}
            <button
              onClick={handleToggleWindowOverride}
              disabled={isTogglingWindow}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isWindowOpen
                  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
              title="Toggle attendance regulatory window"
            >
              {isWindowOpen ? <Unlock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-zinc-400" />}
              <span>Window: {isWindowOpen ? 'Unlocked (Always Accept)' : 'Strict Schedule'}</span>
            </button>

            {isLive && (
              <button
                onClick={handleCloseSession}
                disabled={isClosing}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:dark:bg-red-900/60 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <StopCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                <span>{isClosing ? 'Closing...' : 'Close Lecture'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Total Enrolled</span>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{stats?.totalEnrolled || 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Present (On-Time)</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats?.presentCount || 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Late Check-In</span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats?.lateCount || 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-950 border border-amber-300 dark:border-amber-500/30 shadow-sm dark:shadow-md">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Door Taps (Pending)</span>
            </span>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{stats?.pendingCount || 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md">
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Absent</span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats?.absentCount || 0}</p>
          </div>
        </div>

        {/* CLASSROOM DOOR TAP SIMULATOR TOOLBAR (Demo Beta Mode) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Classroom Door RFID Tap Simulator</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                Hardware Kiosk Simulator
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Simulates physical wall-mounted RFID door kiosks swiping student ID cards at classroom entrance. Students who tap will appear in the <strong>Door Tap Ledger</strong> tab awaiting mobile QR confirmation.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setActiveRosterTab('DOOR_LEDGER');
                handleSimulateDoorTaps('ALL');
              }}
              disabled={isSimulatingTaps}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              ⚡ Tap All Cards (100%)
            </button>
            <button
              onClick={() => {
                setActiveRosterTab('DOOR_LEDGER');
                handleSimulateDoorTaps('PARTIAL');
              }}
              disabled={isSimulatingTaps}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 border border-zinc-200 dark:border-zinc-700"
            >
              ⚡ Tap 85% at Door
            </button>
            <button
              onClick={() => handleSimulateDoorTaps('RESET')}
              disabled={isSimulatingTaps}
              className="px-2.5 py-1.5 rounded-xl text-zinc-500 hover:text-rose-600 text-xs font-medium cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {simFeedback && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-800 dark:text-emerald-300 font-mono flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{simFeedback}</span>
          </div>
        )}

        {/* Projector Card & Door Tap Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Dynamic Rolling QR Code Projector Card */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4 text-center flex flex-col justify-between shadow-sm dark:shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                  <QrCode className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                  <span>Classroom Projector Rolling QR</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                  Anti-Proxy TOTP
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                Project this on classroom screen. Token rotates every 15s to block remote proxy check-ins.
              </p>
            </div>

            {/* Real Camera-Scannable SVG QR Code */}
            <div className="py-2 flex flex-col items-center justify-center">
              <div className="relative p-4 rounded-3xl bg-white shadow-xl flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-700">
                {qrSvg ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: qrSvg }} 
                    className="w-48 h-48 sm:w-56 sm:h-56 [&>svg]:w-full [&>svg]:h-full"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-black font-mono">
                    Generating scannable QR...
                  </div>
                )}
                
                <div className="mt-2 text-center">
                  <span className="text-[11px] font-mono font-bold tracking-widest text-black bg-zinc-100 px-3 py-0.5 rounded border border-zinc-300">
                    {rollingToken}
                  </span>
                </div>
              </div>

              {/* Countdown Progress Ring */}
              <div className="mt-3 flex items-center justify-center space-x-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Next token rotation in <strong className="text-zinc-900 dark:text-white font-bold">{rollingSeconds}s</strong></span>
              </div>

              {/* Classroom Wi-Fi Endpoint Control */}
              <div className="mt-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider flex items-center space-x-1">
                    <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                    <span>Classroom Wi-Fi Endpoint</span>
                  </span>
                  <button
                    onClick={() => {
                      setTempHost(networkHost);
                      setIsCustomizingHost(!isCustomizingHost);
                    }}
                    className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white underline cursor-pointer"
                  >
                    {isCustomizingHost ? 'Cancel' : 'Change IP'}
                  </button>
                </div>

                {isCustomizingHost ? (
                  <div className="flex items-center space-x-1.5 pt-1">
                    <input
                      type="text"
                      value={tempHost}
                      onChange={(e) => setTempHost(e.target.value)}
                      placeholder="e.g. 192.168.1.6:3000"
                      className="flex-1 px-2 py-1 text-[11px] font-mono bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const clean = tempHost.trim() || '192.168.1.6:3000';
                        setNetworkHost(clean);
                        localStorage.setItem('smartcampus_network_host', clean);
                        setIsCustomizingHost(false);
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold bg-zinc-900 text-white dark:bg-white dark:text-black rounded-lg cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold truncate max-w-[210px]">
                      http://{networkHost}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                      Phone Reachable
                    </span>
                  </div>
                )}

                {networkHost.includes('localhost') && (
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-[10px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                    <span>⚠️ Targeting localhost (phone will refuse).</span>
                    <button
                      onClick={() => {
                        setNetworkHost('192.168.1.6:3000');
                        localStorage.setItem('smartcampus_network_host', '192.168.1.6:3000');
                      }}
                      className="font-bold underline cursor-pointer ml-1"
                    >
                      Use 192.168.1.6
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Projector Fullscreen / Direct Open */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900">
              <button
                onClick={() => setShowFullscreenQr(true)}
                className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-white flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Project Fullscreen on Classroom Display</span>
              </button>
            </div>
          </div>

          {/* Door Tap Ledger & Attendance Real-time Roster */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm dark:shadow-2xl">
            
            {/* Header with Title and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider flex items-center space-x-2">
                  <Users className="w-4 h-4 text-zinc-500" />
                  <span>
                    {activeRosterTab === 'DOOR_LEDGER'
                      ? 'Classroom Door Tap Ledger'
                      : 'Enrolled Course Roster'}
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {activeRosterTab === 'DOOR_LEDGER'
                    ? 'Real-time queue of students who physically tapped RFID card at door kiosk and are awaiting mobile confirmation.'
                    : `Complete course enrollment list (${students.length} students) with real-time attendance status.`}
                </p>
              </div>

              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            {/* View Switcher Tabs: Door Tap Ledger vs Complete Class Roster */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveRosterTab('DOOR_LEDGER')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeRosterTab === 'DOOR_LEDGER'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                <span>Door Tap Ledger</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeRosterTab === 'DOOR_LEDGER'
                    ? 'bg-zinc-700 text-white dark:bg-zinc-200 dark:text-black'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                }`}>
                  {currentPendingCount} Pending
                </span>
              </button>

              <button
                onClick={() => setActiveRosterTab('ALL_STUDENTS')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeRosterTab === 'ALL_STUDENTS'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                <span>Enrolled Class Roster</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeRosterTab === 'ALL_STUDENTS'
                    ? 'bg-zinc-700 text-white dark:bg-zinc-200 dark:text-black'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}>
                  {students.length} Enrolled
                </span>
              </button>
            </div>

            {/* Students List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {displayedList.length === 0 ? (
                activeRosterTab === 'DOOR_LEDGER' ? (
                  <div className="py-10 px-4 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <CreditCard className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto" />
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      No Pending Door Taps
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                      When students tap their RFID smartcards at the door kiosk (or via the Simulator above), they appear here in the live door ledger with their 6-digit challenge PIN awaiting mobile QR confirmation.
                    </p>
                    <button
                      onClick={() => setActiveRosterTab('ALL_STUDENTS')}
                      className="mt-2 text-xs font-bold text-zinc-900 dark:text-white underline cursor-pointer hover:opacity-80 inline-block"
                    >
                      View Full Class Roster ({students.length} Enrolled) →
                    </button>
                  </div>
                ) : (
                  <div className="py-12 text-center text-zinc-400 text-xs font-mono">
                    No student records found matching search.
                  </div>
                )
              ) : (
                displayedList.map((st) => {
                  const isPresent = st.status === 'PRESENT' || st.attendance_status === 'PRESENT';
                  const isPending = st.status === 'TAPPED_PENDING' || st.attendance_status === 'TAPPED_PENDING';
                  const isLate = st.status === 'LATE' || st.attendance_status === 'LATE';

                  return (
                    <div
                      key={st.user_id || st.student_id}
                      className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-zinc-900 dark:text-white">{st.name}</span>
                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                            ({st.student_id || st.user_id})
                          </span>
                          {st.challenge_pin && isPending && (
                            <span className="text-[10px] font-mono bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-800/80 font-bold">
                              PIN: {st.challenge_pin}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {isPresent
                            ? `Verified at ${st.verified_at ? new Date(st.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'} • Method: ${st.method || st.attendance_method || 'DUAL_FACTOR'}`
                            : isPending
                            ? `Tapped at Classroom Door (Awaiting Mobile Scan or Faculty Verification)`
                            : `Absence recorded`}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isPresent ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80 flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Present</span>
                          </span>
                        ) : isPending ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 animate-pulse">
                              Door Tapped
                            </span>
                            {/* Faculty 1-Click Verification for Dead Battery / Broken Camera */}
                            <button
                              onClick={() => handleVerifyDoorStudent(st.user_id || st.student_id)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                              title="Faculty manual override: confirm student physical presence without smartphone scan"
                            >
                              ✓ Verify Presence
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleVerifyDoorStudent(st.user_id || st.student_id)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-[10px] font-bold transition-all shadow-xs cursor-pointer border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                            title="Faculty manual override: mark student present"
                          >
                            Mark Present
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </main>

      {/* Fullscreen Projector Modal */}
      {showFullscreenQr && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 select-none">
          <button
            onClick={() => setShowFullscreenQr(false)}
            className="absolute top-6 right-6 p-3 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-bold"
          >
            ✕ Exit Projector Display
          </button>

          <div className="text-center space-y-4 max-w-lg w-full">
            <div className="w-12 h-12 rounded-2xl bg-white text-black font-black text-xl flex items-center justify-center mx-auto shadow-lg">
              CU
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-wider uppercase">
                {session?.subject_name} ({session?.subject_code})
              </h2>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Scan with any smartphone camera to certify physical attendance
              </p>
            </div>

            <div className="p-6 bg-white rounded-3xl inline-block mx-auto shadow-2xl border-4 border-zinc-700">
              <div 
                dangerouslySetInnerHTML={{ __html: qrSvg }} 
                className="w-72 h-72 sm:w-80 sm:h-80 [&>svg]:w-full [&>svg]:h-full"
              />
              <p className="mt-3 font-mono text-xs font-black tracking-widest text-black bg-zinc-100 py-1 rounded border border-zinc-300">
                {rollingToken}
              </p>
            </div>

            <div className="text-xs font-mono text-zinc-400 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-300" />
              <span>Token rotates in <strong className="text-white font-bold">{rollingSeconds}s</strong></span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-zinc-500">Classroom Mobile Link:</span>
              <strong className="text-emerald-400">http://{networkHost}/checkin</strong>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
