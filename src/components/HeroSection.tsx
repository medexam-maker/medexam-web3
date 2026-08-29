import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  TestTube, 
  Stethoscope, 
  GraduationCap, 
  ChevronLeft, 
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  Search
} from 'lucide-react';

const SearchComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Simple direct routing based on keywords
    if (query.includes('باطنية') || query.toLowerCase().includes('medicine')) navigate('/specialty/int_medicine');
    else if (query.includes('مختبرات') || query.toLowerCase().includes('lab')) navigate('/specialty/labs');
    else if (query.includes('تمريض') || query.toLowerCase().includes('nursing')) navigate('/specialty/nursing');
    else navigate('/specialty/medicine'); // Default fallback or exact match logic can be expanded
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="bg-[#0b3844] hover:bg-[#0d4452] p-4 rounded-full border border-cyan-800/60 shadow-xl transition-all cursor-pointer">
        <Search className="w-6 h-6 text-cyan-400" />
      </button>
    );
  }

  return (
    <form onSubmit={handleSearch} className="max-w-md mx-auto relative animate-fade-in">
      <input
        autoFocus
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن تخصص (مثال: الباطنية)..."
        className="w-full bg-[#0b3844] border border-cyan-800/60 rounded-2xl py-4 px-6 pr-12 text-white placeholder:text-cyan-600/50 focus:outline-none focus:border-cyan-500 shadow-xl"
      />
      <button type="submit" className="absolute top-4 right-4 text-cyan-400 hover:text-cyan-300">
        <Search className="w-6 h-6" />
      </button>
    </form>
  );
};
import { CouncilId } from '../types';

interface HeroSectionProps {
  onExploreCouncil: (councilId: CouncilId) => void;
  onExploreSpecialties: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreCouncil,
  onExploreSpecialties
}) => {
  return (
    <div className="dir-rtl font-sans text-slate-800" dir="rtl">
      
      {/* 1. HERO HEADER WITH ELEGANT TEAL BACKGROUND */}
      <section className="bg-gradient-to-b from-[#082d38] via-[#0b3844] to-[#0d4452] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-cyan-900/60 relative overflow-hidden">
        
        {/* Subtle grid mesh background pattern */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)`,
            backgroundSize: '28px 28px'
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
          
          {/* Main Display Headline */}
          <h1 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight text-white">
            MedExam — استعد لامتحانك الطبي
          </h1>

          <div className="pt-8">
            <SearchComponent />
          </div>

        </div>
      </section>

      {/* 2. MAIN 3 COUNCILS HORIZONTAL CARDS SECTION */}
      <section className="bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3.5 py-1 rounded-full border border-emerald-200">
              المجالس الرئيسية الثلاثة
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              اختر المجلس الطبي للانتقال للتخصصات وبدء الامتحانات
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              تصفح التخصصات المتاحة تحت كل مجلس وابدأ التدرب على بنك الأسئلة المعتمد فوراً
            </p>
          </div>

          {/* 3 Main Horizontal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Council Card 1: مجلس المهن الطبية والصحية */}
            <div className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group border-r-4 border-r-emerald-500">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <TestTube className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                    مجلس المهن
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    مجلس المهن الطبية والصحية
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    امتحانات رخصة مزاولة المهنة المعتمدة لكوادر المختبرات الطبية، والتمريض العالي، والأشعة.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => onExploreCouncil('professions')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>استكشف المجلس</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Council Card 2: المجلس الطبي السوداني */}
            <div className="bg-white border border-slate-200 hover:border-cyan-500 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group border-r-4 border-r-cyan-500">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2.5 py-1 rounded-full border border-cyan-200">
                    المجلس الطبي
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                    المجلس الطبي السوداني
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    امتحانات رخصة ممارسة الطب البشري، الصيدلة الدوائية والسريرية، وطب وجراحة الأسنان.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => onExploreCouncil('medical')}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>استكشف المجلس</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Council Card 3: مجلس التخصصات الطبية (SMSB) */}
            <div className="bg-white border border-slate-200 hover:border-amber-500 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group border-r-4 border-r-amber-500">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                    مجلس التخصصات
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                    مجلس التخصصات (SMSB)
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    امتحانات الزمالة والدكتوراة والدخول للتخصصات الإكلينيكية مثل الطب الباطني والجراحة.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => onExploreCouncil('specialties')}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>استكشف المجلس</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Keywords Rich Descriptors Section Below Cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 text-xs text-slate-700 leading-relaxed shadow-2xs">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              تغطية شاملة لكل مجالات امتحانات المجالس الطبية وبنك الأسئلة:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">مجلس المهن الطبية والصحية:</strong>
                يضم بنك أسئلة متخصص في امتحانات <span className="text-emerald-700 font-bold">المختبرات الطبية</span> والتمريض العالي مع تدريبات على تحاليل الأحياء الدقيقة، الكيمياء السريرية، وأمراض الدم.
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">المجلس الطبي السوداني:</strong>
                يغطي أسئلة <span className="text-cyan-700 font-bold">الطب والجراحة</span> العامة، مع محاكاة كاملة لزمن امتحان ممارسة الطب وتبريرات إكلينيكية مفصلة لكل حالة.
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">مجلس التخصصات (SMSB):</strong>
                يمنح مرشحي الزمالة الوصول إلى <span className="text-amber-700 font-bold">بنك الأسئلة</span> المحدث لتخصص الباطنية والعلوم الطبية الأساسية المؤهلة للزمالات.
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
