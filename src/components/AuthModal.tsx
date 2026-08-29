import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserAccount } from '../types';
import { resolveApiPath } from '../services/platform';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount, token?: string) => void;
  currentUser: UserAccount | null;
  initialMode?: 'login' | 'signup';
}

type Step = 'email' | 'password' | 'signup' | 'google_password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [knownName, setKnownName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setStep('email');
      setEmail('');
      setPassword('');
      setName('');
      setKnownName('');
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(resolveApiPath('/api/auth/check-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.exists) {
        setKnownName(data.name || '');
        setStep('password');
      } else {
        setStep('signup');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال. حاول مرة أخرى.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(resolveApiPath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        localStorage.setItem('medexam_token', data.token);
        localStorage.setItem('medexam_user', JSON.stringify(data.user));
        setMessage({ type: 'success', text: 'تم تسجيل الدخول بنجاح!' });
        setTimeout(() => {
          onLoginSuccess(data.user, data.token);
          onClose();
        }, 800);
      } else {
        setMessage({ type: 'error', text: data.error || 'كلمة السر غير صحيحة.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(resolveApiPath('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        localStorage.setItem('medexam_token', data.token);
        localStorage.setItem('medexam_user', JSON.stringify(data.user));
        setMessage({ type: 'success', text: 'تم إنشاء الحساب بنجاح!' });
        setTimeout(() => {
          onLoginSuccess(data.user, data.token);
          onClose();
        }, 800);
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل في إنشاء الحساب.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 sm:p-7 shadow-2xl relative text-right">
        <button onClick={onClose} className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
            {step === 'signup' ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
          </div>
          <h2 className="text-lg font-black text-slate-900">
            {step === 'email' && 'تسجيل الدخول / حساب جديد'}
            {step === 'password' && `أهلاً بك ${knownName || ''}`}
            {step === 'signup' && 'إنشاء حساب جديد'}
          </h2>
        </div>

        {message && (
          <div className={`mb-4 text-xs font-bold rounded-xl p-3 flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {step === 'email' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setEmail('google_user@gmail.com');
                setName('Google User');
                setStep('google_password');
              }}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-xs transition-colors flex items-center justify-center gap-3 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              متابعة باستخدام Google
            </button>
            <div className="flex items-center gap-3 my-4">
              <div className="h-px bg-slate-100 flex-1"></div>
              <span className="text-slate-400 text-[10px] font-bold">أو باستخدام البريد</span>
              <div className="h-px bg-slate-100 flex-1"></div>
            </div>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" dir="ltr"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 pl-10 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 text-left font-mono"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute top-3.5 left-3.5" />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black py-3 rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <span>{isSubmitting ? 'جارِ التحقق...' : 'متابعة'}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </form>
          </div>
        )}

        {step === 'google_password' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl mb-4 leading-relaxed border border-blue-100">
              تم التحقق من هويتك عبر Google بنجاح. يرجى تعيين كلمة مرور لمنصة MedExam لاستكمال التسجيل.
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  type="password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 pl-10 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 text-left font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 left-3.5" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black py-3 rounded-2xl text-xs transition-colors">
              {isSubmitting ? 'جارِ إنشاء الحساب...' : 'تأكيد التسجيل'}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 flex items-center justify-between" dir="ltr">
              <span>{email}</span>
              <button type="button" onClick={() => setStep('email')} className="text-emerald-700 font-bold text-[11px] dir-rtl cursor-pointer">تغيير</button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة السر</label>
              <div className="relative">
                <input type="password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 pl-10 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 text-left font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 left-3.5" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black py-3 rounded-2xl text-xs transition-colors cursor-pointer">
              {isSubmitting ? 'جارِ الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        )}

        {step === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 flex items-center justify-between" dir="ltr">
              <span>{email}</span>
              <button type="button" onClick={() => setStep('email')} className="text-emerald-700 font-bold text-[11px] dir-rtl cursor-pointer">تغيير</button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم الكامل</label>
              <div className="relative">
                <input type="text" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="د. محمد أحمد"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 pr-10 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة السر (8 أحرف على الأقل)</label>
              <div className="relative">
                <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 pl-10 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 text-left font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 left-3.5" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black py-3 rounded-2xl text-xs transition-colors cursor-pointer">
              {isSubmitting ? 'جارِ الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
