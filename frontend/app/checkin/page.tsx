'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Scan, AlertTriangle, ArrowRight, Lock } from 'lucide-react';

export default function StudentCheckInRedirectPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 selection:bg-emerald-500 selection:text-black">
      <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 text-center space-y-6 shadow-2xl backdrop-blur-md">
        
        {/* Security Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-[10px] font-mono text-emerald-400 font-bold tracking-wider uppercase">
            <Lock className="w-3 h-3" />
            <span>Zero-Proxy Architecture Active</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Physical Entrance Kiosk Required
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            In compliance with University Statutory Attendance Regulations, mobile self-entry and remote registration number entry are permanently disabled.
          </p>
        </div>

        {/* Informational Card */}
        <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 text-left space-y-2 text-xs">
          <div className="font-bold text-zinc-200 flex items-center space-x-1.5 font-mono">
            <Scan className="w-4 h-4 text-emerald-400" />
            <span>How to Check In:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px] font-mono">
            <li>Approach the smart screen mounted at the classroom doorway.</li>
            <li>Tap your physical RFID / NFC Smart Student Card.</li>
            <li>Look at the optical sensor for 1-second biometric facial match.</li>
          </ol>
        </div>

        {/* Action Button to Kiosk */}
        <Link
          href="/terminal"
          className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer"
        >
          <span>Open Classroom Entrance Kiosk</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-[10px] text-zinc-600 font-mono">
          SmartCampus v3.0 • ISO-9001 Regulatory Gate
        </p>
      </div>
    </div>
  );
}
