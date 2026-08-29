import React, { useState } from 'react';
import { 
  CreditCard, 
  X, 
  CheckCircle2, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  Key, 
  Smartphone, 
  Building2, 
  Image as ImageIcon,
  AlertCircle,
  Loader2
} from 'lucide-react';

import { SpecialtyId, SubscriptionRequest } from '../types';
import { compressAndResizeImage } from '../lib/imageUtils';
import { authFetch } from '../lib/authFetch';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSpecialtyId: SpecialtyId;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  plans,
  isOpen,
  onClose,
  activeSpecialtyId
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('quarterly');
  const [activeTab, setActiveTab] = useState<'plans' | 'promo'>('plans');

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bankak' | 'fawry' | 'transfer'>('bankak');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // Upload & Submit Progress states
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');

  const [submitProgress, setSubmitProgress] = useState<number>(0);
  const [submitStatusText, setSubmitStatusText] = useState<string>('');

  // Promo state
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [submittedSub, setSubmittedSub] = useState<SubscriptionRequest | null>(null);

  if (!isOpen) return null;

  // Handle Receipt Upload with client-side canvas compression & progress tracking
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setUploadProgress(10);
    setUploadStatusText('جاري تجهيز الصورة...');

    try {
      const compressedDataUrl = await compressAndResizeImage(
        file,
        1200,
        1200,
        0.75,
        (percent, statusText) => {
          setUploadProgress(percent);
          setUploadStatusText(statusText);
        }
      );
      setReceiptImage(compressedDataUrl);
    } catch (err) {
      console.error('Compress error:', err);
      alert('حدث خطأ أثناء قراءة وضغط الصورة، يرجى تجربة اختيار الصورة مرة أخرى.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Submit Subscription Form
  const handleSubmitSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlanId) {
      alert('⚠️ يرجى اختيار باقة الاشتراك المناسبة.');
      return;
    }

    if (!userEmail || !userEmail.trim()) {
      alert('⚠️ حقل إجباري: يرجى إدخال البريد الإلكتروني الخاص بك.');
      return;
    }

    if (!receiptImage) {
      alert('⚠️ حقل إجباري: يرجى إرفاق صورة إشعار التحويل الأبيض (تطبيق بنكك أو فوري) أولاً لإكمال طلب الاشتراك.');
      return;
    }

    setIsLoading(true);
    setSubmitProgress(20);
    setSubmitStatusText('جاري إرسال إشعار التحويل والمستندات المحسّنة...');

    const stepTimer1 = setTimeout(() => {
      setSubmitProgress(55);
      setSubmitStatusText('جاري إرسال الإشعار وتأكيد البيانات مع السيرفر...');
    }, 400);

    const stepTimer2 = setTimeout(() => {
      setSubmitProgress(85);
      setSubmitStatusText('جاري تحليل الإشعار بنظام Gemini AI Vision المتقدم...');
    }, 1200);

    try {
      const res = await authFetch('/api/subscriptions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName.trim() || 'طبيب مشترك',
          userEmail: userEmail.trim(),
          userPhone: userPhone.trim(),
          specialtyId: activeSpecialtyId,
          planId: selectedPlanId,
          paymentMethod,
          receiptUrl: receiptImage
        })
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setSubmitProgress(100);
      setSubmitStatusText('تم إرسال واستلام الطلب بنجاح!');

      const data = await res.json();
      if (res.ok) {
        setSubmittedSub(data.subscription);
      } else {
        alert(data.error || 'حدث خطأ أثناء إرسال طلب الاشتراك.');
      }
    } catch (err) {
      console.error('Submit sub error:', err);
      alert('حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة مرة أخرى.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
    }
  };

  // Redeem Promo Code
  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setIsLoading(true);
    setPromoMessage(null);
    try {
      const res = await authFetch('/api/subscriptions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName || 'طبيب تفعيل كود',
          userEmail: userEmail || 'user@medexam.net',
          specialtyId: activeSpecialtyId,
          planId: selectedPlanId,
          promoCode: promoInput.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.approved) {
        setPromoMessage({ type: 'success', text: 'تم تفعيل حسابك بنجاح كاشتراك ممتاز عبر الكود الترويجي!' });
        setSubmittedSub(data.subscription);
      } else {
        setPromoMessage({ type: 'error', text: data.error || 'الكود غير صحيح أو تم استخدامه مسبقاً.' });
      }
    } catch (err) {
      console.error('Promo redeem error:', err);
      setPromoMessage({ type: 'error', text: 'فشل تفعيل الكود، يرجى إعادة المحاولة.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs dir-rtl animate-fadeIn" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-xl">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-600" />
              بوابة الاشتراكات وتأكيد الدفع (MedExam.net)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              اختر خطتك المناسبة وقم بسداد الرسوم عبر تطبيق بنكك أو فوري لفتح الوصول الكامل لجميع الأسئلة والحلول
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-2 rounded-xl transition-colors border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 flex items-center gap-4 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('plans'); setSubmittedSub(null); }}
            className={`pb-2 pt-1 border-b-2 flex items-center gap-2 ${
              activeTab === 'plans' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>خطط الاشتراك وتأكيد الدفع (بنكك / فوري)</span>
          </button>

          <button
            onClick={() => { setActiveTab('promo'); setSubmittedSub(null); }}
            className={`pb-2 pt-1 border-b-2 flex items-center gap-2 ${
              activeTab === 'promo' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
            }`}
          >
            <Key className="w-4 h-4 text-amber-600" />
            <span>تفعيل عبر كود التفعيل (Activation Code)</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {submittedSub ? (
            /* Success confirmation panel */
            <div className="bg-white border border-emerald-500 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-md">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">تم استلام طلب الاشتراك بنجاح!</h3>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                {submittedSub.status === 'approved'
                  ? 'تم تفعيل حسابك فوراً كعضوية ممتازة في المنصة! يمكنك البدء بالامتحانات فوراً.'
                  : `تم حفظ طلبك برقم مرجعي (${submittedSub.id}). سيقوم قسم المراجعة والتدقيق بالتحقق من الإشعار خلال دقائق معدودة.`}
              </p>

              <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 text-right space-y-2 mb-6 border border-slate-200 font-mono">
                <div>الاسم: {submittedSub.userName}</div>
                <div>البريد: {submittedSub.userEmail}</div>
                <div>طريقة الدفع: {submittedSub.paymentMethod}</div>
                <div>حالة الطلب: <span className="text-emerald-700 font-bold">{submittedSub.status === 'approved' ? 'مفعل ومؤكد' : 'قيد المراجعة الفورية'}</span></div>
              </div>

              <button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl text-xs shadow-md shadow-emerald-200"
              >
                العودة والبدء في الامتحانات
              </button>
            </div>
          ) : activeTab === 'plans' ? (
            /* Plans Selection & Form */
            <div className="space-y-6">
              
              {/* Plans Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all relative flex flex-col justify-center items-center text-center bg-white ${
                        isSelected
                          ? 'border-emerald-500 shadow-md shadow-emerald-100 bg-emerald-50/30'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-2.5 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          الأكثر طلباً
                        </div>
                      )}

                      <h4 className="font-bold text-xs text-slate-900">{plan.nameAr}</h4>
                      <div className="mt-1 text-lg font-black text-emerald-700 font-mono">
                        {plan.priceSdg.toLocaleString()} <span className="text-[10px] text-slate-500 font-sans">ج.س</span>
                        <span className="text-[10px] text-slate-500 block font-sans">(${plan.priceUsd} USD)</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bank Transfer Instructions Section */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800">
                <h4 className="text-xs font-bold text-white mb-2.5 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>تفاصيل الحسابات المصرفية المعتمدة للسداد (بنكك وفوري):</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border-2 border-emerald-500/80 font-mono shadow-inner">
                    <div className="text-emerald-400 font-bold font-sans mb-0.5 flex items-center gap-1 text-[11px]">
                      <Smartphone className="w-3.5 h-3.5" /> تطبيق بنكك (بنك الخرطوم)
                    </div>
                    <div className="text-slate-200 text-xs">رقم الحساب: <span className="font-bold text-white text-sm font-mono">7689305</span></div>
                    <div className="text-emerald-300 font-sans font-bold text-[10px] mt-0.5">محمد السماني حسن سليمان</div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                    <div className="text-amber-400 font-bold font-sans mb-0.5 flex items-center gap-1 text-[11px]">
                      <Smartphone className="w-3.5 h-3.5" /> تطبيق فوري (Fawry)
                    </div>
                    <div className="text-slate-200 text-xs">معرّف فوري: <span className="font-bold text-amber-300 text-xs font-mono">51936329</span></div>
                    <div className="text-slate-400 font-sans text-[10px] mt-0.5">محمد السماني حسن سليمان</div>
                  </div>
                </div>
              </div>

              {/* Form Input for User Info & Receipt */}
              <form onSubmit={handleSubmitSubscription} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 mb-1">بيانات الطبيب ورفع صورة إشعار التحويل:</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">الاسم بالكامل <span className="text-slate-400 font-normal">(اختياري)</span></label>
                    <input
                      type="text"
                      placeholder="د. أحمد عثمان..."
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">البريد الإلكتروني <span className="text-rose-600 font-bold">* (إجباري)</span></label>
                    <input
                      type="email"
                      required
                      placeholder="doctor@example.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم الواتساب / الهاتف <span className="text-slate-400 font-normal">(اختياري)</span></label>
                    <input
                      type="tel"
                      placeholder="+249912345678"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Upload Receipt / Notification */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>ارفق صورة إشعار التحويل الأبيض (تطبيق بنكك / فوري) <span className="text-rose-600 font-bold">* (حقل إجباري)</span></span>
                    {!receiptImage && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                        مطلوب إرفاق الصورة
                      </span>
                    )}
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2">
                    يرجى رفع صورة شاشة (Screenshot) لصفحة <strong>تفاصيل المعاملة البيضاء</strong> من تطبيق بنكك.
                  </p>

                  {/* Visual Sample of White Bankak Receipt (Image 2 style) */}
                  <div className="bg-white border border-slate-300 rounded-xl p-3 mb-3 max-w-sm text-xs font-sans text-slate-800 shadow-xs">
                    <div className="bg-rose-700 text-white font-black text-center py-1 rounded-t-lg flex items-center justify-between px-3 text-[11px]">
                      <span>بنكك bankak</span>
                      <span className="text-[10px] bg-rose-800 px-1.5 py-0.5 rounded">تفاصيل المعاملة</span>
                    </div>
                    <div className="border border-slate-200 border-t-0 p-2 space-y-1 text-[10px] bg-slate-50/50">
                      <div className="flex justify-between border-b border-slate-200 pb-0.5"><span className="text-slate-500">رقم العملية:</span><span className="font-mono font-bold text-slate-900">21117604294</span></div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5"><span className="text-slate-500">نوع العملية:</span><span className="font-bold text-slate-900">تحويل إلى حساب آخر</span></div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5"><span className="text-slate-500">المبلغ:</span><span className="font-mono font-bold text-emerald-700">43,000.00 ج.س</span></div>
                      <div className="flex justify-between border-b border-slate-200 pb-0.5"><span className="text-slate-500">الحالة:</span><span className="font-bold text-emerald-600 bg-emerald-50 px-1 rounded">نجاح ✓</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">اسم المرسل إليه:</span><span className="font-bold text-slate-900">محمد السماني حسن سليمان</span></div>
                    </div>
                    <div className="text-[9px] text-center text-slate-400 mt-1 font-bold">
                      💡 هذا هو النموذج المألوف لإشعار تحويل بنكك الأبيض المطلوب رفعه.
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className={`cursor-pointer bg-white hover:bg-slate-100 border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${isCompressing ? 'opacity-50 pointer-events-none' : 'text-emerald-700'}`}>
                      {isCompressing ? (
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 text-emerald-600" />
                      )}
                      <span>{isCompressing ? 'جاري ضغط ومعالجة الصورة...' : 'اختر صورة الإشعار الأبيض من الجهاز'}</span>
                      <input type="file" accept="image/*" disabled={isCompressing} onChange={handleReceiptUpload} className="hidden" />
                    </label>

                    {receiptImage && !isCompressing && (
                      <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1.5 rounded-xl text-xs text-emerald-800 border border-emerald-300 font-bold">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        <span>تم إرفاق إشعار التحويل وضغطه بنجاح ✓</span>
                      </div>
                    )}
                  </div>

                  {/* Compression Progress Bar */}
                  {isCompressing && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mt-2 space-y-1.5 dir-rtl">
                      <div className="flex justify-between text-xs font-bold text-emerald-900">
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          {uploadStatusText || 'جاري معالجة الصورة للشبكات الضعيفة...'}
                        </span>
                        <span className="font-mono text-emerald-700">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Progress Bar */}
                {isLoading && (
                  <div className="bg-slate-900 text-white border border-emerald-500/80 rounded-xl p-3.5 space-y-2 dir-rtl shadow-lg">
                    <div className="flex justify-between text-xs font-bold text-emerald-400">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        {submitStatusText || 'جاري معالجة وإرسال طلب الاشتراك...'}
                      </span>
                      <span className="font-mono text-emerald-300 text-sm">{submitProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${submitProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || isCompressing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3.5 rounded-xl text-sm transition-all shadow-md shadow-emerald-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الإشعار والطلب... ({submitProgress}%)</span>
                    </>
                  ) : (
                    <span>تأكيد طلب الاشتراك وإرسال إشعار التحويل</span>
                  )}
                </button>
              </form>

            </div>
          ) : (
            /* Promo Code Activation Tab */
            <div className="max-w-md mx-auto py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
                <Key className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">إدخال كود التفعيل المباشر (Promo Code)</h3>
                <p className="text-xs text-slate-600 mt-2">
                  إذا حصلت على كود تفعيل جاهز من المنصة أو الأطباء المشرفين، أدخله هنا للتفعيل الفوري لحسابك
                </p>
              </div>

              <form onSubmit={handleRedeemPromo} className="space-y-4">
                <input
                  type="text"
                  placeholder="مثال: MEDEXAM2026"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-amber-300 rounded-xl p-3.5 text-sm font-mono text-center text-slate-900 focus:outline-none focus:border-amber-500 tracking-wider uppercase font-bold"
                />

                <div className="grid grid-cols-2 gap-3 text-right">
                  <input
                    type="text"
                    placeholder="الاسم"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                  <input
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>

                {promoMessage && (
                  <div className={`p-3 rounded-xl text-xs ${
                    promoMessage.type === 'success'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {promoMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !promoInput.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl text-xs transition-colors shadow-xs"
                >
                  تفعيل الحساب الآن
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
