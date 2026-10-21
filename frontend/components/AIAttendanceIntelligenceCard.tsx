'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  TrendingDown, 
  Send, 
  ChevronRight,
  ShieldAlert,
  Bot
} from 'lucide-react';
import { AIComplianceBriefing } from '@/lib/ai-agent';

interface AIAttendanceCardProps {
  classId?: string;
}

export default function AIAttendanceIntelligenceCard({ classId = 'CLS001' }: AIAttendanceCardProps) {
  const [briefing, setBriefing] = useState<AIComplianceBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRoster, setShowRoster] = useState(false);

  const fetchBriefing = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ai/compliance-summary?classId=${classId}`);
      const data = await res.json();
      if (data.success && data.briefing) {
        setBriefing(data.briefing);
      }
    } catch (err) {
      console.error('Failed to load AI briefing:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [classId]);

  if (isLoading && !briefing) {
    return (
      <div className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 animate-pulse flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-zinc-800 text-zinc-500">
            <Bot className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="h-4 w-48 bg-zinc-800 rounded mb-1" />
            <div className="h-3 w-72 bg-zinc-800/60 rounded" />
          </div>
        </div>
        <div className="h-8 w-24 bg-zinc-800 rounded-xl" />
      </div>
    );
  }

  if (!briefing) return null;

  const isCritical = briefing.overallHealthTier === 'CRITICAL_RISK';
  const isModerate = briefing.overallHealthTier === 'MODERATE_RISK';

  return (
    <div className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 shadow-sm dark:shadow-xl ${
      isCritical
        ? 'bg-gradient-to-br from-rose-50/90 via-white to-rose-50/40 border-rose-200 text-zinc-900 dark:from-rose-950/40 dark:via-zinc-950 dark:to-black dark:border-rose-800/60 dark:text-zinc-100'
        : isModerate
        ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 border-amber-200 text-zinc-900 dark:from-amber-950/30 dark:via-zinc-950 dark:to-black dark:border-amber-800/50 dark:text-zinc-100'
        : 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-emerald-200 text-zinc-900 dark:from-emerald-950/30 dark:via-zinc-950 dark:to-black dark:border-emerald-800/40 dark:text-zinc-100'
    }`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-2xl border shadow-xs ${
            isCritical
              ? 'bg-rose-100 border-rose-300 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400'
              : isModerate
              ? 'bg-amber-100 border-amber-300 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400'
              : 'bg-emerald-100 border-emerald-300 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400'
          }`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                Autonomous Compliance AI Agent
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center space-x-1">
                <Cpu className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                <span>{briefing.engineUsed === 'GROK_LLM' ? 'Grok openai/gpt-oss-120b' : 'Heuristic Rules Engine'}</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Department of {briefing.department} • Section {briefing.classSection}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
            isCritical
              ? 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-300'
              : isModerate
              ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-950/80 dark:border-amber-800 dark:text-amber-300'
              : 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-300'
          }`}>
            ● {briefing.overallHealthTier.replace('_', ' ')}
          </span>

          <button
            onClick={fetchBriefing}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
            title="Re-run AI Compliance Synthesis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Natural Language Synthesis Narrative */}
      <div className="py-4">
        <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed font-sans">
          {briefing.summaryText}
        </p>
      </div>

      {/* Metric Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 pb-4">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-black/60 border border-zinc-200 dark:border-zinc-800/80 space-y-1 shadow-xs">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono uppercase tracking-wider">Average Compliance</span>
          <p className="text-xl font-bold text-zinc-900 dark:text-white font-mono">{briefing.averageAttendancePct}%</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">Target: ≥ 75.0% Statutory</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-black/60 border border-zinc-200 dark:border-zinc-800/80 space-y-1 shadow-xs">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono uppercase tracking-wider flex items-center space-x-1">
            <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            <span>Predicted 14-Day Disqualifications</span>
          </span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">{briefing.predictedBreachesNext14Days} Students</p>
          <span className="text-[10px] text-zinc-500 font-mono">Velocity Threshold &lt; 2 Misses</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-black/60 border border-zinc-200 dark:border-zinc-800/80 space-y-1 shadow-xs">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono uppercase tracking-wider">Automated Workflows</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{briefing.automatedActionRecommendations.length} Active</p>
          <span className="text-[10px] text-zinc-500 font-mono">n8n / CRM / Twilio Sync</span>
        </div>
      </div>

      {/* Action Recommendation Pills */}
      <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
        <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
          Automated Remediation Actions:
        </p>
        <div className="flex flex-wrap gap-2">
          {briefing.automatedActionRecommendations.map((action, i) => (
            <span
              key={i}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-xs flex items-center space-x-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span>{action}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Expandable At-Risk Student Forecast Table */}
      {briefing.topAtRiskStudents.length > 0 && (
        <div className="pt-4">
          <button
            onClick={() => setShowRoster(!showRoster)}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-mono flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <span>{showRoster ? '▼ Hide' : '▶ View'} Top {briefing.topAtRiskStudents.length} At-Risk Students &amp; Breach Forecast</span>
          </button>

          {showRoster && (
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1 animate-fade-in">
              {briefing.topAtRiskStudents.map((st) => (
                <div
                  key={st.studentId}
                  className="p-2.5 rounded-xl bg-white dark:bg-black/80 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono shadow-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-zinc-900 dark:text-white">{st.name}</span>
                      <span className="text-[10px] text-zinc-500">({st.studentId})</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Attended: {st.attended} / {st.total} • Status: <strong className={st.tier === 'STATUTORY_CRITICAL' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>{st.tier}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-bold ${st.currentPct < 65 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {st.currentPct}%
                    </span>
                    <p className="text-[10px] text-zinc-500">
                      {st.lecturesToBreach <= 1 ? '⚠️ 1 absence = barred' : `${st.lecturesToBreach} absences to bar`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
