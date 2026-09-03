import React, { useState } from 'react';
import { 
  Stethoscope, 
  ChevronDown, 
  Award, 
  MessageSquare, 
  Bot, 
  ShieldCheck, 
  CreditCard, 
  Sparkles, 
  Menu, 
  X,
  BookOpen,
  User,
  UserPlus,
  LogIn,
  LogOut,
  Download,
  Building2,
  Newspaper
} from 'lucide-react';

import { SpecialtyId, UserAccount } from '../types';

interface HeaderProps {
  activeSpecialtyId: SpecialtyId;
  onOpenSpecialtyModal: () => void;
  activeTab: 'home' | 'specialties' | 'exams' | 'exam' | 'blog' | 'chat' | 'ai' | 'admin' | 'subscribe';
  onSelectTab: (tab: 'home' | 'specialties' | 'exams' | 'exam' | 'blog' | 'chat' | 'ai' | 'admin' | 'subscribe') => void;
  onOpenSubscribeModal: () => void;
  onOpenCouncilNewsModal?: () => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: (initialMode?: 'login' | 'signup') => void;
  onLogout?: () => void;
  isCompact?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  specialties,
  activeSpecialtyId,
  onOpenSpecialtyModal,
  activeTab,
  onSelectTab,
  onOpenSubscribeModal,
  onOpenCouncilNewsModal,
  currentUser,
  onOpenAuthModal,
  onLogout,
  isCompact = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentSpecialty = specialties.find(s => s.id === activeSpecialtyId) || specialties[0] || { id: '', titleAr: '', titleEn: '', description: '', questionCount: 0, councilId: 'medical' } as any;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'melsmani87@gmail.com' || currentUser?.email === 'd@medexam.net';

  const isExamMode = isCompact || activeTab === 'exam';

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-40 dir-rtl shadow-2xs transition-all" dir="rtl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className={`flex items-center justify-between transition-all ${isExamMode ? 'h-10 sm:h-11' : 'h-16 sm:h-20'}`}>
          
          {/* Right Section in RTL: Hamburger + Specialty Selector Dropdown + Auth status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-slate-700 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="القائمة"
            >
              <Menu className={`w-5 h-5 ${isExamMode ? 'w-4 h-4' : 'w-6 h-6'}`} />
            </button>

            {/* Active Specialty Selector Badge Pill */}
            <button
              onClick={onOpenSpecialtyModal}
              className={`flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-2.5 sm:px-3 py-1 rounded-full transition-all text-xs font-bold shadow-2xs ${isExamMode ? 'text-[11px] py-0.5' : ''}`}
            >
              <ChevronDown className="w-3 h-3 text-emerald-700" />
              <span>تخصص: {currentSpecialty.titleAr}</span>
            </button>

            {/* Council News Quick Link Button */}
            {!isExamMode && onOpenCouncilNewsModal && (
              <button
                onClick={onOpenCouncilNewsModal}
                className="hidden sm:flex items-center gap-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-3 py-1 rounded-full text-xs font-bold transition-all"
              >
                <Newspaper className="w-3.5 h-3.5 text-emerald-600" />
                <span>أخبار المجلس</span>
              </button>
            )}

            {/* Exit Exam Button when in Exam Mode */}
            {isExamMode && (
              <button
                onClick={() => onSelectTab('home')}
                className="hidden sm:flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer"
              >
                <span>الرئيسية</span>
              </button>
            )}

            {/* Admin Badge Quick Jump */}
            {!isExamMode && isAdmin && (
              <button
                onClick={() => onSelectTab('admin')}
                className="hidden md:flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>لوحة الأدمن</span>
              </button>
            )}
          </div>

          {/* Left/Center Section in RTL: Brand Logo & User Auth Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-[11px]">{currentUser.name}</span>
                    {currentUser.isSubscribed && currentUser.subscriptionStatus === 'active' ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1" title={`اشتراك نشط حتى ${currentUser.endDate || 'مفتوح'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        عضو مفعّل 🟢
                      </span>
                    ) : (
                      <button
                        onClick={onOpenSubscribeModal}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 transition-colors flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        عضو غير مفعّل ⚡ تفعيل
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono text-left dir-ltr" dir="ltr">{currentUser.email}</span>
                </div>

                {/* Mobile Badge */}
                <div className="sm:hidden">
                  {currentUser.isSubscribed && currentUser.subscriptionStatus === 'active' ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      مفعّل 🟢
                    </span>
                  ) : (
                    <button
                      onClick={onOpenSubscribeModal}
                      className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                    >
                      تفعيل ⚡
                    </button>
                  )}
                </div>

                {onLogout && !isExamMode && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              !isExamMode && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-slate-600" />
                    <span>تسجيل الدخول</span>
                  </button>
                  <button
                    onClick={() => onOpenAuthModal && onOpenAuthModal('signup')}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>إنشاء حساب</span>
                  </button>
                </div>
              )
            )}

            <button 
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-1 group text-right focus:outline-none"
            >
              <span className={`font-black tracking-tight text-slate-900 font-mono ${isExamMode ? 'text-sm sm:text-base' : 'text-xl sm:text-2xl'}`}>
                medexam<span className="text-cyan-600">.net</span>
              </span>
            </button>

            {/* Brand Logo Card Badge */}
            {!isExamMode && (
              <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 p-1.5 px-3 rounded-2xl shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-xs">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <div className="text-[10px] leading-tight text-right">
                  <div className="font-bold text-slate-900 font-mono">medexam.net</div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Slide-out RTL Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex dir-rtl" dir="rtl">
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-right">
            {/* Header with Close X */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-lg font-black text-slate-900 font-mono">
                medexam<span className="text-cyan-600">.net</span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Links List */}
            <div className="p-4 space-y-1 overflow-y-auto flex-1 font-bold text-xs">
              
              {/* Update Check Callout */}

              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    // Emit a custom event or you can just add UpdateChecker with manualCheck globally
                    window.dispatchEvent(new CustomEvent('TRIGGER_UPDATE_CHECK'));
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 p-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-2xs"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Check for Updates</span>
                </button>
              </div>

              {/* Login Callout in Drawer */}
              {!currentUser ? (
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenAuthModal) onOpenAuthModal('login');
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 p-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-2xs"
                  >
                    <LogIn className="w-4 h-4 text-slate-600" />
                    <span>تسجيل الدخول</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenAuthModal) onOpenAuthModal('signup');
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>إنشاء حساب</span>
                  </button>
                </div>
              ) : (
                <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-right">
                  <div className="font-bold text-slate-900">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono dir-ltr text-left" dir="ltr">{currentUser.email}</div>
                  {isAdmin && (
                    <div className="mt-1 inline-block bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      حساب مدير المنصة (الأدمن)
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => { onSelectTab('home'); setMobileMenuOpen(false); }}
                className={`w-full text-right p-3 rounded-xl transition-colors flex items-center justify-between ${
                  activeTab === 'home' ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>الصفحة الرئيسية</span>
              </button>

              <button
                onClick={() => { onSelectTab('specialties'); setMobileMenuOpen(false); }}
                className={`w-full text-right p-3 rounded-xl transition-colors ${
                  activeTab === 'specialties' ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>دليل التخصصات وبنوك الأسئلة</span>
              </button>

              <button
                onClick={() => { onSelectTab('blog'); setMobileMenuOpen(false); }}
                className={`w-full text-right p-3 rounded-xl transition-colors ${
                  activeTab === 'blog' ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>مدونة MedExam الطبية (SEO)</span>
              </button>

              <button
                onClick={() => { onSelectTab('exam'); setMobileMenuOpen(false); }}
                className={`w-full text-right p-3 rounded-xl transition-colors ${
                  activeTab === 'exam' ? 'bg-cyan-50 text-cyan-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>محاكي الامتحانات القومية المشرّحة</span>
              </button>

              {onOpenCouncilNewsModal && (
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenCouncilNewsModal(); }}
                  className="w-full text-right p-3 rounded-xl text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Newspaper className="w-4 h-4 text-emerald-600" />
                  <span>أخبار ومواقع المجالس الطبية الرسمية</span>
                </button>
              )}

              <button
                onClick={() => { onSelectTab('ai'); setMobileMenuOpen(false); }}
                className="w-full text-right p-3 rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-2"
              >
                <Bot className="w-4 h-4 text-emerald-600" />
                <span>المحاكي الذكي للتسجيل والأسئلة (د. سامي AI)</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => { onSelectTab('admin'); setMobileMenuOpen(false); }}
                  className="w-full text-right p-3 rounded-xl bg-amber-500 text-white font-bold transition-colors flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>لوحة التحكم وإدارة المنصة</span>
                </button>
              )}

              {/* Special Green Highlight Banner for Chat */}
              <div className="pt-4">
                <button
                  onClick={() => { onSelectTab('chat'); setMobileMenuOpen(false); }}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>دردشة وتواصل المشتركين</span>
                  </div>
                  <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full">مباشر</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => { onOpenSubscribeModal(); setMobileMenuOpen(false); }}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold shadow-xs transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>تأكيد إشعار بنكك / تفعيل الاشتراك</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

