import React, { useState, useEffect } from 'react';
import { 
  X, 
  Stethoscope, 
  Activity, 
  Pill, 
  Microscope, 
  HeartPulse, 
  Scan, 
  ShieldAlert, 
  Syringe, 
  CheckCircle2, 
  Users, 
  BookOpen,
  Play,
  Lock,
  Building2,
  Sparkles,
  CreditCard
} from 'lucide-react';

import { SpecialtyId, CouncilId } from '../types';

interface SpecialtyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpecialtyId: SpecialtyId;
  onSelectSpecialty: (id: SpecialtyId) => void;
  initialCouncilFilter?: string;
  isSubscribed?: boolean;
  isLoggedIn?: boolean;
  onOpenAuthModal?: (mode?: 'login' | 'signup') => void;
  specialtiesStatusMap?: Record<string, boolean>;
  onStartTrialExam?: (specialtyId: SpecialtyId) => void;
  onStartMainExam?: (specialtyId: SpecialtyId) => void;
  onOpenSubscribeModal?: () => void;
  onOpenSpecialtyChat?: (specialtyId: SpecialtyId) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Stethoscope: <Stethoscope className="w-6 h-6 text-emerald-400" />,
  Activity: <Activity className="w-6 h-6 text-teal-400" />,
  Pill: <Pill className="w-6 h-6 text-cyan-400" />,
  Microscope: <Microscope className="w-6 h-6 text-emerald-300" />,
  HeartPulse: <HeartPulse className="w-6 h-6 text-blue-400" />,
  Scan: <Scan className="w-6 h-6 text-indigo-400" />,
  ShieldAlert: <ShieldAlert className="w-6 h-6 text-sky-400" />,
  Syringe: <Syringe className="w-6 h-6 text-violet-400" />
};

export const SpecialtyModal: React.FC<SpecialtyModalProps> = ({
  specialties,
  councils,
  isOpen,
  onClose,
  selectedSpecialtyId,
  onSelectSpecialty,
  initialCouncilFilter = 'all',
  isSubscribed = false,
  isLoggedIn = false,
  onOpenAuthModal,
  specialtiesStatusMap = {},
  onStartTrialExam,
  onStartMainExam,
  onOpenSubscribeModal,
  onOpenSpecialtyChat
}) => {
  const [activeCouncilTab, setActiveCouncilTab] = useState<string>('all');
  const [showSubModal, setShowSubModal] = useState(false);

  useEffect(() => {
    if (initialCouncilFilter) {
      setActiveCouncilTab(initialCouncilFilter);
    }
  }, [initialCouncilFilter, isOpen]);

  if (!isOpen) return null;

  const filteredSpecialties = specialties.filter(s => {
    if (activeCouncilTab === 'all') return true;
    return s.councilId === activeCouncilTab;
  });

  const handleTrialClick = (specId: SpecialtyId) => {
    if (!isLoggedIn) {
      onClose();
      if (onOpenAuthModal) {
        onOpenAuthModal('signup');
      }
      return;
    }
    onSelectSpecialty(specId);
    onClose();
    if (onStartTrialExam) {
      onStartTrialExam(specId);
    }
  };

  const handleMainExamClick = (specId: SpecialtyId) => {
    if (!isLoggedIn) {
      onClose();
      if (onOpenAuthModal) {
        onOpenAuthModal('signup');
      }
      return;
    }
    onSelectSpecialty(specId);
    if (isSubscribed) {
      onClose();
      if (onStartMainExam) {
        onStartMainExam(specId);
      }
    } else {
      setShowSubModal(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs dir-rtl animate-fadeIn" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
              <Building2 className="w-6 h-6 text-emerald-400" />
              <span>تخصصات امتحانات المجالس الطبية</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              اختر المجلس والتخصص المطلوب للبدء في الامتحان التجريبي أو الامتحان الرئيسي بالمنصة
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Council Filter Navigation Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveCouncilTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeCouncilTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            جميع التخصصات
          </button>

          {councils.map(council => (
            <button
              key={council.id}
              onClick={() => setActiveCouncilTab(council.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeCouncilTab === council.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              {council.titleAr}
            </button>
          ))}
        </div>

        {/* Sub-Specialties Grid with 2 mandatory Action Buttons */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {filteredSpecialties.map((spec) => {
            const isSelected = selectedSpecialtyId === spec.id;
            const isInactive = specialtiesStatusMap[spec.id] === false;

            return (
              <div
                key={spec.id}
                className={`text-right p-5 rounded-2xl border-2 transition-all flex flex-col justify-between relative bg-white ${
                  isInactive
                    ? 'border-amber-200 bg-amber-50/20'
                    : isSelected
                    ? 'border-emerald-500 shadow-md shadow-emerald-100 bg-emerald-50/10'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                {isSelected && !isInactive && (
                  <div className="absolute top-4 left-4 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                    التخصص المختار حالياً
                  </div>
                )}

                {isInactive && (
                  <div className="absolute top-4 left-4 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                    ⏳ غير مفعل حالياً
                  </div>
                )}

                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
                      {ICON_MAP[spec.iconName] || <Stethoscope className="w-6 h-6 text-emerald-600" />}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-base text-slate-900">
                        {spec.titleAr}
                      </h3>
                      <span className="text-[11px] text-slate-400 dir-ltr font-mono block">
                        {spec.titleEn}
                      </span>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {spec.description}
                      </p>
                    </div>
                  </div>

                  {isInactive ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium mb-4 leading-relaxed">
                      ⚠️ <strong className="font-bold">تنويه إداري:</strong> هذا القسم غير مفعل حالياً. سوف نقوم بتفعيله وإتاحة امتحاناته في الأيام القادمة.
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        {spec.questionCount.toLocaleString()} سؤال معتمد
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Users className="w-3.5 h-3.5" />
                        {spec.activeCount.toLocaleString()} طبيب متدرب
                      </span>
                    </div>
                  )}
                </div>

                {/* THREE ACTION BUTTONS FOR EACH SPECIALTY: Trial Exam, Main Exam, Examinees Chat Group */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Button 1: Trial Exam */}
                    <button
                      type="button"
                      onClick={() => handleTrialClick(spec.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current rotate-180" />
                      <span>امتحان تجريبي مجاني</span>
                    </button>

                    {/* Button 2: Official Main Platform Exam */}
                    <button
                      type="button"
                      onClick={() => handleMainExamClick(spec.id)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-800 cursor-pointer"
                    >
                      {isSubscribed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>الامتحان الرئيسي</span>
                    </button>
                  </div>

                  {/* Button 3: Dedicated Examinees Chat Group for this Specialty */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSpecialty(spec.id);
                      onClose();
                      if (onOpenSpecialtyChat) {
                        onOpenSpecialtyChat(spec.id);
                      }
                    }}
                    className="w-full bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>قروب ممتحني ({spec.titleAr})</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>* يمكنك اختيار الامتحان التجريبي مجاناً أو الاشتراك لفتح الامتحان الرئيسي الكامل.</span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

        {/* Subscription Lock Modal Alert when clicking Main Exam if NOT Subscribed */}
        {showSubModal && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 text-center shadow-2xl relative">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-3">
                <Lock className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">
                الامتحان الرئيسي للمنصة يتطلب اشتراكاً نشطاً
              </h3>

              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                عفواً، الدخول للامتحان الرئيسي الشامل ذو الـ 2100+ سؤال يتطلب اشتراكاً فعالاً. يمكنك السداد الفوري عبر تطبيق بنكك (7689305 - باسم محمد السماني) والبدء فوراً.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowSubModal(false);
                    onClose();
                    if (onOpenSubscribeModal) onOpenSubscribeModal();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>اشترك الآن (3,000 / 5,000 / 10,000 / 20,000)</span>
                </button>

                <button
                  onClick={() => setShowSubModal(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  الرجوع للامتحان التجريبي المجاني
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

