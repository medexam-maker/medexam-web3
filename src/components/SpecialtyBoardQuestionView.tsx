import React, { useState, useEffect } from 'react';
import { Question, UserAccount, ExamAnswerFeedback } from '../types';
import { authFetch } from '../lib/authFetch';
import { 
  ChevronDown, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Check, 
  X,
  AlertCircle,
  FlaskConical
} from 'lucide-react';

interface SpecialtyBoardQuestionViewProps {
  question: Question;
  answeredIndex: number | undefined;   // undefined = not answered yet, or confirmed option index
  answeredFeedback?: ExamAnswerFeedback;
  examLang: 'ar' | 'en';
  currentUser?: UserAccount | null;
  onConfirmAnswer: (questionId: string, optionIndex: number) => void;
  onNext: () => void;
  scoreState: { correctCount: number; answeredCount: number };
}

// 1. Reference Values Data
const STANDARD_REFERENCE_RANGES = [
  {
    panel: 'Complete Blood Count (CBC)',
    items: [
      { test: 'Hemoglobin (Male)', range: '13.5 – 17.5 g/dL' },
      { test: 'Hemoglobin (Female)', range: '12.0 – 15.5 g/dL' },
      { test: 'WBC Count', range: '4.0 – 11.0 × 10^9/L' },
      { test: 'Platelets', range: '150 – 400 × 10^9/L' },
      { test: 'MCV', range: '80 – 100 fL' }
    ]
  },
  {
    panel: 'Urea & Electrolytes (U&E)',
    items: [
      { test: 'Sodium (Na+)', range: '135 – 145 mmol/L' },
      { test: 'Potassium (K+)', range: '3.5 – 5.0 mmol/L' },
      { test: 'Urea', range: '2.5 – 6.7 mmol/L' },
      { test: 'Creatinine', range: '60 – 110 µmol/L' },
      { test: 'eGFR', range: '> 90 mL/min/1.73m²' }
    ]
  },
  {
    panel: 'Liver Function Tests (LFT)',
    items: [
      { test: 'Bilirubin (Total)', range: '< 21 µmol/L' },
      { test: 'ALT (Alanine aminotransferase)', range: '10 – 40 IU/L' },
      { test: 'AST (Aspartate aminotransferase)', range: '10 – 35 IU/L' },
      { test: 'Alkaline Phosphatase (ALP)', range: '30 – 130 IU/L' },
      { test: 'Albumin', range: '35 – 50 g/L' }
    ]
  },
  {
    panel: 'Arterial Blood Gas (ABG)',
    items: [
      { test: 'pH', range: '7.35 – 7.45' },
      { test: 'PaO2', range: '10.0 – 14.0 kPa (75 – 100 mmHg)' },
      { test: 'PaCO2', range: '4.7 – 6.0 kPa (35 – 45 mmHg)' },
      { test: 'HCO3-', range: '22 – 26 mmol/L' },
      { test: 'Base Excess', range: '-2 to +2 mmol/L' }
    ]
  }
];

// 2. Score Tracker Badge Component
export const ScoreTrackerBadge: React.FC<{ correctCount: number; answeredCount: number }> = ({ correctCount, answeredCount }) => {
  const percent = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  return (
    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm">
      <span className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Specialty Board Performance</span>
      </span>
      <span className="font-mono bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-emerald-400">
        Score: {correctCount}/{answeredCount} ({percent}%)
      </span>
    </div>
  );
};

// 3. Lab Values Table Component
export const LabValuesTable: React.FC<{ rows: NonNullable<Question['labTable']> }> = ({ rows }) => (
  <div className="my-3 border border-slate-200 rounded-xl overflow-hidden text-xs font-mono bg-white shadow-xs">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-teal-900 text-teal-100 text-[11px] uppercase tracking-wider">
          <th className="p-2.5 text-left font-bold">Investigation / Test</th>
          <th className="p-2.5 text-left font-bold">Patient's Result</th>
          <th className="p-2.5 text-left font-bold">Reference Range</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
        {rows.map((row, i) => (
          <tr key={i} className={row.abnormal ? 'bg-rose-50/90 text-rose-950 font-bold' : 'text-slate-800'}>
            <td className="p-2.5">{row.test}</td>
            <td className={`p-2.5 font-black flex items-center gap-1.5 ${row.abnormal ? 'text-rose-600' : 'text-slate-900'}`}>
              {row.result}
              {row.abnormal && <span className="text-[10px] bg-rose-200/80 text-rose-900 px-1.5 py-0.2 rounded font-sans font-bold uppercase">Abnormal</span>}
            </td>
            <td className="p-2.5 text-slate-500 font-normal">{row.range}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// 4. Reference Ranges Accordion Component
export const ReferenceRangesAccordion: React.FC<{ isOpen: boolean; onToggle: () => void }> = ({ isOpen, onToggle }) => (
  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
    <button 
      type="button"
      onClick={onToggle} 
      className="w-full flex items-center justify-between p-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
    >
      <span className="flex items-center gap-2">
        <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
        <span>Clinical Reference Laboratory Ranges</span>
      </span>
      <ChevronDown className={`w-4 h-4 transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && (
      <div className="p-4 bg-white border-t border-slate-200 text-xs space-y-4 max-h-72 overflow-y-auto">
        {STANDARD_REFERENCE_RANGES.map(panel => (
          <div key={panel.panel} className="space-y-1.5">
            <span className="font-bold text-teal-900 block border-b border-slate-100 pb-1">{panel.panel}</span>
            <div className="space-y-1 pl-1">
              {panel.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-slate-600 py-0.5 border-b border-slate-50 last:border-0">
                  <span className="font-medium text-slate-700">{it.test}</span>
                  <span className="font-mono text-slate-500">{it.range}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// 5. Reference Article Section Component
export const ReferenceArticleSection: React.FC<{ topic: NonNullable<Question['textbookTopic']> }> = ({ topic }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs sm:text-sm text-slate-800 space-y-4">
    <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-slate-200 pb-2.5 text-base">
      <GraduationCap className="w-5 h-5 text-teal-600" />
      <span>{topic.title}</span>
    </div>
    
    {topic.overview && (
      <p className="text-slate-600 leading-relaxed font-sans">{topic.overview}</p>
    )}

    {topic.features && topic.features.length > 0 && (
      <div>
        <span className="font-bold text-teal-950 block mb-1.5">Key Clinical Features:</span>
        <ul className="list-disc pl-5 space-y-1 text-slate-700">
          {topic.features.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      </div>
    )}

    {topic.causes && topic.causes.length > 0 && (
      <div>
        <span className="font-bold text-teal-950 block mb-1.5">Causes & Etiology:</span>
        <ul className="list-disc pl-5 space-y-1 text-slate-700">
          {topic.causes.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </div>
    )}

    {topic.investigations && topic.investigations.length > 0 && (
      <div>
        <span className="font-bold text-teal-950 block mb-1.5">Investigations & Diagnostic Workup:</span>
        <ul className="list-disc pl-5 space-y-1 text-slate-700">
          {topic.investigations.map((inv, i) => <li key={i}>{inv}</li>)}
        </ul>
      </div>
    )}

    {topic.management && topic.management.length > 0 && (
      <div>
        <span className="font-bold text-teal-950 block mb-1.5">Management Guidelines:</span>
        <ul className="list-disc pl-5 space-y-1 text-slate-700">
          {topic.management.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </div>
    )}

    {topic.keyPoints && topic.keyPoints.length > 0 && (
      <div className="pt-2 border-t border-slate-200">
        <span className="font-bold text-emerald-900 block mb-1.5">Summary Points:</span>
        <ul className="list-disc pl-5 space-y-1 text-emerald-950 font-medium">
          {topic.keyPoints.map((kp, i) => <li key={i}>{kp}</li>)}
        </ul>
      </div>
    )}
  </div>
);

// 6. Question Preference Buttons Component ("Important for me" / "Less important")
export const QuestionPreferenceButtons: React.FC<{ questionId: string }> = ({ questionId }) => {
  const [preference, setPreference] = useState<'important' | 'less_important' | null>(null);

  useEffect(() => {
    authFetch(`/api/questions/${encodeURIComponent(questionId)}/preference`)
      .then(r => r.json())
      .then(d => {
        if (d && d.preference) setPreference(d.preference);
      })
      .catch(() => {});
  }, [questionId]);

  const handleSet = async (pref: 'important' | 'less_important') => {
    const nextPref = preference === pref ? null : pref;
    setPreference(nextPref);
    try {
      if (nextPref) {
        await authFetch(`/api/questions/${encodeURIComponent(questionId)}/preference`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preference: nextPref })
        });
      }
    } catch {
      // silent fallback
    }
  };

  return (
    <div className="flex gap-2 text-xs">
      <button 
        type="button"
        onClick={() => handleSet('important')}
        className={`flex-1 py-2.5 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          preference === 'important' 
            ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-xs' 
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <span>⭐ Important for me</span>
      </button>
      <button 
        type="button"
        onClick={() => handleSet('less_important')}
        className={`flex-1 py-2.5 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          preference === 'less_important' 
            ? 'bg-slate-200 border-slate-400 text-slate-800 shadow-xs' 
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <span>Less important</span>
      </button>
    </div>
  );
};

// 7. Question Reaction Buttons Component (Like / Dislike)
export const QuestionReactionButtons: React.FC<{ questionId: string }> = ({ questionId }) => {
  const [counts, setCounts] = useState<{ like: number; dislike: number }>({ like: 0, dislike: 0 });
  const [myReaction, setMyReaction] = useState<'like' | 'dislike' | null>(null);

  useEffect(() => {
    authFetch(`/api/questions/${encodeURIComponent(questionId)}/reaction`)
      .then(r => r.json())
      .then(d => {
        if (d && d.success) {
          const likeC = (d.counts || []).find((c: any) => c.reaction === 'like')?.cnt || 0;
          const dislikeC = (d.counts || []).find((c: any) => c.reaction === 'dislike')?.cnt || 0;
          setCounts({ like: likeC, dislike: dislikeC });
          if (d.myReaction) setMyReaction(d.myReaction);
        }
      })
      .catch(() => {});
  }, [questionId]);

  const handleReact = async (reaction: 'like' | 'dislike') => {
    const prevReaction = myReaction;
    setMyReaction(reaction);
    try {
      const res = await authFetch(`/api/questions/${encodeURIComponent(questionId)}/reaction`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ reaction })
      });
      const data = await res.json();
      if (data && data.success) {
        const likeC = (data.counts || []).find((c: any) => c.reaction === 'like')?.cnt || 0;
        const dislikeC = (data.counts || []).find((c: any) => c.reaction === 'dislike')?.cnt || 0;
        setCounts({ like: likeC, dislike: dislikeC });
      }
    } catch {
      setMyReaction(prevReaction);
    }
  };

  return (
    <div className="flex gap-3 items-center text-xs">
      <button 
        type="button"
        onClick={() => handleReact('like')} 
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
          myReaction === 'like' 
            ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-bold' 
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" /> 
        <span>Helpful ({counts.like})</span>
      </button>
      <button 
        type="button"
        onClick={() => handleReact('dislike')} 
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
          myReaction === 'dislike' 
            ? 'bg-rose-50 border-rose-400 text-rose-700 font-bold' 
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <ThumbsDown className="w-3.5 h-3.5" /> 
        <span>Unclear ({counts.dislike})</span>
      </button>
    </div>
  );
};

// 8. Question Discuss Panel Component (Threaded Comments with Safe Plaintext Rendering)
export const QuestionDiscussPanel: React.FC<{ questionId: string; currentUser?: UserAccount | null }> = ({ questionId, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = () => {
    authFetch(`/api/questions/${encodeURIComponent(questionId)}/comments`)
      .then(r => r.json())
      .then(d => {
        if (d && d.success) {
          setComments(d.comments || []);
        }
      })
      .catch(() => {});
  };

  useEffect(() => { 
    if (isOpen) loadComments(); 
  }, [isOpen, questionId]);

  const postComment = async (content: string, parentCommentId?: string) => {
    const clean = content.trim();
    if (!clean || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch(`/api/questions/${encodeURIComponent(questionId)}/comments`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: clean, parentCommentId })
      });
      const data = await res.json();
      if (data && data.success) {
        if (parentCommentId) {
          setReplyText('');
          setReplyTo(null);
        } else {
          setNewComment('');
        }
        loadComments();
      } else if (data && data.error) {
        alert(data.error);
      }
    } catch {
      alert('تعذر إرسال التعليق حالياً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
      <button 
        type="button"
        onClick={() => setIsOpen(p => !p)} 
        className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 text-xs font-bold text-slate-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span>Discuss with Peers ({totalCount})</span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 text-xs border-t border-slate-200">
          {/* New Comment Input */}
          <div className="space-y-2">
            <textarea 
              value={newComment} 
              onChange={e => setNewComment(e.target.value)} 
              placeholder="Write a clinical note or question for discussion with colleagues..." 
              rows={2}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none bg-slate-50/50" 
            />
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => postComment(newComment)} 
                disabled={!newComment.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Post Comment
              </button>
            </div>
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-slate-400 text-center py-3 italic">No comments yet. Start the clinical discussion!</p>
          ) : (
            <div className="space-y-3 pt-2">
              {comments.map((c) => (
                <div key={c.id} className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">{c.author_name || 'Medical Colleague'}</span>
                    <span className="text-slate-400 font-mono">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  {/* Strict plain text rendering to prevent XSS */}
                  <p className="text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">{c.content}</p>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} 
                      className="text-blue-600 hover:underline font-bold text-[11px]"
                    >
                      {replyTo === c.id ? 'Cancel Reply' : 'Reply'}
                    </button>
                  </div>

                  {replyTo === c.id && (
                    <div className="space-y-2 mt-2 pr-3 sm:pr-4">
                      <textarea 
                        value={replyText} 
                        onChange={e => setReplyText(e.target.value)} 
                        rows={1} 
                        placeholder="Write your reply..."
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none" 
                      />
                      <div className="flex justify-end">
                        <button 
                          type="button"
                          onClick={() => postComment(replyText, c.id)} 
                          disabled={!replyText.trim() || isSubmitting}
                          className="bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white px-3 py-1 rounded-lg font-bold"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="space-y-2 mt-2 pr-3 sm:pr-4 border-r-2 border-slate-200">
                      {c.replies.map((r: any) => (
                        <div key={r.id} className="bg-slate-50 p-2.5 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-800">{r.author_name || 'Medical Colleague'}</span>
                            <span className="text-slate-400 font-mono">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed font-sans whitespace-pre-wrap">{r.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 9. Improve Suggestion Button Component
export const ImproveSuggestionButton: React.FC<{ questionId: string }> = ({ questionId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const clean = text.trim();
    if (!clean || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch(`/api/questions/${encodeURIComponent(questionId)}/improve-suggestion`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ content: clean })
      });
      const data = await res.json();
      if (data && data.success) {
        setSent(true); 
        setText('');
      } else {
        alert(data?.error || 'تعذر الإرسال حالياً');
      }
    } catch {
      alert('تعذر الإرسال حالياً');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-1">
      <button 
        type="button"
        onClick={() => { setIsOpen(p => !p); setSent(false); }} 
        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer"
      >
        Suggest improvement / report issue
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-fadeIn">
          {sent ? (
            <p className="text-emerald-700 font-bold text-xs flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Thank you! Your feedback has been sent for academic review.</span>
            </p>
          ) : (
            <>
              <textarea 
                value={text} 
                onChange={e => setText(e.target.value)} 
                rows={2} 
                placeholder="What clinical aspect or reference should be improved or updated in this question?"
                className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-900 bg-white focus:border-slate-400 focus:outline-none" 
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={submit} 
                  disabled={!text.trim() || isSubmitting}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-3.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Submit Feedback
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// 10. Main SpecialtyBoardQuestionView Component
export const SpecialtyBoardQuestionView: React.FC<SpecialtyBoardQuestionViewProps> = ({
  question,
  answeredIndex,
  answeredFeedback,
  examLang,
  currentUser,
  onConfirmAnswer,
  onNext,
  scoreState
}) => {
  const [pendingChoice, setPendingChoice] = useState<number | undefined>(undefined);
  const [showRefRanges, setShowRefRanges] = useState(false);

  // Reset pending choice upon question change
  useEffect(() => {
    setPendingChoice(undefined);
  }, [question.id]);

  const isAnswered = answeredIndex !== undefined;

  const handlePick = (optIdx: number) => {
    if (isAnswered) return; // Prevent changing after confirmation
    setPendingChoice(optIdx);
  };

  const handleSubmit = () => {
    if (pendingChoice === undefined || isAnswered) return;
    onConfirmAnswer(question.id, pendingChoice);
  };

  const effectiveCorrectIndex = answeredFeedback?.correctIndex ?? question.correctIndex;
  const effectiveHighYieldFact = answeredFeedback?.highYieldFact || question.highYieldFact;
  const effectiveExplainWrong = answeredFeedback?.explainWrong || question.explainWrong;

  const optionsList = (examLang === 'en' && question.optionsEn && question.optionsEn.length === question.options.length) 
    ? question.optionsEn 
    : question.options;

  const questionText = (examLang === 'en' && question.questionEn) 
    ? question.questionEn 
    : question.questionAr;

  const rawExplanation = (examLang === 'en')
    ? (answeredFeedback?.explanationEn || question.explanationEn || answeredFeedback?.explanationAr || question.explanationAr)
    : (answeredFeedback?.explanationAr || question.explanationAr || answeredFeedback?.explanationEn || question.explanationEn);

  const explanationText = rawExplanation || 'لا يوجد شرح إضافي متاح.';

  return (
    <div className="space-y-4 text-left dir-ltr" dir="ltr">
      {/* 1. Score Tracker Badge */}
      <ScoreTrackerBadge 
        correctCount={scoreState.correctCount} 
        answeredCount={scoreState.answeredCount} 
      />

      {/* 2. Clinical Stem / Vignette */}
      {question.stem && (
        <div className="bg-slate-50 border-r-4 border-teal-600 p-4 rounded-l-2xl text-slate-900 text-sm sm:text-base leading-relaxed font-serif shadow-2xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-800 font-bold block mb-1.5">Clinical Vignette</span>
          {question.stem}
        </div>
      )}

      {/* 3. Lab Values Table */}
      {question.labTable && question.labTable.length > 0 && (
        <LabValuesTable rows={question.labTable} />
      )}

      {/* 4. Reference Ranges Accordion (Always Available) */}
      <ReferenceRangesAccordion 
        isOpen={showRefRanges} 
        onToggle={() => setShowRefRanges(p => !p)} 
      />

      {/* 5. Question Text */}
      <div className="text-slate-950 font-bold text-base sm:text-lg leading-relaxed pt-1">
        {questionText}
      </div>

      {/* 6. Options List */}
      <div className="space-y-2.5">
        {optionsList.map((optText, optIdx) => {
          const isPending = pendingChoice === optIdx;
          const isCorrectOpt = optIdx === effectiveCorrectIndex;
          const isUserConfirmedChoice = optIdx === answeredIndex;
          const optionLetter = String.fromCharCode(65 + optIdx);
          const pct = question.optionsPct && question.optionsPct[optIdx] !== undefined ? question.optionsPct[optIdx] : null;

          let btnStyle = 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800';
          if (isAnswered) {
            if (isCorrectOpt) {
              btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
            } else if (isUserConfirmedChoice) {
              btnStyle = 'bg-rose-50 border-rose-500 text-rose-950 font-bold';
            } else {
              btnStyle = 'bg-slate-50/60 border-slate-200 text-slate-500 opacity-70';
            }
          } else if (isPending) {
            btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs ring-2 ring-emerald-500/20';
          }

          return (
            <button
              key={optIdx}
              type="button"
              disabled={isAnswered}
              onClick={() => handlePick(optIdx)}
              className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3.5 relative overflow-hidden ${
                isAnswered ? 'cursor-default' : 'cursor-pointer'
              } ${btnStyle}`}
            >
              {/* Peer Stat Fill Bar */}
              {isAnswered && pct !== null && (
                <div
                  className={`absolute top-0 bottom-0 left-0 transition-all duration-500 pointer-events-none ${
                    isCorrectOpt ? 'bg-emerald-200/40' : isUserConfirmedChoice ? 'bg-rose-200/40' : 'bg-slate-200/30'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}

              <div className="flex items-center gap-3.5 relative z-10">
                <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  isAnswered
                    ? isCorrectOpt
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : isUserConfirmedChoice
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
              {isAnswered && pct !== null && (
                <span className="relative z-10 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white shrink-0">
                  {pct}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 7. Submit Answer Button (Before Confirmation) */}
      {!isAnswered && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pendingChoice === undefined}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3.5 sm:py-4 rounded-2xl text-sm transition-all shadow-md shadow-blue-900/20 cursor-pointer"
        >
          Submit answer
        </button>
      )}

      {/* 8. Post-Submission Feedback Area */}
      {isAnswered && (
        <div className="space-y-4 pt-2 animate-fadeIn">
          {/* High-Yield Key Rule Box */}
          {effectiveHighYieldFact && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase font-mono tracking-wider block">High-Yield Takeaway</span>
                <p className="text-sm font-bold text-emerald-950 mt-0.5">{effectiveHighYieldFact}</p>
              </div>
            </div>
          )}

          {/* Rationale Explanation */}
          <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-5 text-xs sm:text-sm leading-relaxed space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
              <BookOpen className="w-4 h-4" />
              <span>Medical Explanation & Rationale:</span>
            </div>
            <p className="font-sans leading-relaxed">{explanationText}</p>

            {/* Why other options are incorrect */}
            {effectiveExplainWrong && effectiveExplainWrong.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-amber-400 block font-mono">Why Other Options Are Incorrect:</span>
                <ul className="space-y-1.5 pl-4 list-disc text-slate-300 text-xs">
                  {effectiveExplainWrong.map((reason, rIdx) => (
                    reason ? (
                      <li key={rIdx}>
                        <strong className="text-slate-100">Option {String.fromCharCode(65 + rIdx)}:</strong> {reason}
                      </li>
                    ) : null
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Reference Textbook Topic Article */}
          {question.textbookTopic && (
            <ReferenceArticleSection topic={question.textbookTopic} />
          )}

          {/* Important for me / Less important */}
          <QuestionPreferenceButtons questionId={question.id} />

          {/* Like / Dislike reactions */}
          <QuestionReactionButtons questionId={question.id} />

          {/* Discuss Panel */}
          <QuestionDiscussPanel questionId={question.id} currentUser={currentUser} />

          {/* Suggest Improvement */}
          <ImproveSuggestionButton questionId={question.id} />

          {/* Next Question Navigation */}
          <button
            type="button"
            onClick={onNext}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 sm:py-4 rounded-2xl text-sm transition-all shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Next question →</span>
          </button>
        </div>
      )}
    </div>
  );
};
