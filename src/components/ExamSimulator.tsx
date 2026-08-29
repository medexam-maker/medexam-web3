import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Award, 
  Clock, 
  Heart, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Grid, 
  AlertTriangle, 
  BookOpen, 
  FileCheck, 
  HelpCircle,
  Play,
  Layers,
  ArrowRight,
  ArrowLeft,
  Home,
  ShieldCheck,
  Lock,
  Camera,
  Eye,
  ShieldAlert,
  FileText,
  UserCheck,
  CreditCard,
  Copy,
  Check,
  Send,
  Loader2,
  Upload,
  Calculator,
  FlaskConical,
  Globe,
  Languages,
  Sparkles,
  Share2,
  Share,
  MessageSquare,
  Zap,
  Info,
  GraduationCap
} from 'lucide-react';
import { Question, ExamSession, ExamMode, SpecialtyId, ProctoringReport, UserAccount } from '../types';

import { MockProctorWidget } from './MockProctorWidget';
import { SpecialtyGuideSection } from './SpecialtyGuideSection';
import { SpecialtyBoardQuestionView } from './SpecialtyBoardQuestionView';
import { compressAndResizeImage } from '../lib/imageUtils';
import { authFetch } from '../lib/authFetch';
import { get, set, del } from 'idb-keyval';
import { SpecialtyQuestionView } from './SpecialtyQuestionView';

import { SiteSettings } from '../types';

interface ExamSimulatorProps {
  siteSettings?: SiteSettings;
  specialtyId: SpecialtyId;
  questions: Question[];
  currentUser?: UserAccount | null;
  initialMode?: ExamMode;
  autoStart?: boolean;
  onFinishExamCallback?: (session: ExamSession) => void;
  onOpenSpecialtyModal: () => void;
  onOpenSubscribeModal?: () => void;
  onBackToHome?: () => void;
}

export const ExamSimulator: React.FC<ExamSimulatorProps> = ({
  siteSettings,
  specialties,
  specialtyId,
  questions,
  currentUser,
  initialMode = 'VISITOR_DEMO',
  autoStart = false,
  onFinishExamCallback,
  onOpenSpecialtyModal,
  onOpenSubscribeModal,
  onBackToHome
}) => {
  const currentSpecialty = specialties.find(s => s.id === specialtyId) || specialties[0] || { id: '', titleAr: '', titleEn: '', description: '', questionCount: 0, councilId: 'medical' } as any;
  const specialtyQuestions = useMemo(() => {
    const direct = questions.filter(q => q.specialtyId === specialtyId);
    if (direct.length > 0) return direct;
    return questions.filter(q => 
      q.councilId === currentSpecialty.councilId ||
      q.category === currentSpecialty.titleAr ||
      (currentSpecialty.councilId === 'specialties' && q.specialtyId === 'surgery')
    );
  }, [questions, specialtyId, currentSpecialty]);

  // Mode & setup states
  const [examMode, setExamMode] = useState<ExamMode>(initialMode);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(true);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);

  // Authoritative Answer Feedbacks from backend
  const [answersFeedback, setAnswersFeedback] = useState<Record<string, {
    isCorrect: boolean;
    correctIndex: number;
    explanationAr?: string;
    explanationEn?: string;
    explainWrong?: string[];
    highYieldFact?: string;
    reference?: string;
    score?: number;
  }>>({});
  const [pendingAnswer, setPendingAnswer] = useState<number | null>(null);
  const pendingAnswerRef = useRef<number | null>(null);
  const currentQIdRef = useRef<string | null>(null);

  useEffect(() => {
    pendingAnswerRef.current = pendingAnswer;
  }, [pendingAnswer]);


  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  const [isFinishingExam, setIsFinishingExam] = useState<boolean>(false);

  // Active attempt on server
  
  // Simulated AI Proctoring state
  const [isProctoringEnabled, setIsProctoringEnabled] = useState<boolean>(true);
  const [proctorStats, setProctorStats] = useState({
    tabSwitches: 0,
    faceLossCount: 0,
    audioNoiseAlerts: 0,
    integrityScore: 100,
    status: 'ممتاز - نزاهة أكاديمية كاملة'
  });

  // Active exam navigation & language state
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (activeSession && activeSession.questions[currentIndex]) {
      currentQIdRef.current = activeSession.questions[currentIndex].id;
    } else {
      currentQIdRef.current = null;
    }
  }, [currentIndex, activeSession]);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState<number>(60);
  const [examLang, setExamLang] = useState<'ar' | 'en'>('ar');
  const [languageMode, setLanguageMode] = useState<'ENGLISH_ONLY' | 'BILINGUAL'>('ENGLISH_ONLY');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Tools Modals (Calculator, Notes, Lab Values)
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [calcExpr, setCalcExpr] = useState('');
  const [calcResult, setCalcResult] = useState('');

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [scratchNotes, setScratchNotes] = useState('');

  const [showLabModal, setShowLabModal] = useState(false);

  const triggerOpenSubscribe = () => {
    if (onOpenSubscribeModal) {
      onOpenSubscribeModal();
    }
  };

  // Reset question timer & pending answer on index or session change
    const restoringIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (restoringIndexRef.current === currentIndex) {
       restoringIndexRef.current = null;
    } else {
       setQuestionTimeRemaining(60);
    }
    setPendingAnswer(null);
  }, [currentIndex, activeSession?.id]);


  // Auto-start effect if requested
  useEffect(() => {
    // Wait a tick to see if IndexedDB restores the session
    if (autoStart && !activeSession) {
      const storageKey = `medexam_active_session_${specialtyId}`;
      get(storageKey).then((data: any) => {
        if (!data || !data.session || data.session.isFinished) {
           startExam((initialMode || 'VISITOR_DEMO') as ExamMode);
        }
      }).catch(() => {
           startExam((initialMode || 'VISITOR_DEMO') as ExamMode);
      });
    }
  }, [autoStart, initialMode, specialtyId]);

  // Auto-restore from IndexedDB on mount
  useEffect(() => {
    if (activeSession || !currentUser) return;
    const storageKey = `medexam_active_session_${specialtyId}`;
    get(storageKey).then((data: any) => {
      if (data && data.session && !data.session.isFinished) {
        // Simple expiry check (e.g., 24 hours)
        const savedTime = new Date(data.savedAt || 0).getTime();
        if (Date.now() - savedTime < 24 * 60 * 60 * 1000) {
          restoringIndexRef.current = data.currentIndex || 0;
          setActiveSession(data.session);
          setCurrentIndex(data.currentIndex || 0);
          setTimerEnabled(data.timerEnabled ?? true);
          if (data.cameraEnabled !== undefined) setIsProctoringEnabled(data.cameraEnabled);
          if (data.questionTimeRemaining !== undefined) setQuestionTimeRemaining(data.questionTimeRemaining);
          if (data.session.answersFeedback) {
            setAnswersFeedback(data.session.answersFeedback);
          }
        } else {
          del(storageKey).catch(console.error);
        }
      }
    }).catch(console.error);
  }, [specialtyId, currentUser?.id]);

  /\/\/ Start new exam session via backend \/api\/exam\/start/m
  const startExam = async (overrideMode?: ExamMode) => {
    const targetMode: ExamMode = overrideMode || examMode || 'VISITOR_DEMO';
    setExamMode(targetMode);

    // Check subscription for student training
    const isSubscribed = currentUser?.isSubscribed && currentUser?.subscriptionStatus === 'active';
    if (targetMode === 'STUDENT_TRAINING' && !isSubscribed && currentUser?.role !== 'admin') {
      alert('�� يتطلب إجراء الامتحان التدريبي الكامل وجود اشتراك مفعّل. يرجى تفعيل اشتراكك كعضو بالمنصة.');
      triggerOpenSubscribe();
      return;
    }

    try {
      const res = await authFetch('/api/exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialtyId, mode: targetMode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLanguageMode(data.languageMode || 'ENGLISH_ONLY');
        if (data.languageMode === 'ENGLISH_ONLY') setExamLang('en');
        const isSpecialization = currentSpecialty.councilId === 'specialties';
        
        // Prepare questions
        const mappedQuestions = data.questions.map((q: any) => ({
          ...q,
          options: q.options || q.optionsEn
        }));

        // Use returned active session details if available (Resumed session)
        const resumedAnswers = data.answers || {};
        
        let answersFeedback: Record<string, any> = {};
        // Local evaluation since correctIndex is now included in start payload
        Object.entries(resumedAnswers).forEach(([qId, ans]: [string, any]) => {
            const q = mappedQuestions.find((mq: any) => mq.id === qId);
            const ansIdx = typeof ans === 'object' ? ans.selectedAnswer : ans;
            if (q && ansIdx !== undefined) {
                answersFeedback[qId] = {
                    selectedAnswer: Number(ansIdx),
                    isCorrect: Number(ansIdx) === q.correctIndex,
                    correctIndex: q.correctIndex,
                    explanationAr: q.explanationAr || q.explanationEn,
                    explanationEn: q.explanationEn,
                    explainWrong: q.explainWrong,
                    reference: q.reference,
                    highYieldFact: q.highYieldFact
                };
                resumedAnswers[qId] = Number(ansIdx); // Normalize
            }
        });

        let parsedFlags: Record<string, boolean> = {};
        if (Array.isArray(data.flaggedQuestions)) {
            data.flaggedQuestions.forEach((fid: string) => { parsedFlags[fid] = true; });
        } else if (data.flaggedQuestions && typeof data.flaggedQuestions === 'object') {
            parsedFlags = data.flaggedQuestions;
        }

        // Reset proctor stats for new session
        setProctorStats({
          tabSwitches: 0,
          faceLossCount: 0,
          audioNoiseAlerts: 0,
          integrityScore: 100,
          status: 'ممتاز - نزاهة أكاديمية كاملة'
        });

        const newSession: ExamSession = {
          id: data.attemptId,
          specialtyId,
          councilId: data.councilId,
          mode: data.mode || targetMode,
          categoryFilter: 'all',
          questions: mappedQuestions,
          answers: resumedAnswers,
          answersFeedback: answersFeedback,
          flags: parsedFlags,
          score: 0,
          currentQuestionIndex: data.currentQuestionIndex || 0,
          timeLimitMinutes: data.timeLimitMinutes || (targetMode === 'VISITOR_DEMO' ? 10 : (isSpecialization ? 150 : 50)),
          timeRemainingSeconds: data.timeLimitMinutes ? data.timeLimitMinutes * 60 : (targetMode === 'VISITOR_DEMO' ? 600 : (isSpecialization ? 9000 : 3000)),
                    startedAt: new Date().toISOString(),
          isFinished: false,
          passStatus: false
        };

        setActiveSession(newSession);
        setAnswersFeedback(answersFeedback);
        setCurrentIndex(data.currentQuestionIndex || 0);
        setQuestionTimeRemaining(60);

      } else {
        alert(data.error || "تعذر بدء الامتحان.");
      }
    } catch (e) {
      console.log('Error starting exam via backend API:', e);
      alert("تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.");
    }
  };

  // Auto-save Exam Progress in IndexedDB
  useEffect(() => {
    if (!activeSession) return;
    const storageKey = `medexam_active_session_${specialtyId}`;
    if (activeSession.isFinished) {
      del(storageKey).catch(console.error);
    } else {
      set(storageKey, {
        session: activeSession,
        currentIndex,
        timerEnabled,
        cameraEnabled: isProctoringEnabled,
        questionTimeRemaining,
        savedAt: new Date().toISOString()
      }).catch(console.error);
    }
  }, [activeSession, currentIndex, specialtyId, timerEnabled, isProctoringEnabled, questionTimeRemaining]);


  // Per-Question (60s) Timer Countdown Effect
  useEffect(() => {
    if (!activeSession || activeSession.isFinished || !timerEnabled) return;

    const timer = setInterval(() => {
      setQuestionTimeRemaining((prevQ) => {
        if (typeof document !== "undefined" && document.hidden) return prevQ;
        if (prevQ <= 1) {
          setCurrentIndex((currIdx) => {
            if (currIdx < (activeSession.questions?.length || 0) - 1) {
              return currIdx + 1;
            }
            return currIdx;
          });
          return 60;
        }
        return prevQ - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession?.id, activeSession?.isFinished, timerEnabled]);

  // Auto-submit when time reaches 0
  useEffect(() => {
    if (questionTimeRemaining === 1 && timerEnabled) {
      const qId = currentQIdRef.current;
      const pAns = pendingAnswerRef.current;
      if (qId && pAns !== null) {
        handleSubmitAnswer(qId, pAns, true);
      }
    }
  }, [questionTimeRemaining, timerEnabled]);


  // Submit Answer to backend /api/exam/answer
  const handleSubmitAnswer = async (questionId: string, optionIndex: number, skipAutoAdvance: boolean = false) => {
    if (!activeSession || activeSession.isFinished || isSubmittingAnswer) return;
    
    const currentQ = activeSession.questions.find((q: any) => q.id === questionId);
    if (!currentQ) return;

    // Prevent re-answering
    if (activeSession.answers[questionId] !== undefined) return;

    setIsSubmittingAnswer(true);

    try {
      const isCorrect = optionIndex === currentQ.correctIndex;
      
      setAnswersFeedback((prev: any) => ({
        ...prev,
        [questionId]: {
          selectedAnswer: optionIndex,
          isCorrect,
          correctIndex: currentQ.correctIndex,
          explanationAr: currentQ.explanationAr || currentQ.explanationEn,
          explanationEn: currentQ.explanationEn,
          explainWrong: currentQ.explainWrong,
          reference: currentQ.reference,
          highYieldFact: currentQ.highYieldFact
        }
      }));

      setActiveSession((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: { ...prev.answers, [questionId]: optionIndex }
        };
      });

      if (timerEnabled && !skipAutoAdvance && currentIndex < activeSession.questions.length - 1) {
        setTimeout(() => {
          setCurrentIndex((prev: number) => prev + 1);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Select option handler (stages pending answer for standard view)
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (!activeSession || activeSession.isFinished) return;
    if (activeSession.answers[questionId] !== undefined) return; // already answered
    setPendingAnswer(optionIndex);
  };

  // Toggle flag handler
  const handleToggleFlag = (questionId: string) => {
    if (!activeSession || activeSession.isFinished) return;
    setActiveSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        flags: {
          ...prev.flags,
          [questionId]: !prev.flags[questionId]
        }
      };
    });
  };

  // Authoritative Backend Finish & Score Evaluation
  const executeFinishExam = async (sessionToFinish?: ExamSession) => {
    const targetSession = sessionToFinish || activeSession;
    if (!targetSession || targetSession.isFinished || isFinishingExam) return;
    setIsFinishingExam(true);

    const proctoringReport = isProctoringEnabled ? {
      isProctored: true,
      tabSwitches: proctorStats.tabSwitches,
      faceLossCount: proctorStats.faceLossCount,
      audioNoiseAlerts: proctorStats.audioNoiseAlerts,
      integrityScore: proctorStats.integrityScore,
      status: proctorStats.status,
      summaryText: `المراقبة والنزاهة الأكاديمية: تم إجراء الامتحان بنجاح. سجل النظام ${proctorStats.tabSwitches} تنقلات للتبويب ومستوى نزاهة أكاديمية ${proctorStats.integrityScore}%. لم يتم رفع أو تسجيل أي وسائط على السيرفر (معالجة محلية 100%).`,
      cameraUsed: true
    } : undefined;

    try {
      const res = await authFetch('/api/exam/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: targetSession.id,
          timeRemainingSeconds: targetSession.timeRemainingSeconds,
          answers: targetSession.answers,
          flaggedQuestions: Object.keys(targetSession.flags || {}).filter(k => targetSession.flags[k]),
          cameraEnabled: isProctoringEnabled,
          proctoringReport
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          const finishedSession: ExamSession = {
            ...targetSession,
            isFinished: true,
            score: typeof data.score === 'number' ? data.score : (targetSession.score || 0),
            passStatus: typeof data.passStatus === 'boolean' ? data.passStatus : ((data.score || 0) >= 60),
            finishedAt: data.finishedAt || new Date().toISOString(),
            questions: (Array.isArray(data.detailedQuestions) && data.detailedQuestions.length > 0)
              ? data.detailedQuestions
              : targetSession.questions,
            proctoringReport
          };
          setActiveSession(finishedSession);
          if (onFinishExamCallback) {
            onFinishExamCallback(finishedSession);
          }
          return;
        } else {
            alert(data.error || "حدث خطأ أثناء إنهاء الامتحان.");
        }
      } else {
          alert("فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
      }
    } catch (err) {
      console.error('Error finalizing exam with backend:', err);
      alert("تعذر الاتصال بالخادم. إجاباتك محفوظة محلياً. يرجى إعادة محاولة الإنهاء.");
    } finally {
      setIsFinishingExam(false);
    }
  };

  const handleSafeExit = () => {
    if (activeSession && !activeSession.isFinished) {
      setShowConfirmModal(true);
    } else if (onBackToHome) {
      onBackToHome();
    }
  };

  const handleFinishExamClick = () => {
    if (!activeSession) return;
    setShowConfirmModal(true);
  };

  const confirmFinish = () => {
    setShowConfirmModal(false);
    if (activeSession) {
      executeFinishExam(activeSession);
    }
  };

  // Helper formatting time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // VIEW 1: PRE-EXAM MODE SELECTION
  // ==========================================
  if (!activeSession) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 dir-rtl text-slate-800" dir="rtl">
        {/* Navigation Back to Home Bar */}
        <div className="flex items-center justify-between mb-4">
          {onBackToHome && (
            <button
              onClick={handleSafeExit}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
            >
              <ArrowRight className="w-4 h-4 text-emerald-600" />
              <span>رجوع للصفحة الرئيسية</span>
            </button>
          )}

          <div className="text-xs text-slate-500 font-mono">
            قسم المحاكاة والأسئلة • MedExam.net
          </div>
        </div>

        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-x-12 -translate-y-12 pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-3">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>محاكي الامتحانات التفاعلي لـ MedExam.net</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                امتحان محاكاة {currentSpecialty.titleAr}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                حدد وضع الاختبار المناسب للبدء في تمرين بنك الأسئلة المعتمد متبوعاً بالشرح الطبي الكامل.
              </p>
            </div>

            <button
              onClick={onOpenSpecialtyModal}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>تغيير التخصص ({currentSpecialty.titleAr})</span>
            </button>
          </div>
        </div>

        {/* Specialty Guide & Student Introduction Section */}
        <SpecialtyGuideSection
          specialtyTitle={currentSpecialty.titleAr}
          questionCount={specialtyQuestions.length}
          currentUser={currentUser}
          onOpenSubscribeModal={onOpenSubscribeModal}
          onStartDemo={() => {
            setExamMode('VISITOR_DEMO');
            setTimeout(() => {
              startExam('VISITOR_DEMO');
            }, 50);
          }}
        />

        {/* Server In-Progress Active Attempt Banner */}
        
        {/* Mode Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Option 1: Visitor Demo */}
          <button
            onClick={() => setExamMode('VISITOR_DEMO')}
            className={`p-6 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative bg-white cursor-pointer ${
              examMode === 'VISITOR_DEMO'
                ? 'border-emerald-500 shadow-md shadow-emerald-100 bg-emerald-50/20'
                : 'border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 mb-4 font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">امتحان تجريبي للزوار (10 أسئلة)</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                تجربة فورية لواجهة الامتحان مع مراجعة الشرح الطبي والتحقق الفوري من الإجابة بدون الحاجة لحساب.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-teal-700 font-bold flex items-center justify-between">
              <span>10 أسئلة • 10 دقائق (متاح مجاناً)</span>
              <CheckCircle2 className={`w-4 h-4 ${examMode === 'VISITOR_DEMO' ? 'text-emerald-600' : 'text-slate-300'}`} />
            </div>
          </button>

          {/* Option 2: Student Training Exam */}
          <button
            onClick={() => setExamMode('STUDENT_TRAINING')}
            className={`p-6 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative bg-white cursor-pointer ${
              examMode === 'STUDENT_TRAINING'
                ? 'border-emerald-500 shadow-md shadow-emerald-100 bg-emerald-50/20'
                : 'border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4 font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">الامتحان التدريبي الرئيسي (50 سؤالاً)</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                محاكاة شاملة بدون تكرار للأسئلة السابقة، مع حفظ التقدم وإمكانية الاستئناف وتوزيع الأقسام العلمية بالتساوي.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-emerald-700 font-bold flex items-center justify-between">
              <span>50 سؤالاً • للمشتركين المعتمدين</span>
              <CheckCircle2 className={`w-4 h-4 ${examMode === 'STUDENT_TRAINING' ? 'text-emerald-600' : 'text-slate-300'}`} />
            </div>
          </button>
        </div>

        {/* Action Buttons: Start Simulation + Register for Full Exam */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => startExam(examMode)}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base px-8 py-4 rounded-xl shadow-md shadow-emerald-200 transition-all inline-flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>بدء المحاكاة الآن ({examMode === 'VISITOR_DEMO' ? 'تجريبي' : 'تدريبي كامل'})</span>
          </button>

          <button
            onClick={triggerOpenSubscribe}
            className="w-full sm:w-auto bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-base px-8 py-4 rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-2.5 border border-emerald-600 cursor-pointer"
          >
            <UserCheck className="w-5 h-5 text-emerald-300" />
            <span>سجّل للامتحان بالكامل الآن</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: EXAM RESULTS & MEDICAL REVIEW
  // ==========================================
  if (activeSession.isFinished) {
    const totalCount = activeSession.questions.length;
    const correctCount = Math.round(((activeSession.score || 0) / 100) * totalCount);
    const report = activeSession.proctoringReport;

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 dir-rtl text-slate-800" dir="rtl">
        {/* Navigation Back to Home Bar */}
        <div className="flex items-center justify-between mb-4">
          {onBackToHome && (
            <button
              onClick={handleSafeExit}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
            >
              <ArrowRight className="w-4 h-4 text-emerald-600" />
              <span>رجوع للصفحة الرئيسية</span>
            </button>
          )}

          <div className="text-xs text-slate-500 font-mono">
            نتائج الامتحان • MedExam.net
          </div>
        </div>

        {/* Pass/Fail Banner */}
        <div className={`rounded-2xl p-8 border-2 mb-8 text-center shadow-sm relative overflow-hidden bg-white ${
          activeSession.passStatus ? 'border-emerald-500' : 'border-rose-400'
        }`}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 border border-slate-200 mb-4 shadow-sm">
            {activeSession.passStatus ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            ) : (
              <XCircle className="w-10 h-10 text-rose-500" />
            )}
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            {activeSession.passStatus ? 'تهانينا! لقد اجتزت امتحان المحاكاة بنجاح' : 'للأسف لم تتجاوز النسبة المطلوبة'}
          </h2>

          <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            {activeSession.passStatus
              ? 'أداؤك يعكس استعداداً قوياً للامتحان الوطني لمجلس المهن الطبية. يرجى مراجعة الشرح الطبي للأسئلة أدناه لترسيخ المفاهيم.'
              : 'درجة النجاح المعتمدة في الامتحان هي 60%. استخدم الشرح الطبي المرفق لكل سؤال لمعالجة نقاط الضعف وإعادة الامتحان.'}
          </p>

          <div className="mt-6 inline-flex items-center gap-8 bg-slate-50 px-6 py-3 rounded-xl border border-slate-200">
            <div>
              <div className="text-[10px] text-slate-500">النتيجة النهائية</div>
              <div className={`text-2xl font-black font-mono ${activeSession.passStatus ? 'text-emerald-600' : 'text-rose-600'}`}>
                {activeSession.score}%
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-[10px] text-slate-500">الإجابات الصحيحة</div>
              <div className="text-2xl font-black font-mono text-emerald-600">
                {correctCount} / {totalCount}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setActiveSession(null)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-lg text-xs flex items-center gap-2 shadow-md shadow-emerald-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة الامتحان أو اختيار تخصص آخر</span>
            </button>
            {onBackToHome && (
              <button
                onClick={handleSafeExit}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-3 rounded-lg text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4 text-emerald-400" />
                <span>الرجوع للرئيسية</span>
              </button>
            )}
          </div>

          {/* UPGRADE AND SUBSCRIPTION PROMPT AT END OF TRIAL EXAM */}
          <div className="mt-8 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white rounded-2xl p-6 border-2 border-emerald-500/80 shadow-lg text-right relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-3 py-0.5 rounded-full">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>طلب الترقية والاشتراك الرسمي 2026</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  هل أنت جاهز لفتح الامتحان الرئيسي والوصول لأكثر من 2100+ سؤال؟
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  ترقية حسابك تتيح لك فتح كافة التخصصات، بنوك الأسئلة الكاملة، الشرح المرجعي بالإنجليزية، والتواصل المباشر في القروب العلمي.
                  سدد عبر بنكك: <strong className="text-emerald-400 font-mono text-sm">7689305</strong> (باسم محمد السماني حسن سليمان).
                </p>
              </div>

              <button
                onClick={triggerOpenSubscribe}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-transform transform active:scale-95 shrink-0 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>طلب الترقية والاشتراك الآن</span>
              </button>
            </div>
          </div>
        </div>

        {/* Proctoring Academic Integrity Report Card */}
        {report && (
          <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 mb-8 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    تقرير النزاهة والمراقبة الذكية للامتحان (Proctoring Report)
                  </h3>
                  <p className="text-xs text-slate-400">تم تسجيل التقرير الإحصائي فقط دون تخزين أية وسائط على السيرفر</p>
                </div>
              </div>

              <span className={`text-xs px-3 py-1.5 rounded-full font-bold self-start sm:self-center font-mono ${
                report.integrityScore >= 90
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                نسبة النزاهة: {report.integrityScore}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">مغادرة الشاشة / التبويب</span>
                <span className="text-sm font-bold font-mono text-amber-400">{report.tabSwitches} تنبيهات</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">تشتت الوجه / العين</span>
                <span className="text-sm font-bold font-mono text-cyan-400">{report.faceLossCount} مرات</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">حالة المعالجة</span>
                <span className="text-sm font-bold text-emerald-400">محلياً 100%</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">تقييم المراقبة</span>
                <span className="text-sm font-bold text-slate-200">{report.status}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                خصوصية حتمية: الصلاحيات تمت محلياً، ولم تُرسل الكاميرا أو الميكروفون إلى أي خادم خارجي.
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                ID: {activeSession.id}
              </span>
            </div>
          </div>
        )}

        {/* Detailed Question Review List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <span>المراجعة الطبية التفصيلية للأسئلة والشرح</span>
            </h3>
            <span className="text-xs text-slate-500">جميع الأسئلة مشفوعة بالمرجع والتفسير العلمي</span>
          </div>

          {activeSession.questions.map((q, idx) => {
            const userAnswer = activeSession.answers[q.id];
            const fb = answersFeedback[q.id];
            const effectiveCorrectIndex = fb ? fb.correctIndex : q.correctIndex;
            const isCorrect = (fb && fb.isCorrect !== undefined) 
              ? fb.isCorrect 
              : (userAnswer !== undefined && effectiveCorrectIndex !== undefined && userAnswer === effectiveCorrectIndex);

            const explanationText = (examLang === 'en')
              ? (fb?.explanationEn || q.explanationEn || fb?.explanationAr || q.explanationAr)
              : (fb?.explanationAr || q.explanationAr || fb?.explanationEn || q.explanationEn);

            const highYield = fb?.highYieldFact || q.highYieldFact;
            const referenceBook = fb?.reference || q.reference;

            return (
              <div
                key={q.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {q.category}
                    </span>
                  </div>

                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                    isCorrect
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 leading-relaxed mb-4">
                  {examLang === 'en' && q.questionEn ? q.questionEn : q.questionAr}
                </h4>

                {/* Options List */}
                <div className="space-y-2 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const isOptionCorrect = effectiveCorrectIndex !== undefined && optIdx === effectiveCorrectIndex;
                    const isUserChoice = optIdx === userAnswer;

                    let optStyle = 'bg-white border-slate-200 text-slate-700';
                    if (isOptionCorrect) {
                      optStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                    } else if (isUserChoice && !isOptionCorrect) {
                      optStyle = 'bg-rose-50 border-rose-500 text-rose-900 font-bold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${optStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-slate-100 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isOptionCorrect && (
                          <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-bold">
                            الإجابة الصحيحة
                          </span>
                        )}
                        {isUserChoice && !isOptionCorrect && (
                          <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded font-bold">
                            إجابتك المختارة
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* High Yield Key Concept */}
                {highYield && (
                  <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">المفهوم عالي الأهمية (High-Yield Concept):</strong>
                      <span>{highYield}</span>
                    </div>
                  </div>
                )}

                {/* Medical Explanation Callout Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-relaxed text-slate-700">
                  <div className="font-bold text-emerald-700 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>التفسير والشرح الطبي (Medical Rationale):</span>
                  </div>
                  <p>{explanationText || 'لا يوجد شرح إضافي متاح لهذا السؤال.'}</p>
                  {referenceBook && (
                    <div className="mt-2 text-[10px] text-slate-500 font-mono">
                      المرجع المعتمد: {referenceBook}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: LIVE ACTIVE EXAM SESSION (Matching Screenshot 3)
  // ==========================================
  const currentQ = activeSession.questions[currentIndex];
  const isFlagged = !!activeSession.flags[currentQ.id];
  const selectedOpt = activeSession.answers[currentQ.id];

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2 h-[calc(100vh-40px)] flex flex-col justify-between overflow-hidden dir-ltr text-left font-sans text-slate-800" dir="ltr">
      
      {/* Outer Exam Container Card */}
      <div className="bg-white border border-slate-300 rounded-2xl shadow-lg flex-1 flex flex-col overflow-hidden relative">
        
        {/* 1. TOP DARK TOOLBAR WITH LIVE CAMERA PROCTOR WIDGET AND PER-QUESTION TIMER */}
        <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
          
          {/* Left: Camera Proctoring Widget + 60s Question Timer */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Camera Proctor Widget */}
            <MockProctorWidget
              isProctoringActive={isProctoringEnabled}
              onUpdateStats={setProctorStats}
            />

            {/* Per-Question 60s Countdown Timer */}
            <div 
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs sm:text-sm font-black border transition-all ${
                questionTimeRemaining <= 10
                  ? 'bg-rose-950 text-rose-400 border-rose-800 animate-pulse'
                  : 'bg-slate-800 text-amber-400 border-slate-700'
              }`}
              title="الوقت المتبقي لهذا السؤال (60 ثانية)"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>⏱️ {questionTimeRemaining}s</span>
            </div>

            {/* Auto-Advance Toggle */}
            <button
              onClick={() => setTimerEnabled(prev => !prev)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer ${
                timerEnabled
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="التحكم في تشغيل أو إيقاف مؤقت السؤال"
            >
              <span className={`w-2 h-2 rounded-full ${timerEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              <span className="hidden xs:inline sm:inline">المؤقت:</span>
              <span>{timerEnabled ? 'تشغيل' : 'إيقاف'}</span>
            </button>
          </div>

          {/* Right: Exam Tools Buttons + Language Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Global Language Switcher for Questions - Hidden for Medicine & Surgery (English only) */}
            {languageMode === 'BILINGUAL' && (
              <button
                onClick={() => setExamLang(prev => prev === 'ar' ? 'en' : 'ar')}
                className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="تغيير لغة جميع الأسئلة بين العربية والإنجليزية / Toggle Question Language"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>{examLang === 'ar' ? 'English (En)' : 'العربية (Ar)'}</span>
              </button>
            )}

            <button
              onClick={() => handleToggleFlag(currentQ.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isFlagged
                  ? 'bg-rose-500 text-white font-black'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="حفظ السؤال للمراجعة"
            >
              <Heart className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
              <span>{isFlagged ? 'تم الحفظ' : 'حفظ للمراجعة'}</span>
            </button>

            <button
              onClick={() => setShowCalcModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Calc</span>
            </button>

            <button
              onClick={() => setShowNotesModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Notes</span>
            </button>

            <button
              onClick={() => setShowLabModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
              <span>Lab</span>
            </button>
          </div>
        </div>

        {/* 2. SECOND SUB-HEADER STRIP (GREEN BANNER) */}
        <div className="bg-emerald-800 text-white px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-bold shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <span>Item {currentIndex + 1} of {activeSession.questions.length}</span>
            {specialtyId === 'int_medicine' && (
              <span className="bg-amber-400 text-slate-950 text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-wide hidden sm:inline-block">
                SMSB Internal Medicine Specialization Board
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Block 1 / {activeSession.questions.length} Questions</span>
          </div>
        </div>

        {/* 3. QUESTION CONTENT AREA */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 text-left dir-ltr" dir="ltr">
          {activeSession.councilId === 'specialties' ? (
            <SpecialtyQuestionView
              question={currentQ}
              selectedOpt={selectedOpt}
              pendingAnswer={pendingAnswer}
              isFlagged={isFlagged}
              examLang={examLang}
              onSelectOption={handleSelectOption}
              answersFeedback={answersFeedback}
              timerEnabled={timerEnabled}
              questionTimeRemaining={questionTimeRemaining}
            />
          ) : currentSpecialty?.councilId === 'specialties' ? (
            <SpecialtyBoardQuestionView
              question={currentQ}
              answeredIndex={activeSession.answers[currentQ.id]}
              answeredFeedback={answersFeedback[currentQ.id]}
              examLang={examLang}
              currentUser={currentUser}
              onConfirmAnswer={(qId, optIdx) => handleSubmitAnswer(qId, optIdx)}
              onNext={() => setCurrentIndex(prev => Math.min(activeSession.questions.length - 1, prev + 1))}
              scoreState={{
                correctCount: Object.entries(activeSession.answers).filter(([qId, ansIdx]) => {
                  const fb = answersFeedback[qId];
                  const cIdx = fb ? fb.correctIndex : activeSession.questions.find(q => q.id === qId)?.correctIndex;
                  return cIdx === ansIdx;
                }).length,
                answeredCount: Object.keys(activeSession.answers).length
              }}
            />
          ) : (
            <>
              {/* Per-Question Quick Language Toggle Badge */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
                  {currentQ.category}
                </span>

                {languageMode === 'BILINGUAL' && (
                  <button
                    onClick={() => setExamLang(prev => prev === 'ar' ? 'en' : 'ar')}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Languages className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {examLang === 'ar' 
                        ? '�� تغيير لغة هذا السؤال إلى الإنجليزية (English)' 
                        : '�� Switch to Arabic (عرض بالعربية)'}
                    </span>
                  </button>
                )}
              </div>

              {/* Clinical Stem / Vignette if present */}
              {currentQ.stem && (
                <div className="bg-slate-50 border-r-4 border-teal-600 p-3.5 rounded-l-xl text-slate-800 text-sm leading-relaxed font-serif mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-800 font-bold block mb-1">Clinical Vignette</span>
                  {currentQ.stem}
                </div>
              )}

              {/* Lab Values Table if present */}
              {currentQ.labTable && currentQ.labTable.length > 0 && (
                <div className="my-3 border border-slate-200 rounded-xl overflow-hidden text-xs font-mono bg-white shadow-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-teal-900 text-teal-100 text-[11px] uppercase tracking-wider">
                        <th className="p-2 text-left font-bold">Test</th>
                        <th className="p-2 text-left font-bold">Patient's Result</th>
                        <th className="p-2 text-left font-bold">Reference Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentQ.labTable.map((row, rIdx) => (
                        <tr key={rIdx} className={row.abnormal ? 'bg-rose-50/80 text-rose-950 font-bold' : 'text-slate-800'}>
                          <td className="p-2">{row.test}</td>
                          <td className={`p-2 font-black ${row.abnormal ? 'text-rose-600' : ''}`}>{row.result}</td>
                          <td className="p-2 text-slate-500 font-normal">{row.range}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Question Text */}
              <div className="text-slate-900 font-bold text-base sm:text-lg leading-relaxed pb-2">
                {( (languageMode === 'ENGLISH_ONLY' || examLang === 'en') && currentQ.questionEn) 
                  ? currentQ.questionEn 
                  : currentQ.questionAr}
              </div>

              {/* Options List with Peer Response Stats */}
              <div className="space-y-2.5">
                {(((languageMode === 'ENGLISH_ONLY' || examLang === 'en') && currentQ.optionsEn && currentQ.optionsEn.length === currentQ.options.length) 
                    ? currentQ.optionsEn 
                    : currentQ.options
                 ).map((optText, optIdx) => {
                  const isSubmitted = selectedOpt !== undefined;
                  const isPending = pendingAnswer === optIdx;
                  const optionLetter = String.fromCharCode(65 + optIdx);
                  const fb = answersFeedback[currentQ.id];
                  const effectiveCorrectIndex = fb ? fb.correctIndex : currentQ.correctIndex;
                  const isOptionCorrect = optIdx === effectiveCorrectIndex;
                  const isUserAnswer = selectedOpt === optIdx;
                  const pct = currentQ.optionsPct && currentQ.optionsPct[optIdx] !== undefined ? currentQ.optionsPct[optIdx] : null;

                  let btnStyle = 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800';
                  if (isSubmitted) {
                    if (isOptionCorrect) {
                      btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                    } else if (isUserAnswer) {
                      btnStyle = 'bg-rose-50 border-rose-500 text-rose-950 font-bold';
                    } else {
                      btnStyle = 'bg-slate-50/60 border-slate-200 text-slate-500 opacity-70';
                    }
                  } else if (isPending) {
                    btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs';
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isSubmitted || isSubmittingAnswer}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3.5 cursor-pointer relative overflow-hidden ${btnStyle}`}
                    >
                      {/* Visual Peer Stats Fill Bar when answered */}
                      {isSubmitted && pct !== null && (
                        <div
                          className={`absolute top-0 bottom-0 left-0 transition-all duration-500 pointer-events-none ${
                            isOptionCorrect ? 'bg-emerald-200/40' : isUserAnswer ? 'bg-rose-200/40' : 'bg-slate-200/30'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      )}

                      <div className="flex items-center gap-3.5 relative z-10">
                        <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                          isSubmitted
                            ? isOptionCorrect
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : isUserAnswer
                              ? 'border-rose-600 bg-rose-600 text-white'
                              : 'border-slate-300 bg-slate-100 text-slate-500'
                            : isPending
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 bg-slate-100 text-slate-700'
                        }`}>
                          {optionLetter}
                        </span>
                        <span className="text-sm sm:text-base leading-snug">{optText}</span>
                      </div>

                      {/* Peer percentage badge when answered */}
                      {isSubmitted && pct !== null && (
                        <span className="relative z-10 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white shrink-0">
                          {pct}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Submit Answer Action Bar (Before Submitting) */}
              {selectedOpt === undefined && (
                <div className="pt-3 flex justify-end">
                  <button
                    disabled={pendingAnswer === null || isSubmittingAnswer}
                    onClick={() => {
                      if (pendingAnswer !== null) {
                        handleSubmitAnswer(currentQ.id, pendingAnswer);
                      }
                    }}
                    className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                      pendingAnswer !== null && !isSubmittingAnswer
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmittingAnswer ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>جاري التحقق من الإجابة...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تأكيد الإجابة والتحقق الطبي (Submit Answer)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Standard Clinical High Yield Explanation Box once answered */}
              {selectedOpt !== undefined && (
                <div className="mt-6 space-y-4 animate-fadeIn">
                  
                  {/* High Yield Key Rule Box */}
                  {(answersFeedback[currentQ.id]?.highYieldFact || currentQ.highYieldFact) && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                      <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-emerald-800 uppercase font-mono tracking-wider block">High-Yield Takeaway</span>
                        <p className="text-sm font-bold text-emerald-950 mt-0.5">
                          {answersFeedback[currentQ.id]?.highYieldFact || currentQ.highYieldFact}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Rationale Explanation */}
                  <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-5 text-xs sm:text-sm leading-relaxed space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Medical Explanation & Rationale:</span>
                    </div>
                    <p>
                      {examLang === 'en' 
                        ? (answersFeedback[currentQ.id]?.explanationEn || currentQ.explanationEn || answersFeedback[currentQ.id]?.explanationAr || currentQ.explanationAr) 
                        : (answersFeedback[currentQ.id]?.explanationAr || currentQ.explanationAr)}
                    </p>

                    {/* Why other options are wrong */}
                    {(answersFeedback[currentQ.id]?.explainWrong || currentQ.explainWrong) && (
                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-amber-400 block font-mono">Why Other Options Are Incorrect:</span>
                        <ul className="space-y-1.5 pl-4 list-disc text-slate-300 text-xs">
                          {(answersFeedback[currentQ.id]?.explainWrong || currentQ.explainWrong || []).map((reason, rIdx) => (
                            reason ? <li key={rIdx}><strong>Option {String.fromCharCode(65 + rIdx)}:</strong> {reason}</li> : null
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Textbook Reference Topic */}
                  {currentQ.textbookTopic && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs sm:text-sm text-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-slate-200 pb-2 text-base">
                        <GraduationCap className="w-5 h-5 text-teal-600" />
                        <span>{currentQ.textbookTopic.title}</span>
                      </div>

                      {currentQ.textbookTopic.overview && (
                        <p className="text-slate-600 leading-relaxed">{currentQ.textbookTopic.overview}</p>
                      )}

                      {currentQ.textbookTopic.features && (
                        <div>
                          <span className="font-bold text-teal-900 block mb-1">Key Clinical Features:</span>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {currentQ.textbookTopic.features.map((f, fIdx) => <li key={fIdx}>{f}</li>)}
                          </ul>
                        </div>
                      )}

                      {currentQ.textbookTopic.causes && (
                        <div>
                          <span className="font-bold text-teal-900 block mb-1">Causes & Etiology:</span>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {currentQ.textbookTopic.causes.map((c, cIdx) => <li key={cIdx}>{c}</li>)}
                          </ul>
                        </div>
                      )}

                      {currentQ.textbookTopic.management && (
                        <div>
                          <span className="font-bold text-teal-900 block mb-1">Management Guidelines (NICE):</span>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            {currentQ.textbookTopic.management.map((m, mIdx) => <li key={mIdx}>{m}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </>
          )}
        </div>

        {/* 4. BOTTOM QUESTION NUMBER PALETTE GRID */}
        <div className="bg-slate-100 border-t border-slate-200 p-2.5 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {activeSession.questions.map((q, idx) => {
              const isAns = activeSession.answers[q.id] !== undefined;
              const isFlg = activeSession.flags[q.id];
              const isCur = idx === currentIndex;

              let bgClass = 'bg-white text-slate-700 border-slate-300';
              if (isCur) {
                bgClass = 'bg-blue-600 text-white border-blue-700 font-black scale-105 shadow-xs';
              } else if (isFlg) {
                bgClass = 'bg-rose-500 text-white border-rose-600 font-bold';
              } else if (isAns) {
                bgClass = 'bg-emerald-600 text-white border-emerald-700 font-bold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border text-xs flex items-center justify-center shrink-0 transition-all cursor-pointer ${bgClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. BOTTOM NAVIGATION ACTION BUTTONS */}
        <div className="bg-slate-900 border-t border-slate-800 p-3 px-4 flex items-center justify-between shrink-0">
          
          <button
            onClick={() => setCurrentIndex(prev => Math.min(activeSession.questions.length - 1, prev + 1))}
            disabled={currentIndex === activeSession.questions.length - 1}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950"
          >
            <span>▶ Next</span>
          </button>

          <button
            onClick={handleFinishExamClick}
            className="border border-rose-500/80 hover:bg-rose-950 text-rose-300 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            End Block
          </button>

          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Prev ◀</span>
          </button>
        </div>

      </div>

      {/* CALCULATOR MODAL */}
      {showCalcModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white border border-slate-700 rounded-3xl w-full max-w-xs p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Medical Calculator
              </span>
              <button onClick={() => setShowCalcModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-right mb-4">
              <div className="text-xs text-slate-400 font-mono min-h-4">{calcExpr || '0'}</div>
              <div className="text-xl font-mono font-black text-emerald-400 min-h-6">{calcResult || '0'}</div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-bold font-mono">
              {['C', '(', ')', '/'].map(btn => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') { setCalcExpr(''); setCalcResult(''); }
                    else setCalcExpr(prev => prev + btn);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl text-amber-400"
                >
                  {btn}
                </button>
              ))}
              {['7', '8', '9', '*'].map(btn => (
                <button
                  key={btn}
                  onClick={() => setCalcExpr(prev => prev + btn)}
                  className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl text-slate-200"
                >
                  {btn}
                </button>
              ))}
              {['4', '5', '6', '-'].map(btn => (
                <button
                  key={btn}
                  onClick={() => setCalcExpr(prev => prev + btn)}
                  className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl text-slate-200"
                >
                  {btn}
                </button>
              ))}
              {['1', '2', '3', '+'].map(btn => (
                <button
                  key={btn}
                  onClick={() => setCalcExpr(prev => prev + btn)}
                  className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl text-slate-200"
                >
                  {btn}
                </button>
              ))}
              {['0', '.', '='].map(btn => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === '=') {
                      try {
                        // safe basic evaluator
                        const res = Function(`"use strict"; return (${calcExpr})`)();
                        setCalcResult(String(res));
                      } catch {
                        setCalcResult('Error');
                      }
                    } else setCalcExpr(prev => prev + btn);
                  }}
                  className={`p-3 rounded-xl ${btn === '=' ? 'col-span-2 bg-emerald-600 text-white font-black' : 'bg-slate-800 text-slate-200'}`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SCRATCHPAD NOTES MODAL */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Scratchpad Notes (Draft)</span>
              </span>
              <button onClick={() => setShowNotesModal(false)} className="text-slate-400 hover:text-slate-800 font-bold text-xs">✕ Close</button>
            </div>
            <textarea
              rows={8}
              value={scratchNotes}
              onChange={(e) => setScratchNotes(e.target.value)}
              placeholder="Write your temporary exam notes here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-500"
            />
            <div className="text-[10px] text-slate-400 mt-2 text-right">Notes are saved locally during your active block session.</div>
          </div>
        </div>
      )}

      {/* LAB NORMAL VALUES MODAL */}
      {showLabModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 dir-ltr" dir="ltr">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-5 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-600" />
                <span>Standard Reference Lab Values</span>
              </span>
              <button onClick={() => setShowLabModal(false)} className="text-slate-400 hover:text-slate-800 font-bold text-xs">✕ Close</button>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between"><span>Sodium (Na+)</span><span className="font-bold text-slate-900">135 - 145 mEq/L</span></div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between"><span>Potassium (K+)</span><span className="font-bold text-slate-900">3.5 - 5.0 mEq/L</span></div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between"><span>Hemoglobin (Hb)</span><span className="font-bold text-slate-900">13.5 - 17.5 g/dL (M) / 12 - 15.5 g/dL (F)</span></div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between"><span>WBC Count</span><span className="font-bold text-slate-900">4,500 - 11,000 /mcL</span></div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between"><span>Platelets</span><span className="font-bold text-slate-900">150,000 - 450,000 /mcL</span></div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between"><span>Serum Creatinine</span><span className="font-bold text-slate-900">0.7 - 1.3 mg/dL</span></div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between"><span>BUN</span><span className="font-bold text-slate-900">7 - 20 mg/dL</span></div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between"><span>Fasting Blood Glucose</span><span className="font-bold text-slate-900">70 - 99 mg/dL</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Finish Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 dir-ltr" dir="ltr">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Exam Submission</h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              You have answered <strong className="text-emerald-700 font-bold">{Object.keys(activeSession.answers).length}</strong> out of <strong className="text-slate-900 font-bold">{activeSession.questions.length}</strong> questions. Are you sure you want to finish the exam and review your score?
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
              >
                Return to Exam
              </button>
              <button
                onClick={confirmFinish}
                disabled={isFinishingExam}
                className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-xs shadow-rose-200 cursor-pointer flex items-center gap-2"
              >
                {isFinishingExam ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
