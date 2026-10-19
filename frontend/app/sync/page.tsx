'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  RefreshCw, 
  Radio, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  Wifi, 
  WifiOff,
  Server
} from 'lucide-react';

export default function SyncHubPage() {
  const [stats, setStats] = useState<any>({ totalRecords: 0, pendingSync: 0, syncedRecords: 0 });
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [isSimulatedOnline, setIsSimulatedOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchSyncData();
  }, []);

  const fetchSyncData = async () => {
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setPendingItems(data.pendingItems || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleOnline = async () => {
    const newState = !isSimulatedOnline;
    setIsSimulatedOnline(newState);

    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SET_ONLINE_STATUS', online: newState }),
      });
      fetchSyncData();
    } catch {
      // Ignored for simulation
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TRIGGER_MANUAL_SYNC' }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`Reconciliation completed. ${data.syncedCount || 0} local ledger records merged with central PostgreSQL.`);
        fetchSyncData();
      } else {
        setFeedback('Synchronization failed. Check central server connectivity.');
      }
    } catch {
      setFeedback('Error communicating with sync engine.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 flex w-full bg-black text-zinc-100 antialiased font-sans">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 transition-colors shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 font-mono">
              <Radio className="w-3.5 h-3.5 text-zinc-300" />
              <span>Offline Edge Reconciler</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Edge Storage & Offline Synchronization
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Guarantees zero attendance data loss during classroom Wi-Fi outages with two-way reconciliation.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleOnline}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all ${
                isSimulatedOnline
                  ? 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800/80 animate-pulse'
              }`}
            >
              {isSimulatedOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
              <span>{isSimulatedOnline ? 'Simulate Edge Offline Mode' : 'Restore Online State'}</span>
            </button>

            <button
              onClick={handleTriggerSync}
              disabled={isSyncing || !isSimulatedOnline}
              className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold flex items-center space-x-2 transition-all shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Reconcile Central Database'}</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 flex items-center space-x-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xs">
            <span className="text-xs font-semibold text-zinc-400">Total Validated Records</span>
            <p className="text-2xl font-bold text-white mt-2">{stats.totalRecords || 0}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Across all historical sessions</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xs">
            <span className="text-xs font-semibold text-amber-400">Local Ledger Pending Sync</span>
            <p className="text-2xl font-bold text-amber-400 mt-2">{stats.pendingSync || 0}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Cached in offline browser SQLite / IndexedDB</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xs">
            <span className="text-xs font-semibold text-emerald-400">PostgreSQL Central Synchronized</span>
            <p className="text-2xl font-bold text-emerald-400 mt-2">{stats.syncedRecords || 0}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Certified with cryptographic checksum</p>
          </div>
        </div>

      </main>
    </div>
  );
}
