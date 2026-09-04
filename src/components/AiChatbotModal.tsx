import React, { useState } from 'react';
import { Bot, Send, User, Sparkles, X, HelpCircle, RefreshCw } from 'lucide-react';
import { authFetch } from '../lib/authFetch';

interface AiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  drSamiEnabled?: boolean;
}

interface MessageItem {
  sender: 'user' | 'bot';
  text: string;
}

export const AiChatbotModal: React.FC<AiChatbotModalProps> = ({ isOpen, onClose, drSamiEnabled = true }) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      sender: 'bot',
      text: 'أهلاً بك يا دكتور! أنا د. سامي، المستشار الذكي لمنصة MedExam.net. كيف يمكنني مساعدتك اليوم في تحضير امتحانات مجلس المهن الطبية أو الاستفسار عن خطط الاشتراك؟'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    if (!drSamiEnabled) return;
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isLoading) return;

    const userMsg: MessageItem = { sender: 'user', text: prompt };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await authFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          history: historyPayload
        })
      });

      if (res.status === 503) {
        const data = await res.json().catch(() => null);
        setMessages(prev => [...prev, { sender: 'bot', text: data?.error || 'خدمة المستشار الطبي الذكي (د. سامي) معطلة حالياً بقرار من إدارة المنصة.' }]);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'يسعدني الإجابة عن سؤالك بخصوص الامتحانات أو الاشتراكات بـ بنكك وفوري. أعد المحاولة مرة أخرى.' }]);
      }
    } catch (err) {
      console.error('AI Error:', err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'حدث خطأ في الاتصال. يمكنك طرح سؤالك مجدداً.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'كيف أشترك في المنصة عبر تطبيق بنكك أو فوري؟',
    'ما هي درجة النجاح في امتحانات مجلس المهن الطبية؟',
    'نصائح لإدارة الوقت أثناء جلسة امتحان المحاكاة'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs dir-rtl animate-fadeIn" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl h-[650px] flex flex-col shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                د. سامي - الذكاء الاصطناعي الطبي
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Gemini 3.6 AI
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">مساعدك الذكي لاستفسارات الامتحانات والاشتراك والنصائح الطبية</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-2 rounded-xl transition-colors border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        {drSamiEnabled && (
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-500 shrink-0 text-[11px] font-bold">أسئلة مقترحة:</span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 px-3 py-1 rounded-full whitespace-nowrap text-[11px] transition-colors shrink-0 border border-slate-200 font-medium"
              >
                {qp}
              </button>
            ))}
          </div>
        )}

        {/* Chat Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-600 text-white'
              }`}>
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed border ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white border-emerald-600 rounded-tr-none shadow-xs'
                  : 'bg-white border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
              }`}>
                {m.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 p-2.5 bg-white rounded-xl max-w-xs border border-slate-200 shadow-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>جاري التحليل واستحضار التوجيه الطبي من د. سامي...</span>
            </div>
          )}
        </div>

        {/* Form Input or Disabled Notice */}
        {!drSamiEnabled ? (
          <div className="p-4 bg-amber-50 border-t border-amber-200 text-center space-y-1">
            <div className="text-xs font-bold text-amber-900">
              خدمة المستشار الطبي الذكي (د. سامي AI) معطلة حالياً
            </div>
            <p className="text-[11px] text-amber-700">
              تم إيقاف الخدمة مؤقتاً بقرار من إدارة المنصة. يرجى التواصل مع الدعم الفني أو مراجعة الأقسام الأكاديمية.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="اسأل د. سامي عن الامتحانات، الدفع بـ بنكك، أو أي استفسار آخر..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />

            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>إرسال</span>
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
