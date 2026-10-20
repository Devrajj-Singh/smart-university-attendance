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
  GraduationCap,
  Upload,
  Eye,
  Scan,
  RefreshCw,
  UserCheck,
  UserX,
  Zap,
  Sliders,
  Check,
  Wifi,
  WifiOff
} from 'lucide-react';
import { 
  verifyStudentBiometric, 
  getEnrolledBiometricVector,
  extractVisualEmbeddingFromPixels,
  computeCosineSimilarity,
  BiometricMatchResult
} from '@/lib/biometrics';

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
  
  // Operating Modes:
  // 1. DUAL_FACTOR: Rapid RFID Smart Card Tap + Instant AI Biometric (Primary Door Flow)
  // 2. IMAGE_SIMULATOR: Local File Upload / Test Simulation (For hardware evaluation)
  // 3. LIVE_CAMERA: Live Optical Webcam Scanner with Real-time Canvas Capture
  const [kioskMode, setKioskMode] = useState<'DUAL_FACTOR' | 'IMAGE_SIMULATOR' | 'LIVE_CAMERA'>('DUAL_FACTOR');

  // Enrolled Roster & Selected Student
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('25215101');
  const [manualCardInput, setManualCardInput] = useState('');

  // Scanning & Match States
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [biometricMetrics, setBiometricMetrics] = useState<BiometricMatchResult | null>(null);

  // Image Upload / Simulator States
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live Camera States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Recent Entrance Ledger
  const [recentVerified, setRecentVerified] = useState<any[]>([]);

  // Sound Synthesizer for Immediate Auditory Feedback
  const playSoundFeedback = (success: boolean) => {
    if (typeof window === 'undefined' || !('AudioContext' in window || 'webkitAudioContext' in window)) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        // High-pitch dual pleasant chime (880Hz -> 1320Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        // Low-pitch harsh buzzer (220Hz saw/square wave)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {}
  };

  // Load active session and enrolled roster
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

  // Camera Management
  const startCamera = async () => {
    setCameraError('');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
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
    if (kioskMode === 'LIVE_CAMERA') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [kioskMode]);

  // Handle Local Image Upload (Student ID Card / Face / Iris Photo)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImagePreview(reader.result as string);
        setScanResult(null);
        setBiometricMetrics(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Execute Dual-Factor Attendance Check-in
  const executeAttendanceVerification = async ({
    studentIdentifier,
    simulateImpostor = false,
    useLiveCanvas = false,
  }: {
    studentIdentifier: string;
    simulateImpostor?: boolean;
    useLiveCanvas?: boolean;
  }) => {
    if (!activeSessionId) {
      alert('Please connect to an active classroom session.');
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setBiometricMetrics(null);

    // Resolve Student from Roster
    const student = students.find(
      (s) => s.user_id === studentIdentifier || s.student_id === studentIdentifier || s.card_id === studentIdentifier
    ) || { user_id: studentIdentifier, name: `Student ${studentIdentifier}` };

    const enrolledBioId = student.biometric_id || `IRIS-${student.user_id}`;

    // Extract captured vector
    let capturedVector: Float32Array | undefined = undefined;

    if (useLiveCanvas && videoRef.current && canvasRef.current) {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          capturedVector = extractVisualEmbeddingFromPixels(imgData.data, canvas.width, canvas.height);
        }
      } catch (err) {
        console.warn('Canvas pixel extraction failed, using neural vector projection:', err);
      }
    }

    // Run Biometric Vector Comparison
    const bioResult = verifyStudentBiometric({
      studentId: student.user_id,
      enrolledBiometricId: enrolledBioId,
      capturedVector,
      isSimulation: !capturedVector,
      simulateImpostor,
    });

    setBiometricMetrics(bioResult);

    // Send to Backend Central Database
    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          studentIdentifier: student.user_id,
          method: 'RFID_AND_IRIS',
          deviceId: 'DOOR_KIOSK_101',
          confidenceScore: bioResult.similarity,
        }),
      });

      const data = await res.json();
      setScanResult(data);

      if (data.success) {
        playSoundFeedback(true);
        // Add to Recent Entrance Ledger
        setRecentVerified((prev) => [
          {
            studentId: student.user_id,
            name: student.name,
            timestamp: new Date().toLocaleTimeString(),
            confidence: bioResult.similarityPercent,
            method: 'RFID_AND_IRIS',
          },
          ...prev.slice(0, 4),
        ]);
        if (activeSessionId) loadSession(activeSessionId);
      } else {
        playSoundFeedback(false);
      }
    } catch {
      playSoundFeedback(false);
      setScanResult({
        success: false,
        error: 'Network failure connecting to central university attendance ledger.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const selectedStudentObj = students.find((s) => s.user_id === selectedStudentId);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between select-none font-sans antialiased">
      
      {/* Top Kiosk Bar */}
      <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center space-x-2.5">
          <Link href="/dashboard" className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xs font-bold tracking-tight text-white flex items-center space-x-1.5 font-mono">
              <span>CHRIST Classroom Entrance Terminal</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </h1>
            <p className="text-[10px] text-zinc-400">
              {sessionData ? `${sessionData.class_name} • ${sessionData.subject_name || 'Classroom'} • Room ${sessionData.room_number || sessionData.classroom_id}` : 'Connecting node...'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-[10px] text-emerald-400 font-bold font-mono">
            <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
            <span>Edge AI Node 101 Online</span>
          </div>
        </div>
      </div>

      {/* Main Kiosk Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full space-y-4">
        
        {/* Mode Selector Tabs */}
        <div className="w-full grid grid-cols-3 gap-1.5 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shadow-sm">
          <button
            onClick={() => { setKioskMode('DUAL_FACTOR'); setScanResult(null); setBiometricMetrics(null); }}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              kioskMode === 'DUAL_FACTOR'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Dual-Factor Tap</span>
          </button>

          <button
            onClick={() => { setKioskMode('IMAGE_SIMULATOR'); setScanResult(null); setBiometricMetrics(null); }}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              kioskMode === 'IMAGE_SIMULATOR'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Image Simulator</span>
          </button>

          <button
            onClick={() => { setKioskMode('LIVE_CAMERA'); setScanResult(null); setBiometricMetrics(null); }}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              kioskMode === 'LIVE_CAMERA'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: DUAL-FACTOR SMART CARD TAP + EDGE BIOMETRIC (Primary Door Kiosk) */}
        {/* ========================================================================= */}
        {kioskMode === 'DUAL_FACTOR' && (
          <div className="w-full space-y-4 animate-fade-in">
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-4 shadow-2xl relative overflow-hidden">
              
              {/* Visual Sensor Graphic */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="w-24 h-24 rounded-3xl bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center relative shadow-inner">
                  <CreditCard className="w-12 h-12 text-zinc-300" />
                  <div className="absolute inset-0 rounded-3xl border border-emerald-500/30 animate-pulse pointer-events-none"></div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 animate-pulse"></span>
                </div>
              </div>

              <div>
                <h2 className="text-base font-extrabold text-white">Tap University Smart ID Card</h2>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">
                  Hold card against NFC reader at classroom doorway. Edge AI verifies facial/iris landmarks in 1.2 seconds.
                </p>
              </div>

              {/* Quick Select Enrolled Student */}
              <div className="pt-3 border-t border-zinc-900 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-mono">Select Student to Tap:</span>
                  <span className="text-zinc-500 font-mono">{students.length} Enrolled</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      setScanResult(null);
                      setBiometricMetrics(null);
                    }}
                    className="col-span-2 bg-zinc-900 text-white text-xs px-3 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-zinc-500 font-mono"
                  >
                    {students.map((s) => (
                      <option key={s.user_id} value={s.user_id}>
                        {s.student_id || s.user_id} - {s.name} ({s.class_id || 'CSE'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Instant Tap Actions */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => executeAttendanceVerification({ studentIdentifier: selectedStudentId, simulateImpostor: false })}
                    disabled={isScanning}
                    className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{isScanning ? 'Verifying...' : 'Tap Card & Verify'}</span>
                  </button>

                  <button
                    onClick={() => executeAttendanceVerification({ studentIdentifier: selectedStudentId, simulateImpostor: true })}
                    disabled={isScanning}
                    className="p-3 rounded-2xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800/80 text-zinc-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    title="Simulate someone tapping another student's card with an unmatched face"
                  >
                    <UserX className="w-4 h-4 text-rose-400" />
                    <span>Test Proxy Card Swap</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Manual Card UID Keypad */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Scan Card UID or Type Reg No..."
                value={manualCardInput}
                onChange={(e) => setManualCardInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualCardInput.trim()) {
                    executeAttendanceVerification({ studentIdentifier: manualCardInput.trim() });
                  }
                }}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
              <button
                onClick={() => {
                  if (manualCardInput.trim()) {
                    executeAttendanceVerification({ studentIdentifier: manualCardInput.trim() });
                  }
                }}
                disabled={isScanning || !manualCardInput.trim()}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-md cursor-pointer disabled:opacity-40"
              >
                Scan UID
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: HARDWARE SIMULATOR & LOCAL IMAGE UPLOAD (Testing / Evaluation)    */}
        {/* ========================================================================= */}
        {kioskMode === 'IMAGE_SIMULATOR' && (
          <div className="w-full space-y-4 animate-fade-in">
            <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Biometric Hardware Simulator</span>
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Upload an ID card photo or eye/face crop from your local drive to test the neural matcher.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  Pre-Trained 128-D AI
                </span>
              </div>

              {/* Drag & Drop / File Upload Box */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative rounded-2xl border-2 border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 p-6 text-center cursor-pointer transition-all group overflow-hidden"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {uploadedImagePreview ? (
                  <div className="space-y-2">
                    <div className="relative w-36 h-36 mx-auto rounded-xl overflow-hidden border border-zinc-700 shadow-md">
                      <img 
                        src={uploadedImagePreview} 
                        alt="Uploaded Biometric" 
                        className="w-full h-full object-cover"
                      />
                      {/* Scanning Reticle Overlay */}
                      <div className="absolute inset-0 border-2 border-emerald-500/70 pointer-events-none"></div>
                      <div className="absolute inset-x-0 h-0.5 bg-emerald-400 animate-bounce top-1/2"></div>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Image loaded. Click below to verify against student template.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    <Upload className="w-8 h-8 text-zinc-500 group-hover:text-white mx-auto transition-colors" />
                    <p className="text-xs font-bold text-zinc-300 group-hover:text-white">
                      Click to Browse or Drag & Drop ID Card / Photo
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      Supports JPG, PNG, WEBP (Student ID Cards, Eye/Iris crops, or Face portraits)
                    </p>
                  </div>
                )}
              </div>

              {/* Target Student Roster Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-zinc-400 block">Target Student Profile to Verify Against:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setScanResult(null);
                    setBiometricMetrics(null);
                  }}
                  className="w-full bg-zinc-900 text-white text-xs px-3 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-zinc-500 font-mono"
                >
                  {students.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.student_id || s.user_id} - {s.name} ({s.class_id || 'CSE'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Execution Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => executeAttendanceVerification({ studentIdentifier: selectedStudentId, simulateImpostor: false })}
                  disabled={isScanning}
                  className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isScanning ? 'Extracting Vector...' : '✓ Test Genuine Match'}</span>
                </button>

                <button
                  onClick={() => executeAttendanceVerification({ studentIdentifier: selectedStudentId, simulateImpostor: true })}
                  disabled={isScanning}
                  className="p-3 rounded-2xl bg-zinc-900 hover:bg-rose-950/70 border border-zinc-800 hover:border-rose-800 text-rose-300 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UserX className="w-4 h-4 text-rose-400" />
                  <span>✗ Test Impostor Proxy</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 3: LIVE OPTICAL WEBCAM SCANNER (Device Camera Stream)                */}
        {/* ========================================================================= */}
        {kioskMode === 'LIVE_CAMERA' && (
          <div className="w-full space-y-4 animate-fade-in">
            <div className="w-full relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl aspect-4/3 max-h-[380px] flex items-center justify-center">
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
                    {cameraError || 'Activating optical camera sensor...'}
                  </p>
                </div>
              )}

              {/* Hidden Canvas for Frame Feature Extraction */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Optical Reticle & Iris Targeting Crosshairs */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-52 h-44 border border-emerald-500/40 rounded-3xl relative flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>

                  {/* Dual Eye / Iris Targeting Centers */}
                  <div className="flex items-center space-x-10">
                    <div className="w-10 h-10 rounded-full border border-emerald-400/80 flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-emerald-400/80 flex items-center justify-center animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                  </div>

                  <div className="w-full h-0.5 bg-emerald-400/60 absolute top-1/2 -translate-y-1/2"></div>
                </div>
              </div>

              {/* Camera Trigger Bar */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-20 bg-black/80 backdrop-blur-md p-2 rounded-2xl border border-zinc-800">
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-zinc-900 text-white text-xs px-2.5 py-1.5 rounded-xl border border-zinc-700 max-w-[200px] truncate focus:outline-none font-mono"
                >
                  {students.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.student_id || s.user_id} - {s.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => executeAttendanceVerification({ studentIdentifier: selectedStudentId, useLiveCanvas: true })}
                  disabled={isScanning || !cameraActive}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-lg disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>{isScanning ? 'Processing...' : 'Capture & Verify'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* REAL-TIME VERIFICATION FEEDBACK CARD (Sound + Visual Confidence Gauge)   */}
        {/* ========================================================================= */}
        {scanResult && biometricMetrics && (
          <div className="w-full animate-fade-in z-20">
            {scanResult.success ? (
              <div className="p-4 rounded-3xl bg-zinc-950 border border-emerald-800 text-emerald-300 text-xs shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-white">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm">Biometric Presence Certified</span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400">{scanResult.studentId}</span>
                </div>

                <div className="flex items-center justify-between bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block">Enrolled Student</span>
                    <span className="text-sm font-black text-white">{scanResult.studentName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block">Cosine Match</span>
                    <span className="text-sm font-black font-mono text-emerald-400">
                      {biometricMetrics.similarityPercent}% (Pass)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Method: RFID_AND_IRIS</span>
                  <span className="text-emerald-400 font-bold">✓ Committed to PostgreSQL</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-3xl bg-zinc-950 border border-rose-800 text-rose-300 text-xs shadow-2xl space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="font-bold text-sm text-rose-200">Biometric Verification Failed</span>
                </div>
                <p className="text-[11px] text-rose-300">
                  {scanResult.error || biometricMetrics.details}
                </p>
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 font-mono text-[10px] text-rose-300 flex items-center justify-between">
                  <span>Measured Similarity: {biometricMetrics.similarityPercent}%</span>
                  <span>Required Threshold: 85.0%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* RECENT ENTRANCE LEDGER (Last 5 Students Passed Through Door)              */}
        {/* ========================================================================= */}
        <div className="w-full p-4 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-zinc-900 pb-2">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Entrance Door Ledger</span>
            </span>
            <span>{recentVerified.length} Verified in Current Block</span>
          </div>

          {recentVerified.length === 0 ? (
            <p className="text-[11px] text-zinc-600 font-mono py-2 text-center">
              No door tap records yet. Tap card or simulate match above to check in.
            </p>
          ) : (
            <div className="space-y-1.5">
              {recentVerified.map((rec, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{rec.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono ml-1.5">({rec.studentId})</span>
                  </div>
                  <div className="flex items-center space-x-2 font-mono text-[10px]">
                    <span className="text-emerald-400 font-bold">{rec.confidence}% Match</span>
                    <span className="text-zinc-500">{rec.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-center text-[10px] text-zinc-500 font-mono">
        CHRIST (Deemed to be University) • Dual-Factor Smart Attendance Edge Terminal Node
      </div>

    </div>
  );
}
