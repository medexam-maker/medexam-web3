import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, BookOpen, ArrowRight, Building2 } from 'lucide-react';

import { CouncilId, SpecialtyId, SpecialtyInfo, CouncilInfo } from '../types';

interface SpecialtiesPageProps {
  specialties: SpecialtyInfo[];
  councils: CouncilInfo[];
  selectedCouncilId: CouncilId | 'all';
  onSelectCouncil: (councilId: CouncilId | 'all') => void;
  onOpenExamsForSpecialty: (specialtyId: SpecialtyId) => void;
  onBackToHome: () => void;
}

export const SpecialtiesPage: React.FC<SpecialtiesPageProps> = ({
  specialties,
  councils,
  selectedCouncilId,
  onSelectCouncil,
  onOpenExamsForSpecialty,
  onBackToHome
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filter specialties based on active council and search term
  const filteredSpecialties = useMemo(() => {
    return specialties.filter(spec => {
      const matchesCouncil = selectedCouncilId === 'all' || spec.councilId === selectedCouncilId;
      const matchesSearch = 
        spec.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spec.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spec.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCouncil && matchesSearch;
    });
  }, [selectedCouncilId, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredSpecialties.length / ITEMS_PER_PAGE) || 1;
  const paginatedSpecialties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSpecialties.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSpecialties, currentPage]);

  const activeCouncilInfo = councils.find(c => c.id === selectedCouncilId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 dir-rtl" dir="rtl">
      
      {/* Top Header Navigation Bar with Single Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الرجوع للمجالس الرئيسية</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
              {activeCouncilInfo ? activeCouncilInfo.titleAr : 'جميع التخصصات المتاحة'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 pt-1">
            دليل التخصصات وبنوك الأسئلة
          </h1>
        </div>

        {/* Council Switcher Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => { onSelectCouncil('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              selectedCouncilId === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل
          </button>
          {councils.map(c => (
            <button
              key={c.id}
              onClick={() => { onSelectCouncil(c.id); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedCouncilId === c.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {c.titleAr}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Filter Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          placeholder="ابحث عن تخصص معين (مثل: باطنية، مختبرات، تمريض)..."
          className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs font-bold focus:outline-none focus:border-emerald-500 shadow-2xs"
        />
      </div>

      {/* Specialties Cards Responsive Grid */}
      {paginatedSpecialties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedSpecialties.map((spec: SpecialtyInfo) => (
            <div
              key={spec.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
                    {spec.titleEn}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    امتحان تجريبي + رسمي (50 سؤال)
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{spec.titleAr}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {spec.description}
                  </p>
                </div>
              </div>

              {/* SINGLE BUTTON PER CARD MANDATE */}
              <div className="pt-5 border-t border-slate-100 mt-4">
                <button
                  onClick={() => onOpenExamsForSpecialty(spec.id)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>الدخول إلى الامتحانات</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-sm">لا توجد تخصصات مطابقة لبحثك في هذا المجلس.</p>
          <p className="text-xs">جرب تغيير كلمة البحث أو اختيار "الكل" لعرض كافة التخصصات.</p>
        </div>
      )}

      {/* Pagination Controls if > 10 specialties */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-200 text-xs font-bold">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-slate-100 disabled:opacity-40 hover:bg-slate-200 text-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl">
            صفحة {currentPage} من {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-slate-100 disabled:opacity-40 hover:bg-slate-200 text-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
