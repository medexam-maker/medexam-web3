import { UpdateChecker } from './components/UpdateChecker';
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { CouncilPage, SpecialtyPage, SectionPage, NewsPage } from './components/SeoPages';
import { Header } from './components/Header';
import { NoticeTicker } from './components/NoticeTicker';
import { SpecialtyModal } from './components/SpecialtyModal';
import { HeroSection } from './components/HeroSection';
import { SpecialtiesPage } from './components/SpecialtiesPage';
import { ExamsPage } from './components/ExamsPage';
import { BlogSection } from './components/BlogSection';
import { ExamSimulator } from './components/ExamSimulator';
import { SubscriberChat } from './components/SubscriberChat';
import { AiChatbotModal } from './components/AiChatbotModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { CouncilNewsModal } from './components/CouncilNewsModal';
import { SpecialtyId, CouncilId, Question, CouncilNotice, UserAccount, SiteSettings, CouncilInfo, ExamMode, SubscriptionPlan } from './types';
import { INITIAL_NOTICES, DEFAULT_SITE_SETTINGS } from './data/mockData';
import { authFetch } from './lib/authFetch';
import { 
  Stethoscope, 
  ShieldCheck, 
  BookOpen, 
  Award, 
  HelpCircle, 
  Heart, 
  Bot, 
  MessageSquare, 
  CreditCard,
  Building2,
  CheckCircle2,
  Layers,
  Sparkles,
  Download,
  Users,
  ChevronLeft
} from 'lucide-react';

export default function App() {
  // Specialty State (persisted in local storage)
  const [activeSpecialtyId, setActiveSpecialtyId] = useState<SpecialtyId>(() => {
    const saved = localStorage.getItem('medexam_specialty');
    return (saved as SpecialtyId) || 'medicine';
  });

  // Site Settings & Councils State
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [councilsState, setCouncilsState] = useState<CouncilInfo[]>([]);
  const [plansState, setPlansState] = useState<SubscriptionPlan[]>([]);

  const allSpecialties = councilsState.flatMap(c => c.departments);
  const currentSpecialty = allSpecialties.find(s => s.id === activeSpecialtyId) || allSpecialties[0] || { id: '', titleAr: '', titleEn: '', description: '', questionCount: 0, councilId: 'medical' };

  // User Auth State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const savedUser = localStorage.getItem('medexam_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Active Tab View State (Migrated to React Router)
  const navigate = useNavigate();
  const location = useLocation();
  
  const getActiveTab = () => {
    if (location.pathname === '/') return 'home';
    if (location.pathname.startsWith('/exam/')) return 'exam';
    if (location.pathname === '/exams') return 'exams';
    if (location.pathname === '/specialties') return 'specialties';
    if (location.pathname === '/blog') return 'blog';
    if (location.pathname === '/chat') return 'chat';
    if (location.pathname === '/admin') return 'admin';
    if (location.pathname === '/subscribe') return 'subscribe';
    return 'home'; // Fallback
  };
  const activeTab = getActiveTab();
  const setActiveTab = (tab: string) => navigate(tab === 'home' ? '/' : `/${tab}`);
  const [selectedCouncilForPage, setSelectedCouncilForPage] = useState<CouncilId | 'all'>('all');

  // Modals Visibility States
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isAiChatbotModalOpen, setIsAiChatbotModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'signup'>('login');
  const [isCouncilNewsModalOpen, setIsCouncilNewsModalOpen] = useState(false);

  const handleOpenAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  // Active Council Filter for Modal & Showcase
  const [activeCouncilId, setActiveCouncilId] = useState<string>('all');
  const [selectedCouncilFilter, setSelectedCouncilFilter] = useState<string>('all');

  // Questions and Notices
  const [questions, setQuestions] = useState<Question[]>([]);
  const [notices, setNotices] = useState<CouncilNotice[]>(INITIAL_NOTICES);

  // Exam Simulator launch mode & auto-start flags
  const [examInitialMode, setExamInitialMode] = useState<ExamMode>('VISITOR_DEMO');
  const [examAutoStart, setExamAutoStart] = useState<boolean>(false);

  // Save selected specialty to localStorage
  // Specialty Active Map state
  const [specialtiesStatusMap, setSpecialtiesStatusMap] = useState<Record<string, boolean>>({});

  const handleSelectSpecialty = (id: SpecialtyId) => {
    setActiveSpecialtyId(id);
    localStorage.setItem('medexam_specialty', id);
  };

  const handleOpenCouncilSpecialties = (councilId: string) => {
    setSelectedCouncilFilter(councilId);
    setIsSpecialtyModalOpen(true);
  };

  const handleLoginSuccess = (user: UserAccount, token?: string) => {
    setCurrentUser(user);
    localStorage.setItem('medexam_user', JSON.stringify(user));
    if (token) {
      localStorage.setItem('medexam_token', token);
    }
    if (user.role === 'admin') {
      setActiveTab('admin');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('medexam_user');
    localStorage.removeItem('medexam_token');
    setActiveTab('home');
  };

  // Fetch questions specifically for active specialty whenever it changes
  useEffect(() => {
    authFetch(`/api/questions?specialtyId=${activeSpecialtyId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          setQuestions(prev => {
            const others = prev.filter(q => q.specialtyId !== activeSpecialtyId);
            return [...others, ...data];
          });
        }
      })
      .catch(err => console.log('Specialty questions fetch notice:', err));
  }, [activeSpecialtyId]);

  // Fetch live questions, settings, councils, and specialty active statuses from backend API
  useEffect(() => {
    authFetch('/api/questions')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          setQuestions(data);
        }
      })
      .catch(err => console.log('Using default mock questions:', err));

    authFetch('/api/settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && typeof data === 'object') {
          setSiteSettings(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.log('Site settings fetch notice:', err));

    authFetch('/api/plans').then(res => res.ok ? res.json() : null).then(data => { if (data && data.plans) { setPlansState(data.plans); } }).catch(err => console.log('Plans fetch notice:', err));
    authFetch('/api/councils')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          setCouncilsState(data);
        }
      })
      .catch(err => console.log('Councils fetch notice:', err));

    authFetch('/api/specialties/status')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.statusMap) {
          setSpecialtiesStatusMap(data.statusMap);
        }
      })
      .catch(err => console.log('Specialties status error:', err));
  }, []);

  const handleUpdateSettings = (newSettings: SiteSettings) => {
    setSiteSettings(newSettings);
    authFetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    }).catch(err => console.error('Failed to persist settings:', err));
  };

  const handleUpdateCouncils = (newCouncils: CouncilInfo[]) => {
    setCouncilsState(newCouncils);
    authFetch('/api/admin/councils', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCouncils)
    }).catch(err => console.error('Failed to persist councils:', err));
  };

  // Listen for /admin URL route or #admin hash
  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || path.endsWith('/admin') || hash === '#admin') {
        const isUserAdmin = currentUser?.role === 'admin';
        if (isUserAdmin) {
          setActiveTab('admin');
        } else {
          setIsAuthModalOpen(true);
        }
      }
    };

    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);
    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
    };
  }, [currentUser]);

  // Event-Driven User Subscription Status Validation with Backend
  const lastSubscriptionCheckRef = useRef<number>(0);
  useEffect(() => {
    if (!currentUser?.email) return;

    const checkSubscription = () => {
      lastSubscriptionCheckRef.current = Date.now();
      authFetch('/api/subscriptions/check-user')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.isSubscribed !== undefined) {
            const updatedUser: UserAccount = {
              ...currentUser,
              isSubscribed: data.isSubscribed,
              subscriptionStatus: data.subscriptionStatus || (data.isSubscribed ? 'active' : 'free'),
              rejectionReason: data.rejectionReason,
              startDate: data.startDate,
              endDate: data.endDate,
              remainingDays: data.remainingDays,
              planId: data.planId
            };

            if (
              currentUser.isSubscribed !== updatedUser.isSubscribed ||
              currentUser.subscriptionStatus !== updatedUser.subscriptionStatus ||
              currentUser.rejectionReason !== updatedUser.rejectionReason ||
              currentUser.endDate !== updatedUser.endDate
            ) {
              setCurrentUser(updatedUser);
              localStorage.setItem('medexam_user', JSON.stringify(updatedUser));
            }
          }
        })
        .catch(err => console.log('Subscription sync check notice:', err));
    };

    // Initial validation on mount / login / hydration
    checkSubscription();

    // Event-driven re-validation on regaining focus after >15min inactivity
    const INACTIVITY_THRESHOLD_MS = 15 * 60 * 1000;
    const handleRevalidateOnFocus = () => {
      if (document.visibilityState === 'visible' || document.hasFocus()) {
        const elapsed = Date.now() - lastSubscriptionCheckRef.current;
        if (elapsed > INACTIVITY_THRESHOLD_MS) {
          checkSubscription();
        }
      }
    };

    window.addEventListener('focus', handleRevalidateOnFocus);
    document.addEventListener('visibilitychange', handleRevalidateOnFocus);

    return () => {
      window.removeEventListener('focus', handleRevalidateOnFocus);
      document.removeEventListener('visibilitychange', handleRevalidateOnFocus);
    };
  }, [currentUser?.email]);

  const handleSelectTab = (tab: 'home' | 'specialties' | 'exams' | 'exam' | 'blog' | 'chat' | 'ai' | 'admin' | 'subscribe') => {
    if (tab === 'subscribe') {
      setIsSubscribeModalOpen(true);
      return;
    }

    if (tab === 'admin') {
      const isUserAdmin = currentUser?.role === 'admin';
      if (!isUserAdmin) {
        alert('⚠️ هذه اللوحة مخصصة لإدارة المنصة. يرجى تسجيل الدخول بحساب مدير المنصة.');
        setIsAuthModalOpen(true);
        return;
      }
    }

    if (tab === 'ai') {
      setIsAiChatbotModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans dir-rtl selection:bg-emerald-500 selection:text-white flex flex-col" dir="rtl">
      
      <UpdateChecker />
      {/* 1. Top Council Notice Marquee Ticker (Hidden during exam mode) */}
      {activeTab !== 'exam' && <NoticeTicker notices={notices} />}

      {/* 2. Main Header Bar (Compact during exam mode) */}
      <Header specialties={allSpecialties}
        activeSpecialtyId={activeSpecialtyId}
        onOpenSpecialtyModal={() => setIsSpecialtyModalOpen(true)}
        activeTab={activeTab}
        isCompact={activeTab === 'exam'}
        onOpenCouncilNewsModal={() => setIsCouncilNewsModalOpen(true)}
        onSelectTab={handleSelectTab}
        onOpenSubscribeModal={() => setIsSubscribeModalOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
      />

      {/* Subscription Warning Banner if expiring within 7 days */}
      {currentUser && currentUser.isSubscribed && currentUser.remainingDays !== undefined && currentUser.remainingDays <= 7 && currentUser.remainingDays >= 0 && (
        <div className="bg-amber-500 text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-3 border-b border-amber-600 shadow-xs">
          <span>⚠️ تنبيه انتهاء الاشتراك: ينتهي تفعيل اشتراكك المعتمد خلال <strong>{currentUser.remainingDays} أيام</strong> (بتاريخ {currentUser.endDate}). يرجى تجديد الاشتراك لضمان الوصول لكافة بنوك الأسئلة.</span>
          <button
            onClick={() => setIsSubscribeModalOpen(true)}
            className="bg-white text-amber-900 hover:bg-amber-100 px-3 py-1 rounded-lg text-[11px] font-black transition-colors shrink-0"
          >
            تجديد الاشتراك الآن
          </button>
        </div>
      )}

      {/* 3. Main View Switcher */}
      <main className="flex-1">
        <Routes>
          <Route path="/specialty/:slug" element={
            <SpecialtyPage specialties={allSpecialties} councils={councilsState} siteSettings={siteSettings} currentUser={currentUser} 
              onStartExam={(specId) => {
                handleSelectSpecialty(specId);
                setExamInitialMode('mock');
                setExamAutoStart(true);
                setActiveTab('exam');
              }}
              onOpenSubscribe={() => setIsSubscribeModalOpen(true)}
            />
          } />
          <Route path="/council/:slug" element={
            <CouncilPage specialties={allSpecialties} councils={councilsState} siteSettings={siteSettings} currentUser={currentUser} onStartExam={()=>{}} onOpenSubscribe={()=>{}} />
          } />
          <Route path="/section/:slug" element={
            <SectionPage specialties={allSpecialties} councils={councilsState} siteSettings={siteSettings} currentUser={currentUser} onStartExam={()=>{}} onOpenSubscribe={()=>{}} />
          } />
          <Route path="/news" element={
            <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fade-in text-slate-800">
              <h1 className="text-3xl font-black mb-8 text-slate-900">أخبار المجالس والتحديثات</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(siteSettings.blogPosts || []).map((post: any) => (
                  <div key={post.id} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-4">
                    {post.imageUrl && <img src={post.imageUrl} className="w-full h-48 object-cover rounded-xl" />}
                    <h3 className="font-bold text-xl">{post.title}</h3>
                    <p className="text-slate-600 line-clamp-3">{post.excerpt || post.title}</p>
                    <a href={`/news/${post.id}`} className="text-emerald-600 font-bold hover:underline self-start">اقرأ المزيد &larr;</a>
                  </div>
                ))}
              </div>
            </div>
          } />
          <Route path="/news/:slug" element={
            <NewsPage blogPosts={siteSettings.blogPosts || []} siteSettings={siteSettings} />
          } />
          <Route path="*" element={
            <>
              {activeTab === 'home' && (
          <HeroSection
            onExploreCouncil={(councilId) => {
              setSelectedCouncilForPage(councilId);
              setActiveTab('specialties');
            }}
            onExploreSpecialties={() => {
              setSelectedCouncilForPage('all');
              setActiveTab('specialties');
            }}
          />
        )}

        {activeTab === 'specialties' && (
          <SpecialtiesPage specialties={allSpecialties} councils={councilsState}
            selectedCouncilId={selectedCouncilForPage}
            onSelectCouncil={(cId) => setSelectedCouncilForPage(cId)}
            onOpenExamsForSpecialty={(specId) => {
              handleSelectSpecialty(specId);
              setActiveTab('exams');
            }}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'exams' && (
          <ExamsPage specialties={allSpecialties}
            specialtyId={activeSpecialtyId}
            currentUser={currentUser}
            questions={questions}
            onStartExam={(mode) => {
              setExamInitialMode(mode);
              setExamAutoStart(true);
              setActiveTab('exam');
            }}
            onOpenSubscribeModal={() => setIsSubscribeModalOpen(true)}
            onOpenAuthModal={handleOpenAuthModal}
            onBackToSpecialties={() => setActiveTab('specialties')}
          />
        )}

        {activeTab === 'blog' && (
          <BlogSection
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'exam' && (
          <ExamSimulator siteSettings={siteSettings} specialties={allSpecialties}
            specialtyId={activeSpecialtyId}
            questions={questions}
            currentUser={currentUser}
            initialMode={examInitialMode}
            autoStart={examAutoStart}
            onOpenSpecialtyModal={() => setIsSpecialtyModalOpen(true)}
            onOpenSubscribeModal={() => setIsSubscribeModalOpen(true)}
            onBackToHome={() => {
              setExamAutoStart(false);
              setActiveTab('home');
            }}
          />
        )}

        {/* 3. DEDICATED SPECIALTY EXAMINEES CHAT VIEW (Contains candidates of current specialty ONLY) */}
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-right space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      قروب ممتحني ({currentSpecialty.titleAr})
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        نشط الآن
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      مساحة حصرية ومخصصة لمرشحي وممتحني تخصص ({currentSpecialty.titleAr}) فقط للتواصل والتبادل العلمي
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSpecialtyModalOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-colors"
                >
                  تغيير التخصص ({currentSpecialty.titleAr})
                </button>
              </div>

              {/* Specialty Chat Instructions Card */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  أهلاً بك في الملتقى العلمي التفاعلي لممتحني {currentSpecialty.titleAr}
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  هذا التجمّع مخصص حائرياً لممتحني قسم <strong className="text-emerald-900 font-bold">{currentSpecialty.titleAr}</strong>. يمكنك مناقشة الأسئلة الطبية الصعبة، مشاركة الصور والمستندات بتركيز تام على تخصصك بدون تشتت مع التخصصات الأخرى.
                </p>
                
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-bold text-emerald-900">
                  <span className="bg-white px-3 py-1 rounded-lg border border-emerald-200">• دعم إرسال الصور والمستندات حتى 50MB</span>
                  <span className="bg-white px-3 py-1 rounded-lg border border-emerald-200">• حماية خصوصية البيانات والتنقية الآلية 04:00 ص</span>
                </div>
              </div>

              {/* Embedded Chat Widget for current specialty */}
              <div className="pt-2">
                <SubscriberChat currentSpecialtyTitle={currentSpecialty.titleAr} />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('home')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"
                >
                  الرجوع للرئيسية
                </button>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      handleOpenAuthModal('signup');
                      return;
                    }
                    const isSubscribedNow = currentUser.isSubscribed && currentUser.subscriptionStatus === 'active';
                    if (!isSubscribedNow) {
                      setIsSubscribeModalOpen(true);
                      return;
                    }
                    setExamInitialMode('STUDENT_TRAINING'); // الامتحان التدريبي الرئيسي الكامل (50 سؤال)
                    setExamAutoStart(true);     // يبدأ مباشرة بدون شاشة اختيار وضع
                    setActiveTab('exam');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-200 transition-colors"
                >
                  {!currentUser
                    ? 'سجّل الآن لبدء الامتحان'
                    : (currentUser.isSubscribed && currentUser.subscriptionStatus === 'active')
                      ? `بدء الامتحان الرسمي (${currentSpecialty.titleAr})`
                      : 'اشترك الآن لفتح الامتحان الرسمي'}
                </button>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <AdminPanel specialties={allSpecialties} plans={plansState} siteSettings={siteSettings}
            onUpdateSettings={handleUpdateSettings}
            councilsState={councilsState}
            onUpdateCouncils={handleUpdateCouncils}
            onBackToHome={() => setActiveTab('home')}
          />
        )}
            </>
          } />
        </Routes>
      </main>

      {/* 4. Floating Subscriber Chat Badge (Hidden on Home page, visible ONLY in specialty sections/chat) */}
      {activeTab !== 'home' && activeTab !== 'exam' && (
        <SubscriberChat currentSpecialtyTitle={currentSpecialty.titleAr} />
      )}

      {/* 5. Modals */}
      <SpecialtyModal specialties={allSpecialties} councils={councilsState}
        isOpen={isSpecialtyModalOpen}
        onClose={() => setIsSpecialtyModalOpen(false)}
        selectedSpecialtyId={activeSpecialtyId}
        onSelectSpecialty={handleSelectSpecialty}
        initialCouncilFilter={selectedCouncilFilter}
        isSubscribed={currentUser?.isSubscribed || false}
        isLoggedIn={Boolean(currentUser)}
        onOpenAuthModal={handleOpenAuthModal}
        specialtiesStatusMap={specialtiesStatusMap}
        onStartTrialExam={(specId) => {
          handleSelectSpecialty(specId);
          setExamInitialMode('drill');
          setExamAutoStart(true);
          setActiveTab('exam');
        }}
        onStartMainExam={(specId) => {
          handleSelectSpecialty(specId);
          setExamInitialMode('mock');
          setExamAutoStart(true);
          setActiveTab('exam');
        }}
        onOpenSubscribeModal={() => setIsSubscribeModalOpen(true)}
        onOpenSpecialtyChat={(specId) => {
          handleSelectSpecialty(specId);
          setActiveTab('chat');
        }}
      />

      <SubscriptionModal isOpen={isSubscribeModalOpen} plans={plansState}
        onClose={() => setIsSubscribeModalOpen(false)}
        activeSpecialtyId={activeSpecialtyId}
      />

      <AiChatbotModal
        isOpen={isAiChatbotModalOpen}
        onClose={() => setIsAiChatbotModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
        initialMode={authModalInitialMode}
      />

      <CouncilNewsModal
        isOpen={isCouncilNewsModalOpen}
        onClose={() => setIsCouncilNewsModalOpen(false)}
      />

      {/* 6. Footer (Hidden during active exam mode for maximum focus & clean viewport) */}
      {activeTab !== 'exam' && (
        <footer className="bg-slate-900 border-t-4 border-emerald-500 pt-12 pb-8 mt-16 dir-rtl text-slate-300 text-xs" dir="rtl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-white text-lg">M</div>
                  <span className="text-base font-black text-white font-mono">MedExam<span className="text-emerald-400">.net</span></span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  منصة الامتحانات والمحاكاة التفاعلية الأولى لمجالس المهن الطبية والصحية في السودان والوطن العربي لعام 2026.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-3 text-sm">أقسام المجالس</h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li>• مجلس المهن الطبية والصحية</li>
                  <li>• المجلس الطبي السوداني</li>
                  <li>• مجلس التخصصات الطبية (SMSB)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-3 text-sm">طرق السداد المعتمدة</h4>
                <ul className="space-y-1.5 text-slate-400">
                  <li>• تطبيق بنكك (بنك الخرطوم): {siteSettings.bankAccountDetails.bankakAccount}</li>
                  <li>• تطبيق فوري (بنك فيصل): {siteSettings.bankAccountDetails.fawryNumber}</li>
                  <li>• تحويل مباشر / أكواد تفعيل</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-3 text-sm">عن المنصة والتشغيل</h4>
                <p className="leading-relaxed text-slate-400">
                  منصة MedExam.net معتمدة لخدمة وتجهيز مرشحي امتحانات المجالس الطبية في جميع التخصصات.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-center text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>© 2026 جميع الحقوق محفوظة لمنصة MedExam.net لمجالس المهن الطبية</div>
              <div className="flex items-center gap-4">
                <button onClick={() => setIsCouncilNewsModalOpen(true)} className="hover:text-emerald-400 font-bold">أخبار المجالس الرسمية</button>
                <span>•</span>
                <button onClick={() => setIsSubscribeModalOpen(true)} className="hover:text-emerald-400">تفعيل الاشتراكات</button>
                <span>•</span>
                <button onClick={() => setIsAiChatbotModalOpen(true)} className="hover:text-emerald-400">د. سامي AI</button>
              </div>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}

