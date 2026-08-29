import React, { useState } from 'react';
import { Megaphone, AlertCircle, X, ChevronLeft } from 'lucide-react';
import { CouncilNotice } from '../types';

interface NoticeTickerProps {
  notices: CouncilNotice[];
}

export const NoticeTicker: React.FC<NoticeTickerProps> = ({ notices }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [activeNoticeIndex, setActiveNoticeIndex] = useState(0);

  if (!isVisible || notices.length === 0) return null;

  const currentNotice = notices[activeNoticeIndex];

  const handleNext = () => {
    setActiveNoticeIndex((prev) => (prev + 1) % notices.length);
  };

  return (
    <div className="bg-emerald-50 border-b border-emerald-200 text-slate-800 py-2.5 px-4 text-sm dir-rtl" dir="rtl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <div className="flex items-center gap-1.5 bg-emerald-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shrink-0 shadow-xs">
            <Megaphone className="w-3.5 h-3.5 animate-pulse" />
            <span>تنويهات المجلس الطبي</span>
          </div>

          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            {currentNotice.isImportant && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded border border-amber-300 shrink-0 flex items-center gap-1 font-bold">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                هام جداً
              </span>
            )}
            <span className="font-bold text-slate-900">{currentNotice.title}:</span>
            <span className="text-slate-600 text-xs truncate max-w-xl hidden sm:inline">{currentNotice.content}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleNext}
            className="text-xs text-emerald-800 hover:text-emerald-900 font-bold flex items-center gap-1 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors shadow-xs"
          >
            <span>التالي</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-slate-400 hover:text-slate-700 p-1 hover:bg-emerald-100 rounded-lg transition-colors"
            title="إغلاق الشريط"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
