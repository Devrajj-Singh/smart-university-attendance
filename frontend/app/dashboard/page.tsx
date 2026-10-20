'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  CalendarDays, 
  Clock, 
  Users, 
  CheckCircle2, 
  Play, 
  PlusCircle, 
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Radio,
  FileSpreadsheet,
  Zap,
  Sparkles,
  Check,
  Scan,
  ShieldAlert
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ subjects: [], classrooms: [], sections: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  // Manual session modal state (for Faculty only)
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSubject, setManualSubject] = useState('');
  const [manualClass, setManualClass] = useState('');
  const [manualRoom, setManualRoom] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  // Door Tap Simulator feedback state
  const [simFeedback, setSimFeedback] = useState<string | null>(null);
  const [isSimulatingTaps, setIsSimulatingTaps] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [userRes, sessRes, ttRes, metaRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/sessions').then((r) => r.json()),
        fetch('/api/timetable').then((r) => r.json()),
        fetch('/api/meta').then((r) => r.json()),
      ]);

      if (!userRes.authenticated) {
        router.push('/');
        return;
      }

      setUser(userRes.user);
      setSessions(sessRes.sessions || []);
      setTimetable(ttRes.timetable || []);
      setMeta(metaRes);

      if (metaRes.subjects?.length) setManualSubject(metaRes.subjects[0].subject_id);
      if (metaRes.sections?.length) setManualClass(metaRes.sections[0].class_id);
      if (metaRes.classrooms?.length) setManualRoom(metaRes.classrooms[0].classroom_id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartManualSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStarting(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: manualSubject,
          classId: manualClass,
          classroomId: manualRoom,
          sessionType: 'MANUAL',
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        router.push(`/session/${data.session.session_id}`);
      } else {
        alert(data.error || 'Failed to start manual session');
      }
    } catch {
      alert('Network error initializing session');
    } finally {
      setIsStarting(false);
    }
  };

  const handleSimulateDoorTaps = async (sessionId: string, mode: 'ALL' | 'PARTIAL' | 'RESET' | 'BIOMETRIC_ALL' | 'IMPOSTOR') => {
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
        loadDashboardData();
        setTimeout(() => setSimFeedback(null), 5000);
      } else {
        alert(data.error || 'Failed to simulate door taps');
      }
    } catch {
      alert('Error communicating with door tap simulator');
    } finally {
      setIsSimulatingTaps(false);
    }
  };

  // Find active lecture
  const activeSession = sessions.find((s) => s.status === 'ACTIVE');
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex-1 flex w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 antialiased font-sans transition-colors duration-200">
      <Sidebar userRole={user?.role} />

      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8 w-full overflow-hidden">
        
        {/* Welcome & Command Suite Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm dark:shadow-2xl">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-500 dark:text-zinc-400">
                {isAdmin ? 'Dean Administrative Control Node' : 'Faculty Command Suite'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              Welcome back, {user?.name || 'Academic Faculty'}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {isAdmin 
                ? 'Supervisory role: Inspecting faculty timetables, university health metrics, and student compliance records.' 
                : `${user?.department || 'Computer Science & Engineering'} • Faculty ID: ${user?.loginId || 'F001'}`}
            </p>
          </div>

          {/* ATTENDANCE TAKING BUTTONS: Offered ONLY to Faculty (NOT to Admin) */}
          <div className="flex items-center space-x-3">
            {isAdmin ? (
              <Link
                href="/admin"
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center space-x-2 transition-all shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Open Dean Admin Console</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Ad-hoc Lecture</span>
                </button>

                <Link
                  href="/timetable"
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center space-x-2 transition-all shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Live Attendance</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Live Active Lecture Session Radar Banner */}
        {activeSession && (
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center space-x-3">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      LIVE LECTURE IN PROGRESS
                    </span>
                    <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">ID: {activeSession.session_id}</span>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">
                    {activeSession.subject_name || 'Data Structures & Algorithms'} • {activeSession.class_name || 'CSE-A'} ({activeSession.room_number ? `Room ${activeSession.room_number}` : 'Room 101'})
                  </h3>
                </div>
              </div>

              {/* Action Buttons: Entrance Kiosk + Conductor Room for Faculty */}
              <div className="flex flex-wrap items-center gap-2">
                {!isAdmin ? (
                  <>
                    <Link
                      href={`/terminal?session=${activeSession.session_id}`}
                      target="_blank"
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-sm cursor-pointer"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      <span>Launch Entrance Kiosk</span>
                    </Link>

                    <Link
                      href={`/session/${activeSession.session_id}`}
                      className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <span>Conductor Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs font-mono border border-zinc-200 dark:border-zinc-800">
                    Live Session Active
                  </span>
                )}
              </div>
            </div>

            {/* CLASSROOM ENTRANCE TERMINAL SIMULATOR (Dual-Factor Edge AI) */}
            {!isAdmin && (
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                      <Scan className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Classroom Entrance Terminal Simulator (Dual-Factor Edge AI)</span>
                    </span>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Simulate entrance kiosk swiping RFID smart cards and running real-time visual vector matching (Cosine Similarity ≥ 85%). Zero student phone dependency.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleSimulateDoorTaps(activeSession.session_id, 'BIOMETRIC_ALL')}
                      disabled={isSimulatingTaps}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>⚡ Verify All via Biometrics (100%)</span>
                    </button>
                    <button
                      onClick={() => handleSimulateDoorTaps(activeSession.session_id, 'IMPOSTOR')}
                      disabled={isSimulatingTaps}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center space-x-1"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      <span>⚡ Test Impostor Swap</span>
                    </button>
                    <button
                      onClick={() => handleSimulateDoorTaps(activeSession.session_id, 'PARTIAL')}
                      disabled={isSimulatingTaps}
                      className="px-3 py-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-[11px] font-bold shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      85% Tap
                    </button>
                    <button
                      onClick={() => handleSimulateDoorTaps(activeSession.session_id, 'RESET')}
                      disabled={isSimulatingTaps}
                      className="px-2.5 py-1.5 rounded-xl text-zinc-500 hover:text-red-600 dark:hover:text-red-400 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {simFeedback && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-2 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{simFeedback}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Live Academic Telemetry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Classes Today</span>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{timetable.length || 7}</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Scheduled in semester timetable</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Enrolled Students</span>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">65</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Section CSE-A & Section CSE-B</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Average Compliance</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">84.2%</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Above 75% Accreditation Threshold</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">System Security</span>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">Edge AI 2FA</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Door RFID + 128D Neural Vector Match</p>
          </div>
        </div>

        {/* Today's Lecture Schedule Table */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider flex items-center space-x-2">
                <CalendarDays className="w-4 h-4 text-zinc-500" />
                <span>Today's Lecture Schedule</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Official curriculum schedule for current academic semester.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {timetable.length} Active Slots
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 font-mono uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Time Slot</th>
                  <th className="py-3 px-4 font-semibold">Subject</th>
                  <th className="py-3 px-4 font-semibold">Class Section</th>
                  <th className="py-3 px-4 font-semibold">Room</th>
                  <th className="py-3 px-4 font-semibold">Invigilator</th>
                  <th className="py-3 px-4 font-semibold text-right">
                    {isAdmin ? 'Status' : 'Action'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                {timetable.map((slot) => (
                  <tr key={slot.timetable_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 dark:text-white">
                      {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-white">
                      {slot.subject_name} ({slot.subject_code})
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                      {slot.class_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                      Room {slot.room_number}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                      {slot.faculty_name}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isAdmin ? (
                        <span className="text-[11px] font-mono text-zinc-500">
                          Assigned to {slot.faculty_name}
                        </span>
                      ) : (
                        <Link
                          href="/timetable"
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold text-[11px] inline-flex items-center space-x-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start Lecture</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Ad-hoc Lecture Creator Modal (Faculty only) */}
      {showManualModal && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-mono">Launch Ad-hoc Makeup Lecture</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartManualSession} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Subject</label>
                <select
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                >
                  {meta.subjects?.map((s: any) => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.subject_code} - {s.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Class Section</label>
                <select
                  value={manualClass}
                  onChange={(e) => setManualClass(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                >
                  {meta.sections?.map((c: any) => (
                    <option key={c.class_id} value={c.class_id}>
                      {c.class_name} ({c.academic_year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Classroom Location</label>
                <select
                  value={manualRoom}
                  onChange={(e) => setManualRoom(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                >
                  {meta.classrooms?.map((r: any) => (
                    <option key={r.classroom_id} value={r.classroom_id}>
                      Room {r.room_number} ({r.building})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStarting}
                  className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold shadow-md disabled:opacity-50"
                >
                  {isStarting ? 'Initializing...' : 'Launch Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
