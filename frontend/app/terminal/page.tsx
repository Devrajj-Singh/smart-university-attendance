'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Camera, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Sparkles,
  GraduationCap
} from 'lucide-react';

export default function MobileTerminalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-xs text-zinc-500 font-mono">Loading Classroom Door Kiosk...</div>}>
      <TerminalContent />
    </Suspense>
  );
}

function TerminalContent() {
  const searchParams = useSearchParams();
  const sessionFromQuery = searchParams.get('session');

  const [activeSessionId, setActiveSessionId] = useState(sessionFromQuery || '');
  const [sessionData, setSessionData] = useState<any>(null);
  const [kioskMode, setKioskMode] = useState<'DOOR_TAP' | 'CAMERA_SCAN'>('DOOR_TAP');
  const [activeMode, setActiveMode] = useState<'CARD' | 'IRIS'>('CARD');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Selected student for camera simulation / scan
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('25215101');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load session info & roster
  const loadSession = (sessionIdToLoad: string) => {
    fetch(`/api/sessions/${sessionIdToLoad}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSessionData(data.session);
          if (data.students?.length) {
            setStudents(data.students);
            if (!selectedStudentId || selectedStudentId === '25215101') {
              setSelectedStudentId(data.students[0].user_id);
            }
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (activeSessionId) {
      loadSession(activeSessionId);
    } else {
      // Find latest active session automatically
      fetch('/api/sessions')
        .then((r) => r.json())
        .then((data) => {
          if (data.sessions?.length > 0) {
            const active = data.sessions.find((s: any) => s.status === 'ACTIVE') || data.sessions[0];
            setActiveSessionId(active.session_id);
            loadSession(active.session_id);
          }
        })
        .catch(() => {});
    }
  }, [activeSessionId]);

  // Camera initialization for optical scanning
  const startCamera = async () => {
    setCameraError('');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } else {
        setCameraError('Camera access not supported on this browser context.');
      }
    } catch {
      setCameraError('Camera permission denied or camera unavailable on this device.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (kioskMode === 'CAMERA_SCAN') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [kioskMode]);

  const handleSimulateScan = async (identifierOverride?: string) => {
    if (!activeSessionId) {
      alert('Please connect to an active classroom session.');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    const studentToMark = identifierOverride || selectedStudentId;

    // Simulate door reader processing delay (300ms)
    setTimeout(async () => {
      try {
        const isDoorTap = kioskMode === 'DOOR_TAP';
        const method = isDoorTap ? 'DOOR_RFID' : (activeMode === 'CARD' ? 'CAMERA_CARD' : 'CAMERA_IRIS');

        const res = await fetch('/api/attendance/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: activeSessionId,
            studentIdentifier: studentToMark,
            method,
            action: isDoorTap ? 'DOOR_TAP' : 'VERIFY',
            deviceId: 'DOOR_KIOSK_101',
          }),
        });

        const data = await res.json();
        setScanResult(data);

        // Sound feedback
        if (data.success) {
          if (activeSessionId) loadSession(activeSessionId);
          if (typeof window !== 'undefined' && 'AudioContext' in window) {
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
              osc.start();
              osc.stop(ctx.currentTime + 0.15);
            } catch {}
          }
        }
      } catch {
        setScanResult({ success: false, error: 'Connection failure to university attendance server.' });
      } finally {
        setIsScanning(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between select-none font-sans antialiased">
      
      {/* Top Mobile Bar */}
      <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard" className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xs font-bold tracking-tight text-white flex items-center space-x-1.5 font-mono">
              <span>Classroom Entrance Kiosk</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            </h1>
            <p className="text-[10px] text-zinc-400">
              {sessionData ? `${sessionData.class_name} • Room ${sessionData.room_number || sessionData.classroom_id}` : 'Connecting session...'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-[10px] text-emerald-400 font-bold font-mono">
          <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
          <span>Door Kiosk Online</span>
        </div>
      </div>

      {/* Main Kiosk Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative max-w-lg mx-auto w-full">
        
        {/* Kiosk Mode Switcher (Door RFID Tap vs Optical Scanner) */}
        <div className="w-full grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 mb-4 z-10 shadow-xs">
          <button
            onClick={() => { setKioskMode('DOOR_TAP'); setScanResult(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              kioskMode === 'DOOR_TAP'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>RFID Door Tap</span>
          </button>

          <button
            onClick={() => { setKioskMode('CAMERA_SCAN'); setScanResult(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              kioskMode === 'CAMERA_SCAN'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Optical Card Scan</span>
          </button>
        </div>

        {/* MODE 1: Door RFID / NFC Tap */}
        {kioskMode === 'DOOR_TAP' && (
          <div className="w-full space-y-4">
            <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-4 shadow-2xl relative overflow-hidden">
              
              <div className="w-24 h-24 mx-auto rounded-3xl bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-white relative shadow-inner">
                <CreditCard className="w-12 h-12 text-zinc-300" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 animate-pulse"></span>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-white">Tap University ID Card</h2>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">
                  Hold RFID student identity card against sensor upon classroom entry.
                </p>
              </div>

              {/* Fast Quick Tap Buttons for Testing / Kiosk Operator */}
              <div className="pt-2 border-t border-zinc-900 space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 tracking-wider block">
                  Simulate Live NFC Card Tap
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSimulateScan('25215101')}
                    disabled={isScanning}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-mono transition-all group"
                  >
                    <span className="font-bold text-white block group-hover:text-zinc-200">25215101</span>
                    <span className="text-[10px] text-zinc-500 block truncate">Aarav Sharma</span>
                  </button>

                  <button
                    onClick={() => handleSimulateScan('25215102')}
                    disabled={isScanning}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-mono transition-all group"
                  >
                    <span className="font-bold text-white block group-hover:text-zinc-200">25215102</span>
                    <span className="text-[10px] text-zinc-500 block truncate">Aditi Rao</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Manual Card UID input box */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Enter Student Reg No or Tap Card UID..."
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
              <button
                onClick={() => handleSimulateScan()}
                disabled={isScanning}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-md disabled:opacity-50"
              >
                {isScanning ? 'Processing...' : 'Tap Card'}
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: Optical Camera Scan */}
        {kioskMode === 'CAMERA_SCAN' && (
          <div className="w-full relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl aspect-3/4 max-h-[460px] flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <Camera className="w-12 h-12 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-mono">
                  {cameraError || 'Activating camera sensor...'}
                </p>
              </div>
            )}

            {/* Scanning Overlay Reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-40 border-2 border-white/60 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                <div className="w-full h-0.5 bg-white/80 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-sm"></div>
              </div>
            </div>

            {/* Bottom Optical Trigger */}
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-20">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-black/90 text-white text-xs px-3 py-2 rounded-xl border border-zinc-700 max-w-[200px] truncate focus:outline-none"
              >
                {students.map((s) => (
                  <option key={s.user_id} value={s.user_id}>
                    {s.student_id} - {s.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleSimulateScan()}
                disabled={isScanning}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-lg disabled:opacity-50"
              >
                {isScanning ? 'Scanning...' : 'Capture'}
              </button>
            </div>
          </div>
        )}

        {/* Scan Result Feedback Banner */}
        {scanResult && (
          <div className="w-full mt-4 animate-fade-in z-20">
            {scanResult.success ? (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-800 text-emerald-300 text-xs shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{scanResult.action === 'DOOR_TAP' ? 'Door Tap Registered' : 'Presence Certified'}</span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400">{scanResult.studentId}</span>
                </div>
                <p className="text-sm font-black text-white">{scanResult.studentName}</p>

                {/* 6-Digit Door Challenge PIN Display */}
                {scanResult.challengePin && (
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase block">Your 6-Digit Door PIN</span>
                      <span className="text-base font-black font-mono text-white tracking-widest">{scanResult.challengePin}</span>
                    </div>
                    <KeyRound className="w-5 h-5 text-zinc-400" />
                  </div>
                )}

                <p className="text-[11px] text-zinc-400">
                  {scanResult.challengePin
                    ? 'Now scan the classroom projector QR on your phone and enter this PIN if prompted.'
                    : 'Attendance is recorded and confirmed in the session ledger.'}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-rose-800 text-rose-300 text-xs shadow-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-200">Tap Rejected</p>
                  <p className="text-[11px] text-rose-300 mt-0.5">{scanResult.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Footer Info */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-center text-[10px] text-zinc-500 font-mono">
        CHRIST (Deemed to be University) • Door Kiosk Terminal Node
      </div>

    </div>
  );
}
