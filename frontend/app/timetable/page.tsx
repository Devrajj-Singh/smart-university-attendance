'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  CalendarDays, 
  Clock, 
  Building, 
  Users, 
  Play, 
  BookOpen, 
  AlertCircle,
  CheckCircle2,
  Lock,
  PlusCircle,
  X,
  Search,
  UserCheck
} from 'lucide-react';

export default function TimetablePage() {
  const router = useRouter();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Manual lecture modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [meta, setMeta] = useState<any>({ subjects: [], classes: [], classrooms: [] });
  const [manualForm, setManualForm] = useState({
    subjectId: 'SUB001',
    classId: 'CLS001',
    classroomId: 'ROOM001',
    reason: 'Ad-hoc Makeup Lecture',
  });
  const [isStarting, setIsStarting] = useState(false);

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/timetable').then((r) => r.json()),
      fetch('/api/meta').then((r) => r.json()),
    ])
      .then(([userData, ttData, metaData]) => {
        if (userData.authenticated) setUser(userData.user);
        if (ttData.success) setTimetable(ttData.timetable || []);
        if (metaData.success) setMeta(metaData);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  /**
   * Evaluates if a lecture slot can legally be launched based on university rules.
   * Faculty can only launch attendance 15 minutes before slot or during class time on that day.
   */
  const getSlotEligibility = (slot: any) => {
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const now = new Date();
    const currentDay = dayNames[now.getDay()];

    const isToday = slot.day_of_week === currentDay;

    // Time calculations
    const [startH, startM] = slot.start_time.split(':').map(Number);
    const [endH, endM] = slot.end_time.split(':').map(Number);

    const slotStartMin = startH * 60 + startM;
    const slotEndMin = endH * 60 + endM;
    const currentMin = now.getHours() * 60 + now.getMinutes();

    // 15 minutes before slot start up to slot end
    const isWithinWindow = isToday && (currentMin >= (slotStartMin - 15) && currentMin <= slotEndMin);

    return {
      canLaunch: isWithinWindow,
      isToday,
      reason: !isToday 
        ? `Scheduled for ${slot.day_of_week}` 
        : currentMin < (slotStartMin - 15) 
        ? `Window opens at ${new Date(now.setHours(startH, startM - 15)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
        : currentMin > slotEndMin
        ? 'Slot time concluded'
        : 'Active Window Available',
    };
  };

  const handleLaunchSession = async (slot: any) => {
    setIsStarting(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timetableId: slot.timetable_id,
          subjectId: slot.subject_id,
          classId: slot.class_id,
          classroomId: slot.classroom_id,
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        router.push(`/session/${data.session.session_id}`);
      } else {
        alert(data.error || 'Failed to start session.');
      }
    } catch {
      alert('Error communicating with session server.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleLaunchManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStarting(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: manualForm.subjectId,
          classId: manualForm.classId,
          classroomId: manualForm.classroomId,
          isAdhoc: true,
          adhocReason: manualForm.reason,
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        router.push(`/session/${data.session.session_id}`);
      } else {
        alert(data.error || 'Failed to initialize ad-hoc session.');
      }
    } catch {
      alert('Network error launching ad-hoc session.');
    } finally {
      setIsStarting(false);
    }
  };

  const filteredTimetable = timetable
    .filter((t) => selectedDay === 'ALL' || t.day_of_week === selectedDay)
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.subject_name?.toLowerCase().includes(q) ||
        t.subject_code?.toLowerCase().includes(q) ||
        t.faculty_name?.toLowerCase().includes(q) ||
        t.class_name?.toLowerCase().includes(q) ||
        t.room_number?.toString().includes(q)
      );
    });

  return (
    <div className="flex-1 flex w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 antialiased font-sans transition-colors duration-200">
      <Sidebar userRole={user?.role} />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm dark:shadow-2xl">
          <div>
            <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
              <CalendarDays className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <span>{isAdmin ? 'Dean Curriculum Matrix Oversight' : 'Academic Curriculum Schedule'}</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Class Timetable Matrix
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {isAdmin 
                ? 'Supervisory view: Search and inspect all faculty class allocations across the academic week.'
                : 'Statutory attendance window unlocks 15 minutes prior to scheduled lecture time.'}
            </p>
          </div>

          {!isAdmin && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowManualModal(true)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center space-x-2 transition-all shadow-md cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Launch Ad-hoc Makeup Lecture</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter and Search Bar (Works for both Admin and Faculty) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-xs">
          
          {/* Day Switcher */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedDay('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                selectedDay === 'ALL'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              All Week
            </button>
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  selectedDay === day
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Search Bar for Timetable (by Faculty Name or Subject Name) */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by faculty name or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>

        </div>

        {/* Timetable Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full py-16 text-center text-zinc-500 font-mono text-xs">
              Loading academic schedule...
            </div>
          ) : filteredTimetable.length === 0 ? (
            <div className="col-span-full py-16 text-center text-zinc-500 text-xs">
              No classes match the search query "{searchQuery}" for {selectedDay}.
            </div>
          ) : (
            filteredTimetable.map((slot) => {
              const { canLaunch, reason } = getSlotEligibility(slot);

              return (
                <div
                  key={slot.timetable_id}
                  className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md flex flex-col justify-between space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-300">
                        {slot.subject_code}
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 font-mono">
                        {slot.day_of_week}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">
                        {slot.subject_name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {slot.class_name} • Room {slot.room_number} ({slot.building})
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-1.5 text-zinc-700 dark:text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                        {slot.faculty_name}
                      </span>
                    </div>
                  </div>

                  {/* Action / Information Section */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    {isAdmin ? (
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs">
                        <span className="text-[11px] font-medium">Invigilator: <strong className="text-zinc-900 dark:text-white">{slot.faculty_name}</strong></span>
                      </div>
                    ) : canLaunch ? (
                      <button
                        onClick={() => handleLaunchSession(slot)}
                        disabled={isStarting}
                        className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Launch Attendance Window</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs">
                        <div className="flex items-center space-x-1.5">
                          <Lock className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-[11px] font-medium">{reason}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
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
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLaunchManual} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Subject</label>
                <select
                  value={manualForm.subjectId}
                  onChange={(e) => setManualForm({ ...manualForm, subjectId: e.target.value })}
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
                  value={manualForm.classId}
                  onChange={(e) => setManualForm({ ...manualForm, classId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                >
                  {meta.classes?.map((c: any) => (
                    <option key={c.class_id} value={c.class_id}>
                      {c.class_name} ({c.academic_year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Classroom Location</label>
                <select
                  value={manualForm.classroomId}
                  onChange={(e) => setManualForm({ ...manualForm, classroomId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                >
                  {meta.classrooms?.map((r: any) => (
                    <option key={r.classroom_id} value={r.classroom_id}>
                      Room {r.room_number} ({r.building})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Ad-hoc Reason</label>
                <input
                  type="text"
                  value={manualForm.reason}
                  onChange={(e) => setManualForm({ ...manualForm, reason: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                  required
                />
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
