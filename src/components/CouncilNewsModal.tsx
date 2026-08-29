import React from 'react';
import { X, ExternalLink, Globe, Landmark, Newspaper, ShieldCheck } from 'lucide-react';

interface CouncilNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CouncilNewsModal: React.FC<CouncilNewsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const councils = [
    {
      id: 'professions',
      title: 'المجلس القومي السوداني للمهن الطبية والصحية',
      url: 'https://sncmhp.gov.sd/',
      desc: 'الموقع الرسمي لمتابعة إعلانات وأخبار وتراخيص المهن الطبية والصحية المساندة في السودان.',
      badge: 'المهن الطبية والصحية',
      color: 'border-emerald-500 bg-emerald-50 text-emerald-900',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    {
      id: 'medical',
      title: 'المجلس الطبي السوداني',
      url: 'https://www.smcsdn.com/PagePortal/Access.aspx?ReturnUrl=%2fPagePortal%2f',
      desc: 'البوابة الإلكترونية الموحدة لتسجيل وتراخيص واختبارات الطب البشري، الأسنان، والصيدلة.',
      badge: 'الطب البشري والأسنان والصيدلة',
      color: 'border-cyan-500 bg-cyan-50 text-cyan-900',
      buttonColor: 'bg-cyan-600 hover:bg-cyan-700 text-white'
    },
    {
      id: 'specialties',
      title: 'المجلس القومي للتخصصات الطبية السودانية (SMSB)',
      url: 'https://reg.smsb.gov.sd/',
      desc: 'بوابة النواب والزمالات الطبية، متابعة امتحانات الدخول والجزئي والنهائي للتخصصات الطبية.',
      badge: 'التخصصات الطبية والزمالة',
      color: 'border-amber-500 bg-amber-50 text-amber-900',
      buttonColor: 'bg-amber-600 hover:bg-amber-700 text-white'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs dir-rtl" dir="rtl">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 z-10 animate-fade-in my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl">
              <Landmark className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-400/10 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/20 mb-1">
                <Newspaper className="w-3 h-3 text-emerald-400" />
                <span>المواقع الرسمية الحكومية</span>
              </div>
              <h2 className="text-xl font-black">أخبار وصفحات المجالس الطبية</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            اختر المجلس الطبي التابع له للانتقال مباشرة إلى موقعه الرسمي المعتمد لمتابعة جدول الامتحانات، الاشتراطات، والإعلانات الرسمية:
          </p>

          <div className="space-y-3.5">
            {councils.map((c) => (
              <div 
                key={c.id} 
                className={`p-4 rounded-2xl border-2 transition-all hover:shadow-md ${c.color}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 border border-slate-200/60 mb-1">
                      {c.badge}
                    </span>
                    <h3 className="text-sm font-black text-slate-900">{c.title}</h3>
                  </div>
                  <Globe className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-normal">
                  {c.desc}
                </p>

                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs ${c.buttonColor}`}
                >
                  <span>زيارة الموقع الرسمي للمجلس</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>تفتح جميع الرابط في تبويب جديد آمن لضمان عدم الخروج من منصة MedExam.net.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-6 py-2 rounded-xl text-xs transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
