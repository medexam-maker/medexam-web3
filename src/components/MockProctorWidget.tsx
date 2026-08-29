import React, { useEffect, useRef, useState } from 'react';
import { Camera, Eye, ShieldAlert, ShieldCheck, Lock, AlertTriangle, Volume2, RefreshCw } from 'lucide-react';

interface MockProctorWidgetProps {
  isProctoringActive: boolean;
  onUpdateStats: (stats: { tabSwitches: number; faceLossCount: number; audioNoiseAlerts: number; integrityScore: number; status: string }) => void;
}

export const MockProctorWidget: React.FC<MockProctorWidgetProps> = ({
  isProctoringActive,
  onUpdateStats
}) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(true);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [faceLossCount, setFaceLossCount] = useState(0);
  const [audioNoiseAlerts] = useState(0);
  const [isFaceDetected, setIsFaceDetected] = useState(true);
  const [gazeStatus, setGazeStatus] = useState<'focused' | 'away'>('focused');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // High pitched alarm audio trigger function for warnings
  const triggerLoudAlarmSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  // Request Camera & Microphone access handler
  const handleRequestPermissions = async () => {
    setShowPermissionModal(false);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: true
        });
        streamRef.current = stream;
        setHasCameraPermission(true);
      } else {
        setHasCameraPermission(false);
      }
    } catch (err) {
      console.warn("Camera/Mic permission denied or unavailable:", err);
      setHasCameraPermission(false);
    }
  };

  // Ensure video element receives stream whenever rendered
  useEffect(() => {
    if (hasCameraPermission && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.log("Video auto-play:", e));
    }
  }, [hasCameraPermission]);

  // Tab switch listener
  useEffect(() => {
    if (!isProctoringActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
        triggerLoudAlarmSound();
        setWarningMessage("⚠️ WARNING: Leaving test tab is recorded!");
        setTimeout(() => setWarningMessage(null), 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isProctoringActive]);

  // Periodic simulated face movement & gaze detection
  useEffect(() => {
    if (!isProctoringActive) return;

    const interval = setInterval(() => {
      const randomVal = Math.random();
      if (randomVal < 0.08) {
        setIsFaceDetected(false);
        setFaceLossCount(prev => prev + 1);
        triggerLoudAlarmSound();
        setWarningMessage("⚠️ ALARM: Face lost! Return to screen center immediately!");
        setTimeout(() => {
          setIsFaceDetected(true);
          setWarningMessage(null);
        }, 2200);
      } else if (randomVal < 0.16) {
        setGazeStatus('away');
        triggerLoudAlarmSound();
        setWarningMessage("⚠️ ALARM: Keep your eyes focused on the exam!");
        setTimeout(() => {
          setGazeStatus('focused');
          setWarningMessage(null);
        }, 1800);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [isProctoringActive]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Sync metrics to parent
  useEffect(() => {
    const integrityScore = Math.max(0, 100 - (tabSwitches * 12 + faceLossCount * 5 + audioNoiseAlerts * 3));
    
    let status = 'Passed - Complete Academic Integrity';
    if (integrityScore < 70) {
      status = 'Warning - Multiple Tab / Attention Alerts';
    } else if (integrityScore < 90) {
      status = 'Good - Minor Distractions Logged';
    }

    onUpdateStats({
      tabSwitches,
      faceLossCount,
      audioNoiseAlerts,
      integrityScore,
      status
    });
  }, [tabSwitches, faceLossCount, audioNoiseAlerts, onUpdateStats]);

  if (!isProctoringActive) return null;

  return (
    <>
      {/* One-time Camera & Microphone Permission Prompt Modal */}
      {showPermissionModal && hasCameraPermission === null && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl text-right" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-scaleUp">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto mb-4">
              <Camera className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              تفعيل المراقبة الذكية المباشرة (AI Proctoring)
            </h3>
            
            <p className="text-xs text-slate-600 text-center mb-6 leading-relaxed">
              تطلب منصة <strong className="text-emerald-700">MedExam</strong> إذن الوصول للكاميرا والميكروفون لمرة واحدة فقط لربط تقنيات التعرف على الوجه أثناء الامتحان.
              <br />
              <span className="text-[11px] text-emerald-800 font-bold block mt-2">
                🔒 ضمان الخصوصية: تتم المعالجة محلياً 100% ولا يتم حفظ أو رفع أي صور أو فيديو للسيرفر.
              </span>
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleRequestPermissions}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>السماح بفتح الكاميرا والميكروفون للبدء</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Loud Warning Banner */}
      {warningMessage && (
        <div className="fixed top-2 inset-x-4 sm:inset-x-auto sm:right-1/2 sm:translate-x-1/2 z-50 bg-rose-600 text-white font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs border border-rose-400 animate-bounce">
          <Volume2 className="w-4 h-4 animate-ping" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Camera Widget with Oval Face Frame & Full Live Metrics */}
      <div className="dir-ltr text-left font-sans select-none shrink-0" dir="ltr">
        <div className="flex items-center gap-2.5 bg-slate-950/95 text-white p-1.5 rounded-2xl border border-emerald-500/50 shadow-md backdrop-blur-md">
          {/* OVAL FACE FRAME (Shows all facial features clearly) */}
          <div className="relative w-14 h-18 sm:w-16 sm:h-20 rounded-[50%] border-2 border-emerald-400 overflow-hidden bg-slate-900 flex items-center justify-center shrink-0 shadow-inner group">
            {hasCameraPermission ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              /* High-fidelity live student face photo fallback */
              <div className="relative w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
                  alt="Student Camera Feed"
                  className="w-full h-full object-cover brightness-95 contrast-105"
                />
                <div className="absolute inset-0 bg-emerald-950/20" />
              </div>
            )}

            {/* Oval Face Tracking Mesh Overlay */}
            <div className="absolute inset-0 border border-dashed border-emerald-400/60 rounded-[50%] pointer-events-none flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400/80 animate-ping" />
            </div>

            {/* Quick Camera Enable Button Overlay */}
            {!hasCameraPermission && (
              <button
                onClick={handleRequestPermissions}
                title="Open Camera"
                className="absolute inset-0 bg-slate-950/60 hover:bg-slate-950/40 text-emerald-300 flex flex-col items-center justify-center text-[8px] font-bold p-1 text-center transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-400 animate-pulse mb-0.5" />
                <span>OPEN CAM</span>
              </button>
            )}

            {!isFaceDetected && (
              <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-rose-300 text-[8px] font-bold p-1 text-center animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Away!</span>
              </div>
            )}
          </div>

          {/* Full Live Status Metrics */}
          <div className="hidden sm:flex flex-col text-[9px] font-mono leading-tight space-y-0.5 pr-2">
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI PROCTOR</span>
            </div>
            <div className="text-slate-300">
              GAZE: <span className={gazeStatus === 'focused' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{gazeStatus.toUpperCase()}</span>
            </div>
            <div className="text-slate-400">
              TABS: <span className="text-amber-400 font-bold">{tabSwitches}</span>
            </div>
            <div className="text-slate-400 text-[8px] flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5 text-emerald-400" />
              <span>100% LOCAL</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
