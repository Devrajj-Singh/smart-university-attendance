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
  UserCheck, 
  UserX,
  RefreshCw, 
  StopCircle, 
  Building, 
  ShieldCheck,
  Zap,
  ArrowLeft,
  Search,
  Check,
  X,
  Unlock,
  Lock,
  Copy,
  Sparkles,
  KeyRound,
  CreditCard,
  Scan,
  Eye,
  Camera,
  Upload,
  ExternalLink,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { 
  verifyStudentBiometric, 
  getEnrolledBiometricVector,
  extractVisualEmbeddingFromPixels,
  computeCosineSimilarity,
  BiometricMatchResult
} from '@/lib/biometrics';

export default function SessionControllerPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [pendingDoorTaps, setPendingDoorTaps] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
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

  // Enrolled Roster & Selected Student for Edge Biometric Testing
  const [selectedKioskStudent, setSelectedKioskStudent] = useState<string>('25215101');
  const [isBiometricTesting, setIsBiometricTesting] = useState(false);
  const [biometricFeedback, setBiometricFeedback] = useState<BiometricMatchResult | null>(null);
  const [uploadedKioskImage, setUploadedKioskImage] = useState<string | null>(null);
  const kioskFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Web Audio Synthesizer for Immediate Auditory Feedback (Chime / Buzzer)
  const playKioskSound = (success: boolean) => {
    if (typeof window === 'undefined' || !('AudioContext' in window || 'webkitAudioContext' in window)) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {}
  };

  // 1-Click Genuine Biometric Verification (Cosine Similarity ~97.4%)
  const handleTestGenuineBiometric = async (studentIdToVerify?: string) => {
    const targetId = studentIdToVerify || selectedKioskStudent;
    if (!targetId) return;

    setIsBiometricTesting(true);
    setBiometricFeedback(null);

    try {
      const matchResult = verifyStudentBiometric({
        studentId: targetId,
        enrolledBiometricId: 'BIO-' + targetId,
        isSimulation: true,
        simulateImpostor: false,
      });
      setBiometricFeedback(matchResult);

      if (matchResult.matched) {
        playKioskSound(true);
        const res = await fetch('/api/attendance/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            studentIdentifier: targetId,
            method: 'RFID_AND_IRIS',
            action: 'VERIFY',
            confidenceScore: matchResult.similarity,
            deviceId: 'DOOR_KIOSK_101',
            bypassWindow: true,
          }),
        });
        const data = await res.json();
        if (data.success) {
          await loadSessionData();
        } else {
          alert(data.error || 'Failed to record biometric attendance');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error during biometric verification');
    } finally {
      setIsBiometricTesting(false);
    }
  };

  // 1-Click Impostor Proxy Swap Test (Cosine Similarity ~23.2% -> Breach Alert)
  const handleTestImpostorBiometric = async (studentIdToVerify?: string) => {
    const targetId = studentIdToVerify || selectedKioskStudent;
    if (!targetId) return;

    setIsBiometricTesting(true);
    setBiometricFeedback(null);

    try {
      const matchResult = verifyStudentBiometric({
        studentId: targetId,
        enrolledBiometricId: 'BIO-' + targetId,
        isSimulation: true,
        simulateImpostor: true,
      });
      setBiometricFeedback(matchResult);
      playKioskSound(false);

      await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          studentIdentifier: targetId,
          method: 'RFID_AND_IRIS',
          action: 'VERIFY',
          confidenceScore: matchResult.similarity,
          deviceId: 'DOOR_KIOSK_101',
          bypassWindow: true,
        }),
      });

      await loadSessionData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsBiometricTesting(false);
    }
  };

  // Handle local image upload to test pixel vector extraction against enrolled biometric
  const handleKioskImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedKioskImage(dataUrl);

      const img = new Image();
      img.src = dataUrl;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 128, 128);
          const imgData = ctx.getImageData(0, 0, 128, 128);
          const liveVector = extractVisualEmbeddingFromPixels(imgData.data, 128, 128);
          const enrolledVector = getEnrolledBiometricVector('BIO-' + selectedKioskStudent, selectedKioskStudent);
          const sim = computeCosineSimilarity(liveVector, enrolledVector);

          const isMatch = sim >= 0.85;
          const simPercent = Math.round(sim * 1000) / 10;
          const result: BiometricMatchResult = {
            matched: isMatch,
            similarity: sim,
            similarityPercent: simPercent,
            threshold: 0.85,
            status: isMatch ? 'MATCHED' : 'BIOMETRIC_MISMATCH',
            studentId: selectedKioskStudent,
            enrolledBiometricId: 'BIO-' + selectedKioskStudent,
            details: isMatch
              ? `Biometric visual match confirmed (${simPercent}% confidence >= 85% threshold).`
              : `Biometric mismatch (${simPercent}% confidence < 85% threshold). Impostor proxy detected.`,
          };
          setBiometricFeedback(result);
          playKioskSound(isMatch);

          if (isMatch) {
            await fetch('/api/attendance/mark', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                studentIdentifier: selectedKioskStudent,
                method: 'RFID_AND_IRIS',
                action: 'VERIFY',
                confidenceScore: sim,
                deviceId: 'DOOR_KIOSK_101',
                bypassWindow: true,
              }),
            });
            await loadSessionData();
          }
        }
      };
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadSessionData();
    const interval = setInterval(loadSessionData, 3000); // Poll every 3 seconds for live updates
    return () => clearInterval(interval);
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setStats(data.stats);
        setStudents(data.students || []);
        setPendingDoorTaps(data.pendingDoorTaps || []);
        setViolations(data.violations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePardonViolation = async (violationId: string, studentId?: string) => {
    try {
      const res = await fetch('/api/attendance/violation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ violationId }),
      });
      const data = await res.json();
      if (data.success) {
        if (studentId) {
          await handleVerifyDoorStudent(studentId);
        } else {
          await loadSessionData();
        }
      } else {
        alert(data.error || 'Failed to pardon student violation');
      }
    } catch {
      alert('Network error pardoning student violation');
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
  const handleSimulateDoorTaps = async (mode: 'ALL' | 'PARTIAL' | 'RESET' | 'BIOMETRIC_ALL' | 'IMPOSTOR') => {
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

      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8 w-full overflow-hidden">
        
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

        {/* Real-time Anti-Cheat Classroom Security Alert Banner */}
        {violations.filter((v) => !v.cleared_by_faculty).length > 0 && (
          <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 shadow-xl space-y-3 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 dark:border-rose-800/80 pb-3">
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-100 uppercase tracking-wider font-mono">
                    Anti-Cheat Watchdog: {violations.filter((v) => !v.cleared_by_faculty).length} Active Security Breach{violations.filter((v) => !v.cleared_by_faculty).length > 1 ? 'es' : ''}
                  </h3>
                  <p className="text-[11px] text-rose-800 dark:text-rose-300">
                    Student switched apps/tabs or pulled notification shade during check-in. Session locked on central server.
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-200/80 dark:bg-rose-900/80 text-rose-950 dark:text-rose-100 border border-rose-300 dark:border-rose-700">
                Server-Side Lockout Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {violations.filter((v) => !v.cleared_by_faculty).map((v) => (
                <div key={v.violation_id} className="p-3 rounded-2xl bg-white/90 dark:bg-black/70 border border-rose-200 dark:border-rose-800/70 flex items-center justify-between gap-3 shadow-xs">
                  <div className="text-xs space-y-0.5">
                    <div className="font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                      <span>{v.student_name || 'Unidentified Student'}</span>
                      <span className="font-mono text-[10px] text-zinc-500">({v.student_id})</span>
                    </div>
                    <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                      Trigger: <span className="font-mono font-bold">{v.violation_type}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {new Date(v.timestamp).toLocaleTimeString()} • Device: {v.device_fingerprint || 'Mobile'}
                    </div>
                  </div>

                  <button
                    onClick={() => handlePardonViolation(v.violation_id, v.student_id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shrink-0 transition-all shadow-xs cursor-pointer"
                  >
                    Pardon & Verify
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Total Enrolled</span>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{stats?.totalEnrolled || 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-950 border border-emerald-300 dark:border-emerald-500/30 shadow-sm dark:shadow-md">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Biometric Verified</span>
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats?.presentCount || 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Late Check-In</span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats?.lateCount || 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Awaiting Entrance</span>
            <p className="text-2xl font-black text-zinc-700 dark:text-zinc-300 mt-1">
              {Math.max(0, (stats?.totalEnrolled || 0) - (stats?.presentCount || 0) - (stats?.lateCount || 0))}
            </p>
          </div>

          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md">
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Security Breaches</span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {violations.filter((v) => !v.cleared_by_faculty).length}
            </p>
          </div>
        </div>

        {/* CLASSROOM ENTRANCE HARDWARE SIMULATOR (Dual-Factor Edge AI Biometrics + RFID) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                <Scan className="w-4 h-4 text-emerald-500" />
                <span>Classroom Entrance Hardware Simulator (Dual-Factor Edge AI)</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                RFID + Iris Biometrics
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Simulates door kiosk swiping RFID smart cards and running real-time 128D visual neural matching (Cosine Similarity ≥ 85%). Zero student phone dependency.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveRosterTab('DOOR_LEDGER');
                handleSimulateDoorTaps('BIOMETRIC_ALL');
              }}
              disabled={isSimulatingTaps}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Verify All via Biometrics (100%)</span>
            </button>
            <button
              onClick={() => {
                setActiveRosterTab('DOOR_LEDGER');
                handleSimulateDoorTaps('IMPOSTOR');
              }}
              disabled={isSimulatingTaps}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>⚡ Test Impostor Proxy Swap</span>
            </button>
            <button
              onClick={() => {
                setActiveRosterTab('DOOR_LEDGER');
                handleSimulateDoorTaps('PARTIAL');
              }}
              disabled={isSimulatingTaps}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 border border-zinc-200 dark:border-zinc-700"
            >
              Simulate 85%
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

        {/* Dual-Column Layout: Embedded Biometric Terminal on Left, Entrance Ledger on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT 5-COL: Embedded Edge Biometric Terminal & Hardware Kiosk */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4 flex flex-col justify-between shadow-sm dark:shadow-2xl">
            <div>
              {/* Edge Biometric Kiosk Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <Scan className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                    Edge Biometric Kiosk Node
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Door Terminal 101 • Live
                </span>
              </div>

              {/* BIOMETRIC TERMINAL VIEW */}
              <div className="space-y-4">
                  
                  {/* High-Tech Optical Sensor Viewport Simulation */}
                  <div className="relative rounded-2xl bg-zinc-950 border border-zinc-800 p-4 overflow-hidden h-44 flex flex-col items-center justify-center text-center shadow-inner">
                    {/* Corner Reticles */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-500/80" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-500/80" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-500/80" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500/80" />

                    {/* Scanning Laser Line */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse opacity-80" />

                    {/* Central Iris & Facial Geometry Target */}
                    <div className="relative w-20 h-20 rounded-full border-2 border-emerald-500/60 flex items-center justify-center animate-pulse">
                      <div className="w-10 h-10 rounded-full border border-dashed border-emerald-400/80 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50" />
                      </div>
                      <Eye className="w-5 h-5 text-emerald-400/40 absolute" />
                    </div>

                    <div className="mt-2 text-center">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
                        ● OPTICAL BIOMETRIC READY (128D VECTOR)
                      </span>
                    </div>
                  </div>

                  {/* Hardware ID Card Tap & Biometric Matcher Controls */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Select Student Card to Simulate</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">1-Touch Test</span>
                    </div>

                    <select
                      value={selectedKioskStudent}
                      onChange={(e) => {
                        setSelectedKioskStudent(e.target.value);
                        setBiometricFeedback(null);
                      }}
                      className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                    >
                      {students.map((st) => (
                        <option key={st.user_id || st.student_id} value={st.user_id || st.student_id}>
                          {st.name} ({st.student_id || st.user_id}) - Card: NFC-{(st.student_id || st.user_id).slice(-4)}
                        </option>
                      ))}
                    </select>

                    {/* Dual Action Match Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleTestGenuineBiometric()}
                        disabled={isBiometricTesting}
                        className="w-full py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1"
                        title="Simulate genuine student face/iris matching their enrolled smart card"
                      >
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>{isBiometricTesting ? 'Matching...' : 'Test Genuine (97%)'}</span>
                      </button>

                      <button
                        onClick={() => handleTestImpostorBiometric()}
                        disabled={isBiometricTesting}
                        className="w-full py-2.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1"
                        title="Simulate friend proxy-tapping card while biometric mismatch occurs"
                      >
                        <UserX className="w-3.5 h-3.5 shrink-0" />
                        <span>{isBiometricTesting ? 'Testing...' : 'Test Impostor Swap'}</span>
                      </button>
                    </div>

                    {/* Optional Local Photo / ID Image Dropzone */}
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <input
                        ref={kioskFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleKioskImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => kioskFileInputRef.current?.click()}
                        className="w-full py-1.5 px-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-zinc-500" />
                        <span>Upload Custom Photo / ID Card to Test Embedding</span>
                      </button>
                    </div>
                  </div>

                  {/* Neural Metric Readout & Match Feedback Box */}
                  {biometricFeedback && (
                    <div className={`p-3.5 rounded-2xl border text-xs space-y-2 animate-fade-in ${
                      biometricFeedback.matched
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}>
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center space-x-1.5">
                          {biometricFeedback.matched ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                          )}
                          <span>{biometricFeedback.details}</span>
                        </span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/60 dark:bg-black/60 border border-current">
                          42ms (Edge AI)
                        </span>
                      </div>

                      {/* Cosine Similarity Bar */}
                      <div>
                        <div className="flex justify-between text-[10px] font-mono mb-1">
                          <span>Cosine Vector Similarity:</span>
                          <strong className="font-bold">{(biometricFeedback.similarity * 100).toFixed(1)}% (Threshold: 85.0%)</strong>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${biometricFeedback.matched ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(100, Math.max(5, biometricFeedback.similarity * 100))}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-[10px] opacity-80 font-mono">
                        {biometricFeedback.matched
                          ? 'Attendance committed directly to central database with cryptographic biometric signature.'
                          : 'Security breach logged to Dean/Faculty Watchdog: Proxy card-swap prevented.'}
                      </p>
                    </div>
                  )}

                </div>
              </div>

            {/* Standalone Fullscreen Kiosk Launcher */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900">
              <Link
                href={`/terminal?session=${sessionId}`}
                target="_blank"
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Launch Standalone Door Kiosk (Full Screen)</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>
            </div>
          </div>

          {/* RIGHT 7-COL: Classroom Entrance Live Ledger & Enrolled Roster */}
          <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm dark:shadow-2xl">
            
            {/* Header with Title and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>
                    {activeRosterTab === 'DOOR_LEDGER'
                      ? 'Classroom Entrance Live Ledger'
                      : 'Enrolled Course Roster'}
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {activeRosterTab === 'DOOR_LEDGER'
                    ? 'Real-time stream of students verified at the entrance terminal via RFID smartcard and edge computer vision.'
                    : `Complete course enrollment roster (${students.length} students) with real-time attendance compliance.`}
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

            {/* View Switcher Tabs: Live Entrance Ledger vs Enrolled Class Roster */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveRosterTab('DOOR_LEDGER')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeRosterTab === 'DOOR_LEDGER'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                <span>Live Entrance Ledger</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeRosterTab === 'DOOR_LEDGER'
                    ? 'bg-zinc-700 text-white dark:bg-zinc-200 dark:text-black'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                }`}>
                  {stats?.presentCount || 0} Verified
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
              {(activeRosterTab === 'DOOR_LEDGER' 
                ? filteredStudents.filter((s) => s.status === 'PRESENT' || s.attendance_status === 'PRESENT' || s.status === 'TAPPED_PENDING' || s.attendance_status === 'TAPPED_PENDING')
                : filteredStudents
              ).length === 0 ? (
                <div className="py-10 px-4 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <Scan className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto" />
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    No Entrance Verifications Recorded Yet
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                    Students will appear here live when they present their smart cards at the entrance kiosk and complete the 128D visual neural match.
                  </p>
                  <div className="pt-2 flex justify-center space-x-2">
                    <button
                      onClick={() => handleSimulateDoorTaps('BIOMETRIC_ALL')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      ⚡ Run Biometric Verification (100%)
                    </button>
                    <button
                      onClick={() => setActiveRosterTab('ALL_STUDENTS')}
                      className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold cursor-pointer"
                    >
                      View All {students.length} Students
                    </button>
                  </div>
                </div>
              ) : (
                (activeRosterTab === 'DOOR_LEDGER' 
                  ? filteredStudents.filter((s) => s.status === 'PRESENT' || s.attendance_status === 'PRESENT' || s.status === 'TAPPED_PENDING' || s.attendance_status === 'TAPPED_PENDING')
                  : filteredStudents
                ).map((st) => {
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
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {isPresent
                            ? `Entrance Verified at ${st.verified_at ? new Date(st.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:04 AM'} • Node: ${st.device_id || 'DOOR_KIOSK_101'}`
                            : isPending
                            ? `Card presented at Entrance Door (Pending Neural Vector Match)`
                            : `Awaiting student entrance`}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isPresent ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80 flex items-center space-x-1 shadow-xs">
                              <Check className="w-3 h-3" />
                              <span>RFID + Biometric AI</span>
                            </span>
                          </div>
                        ) : isPending ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 animate-pulse">
                              Card Tapped
                            </span>
                            <button
                              onClick={() => handleVerifyDoorStudent(st.user_id || st.student_id)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                              title="Faculty manual override: confirm student presence"
                            >
                              ✓ Verify
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleTestGenuineBiometric(st.user_id || st.student_id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold transition-all cursor-pointer"
                              title="Simulate edge biometric tap for this student"
                            >
                              ⚡ Biometric Tap
                            </button>
                            <button
                              onClick={() => handleVerifyDoorStudent(st.user_id || st.student_id)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                              title="Faculty manual visual presence override"
                            >
                              Visual Override
                            </button>
                          </div>
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

    </div>
  );
}
