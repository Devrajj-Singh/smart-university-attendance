'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  AlertTriangle, 
  Users, 
  Search, 
  CheckCircle2, 
  GraduationCap,
  Filter
} from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [classFilter, setClassFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [classFilter]);

  const fetchReports = async () => {
    try {
      let url = '/api/reports';
      if (classFilter !== 'ALL') {
        url += `?classId=${classFilter}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
        setTotalStudents(data.totalStudents || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredReports = reports.filter(
    (s) =>
      s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id?.includes(searchQuery)
  );

  const safeCount = reports.filter((s) => s.attendanceStatus === 'SAFE').length;
  const warningCount = reports.filter((s) => s.attendanceStatus === 'WARNING').length;
  const criticalCount = reports.filter((s) => s.attendanceStatus === 'CRITICAL').length;

  return (
    <div className="flex-1 flex w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 antialiased font-sans transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Printable University Header (Visible only when printed) */}
        <div className="hidden print:block text-center pb-4 border-b-2 border-zinc-900 mb-6 text-black">
          <h1 className="text-xl font-bold uppercase tracking-wider">CHRIST (Deemed to be University)</h1>
          <h2 className="text-sm font-semibold">DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING</h2>
          <p className="text-xs">Official Student Attendance Ledger & Academic Compliance Audit • Semester 2026</p>
        </div>

        {/* Screen Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 print:hidden transition-colors shadow-sm dark:shadow-2xl">
          <div>
            <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
              <GraduationCap className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <span>Official Academic Records & Audit</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Student Attendance Reports
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Semester-wide attendance analytics, statutory 75% examination eligibility tracking, and verified attendance ledgers.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold flex items-center space-x-2 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Audit Sheet</span>
            </button>

            <a
              href="/api/reports?format=csv"
              download="student_attendance_report.csv"
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center space-x-2 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Official CSV</span>
            </a>
          </div>
        </div>

        {/* High-Level Compliance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Enrolled</span>
              <Users className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">{totalStudents}</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Sections CSE-A & CSE-B</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Exam Eligible (≥ 75%)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{safeCount}</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Cleared for end-sem exams</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Warning Zone (65-74%)</span>
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{warningCount}</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Requires 2 to 4 classes</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Statutory Critical (&lt; 65%)</span>
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">{criticalCount}</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Barred from exam hall tickets</p>
          </div>

        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 print:hidden shadow-sm dark:shadow-xs">
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-zinc-400 ml-1" />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Filter Section:</span>
            <div className="flex items-center space-x-1.5">
              {['ALL', 'CLS001', 'CLS002'].map((cId) => (
                <button
                  key={cId}
                  onClick={() => setClassFilter(cId)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                    classFilter === cId
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent shadow-xs font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  {cId === 'ALL' ? 'All Batches' : cId === 'CLS001' ? 'CSE-A' : 'CSE-B'}
                </button>
              ))}
            </div>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            />
          </div>

        </div>

        {/* Student Records Table */}
        <div className="rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm dark:shadow-2xl">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider font-mono">
              Student Attendance Ledger ({filteredReports.length} Students)
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">
              Regulation: Minimum 75% required
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 font-mono uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Reg Number</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Class / Section</th>
                  <th className="py-3 px-4 font-semibold text-center">Attended / Total</th>
                  <th className="py-3 px-4 font-semibold text-center">Aggregate %</th>
                  <th className="py-3 px-4 font-semibold text-center">Compliance Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Shortfall Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono">
                      Loading certified attendance records...
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      No student records match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((student) => {
                    const attended = Number(student.attended_count ?? student.attended_sessions ?? 0);
                    const total = Number(student.total_held ?? student.total_sessions ?? 1);
                    const pct = Number(student.percentage ?? student.attendance_percentage ?? (total > 0 ? (attended / total) * 100 : 0));
                    
                    let badgeClass = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400';
                    let statusLabel = 'Eligible (≥75%)';

                    if (pct < 65) {
                      badgeClass = 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800/80 text-rose-700 dark:text-rose-400';
                      statusLabel = 'Critical Shortfall';
                    } else if (pct < 75) {
                      badgeClass = 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800/80 text-amber-700 dark:text-amber-400';
                      statusLabel = 'Warning (Notice)';
                    }

                    return (
                      <tr 
                        key={student.student_id} 
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-medium text-zinc-700 dark:text-zinc-300">
                          {student.student_id}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-white">
                          {student.student_name}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
                          {student.class_name || 'B.Tech CSE'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">
                          {attended} / {total}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          <span className={pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 65 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}>
                            {pct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {pct < 75 ? (
                            <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                              Needs +{student.classesNeededFor75 || Math.max(1, Math.ceil(3 * total - 4 * attended))} lectures
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-end space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Good Standing</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>
    </div>
  );
}
