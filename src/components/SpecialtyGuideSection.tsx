import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  CheckCircle2,
  Share2,
  Share,
  Sparkles,
  Zap,
  FlaskConical,
  BarChart3,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Lock,
  GraduationCap
} from 'lucide-react';
import { UserAccount } from '../types';

interface SpecialtyGuideSectionProps {
  specialtyTitle: string;
  questionCount: number;
  currentUser?: UserAccount | null;
  onOpenSubscribeModal: () => void;
  onStartDemo: () => void;
}

export const SpecialtyGuideSection: React.FC<SpecialtyGuideSectionProps> = ({
  specialtyTitle,
  questionCount,
  currentUser,
  onOpenSubscribeModal,
  onStartDemo
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isSubscribed = currentUser?.isSubscribed && currentUser?.subscriptionStatus === 'active';

  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://medexam.net';
  const shareText = `🎓 انضم لتجربة تدريب بنك الأسئلة الطبي المتقدم في تخصص (${specialtyTitle}) المصمم بأعلى معايير التقييم الإكلينيكي العالمي مع الشرح التفاعلي وجداول التحاليل!`;

  const handleShare = (platform: 'whatsapp' | 'telegram' | 'facebook' | 'x') => {
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'x':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white border border-teal-800/60 rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden dir-rtl" dir="rtl">
      {/* Background Accent Glow */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-teal-800/60 pb-5 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>دليل الطالب • طريقة الأسئلة ونمط التقييم الإكلينيكي العالمي المتقدم</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>تخصص {specialtyTitle}</span>
            <span className="text-xs font-normal text-teal-300 bg-teal-900/60 border border-teal-700/50 px-2.5 py-0.5 rounded-lg">
              {questionCount}+ سؤال إكلينيكي معتمد
            </span>
          </h2>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start sm:self-auto bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-700/60 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        >
          <span>{isExpanded ? 'طي دليل التعريف' : 'عرض مميزات بنك الأسئلة'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Content Showcase */}
      {isExpanded && (
        <div className="space-y-6">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            تم تصميم بنك أسئلة قسم <strong>{specialtyTitle}</strong> معالجةً وإخراجاً وفق معايير التقييم الإكلينيكية المعترف بها عالمياً للزمالات والامتحانات القومية. يحول هذا النظام كل سؤال إلى دراسة حالة إكلينيكية متكاملة تدربك على امتحان رخصة المجلس بنجاح وتفوق.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Feature 1 */}
            <div className="bg-slate-800/80 border border-teal-700/40 rounded-2xl p-4 hover:border-teal-500/60 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-teal-100">1. السيناريو الإكلينيكي الممتد</h3>
              </div>
              <p className="text-xs text-slate-300 leading-normal">
                سيناريوهات مرضية واقعية (Clinical Vignette) تحاكي أسلوب الامتحانات القومية والزمالات البريطانية.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/80 border border-teal-700/40 rounded-2xl p-4 hover:border-teal-500/60 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold shrink-0">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-teal-100">2. جداول تحاليل ملونة</h3>
              </div>
              <p className="text-xs text-slate-300 leading-normal">
                جداول منسقة للفحوصات الطبية (CBC, U&E, LFT, ABG) مع تظليل أحمر فوري للقيم الشاذة لسرعة الاستنباط.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/80 border border-teal-700/40 rounded-2xl p-4 hover:border-teal-500/60 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-teal-100">3. إحصائيات اختيار الزملاء</h3>
              </div>
              <p className="text-xs text-slate-300 leading-normal">
                شريط إحصائي تفاعلي (Peer Stats) يوضح نسبة استجابات زملائك الأطباء لكل خيار كاشفاً الخيارات الخادعة.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/80 border border-teal-700/40 rounded-2xl p-4 hover:border-teal-500/60 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-teal-100">4. تفنيد أسباب استبعاد الخيارات</h3>
              </div>
              <p className="text-xs text-slate-300 leading-normal">
                شرح طبي شامل يوضح ليس فقط الإجابة الصحيحة، بل تفنيد علمي دقيق لسبب استبعاد كل إجابة خاطئة.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/80 border border-teal-700/40 rounded-2xl p-4 hover:border-teal-500/60 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-teal-100">5. المقال المرجعي المدمج</h3>
              </div>
              <p className="text-xs text-slate-300 leading-normal">
                ملخص مرجعي شامل لكل حالة مرَضية يتضمن الأعراض، الفحوصات، وخوارزميات العلاج المعتمدة من NICE.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/80 border border-teal-700/40 rounded-2xl p-4 hover:border-teal-500/60 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 font-bold shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-teal-100">6. دفتر الملاحظات والمساعد الذكي</h3>
              </div>
              <p className="text-xs text-slate-300 leading-normal">
                إمكانية كتابة ملاحظاتك الخاصة لكل سؤال إضافةً إلى زر الاستفسار المباشر من الذكاء الاصطناعي الطبي.
              </p>
            </div>

          </div>

          {/* Action Row & Share Bar */}
          <div className="pt-4 border-t border-teal-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* CTA buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={onStartDemo}
                className="flex-1 md:flex-initial bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>تجربة 10 أسئلة إكلينيكية معتمدة مجاناً</span>
              </button>

              {!isSubscribed && (
                <button
                  onClick={onOpenSubscribeModal}
                  className="flex-1 md:flex-initial bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>تفعيل الاشتراك القومي الكامل</span>
                </button>
              )}
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-center">
              <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5 shrink-0">
                <Share2 className="w-3.5 h-3.5" />
                <span>مشاركة الصفحة:</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="مشاركة عبر واتساب"
                >
                  <span>واتساب</span>
                </button>

                <button
                  onClick={() => handleShare('telegram')}
                  className="bg-[#0088cc]/20 hover:bg-[#0088cc]/30 text-[#0088cc] border border-[#0088cc]/40 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="مشاركة عبر تلغرام"
                >
                  <span>تلغرام</span>
                </button>

                <button
                  onClick={() => handleShare('facebook')}
                  className="bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] border border-[#1877F2]/40 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="مشاركة عبر فيسبوك"
                >
                  <span>فيسبوك</span>
                </button>

                <button
                  onClick={() => handleShare('x')}
                  className="bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="مشاركة عبر منصة X"
                >
                  <span>X</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
