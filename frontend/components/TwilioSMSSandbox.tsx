'use client';

import React, { useState } from 'react';
import { 
  Smartphone, 
  Send, 
  Check, 
  CheckCheck, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  Sparkles,
  Phone,
  Signal,
  Wifi,
  Battery
} from 'lucide-react';

interface SMSMessage {
  id: string;
  recipient: string;
  phone: string;
  message: string;
  timestamp: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED';
  carrierAckMs: number;
}

export default function TwilioSMSSandbox() {
  const [selectedStudent, setSelectedStudent] = useState('25215114');
  const [alertType, setAlertType] = useState<'WARNING' | 'CRITICAL' | 'SECURITY'>('WARNING');
  const [isSending, setIsSending] = useState(false);

  const [messages, setMessages] = useState<SMSMessage[]>([
    {
      id: 'sms_001',
      recipient: 'Mr. Ramesh Sharma (Parent of Arjun Sharma)',
      phone: '+91 98765 43210',
      message: '🚨 URGENT SmartCampus Alert: Your ward Arjun Sharma (Roll #25215114) attendance has fallen to 68.2% in CSE-A (Below 75% Statutory Limit). Missing 2 more classes will bar exam hall ticket issuance. Contact proctor immediately.',
      timestamp: '10:04 AM',
      status: 'DELIVERED',
      carrierAckMs: 22,
    },
    {
      id: 'sms_002',
      recipient: 'Dr. Anita Rao (Course Faculty)',
      phone: '+91 98111 22334',
      message: 'SmartCampus Watchdog: Student #25215132 has dropped below 65% statutory critical threshold. Exam barring flag committed to PostgreSQL.',
      timestamp: '09:45 AM',
      status: 'DELIVERED',
      carrierAckMs: 18,
    },
  ]);

  const [activeMessageIndex, setActiveMessageIndex] = useState(0);

  const handleSendTestSMS = () => {
    setIsSending(true);
    const newMsg: SMSMessage = {
      id: `sms_${Date.now()}`,
      recipient: selectedStudent === '25215114' ? 'Parent of Arjun Sharma' : 'Parent of Rohan Gupta',
      phone: selectedStudent === '25215114' ? '+91 98765 43210' : '+91 98765 43232',
      message: alertType === 'WARNING'
        ? `🚨 SmartCampus Notice: Roll #${selectedStudent} attendance is at 68.5% (Warning Zone). 2 classes remaining before statutory exam disqualification.`
        : alertType === 'CRITICAL'
        ? `⚠️ CRITICAL NOTICE: Roll #${selectedStudent} has fallen to 59.2% attendance. Student is officially barred from examination hall tickets.`
        : `🚨 SECURITY BREACH: Biometric card-swap attempt detected for card belonging to Roll #${selectedStudent} at Door Kiosk 101.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'QUEUED',
      carrierAckMs: Math.floor(Math.random() * 15) + 12,
    };

    setMessages([newMsg, ...messages]);
    setActiveMessageIndex(0);

    setTimeout(() => {
      setMessages((prev) => prev.map((m) => m.id === newMsg.id ? { ...m, status: 'SENT' } : m));
      setTimeout(() => {
        setMessages((prev) => prev.map((m) => m.id === newMsg.id ? { ...m, status: 'DELIVERED' } : m));
        setIsSending(false);
      }, 700);
    }, 500);
  };

  const activeMsg = messages[activeMessageIndex] || messages[0];

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider">
              Twilio Multi-Channel SMS &amp; Notification Sandbox
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              Live Dispatcher
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Automated SMS dispatch sequence triggered whenever student compliance drops below 75% or 65% statutory threshold. Zero-credit sandbox mode active.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-zinc-400">
            Twilio SID: <code className="text-zinc-600 dark:text-zinc-300">AC_smartcampus_2026</code>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* LEFT 7-COL: Interactive Notification Dispatch Controls & History */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider block">
              1-Click Automated Alert Dispatch
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Target Student:</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="25215114">Arjun Sharma (Roll #25215114 - 68.2%)</option>
                  <option value="25215132">Rohan Gupta (Roll #25215132 - 59.1%)</option>
                  <option value="25215108">Ananya Roy (Roll #25215108 - Impostor Alert)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Alert Scenario:</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="WARNING">75% Statutory Warning Alert</option>
                  <option value="CRITICAL">65% Disqualification Bar Notice</option>
                  <option value="SECURITY">Edge Biometric Mismatch Incident</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSendTestSMS}
              disabled={isSending}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Dispatching via Twilio...' : '⚡ Dispatch Parent Alert SMS'}</span>
            </button>
          </div>

          {/* Outgoing Message Feed */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
              Recent Outgoing Messages ({messages.length}):
            </span>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  onClick={() => setActiveMessageIndex(index)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    activeMessageIndex === index
                      ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600'
                      : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="font-bold text-zinc-900 dark:text-white">{msg.recipient}</span>
                    <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      {msg.status === 'DELIVERED' ? (
                        <>
                          <CheckCheck className="w-3 h-3" />
                          <span>Delivered ({msg.carrierAckMs}ms)</span>
                        </>
                      ) : (
                        <span>{msg.status}...</span>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-2">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 5-COL: Realistic Smartphone Device Frame */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-68 sm:w-72 rounded-[40px] bg-black p-3.5 border-4 border-zinc-800 shadow-2xl relative">
            {/* Speaker & Dynamic Island */}
            <div className="w-20 h-4 bg-zinc-900 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-zinc-950 mr-2" />
              <div className="w-6 h-1 rounded-full bg-zinc-800" />
            </div>

            {/* Phone Screen */}
            <div className="rounded-[28px] bg-zinc-950 p-3 h-[380px] flex flex-col justify-between border border-zinc-800/80">
              {/* Status Bar */}
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1">
                <span>9:41</span>
                <div className="flex items-center space-x-1">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Message Header */}
              <div className="text-center py-1 border-b border-zinc-800">
                <span className="text-[11px] font-bold text-white block">SmartCampus SMS</span>
                <span className="text-[9px] text-zinc-500 font-mono">+1 (800) 555-0199</span>
              </div>

              {/* Chat Bubble Area */}
              <div className="flex-1 py-3 flex flex-col justify-end space-y-2">
                <div className="self-start max-w-[90%] p-3 rounded-2xl rounded-tl-xs bg-zinc-800 text-white text-[11px] space-y-1 shadow-md">
                  <p className="leading-snug">{activeMsg?.message}</p>
                  <div className="flex items-center justify-end space-x-1 text-[9px] text-zinc-400 font-mono">
                    <span>{activeMsg?.timestamp}</span>
                    {activeMsg?.status === 'DELIVERED' && (
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Simulated Input */}
              <div className="p-2 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 px-3">
                <span>SMS Alert Received</span>
                <span className="text-emerald-400 font-mono font-bold">● Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
