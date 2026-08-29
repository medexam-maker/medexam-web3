import React from 'react';
import { Question } from '../types';
import { Check, X, Bookmark, BookmarkCheck } from 'lucide-react';

interface SpecialtyQuestionViewProps {
  question: Question;
  selectedOpt: number | undefined;
  pendingAnswer: number | null;
  isFlagged: boolean;
  examLang: 'en' | 'ar';
  onSelectOption: (qId: string, optIdx: number) => void;
  answersFeedback: Record<string, any>;
  timerEnabled: boolean;
  questionTimeRemaining: number;
}

export const SpecialtyQuestionView: React.FC<SpecialtyQuestionViewProps> = ({
  question,
  selectedOpt,
  pendingAnswer,
  isFlagged,
  examLang,
  onSelectOption,
  answersFeedback
}) => {
  const isSubmitted = selectedOpt !== undefined;
  const feedback = isSubmitted ? answersFeedback[question.id] : null;

  const stemText = examLang === 'en' && question.stemEn ? question.stemEn : question.stemAr || question.stem;
  const leadInText = examLang === 'en' && question.questionEn ? question.questionEn : question.questionAr;
  const options = examLang === 'en' && question.optionsEn && question.optionsEn.length > 0 ? question.optionsEn : question.options;

  const explanation = examLang === 'en' && question.explanationEn ? question.explanationEn : question.explanationAr || question.explanation;

  return (
    <div className="flex flex-col gap-4">
      {/* Specialty UI Header & Category */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{question.category || 'Specialty Scenario'}</div>
      </div>

      {/* Clinical Stem / Vignette */}
      {stemText && (
        <div className="bg-slate-50 border-l-4 border-indigo-600 p-4 rounded-r-xl text-slate-800 text-sm leading-relaxed font-serif">
          {stemText}
        </div>
      )}

      {/* Image Handling */}
      {question.imageUrl && (
        <div className="my-2 rounded-xl overflow-hidden border border-slate-200">
          <img src={question.imageUrl} alt="Clinical figure" className="w-full max-h-64 object-contain bg-slate-900" />
        </div>
      )}

      {/* Lab Table */}
      {question.labTable && Array.isArray(question.labTable) && question.labTable.length > 0 && (
        <div className="my-2 border border-slate-200 rounded-xl overflow-hidden text-xs font-mono bg-white shadow-sm">
          <table className="w-full border-collapse">
            <tbody className="divide-y divide-slate-200">
              {question.labTable.map((row: any, rIdx: number) => (
                <tr key={rIdx} className="text-slate-800 hover:bg-slate-50">
                  {Object.values(row).map((val: any, cIdx: number) => (
                    <td key={cIdx} className="p-2 border-r last:border-r-0">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Main Question Text */}
      <div className="text-slate-900 font-bold text-lg leading-relaxed">
        {leadInText}
      </div>

      {/* Options */}
      <div className="space-y-3 mt-2">
        {options.map((optText: string, optIdx: number) => {
          let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:shadow-md';
          const isPending = pendingAnswer === optIdx;
          const isUserChoice = selectedOpt === optIdx;
          
          if (isSubmitted && feedback) {
            const isCorrectAnswer = optIdx === feedback.correctIndex;
            if (isCorrectAnswer) {
              btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-sm';
            } else if (isUserChoice) {
              btnStyle = 'bg-rose-50 border-rose-500 text-rose-950 font-bold shadow-sm';
            } else {
              btnStyle = 'bg-white border-slate-200 text-slate-400 opacity-60';
            }
          } else if (isPending) {
            btnStyle = 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-sm';
          }

          return (
            <button
              key={optIdx}
              disabled={isSubmitted}
              onClick={() => onSelectOption(question.id, optIdx)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm border-2
                  ${(isSubmitted && feedback && optIdx === feedback.correctIndex) ? 'bg-emerald-500 border-emerald-600 text-white' : ''}
                  ${(isSubmitted && feedback && isUserChoice && optIdx !== feedback.correctIndex) ? 'bg-rose-500 border-rose-600 text-white' : ''}
                  ${(!isSubmitted && isPending) ? 'bg-indigo-500 border-indigo-600 text-white' : ''}
                  ${(!isSubmitted && !isPending) ? 'bg-slate-100 border-slate-300 text-slate-500' : ''}
                  ${(isSubmitted && feedback && !isUserChoice && optIdx !== feedback.correctIndex) ? 'bg-slate-100 border-slate-200 text-slate-400' : ''}
                `}>
                  {String.fromCharCode(65 + optIdx)}
                </div>
                <span className="leading-snug">{optText}</span>
              </div>
              
              {isSubmitted && feedback && optIdx === feedback.correctIndex && (
                <Check className="w-5 h-5 text-emerald-600 shrink-0" strokeWidth={3} />
              )}
              {isSubmitted && feedback && isUserChoice && optIdx !== feedback.correctIndex && (
                <X className="w-5 h-5 text-rose-600 shrink-0" strokeWidth={3} />
              )}
            </button>
          );
        })}
      </div>

      {/* Immediate Feedback */}
      {isSubmitted && feedback && (
        <div className={`mt-6 p-5 rounded-2xl border-2 ${feedback.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <h4 className={`font-black text-lg mb-2 ${feedback.isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
            {feedback.isCorrect ? '✨ إجابة صحيحة!' : '❌ إجابة غير صحيحة'}
          </h4>
          <div className="text-sm text-slate-700 leading-relaxed font-medium">
            {explanation}
          </div>
          {question.reference && (
            <div className="mt-3 text-xs text-slate-500 font-mono bg-white/50 p-2 rounded-lg border border-slate-200/50">
              <span className="font-bold">Source:</span> {question.reference}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
