'use client';

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ExternalLink, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Terminal, 
  Code2, 
  Copy,
  Check,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { WebhookSubscription, WebhookDeliveryLog } from '@/lib/webhooks';

export default function WebhookConsole() {
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [logs, setLogs] = useState<WebhookDeliveryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiring, setIsFiring] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WebhookDeliveryLog | null>(null);
  const [copied, setCopied] = useState(false);

  // New webhook registration form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const fetchWebhookData = async () => {
    try {
      const res = await fetch('/api/webhooks');
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        setLogs(data.logs || []);
        if (data.logs?.length && !selectedLog) {
          setSelectedLog(data.logs[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch webhook data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookData();
  }, []);

  const handleFireTestEvent = async (eventType: string) => {
    setIsFiring(true);
    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType }),
      });
      const data = await res.json();
      if (data.success && data.deliveries?.length) {
        setSelectedLog(data.deliveries[0]);
        fetchWebhookData();
      }
    } catch (err) {
      console.error('Failed to fire test webhook:', err);
    } finally {
      setIsFiring(false);
    }
  };

  const handleRegisterWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setIsRegistering(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl,
          name: newName || 'Custom Automation Listener',
          eventTypes: ['compliance.threshold.breach', 'compliance.statutory.critical', 'security.impostor_detected'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewUrl('');
        setNewName('');
        fetchWebhookData();
      } else {
        alert(data.error || 'Failed to register webhook');
      }
    } catch {
      alert('Error registering webhook');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE' });
      fetchWebhookData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyPayload = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Enterprise Event Bus &amp; Webhook Dispatcher</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
              HMAC SHA-256
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Event-driven webhook engine for n8n, Make.com, HubSpot, Zapier, and custom external receivers.
          </p>
        </div>

        {/* Action Buttons: Add Webhook & Download n8n Blueprint */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/smartcampus-n8n-workflow.json"
            download="smartcampus-n8n-workflow.json"
            className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 text-xs font-bold font-mono flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download n8n Blueprint (.json)</span>
          </a>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Listener</span>
          </button>
        </div>
      </div>

      {/* Quick Test Trigger Buttons */}
      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Fire Real-time Test Webhook Event:</span>
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleFireTestEvent('compliance.threshold.breach')}
            disabled={isFiring}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold font-mono transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            ⚡ 75% Warning Breach
          </button>

          <button
            onClick={() => handleFireTestEvent('compliance.statutory.critical')}
            disabled={isFiring}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold font-mono transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            ⚡ 65% Barred Critical
          </button>

          <button
            onClick={() => handleFireTestEvent('security.impostor_detected')}
            disabled={isFiring}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold font-mono transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            ⚡ Impostor Biometric Mismatch
          </button>
        </div>
      </div>

      {/* Dual Column: Subscriptions & Delivery Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
        
        {/* LEFT 6-COL: Registered Webhook Listeners */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider">
              Active Listeners ({subscriptions.length}):
            </span>
          </div>

          <div className="space-y-2.5">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                      {sub.name}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 break-all block mt-0.5">
                      {sub.url}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteWebhook(sub.id)}
                    className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                    title="Delete Webhook"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sub.eventTypes.map((ev) => (
                    <span
                      key={ev}
                      className="px-2 py-0.5 rounded text-[9px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Log History Mini-Table */}
          <div className="pt-3 space-y-2">
            <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider block">
              Recent Dispatches:
            </span>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono cursor-pointer transition-all ${
                    selectedLog?.id === log.id
                      ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600'
                      : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-zinc-900 dark:text-white block text-[11px]">
                      {log.eventType}
                    </span>
                    <span className="text-[9px] text-zinc-400">
                      {new Date(log.timestamp).toLocaleTimeString()} • Latency: {log.latencyMs}ms
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.statusCode === 200
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                  }`}>
                    {log.statusCode || 200} OK
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 6-COL: Live Payload Terminal Inspector */}
        <div className="lg:col-span-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-zinc-500" />
              <span>Payload Inspector (Signed JSON)</span>
            </span>

            {selectedLog && (
              <button
                onClick={handleCopyPayload}
                className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center space-x-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 h-[380px] overflow-y-auto shadow-inner">
            {selectedLog ? (
              <pre className="text-[11px] leading-relaxed text-emerald-400">
                {JSON.stringify(selectedLog.payload, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
                Select a dispatch from the left to inspect its signed payload.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Webhook Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-zinc-900 border border-zinc-800 text-white space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider">
              Register Webhook Endpoint
            </h3>

            <form onSubmit={handleRegisterWebhook} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Listener Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Production n8n Workflow"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Target Webhook URL:</label>
                <input
                  type="url"
                  required
                  placeholder="https://your-domain.com/webhook/smartcampus"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isRegistering ? 'Registering...' : 'Register Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
