import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowRight, 
  Award, 
  Play, 
  Lock, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles,
  BookOpen,
  CreditCard,
  AlertTriangle,
  LogIn,
  UserPlus,
  X,
  Database
} from 'lucide-react';

import { SpecialtyId, UserAccount, Question, ExamMode } from '../types';

interface ExamItem {
  id: string;
  title: string;
  questionCount: number;
  timeMinutes: number;
  isFree: boolean;
  mode: ExamMode;
  description: string;
}

interface ExamsPageProps {
  specialtyId: SpecialtyId;
  currentUser: UserAccount | null;
  questions?: Question[];
  onStartExam: (mode: ExamMode) => void;
  onOpenSubscribeModal: () => void;
  onOpenAuthModal: (initialMode?: 'login' | 'signup') => void;
  onBackToSpecialties: () => void;
}

export const ExamsPage: React.FC<ExamsPageProps> = ({
  specialties,
  specialtyId,
  currentUser,
  questions = [],
  onStartExam,
  onOpenSubscribeModal,
  onOpenAuthModal,
  onBackToSpecialties
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalNotice, setActiveModalNotice] = useState<'not_logged_in' | 'not_subscribed' | 'empty_bank' | null>(null);

  const currentSpecialty = specialties.find(s => s.id === specialtyId) || specialties[0] || { id: '', titleAr: '', titleEn: '', description: '', questionCount: 0, councilId: 'medical' } as any;
  const isSubscribed = Boolean(currentUser?.isSubscribed && currentUser?.subscriptionStatus === 'active');

  const isSpecialization = currentSpecialty.councilId === 'specialties';
  const officialTime = isSpecialization ? 150 : 50;

  // Check matching questions for this specialty
  const specialtyQuestionsCount = useMemo(() => {
    const direct = questions.filter(q => 
      q.specialtyId === specialtyId || 
      q.councilId === currentSpecialty.councilId ||
      q.category === currentSpecialty.titleAr
    ).length;
    if (direct > 0) return direct;
    return questions.length > 0 ? questions.length : 50;
  }, [questions, specialtyId, currentSpecialty]);

  // Exactly 2 exams for each specialty: Free Visitor Demo (10 questions) and Student Training Exam (50 questions)
  const examsList: ExamItem[] = useMemo(() => {
    return [
      {
        id: 'exam-free',
        title: `🎯 امتحان تجريبي للزوار (10 أسئلة)`,
        questionCount: 10,
        timeMinutes: 10,
        isFree: true,
        mode: 'VISITOR_DEMO',
        description: 'تجربة فورية لواجهة الامتحان وبنك الأسئلة المعتمد مع الشرح الطبي الكامل.'
      },
      {
        id: 'exam-official',
        title: `📝 الامتحان التدريبي الرئيسي (50 سؤال)`,
        questionCount: 50,
        timeMinutes: officialTime,
        isFree: false,
        mode: 'STUDENT_TRAINING',
        description: isSpecialization 
          ? 'محاكاة رسمية كاملة للامتحان الوطني بمجلس التخصصات SMSB (50 سؤالاً عشوائياً بدون تكرار - مع توزيع الأقسام).' 
          : 'محاكاة رسمية كاملة لنظام وشكل الامتحان الوطني (50 سؤالاً عشوائياً بدون تكرار - الزمن: 50 دقيقة).'
      }
    ];
  }, [currentSpecialty, isSpecialization, officialTime]);

  const filteredExams = useMemo(() => {
    return examsList.filter(e => 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [examsList, searchQuery]);

  // Handle Exam Click
  const handleExamClick = (exam: ExamItem) => {
    // 1. Visitor demo is open to everyone
    if (exam.mode === 'VISITOR_DEMO') {
      onStartExam(exam.mode);
      return;
    }

    // 2. Student Training requires login
    if (!currentUser) {
      setActiveModalNotice('not_logged_in');
      return;
    }

    // 3. Student Training requires subscription
    if (!isSubscribed) {
      setActiveModalNotice('not_subscribed');
      return;
    }

    // 4. Everything is valid -> Start exam!
    onStartExam(exam.mode);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 dir-rtl" dir="rtl">
      
      {/* Top Header Navigation Bar with Single Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToSpecialties}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الرجوع لصفحة التخصصات</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
              {currentSpecialty.titleAr}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 pt-1">
            امتحانات تخصص ({currentSpecialty.titleAr})
          </h1>
        </div>

        {/* User Membership Status Indicator */}
        <div className="text-left text-xs font-bold">
          {currentUser ? (
            isSubscribed ? (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                عضوية مفعلة - جميع الامتحانات مفتوحة 🟢
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                حساب تجريبي (الامتحان التجريبي فقط)
              </span>
            )
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              تسجيل الدخول لبدء الامتحانات
            </button>
          )}
        </div>
      </div>

      {/* Search Input for Exams */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن امتحان معين..."
          className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs font-bold focus:outline-none focus:border-emerald-500 shadow-2xs"
        />
      </div>

      {/* Exams List (Free first, then Official) */}
      <div className="space-y-4">
        {filteredExams.map((exam) => {
          const isExamAccessible = exam.isFree || isSubscribed;

          return (
            <div
              key={exam.id}
              className={`bg-white border rounded-2xl p-6 shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 ${
                exam.isFree
                  ? 'border-blue-200 hover:border-blue-400 border-r-4 border-r-blue-600'
                  : isSubscribed
                  ? 'border-emerald-200 hover:border-emerald-400 border-r-4 border-r-emerald-500'
                  : 'border-amber-200 hover:border-amber-300 border-r-4 border-r-amber-500'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Badge */}
                  {exam.isFree ? (
                    <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      ✨ امتحان تجريبي مجاني (10 أسئلة)
                    </span>
                  ) : isSubscribed ? (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      امتحان رسمي للمشتركين (50 سؤال)
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-700" />
                      امتحان رسمي مدفوع (يتطلب اشتراك)
                    </span>
                  )}

                  <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    الزمن: {exam.timeMinutes} دقيقة
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{exam.title}</span>
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {exam.description}
                </p>
              </div>

              {/* ACTION BUTTON */}
              <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                {exam.isFree ? (
                  <button
                    onClick={() => handleExamClick(exam)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl text-xs transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current rotate-180" />
                    <span>ابدأ الامتحان التجريبي</span>
                  </button>
                ) : isSubscribed ? (
                  <button
                    onClick={() => handleExamClick(exam)}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-xl text-xs transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current rotate-180" />
                    <span>ابدأ الامتحان الرسمي</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleExamClick(exam)}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-black px-6 py-3 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>اشترك الآن للوصول للامتحان الرسمي</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL NOTICES OVERLAY FOR USER STATES */}
      {activeModalNotice && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-center space-y-5 animate-scale-up">
            
            <button
              onClick={() => setActiveModalNotice(null)}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 1. NOT LOGGED IN NOTICE */}
            {activeModalNotice === 'not_logged_in' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-inner">
                  <LogIn className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">
                    ⚠️ يرجى تسجيل الدخول لبدء الامتحان
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    يتطلب إجراء امتحانات المنصة واستخراج النتيجة تسجيلاً صالحاً بحسابك. يرجى الدخول أو إنشاء حساب جديد.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setActiveModalNotice(null);
                      onOpenAuthModal('login');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveModalNotice(null);
                      onOpenAuthModal('signup');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>إنشاء حساب جديد</span>
                  </button>
                </div>
              </>
            )}

            {/* 2. NOT SUBSCRIBED NOTICE */}
            {activeModalNotice === 'not_subscribed' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-inner">
                  <Lock className="w-8 h-8 text-amber-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">
                    ⚠️ هذا الامتحان متاح حصرياً للمشتركين
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    يتطلب الامتحان الرسمي (50 سؤالاً) اشتراكاً نَشِطاً. اشترك الآن بـ 5,000 ج.س فقط لفتح بنوك الأسئلة كاملة وإصدار الشهادات.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActiveModalNotice(null);
                      onOpenSubscribeModal();
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 px-4 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>اشترك الآن وتصفح خيارات الدفع</span>
                  </button>
                </div>
              </>
            )}

            {/* 3. EMPTY QUESTION BANK NOTICE */}
            {activeModalNotice === 'empty_bank' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto border border-slate-200 shadow-inner">
                  <Database className="w-8 h-8 text-slate-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">
                    ⚠️ بنك الأسئلة قيد الإعداد حالياً
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    بنك الأسئلة الخاص بتخصص (<strong>{currentSpecialty.titleAr}</strong>) في قاعدة البيانات لا يزال قيد الإعداد والتحميل بواسطة اللجنة العلمية. سيتم إضافة الأسئلة الرسمية قريباً.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveModalNotice(null)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>العودة والرجوع</span>
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
