'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Users, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserPlus, 
  Calendar,
  XCircle,
  Inbox,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  KeyRound,
  LogIn
} from 'lucide-react';

export default function DelegationPage() {
  const router = useRouter();
  const [delegations, setDelegations] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ faculty: [], subjects: [] });
  const [timetable, setTimetable] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Tab State
  const [facultyTab, setFacultyTab] = useState<'MY_REQUESTS' | 'INCOMING'>('MY_REQUESTS');
  const [adminFilter, setAdminFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Form State
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [substituteFacultyId, setSubstituteFacultyId] = useState('');
  const [delegationDate, setDelegationDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    setDelegationDate(new Date().toISOString().split('T')[0]);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userRes, delRes, metaRes, ttRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/delegation').then((r) => r.json()),
        fetch('/api/meta').then((r) => r.json()),
        fetch('/api/timetable').then((r) => r.json()),
      ]);

      if (userRes.authenticated) setUser(userRes.user);
      if (delRes.success) setDelegations(delRes.delegations || []);
      if (metaRes.success) {
        setMeta(metaRes);
        const otherFaculty = metaRes.faculty?.find((f: any) => f.user_id !== userRes.user?.userId);
        if (otherFaculty) {
          setSubstituteFacultyId(otherFaculty.user_id);
        }
      }
      if (ttRes.success && ttRes.timetable?.length > 0) {
        setTimetable(ttRes.timetable);
        setSelectedTimetableId(ttRes.timetable[0].timetable_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/delegation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timetableId: selectedTimetableId,
          substituteFacultyId,
          date: delegationDate,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ success: true, message: 'Delegation request successfully dispatched to substitute faculty.' });
        setReason('');
        loadData();
      } else {
        setFeedback({ success: false, error: data.error || 'Failed to submit delegation.' });
      }
    } catch {
      setFeedback({ success: false, error: 'Network communication error.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (delegationId: string, action: 'APPROVE' | 'REJECT' | 'REVOKE') => {
    try {
      const res = await fetch('/api/delegation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delegationId, action }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.error || 'Action failed.');
      }
    } catch {
      alert('Error updating delegation status.');
    }
  };

  // Quick Account Switcher Helper for testing
  const handleQuickSwitch = async (id: string, pass: string) => {
    await fetch('/api/auth/logout', { method: 'POST' });
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: id, password: pass, portalRole: 'FACULTY' }),
    });
    if (res.ok) {
      window.location.reload();
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  // Filtered lists for Faculty
  const myRequests = delegations.filter((d) => d.original_faculty_id === user?.userId);
  const incomingRequests = delegations.filter((d) => d.substitute_faculty_id === user?.userId);

  // Filtered lists for Admin
  const adminPending = delegations.filter((d) => d.status === 'PENDING');
  const adminApproved = delegations.filter((d) => d.status === 'APPROVED' || d.status === 'ACTIVE');
  const adminRejected = delegations.filter((d) => d.status === 'REJECTED' || d.status === 'REVOKED');

  const displayedList = isAdmin 
    ? (adminFilter === 'ALL' 
        ? delegations 
        : adminFilter === 'PENDING' 
        ? adminPending 
        : adminFilter === 'APPROVED' 
        ? adminApproved 
        : adminRejected)
    : (facultyTab === 'MY_REQUESTS' 
        ? myRequests 
        : incomingRequests);

  return (
    <div className="flex-1 flex w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 antialiased font-sans transition-colors duration-200">
      <Sidebar userRole={user?.role} />

      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8 w-full overflow-hidden">
        
        {/* Header */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm dark:shadow-2xl">
          <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> : <Users className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />}
            <span>{isAdmin ? 'Academic Dean Oversight Registry' : 'Academic Faculty Substitution Workflow'}</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {isAdmin ? 'Campus Faculty Substitution Audit Registry' : 'Lecture Substitution Management'}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {isAdmin 
              ? 'Complete institutional audit trail of all peer-to-peer faculty lecture delegations and authorization statuses across campus.'
              : 'Delegate scheduled classes to peer faculty. Designated substitute professors review and authorize substitution requests directly from their portal.'}
          </p>
        </div>

        {/* Informative Hint Banner for Credentials - ONLY for Faculty */}
        {!isAdmin && (
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-zinc-900 dark:text-white">Reviewer Credentials Note: </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  To approve substitutions sent to <strong>Prof. Sanjay Mehta</strong>, sign in as <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-800 dark:text-zinc-200">F002</code> (Password: <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-800 dark:text-zinc-200">faculty123</code>).
                </span>
              </div>
            </div>
            {user?.loginId !== 'F002' && (
              <button
                onClick={() => handleQuickSwitch('F002', 'faculty123')}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold shrink-0 transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Switch to Prof. Sanjay Mehta</span>
              </button>
            )}
          </div>
        )}

        <div className={`grid grid-cols-1 ${isAdmin ? 'grid-cols-1' : 'lg:grid-cols-12'} gap-8`}>
          
          {/* Left: Request Form - ONLY rendered for Faculty, NEVER for Admin */}
          {!isAdmin && (
            <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5 h-fit shadow-sm dark:shadow-2xl">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center space-x-2 border-b border-zinc-100 dark:border-zinc-900 pb-3 font-mono">
                <UserPlus className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                <span>Request Class Substitution</span>
              </h2>

              {feedback && (
                <div className={`p-3 rounded-2xl text-xs flex items-center space-x-2 ${
                  feedback.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300'
                }`}>
                  {feedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{feedback.message || feedback.error}</span>
                </div>
              )}

              <form onSubmit={handleRequestDelegation} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Assigned Lecture Slot
                  </label>
                  <select
                    value={selectedTimetableId}
                    onChange={(e) => setSelectedTimetableId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                  >
                    {timetable.map((t) => (
                      <option key={t.timetable_id} value={t.timetable_id}>
                        {t.subject_code} - {t.subject_name} ({t.day_of_week} {t.start_time.slice(0, 5)}) - {t.class_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Designated Substitute Faculty
                  </label>
                  <select
                    value={substituteFacultyId}
                    onChange={(e) => setSubstituteFacultyId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                  >
                    {meta.faculty?.map((f: any) => (
                      <option key={f.user_id} value={f.user_id}>
                        {f.name} ({f.department || 'Computer Science'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Delegation Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={delegationDate}
                      onChange={(e) => setDelegationDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Academic Justification / Notes
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Official duties, research symposium, or approved medical leave..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Transmitting Request...' : 'Submit Delegation Request'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Right / Full Width: Delegations Ledger */}
          <div className={`${isAdmin ? 'col-span-12' : 'lg:col-span-7'} space-y-4`}>
            
            {/* Tabs */}
            <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-900 pb-2">
              {isAdmin ? (
                // ADMIN TABS (No "My" word)
                <>
                  <button
                    onClick={() => setAdminFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      adminFilter === 'ALL'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    All Campus Delegations ({delegations.length})
                  </button>

                  <button
                    onClick={() => setAdminFilter('PENDING')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      adminFilter === 'PENDING'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Pending Review ({adminPending.length})
                  </button>

                  <button
                    onClick={() => setAdminFilter('APPROVED')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      adminFilter === 'APPROVED'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Approved ({adminApproved.length})
                  </button>

                  <button
                    onClick={() => setAdminFilter('REJECTED')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      adminFilter === 'REJECTED'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Declined / Revoked ({adminRejected.length})
                  </button>
                </>
              ) : (
                // FACULTY TABS
                <>
                  <button
                    onClick={() => setFacultyTab('MY_REQUESTS')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      facultyTab === 'MY_REQUESTS'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    My Outgoing Requests ({myRequests.length})
                  </button>

                  <button
                    onClick={() => setFacultyTab('INCOMING')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      facultyTab === 'INCOMING'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Incoming for My Review ({incomingRequests.length})
                  </button>
                </>
              )}
            </div>

            {/* List */}
            <div className="space-y-3">
              {displayedList.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <Inbox className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {isAdmin
                      ? 'No delegation records found matching the selected filter.'
                      : facultyTab === 'MY_REQUESTS'
                      ? 'You have not submitted any substitution requests.'
                      : `No pending substitution requests assigned to ${user?.name || 'you'}. (Note: To review requests sent to Prof. Sanjay Mehta, switch to F002).`}
                  </p>
                </div>
              ) : (
                displayedList.map((del) => {
                  const isRequester = del.original_faculty_id === user?.userId;
                  const isRecipient = del.substitute_faculty_id === user?.userId;
                  const isPending = del.status === 'PENDING';
                  const isApproved = del.status === 'APPROVED' || del.status === 'ACTIVE';
                  const isRejected = del.status === 'REJECTED';
                  const isRevoked = del.status === 'REVOKED';

                  return (
                    <div
                      key={del.delegation_id}
                      className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-md space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono">
                              {del.subject_code} - {del.subject_name}
                            </span>
                            <span className="text-[10px] text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                              {del.class_name} • Room {del.room_number}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                            Slot: {del.day_of_week} ({del.start_time?.slice(0, 5)} - {del.end_time?.slice(0, 5)}) • Date: <strong className="text-zinc-800 dark:text-zinc-200">{del.delegation_date?.slice(0, 10)}</strong>
                          </p>
                        </div>

                        {/* Status Badge (Prominent on all cards) */}
                        <div>
                          {isApproved && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>APPROVED</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-amber-700 dark:text-amber-400 flex items-center space-x-1 animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>PENDING REVIEW</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/80 text-rose-700 dark:text-rose-400 flex items-center space-x-1">
                              <XCircle className="w-3 h-3" />
                              <span>DECLINED</span>
                            </span>
                          )}
                          {isRevoked && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                              REVOKED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Direction Overview */}
                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
                        <div>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase block font-mono">Requesting Faculty</span>
                          <span className="font-semibold text-zinc-900 dark:text-white">{del.original_faculty_name || 'Dr. Anita Rao'}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-400" />
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase block font-mono">Designated Substitute</span>
                          <span className="font-semibold text-zinc-900 dark:text-white">{del.substitute_faculty_name || 'Prof. Sanjay Mehta'}</span>
                        </div>
                      </div>

                      {del.reason && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                          "{del.reason}"
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-900 text-[10px] text-zinc-400 font-mono">
                        <span>ID: {del.delegation_id}</span>

                        <div className="flex items-center space-x-2">
                          {/* Requester can only view status or revoke their own pending request */}
                          {!isAdmin && isRequester && isPending && (
                            <button
                              onClick={() => handleAction(del.delegation_id, 'REVOKE')}
                              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                            >
                              Cancel Request
                            </button>
                          )}

                          {/* Designated substitute faculty can Approve or Reject */}
                          {!isAdmin && isRecipient && isPending && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleAction(del.delegation_id, 'REJECT')}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-zinc-900 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-zinc-800 hover:border-rose-300 text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                              <button
                                onClick={() => handleAction(del.delegation_id, 'APPROVE')}
                                className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center space-x-1 transition-all shadow-sm cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Accept Substitution</span>
                              </button>
                            </div>
                          )}

                          {isAdmin && (
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                              Dean Audit Record • Non-editable
                            </span>
                          )}
                        </div>
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
