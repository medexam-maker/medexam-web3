import { SpecialtyInfo, Question, CouncilNotice, SubscriptionPlan, ChatMessage, PromoCode, CouncilInfo, SiteSettings } from '../types';
import { LAB_BANK_QUESTIONS } from './labQuestions';
import { NURSING_BANK_QUESTIONS } from './nursingQuestions';
import { MEDICINE_BANK_QUESTIONS } from './medicineQuestions';
import { INT_MEDICINE_BANK_QUESTIONS } from './intMedicineQuestions';

export const COUNCILS: CouncilInfo[] = [
  {
    id: 'professions',
    titleAr: 'مجلس المهن الطبية والصحية',
    titleEn: 'Medical & Health Professions Council',
    description: 'امتحانات مزاولة المهن للمختبرات الطبية والتمريض العالي.',
    badgeColor: 'emerald',
    departments: [
      {
        id: 'labs',
        councilId: 'professions',
        titleAr: 'مختبرات طبية',
        titleEn: 'Medical Laboratories',
        description: 'أمراض الدم، المصليات، الكيمياء السريرية والأحياء الدقيقة.',
        questionCount: 850
      },
      {
        id: 'nursing',
        councilId: 'professions',
        titleAr: 'التمريض العالي',
        titleEn: 'Higher Nursing',
        description: 'أساسيات التمريض، التمريض الجراحي الباطني، العناية الحثيثة، وتمريض صحة الأم والطفل.',
        questionCount: 960
      }
    ]
  },
  {
    id: 'medical',
    titleAr: 'المجلس الطبي السوداني',
    titleEn: 'Sudanese Medical Council',
    description: 'امتحانات رخصة مزاولة المهنة للأطباء البشريين (الطب والجراحة العامة).',
    badgeColor: 'cyan',
    departments: [
      {
        id: 'medicine',
        councilId: 'medical',
        titleAr: 'الطب والجراحة',
        titleEn: 'Medicine & Surgery',
        description: 'امتحانات رخصة ممارسة الطب البشري والجراحة العامة.',
        questionCount: 2150
      }
    ]
  },
  {
    id: 'specialties',
    titleAr: 'مجلس التخصصات الطبية (SMSB)',
    titleEn: 'Sudanese Medical Specialization Board',
    description: 'امتحانات الدكتوراة والزمالة والدخول لتخصص الباطنية.',
    badgeColor: 'amber',
    departments: [
      {
        id: 'int_medicine',
        councilId: 'specialties',
        titleAr: 'الباطنية',
        titleEn: 'Internal Medicine',
        description: 'أمراض القلب، الصدر، الهضمية، والكلى والغدد الصماء.',
        questionCount: 890
      }
    ]
  }
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  demoQuestionLimit: 5,
  examQuestionCount: 50,
  examTimerSeconds: 3600,
  heroTitle: 'جاهز لامتحان المجلس الطبي؟',
  heroSubtitle: 'تدرب الآن على أحدث بنوك الأسئلة المحدثة لعام 2026 في جميع تخصصات المجالس الطبية مع التفسيرات باللغة الإنجليزية.',
  tickerText: 'تحديثات دفعة 2026: تم رفد بنك الأسئلة بأسئلة حصرية جديدة وإجابات شريحة باللغة الإنجليزية لكل من مجلس المهن الطبية والصحية، المجلس الطبي السوداني، ومجلس التخصصات الطبية (SMSB).',
  announcementBadge: 'تحديثات دفعة 2026 - أسئلة جديدة وحصرية',
  apkDownloadUrl: '/download/medexam_v2.6.apk',
  bankAccountDetails: {
    bankakAccount: '7689305',
    bankakName: 'محمد السماني حسن سليمان (بنك الخرطوم - بنكك)',
    fawryNumber: '51936329',
    faisalAccount: 'محمد السماني حسن سليمان'
  },
  zohoSettings: {
    email: 'd@medexam.net',
    password: '',
    smtpHost: 'smtppro.zoho.com',
    smtpPort: 465
  }
};

export const SPECIALTIES: SpecialtyInfo[] = [
  {
    id: 'medicine',
    councilId: 'medical',
    titleAr: 'الطب والجراحة العامة',
    titleEn: 'Medicine & Surgery',
    iconName: 'Stethoscope',
    description: 'امتحانات الامتياز والمجلس الطبي للجراحة والباطنية والأطفال والنساء والتوليد.',
    questionCount: 2150,
    activeCount: 4250,
    badgeColor: 'emerald'
  },
  {
    id: 'labs',
    councilId: 'professions',
    titleAr: 'المختبرات الطبية',
    titleEn: 'Medical Laboratories',
    iconName: 'Microscope',
    description: 'أمراض الدم، الكيمياء السريرية، الأحياء الدقيقة، والأنسجة.',
    questionCount: 393,
    activeCount: 1650,
    badgeColor: 'emerald'
  },
  {
    id: 'nursing',
    councilId: 'professions',
    titleAr: 'التمريض العالي',
    titleEn: 'Higher Nursing',
    iconName: 'HeartPulse',
    description: 'أساسيات التمريض، التمريض الجراحي الباطني، العناية الحثيثة، وتمريض صحة الأم والطفل.',
    questionCount: 520,
    activeCount: 1940,
    badgeColor: 'blue'
  },
  {
    id: 'int_medicine',
    councilId: 'specialties',
    titleAr: 'الباطنية (SMSB)',
    titleEn: 'Internal Medicine',
    iconName: 'Activity',
    description: 'امتحانات الزمالة والدكتوراة في الطب الباطني.',
    questionCount: 2150,
    activeCount: 4250,
    badgeColor: 'amber'
  }
];

export const INITIAL_NOTICES: CouncilNotice[] = [
  {
    id: 'n1',
    title: 'مواعيد الجلسات الامتحانية القادمة لمجلس المهن الطبية والصحية',
    content: 'يعلن مجلس المهن الطبية عن فتح باب التسجيل للامتحان الوطني الموحد لدورة سبتمبر 2026 لجميع التخصصات الطبية والصحية.',
    date: '2026-08-01',
    isImportant: true,
    category: 'إعلان مهم'
  },
  {
    id: 'n2',
    title: 'تحديث بنك أسئلة الطب والجراحة وفق الدليل الاسترشادي الجديد',
    content: 'تمت إضافة 250 سؤالاً جديداً باللغة الإنجليزية في كافة التخصصات مع التوضيحات الطبية المعتمدة من اللجنة العلمية العليا.',
    date: '2026-07-28',
    isImportant: false,
    category: 'تحديثات أسئلة'
  },
  {
    id: 'n3',
    title: 'تنويه بخصوص سداد الاشتراكات عبر تطبيق بنكك، فوري، وبنك فيصل',
    content: 'يرجى تأكيد رفع إشعار الدفع الخالي من الغباشة وتأكيد رقم العملية لضمان التفعيل الفوري لحسابك خلال دقائق.',
    date: '2026-07-25',
    isImportant: false,
    category: 'الدفع والاشتراك'
  }
];



export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'weekly',
    nameAr: 'اشتراك أسبوعي (7 أيام)',
    durationMonths: 0.25,
    priceUsd: 2,
    priceSdg: 3000,
    features: [
      'وصول كامل لبنك أسئلة التخصص المختار لمدة أسبوع',
      'محاكاة الامتحانات الوطنية والشرح الطبي التفصيلي',
      'الانضمام لقروب الدردشة التفاعلي والتبادل العلمي'
    ]
  },
  {
    id: 'monthly',
    nameAr: 'اشتراك شهري (30 يوم)',
    durationMonths: 1,
    priceUsd: 4,
    priceSdg: 5000,
    isPopular: true,
    features: [
      'وصول كامل لبنك الأسئلة المحدث للتخصص المختار',
      'محاكاة الامتحانات الوطنية بلغة إنجليزية وشرط LTR',
      'الشرح الطبي التفصيلي والمراجع لكل سؤال',
      'انضمام لقروب الدردشة والتبادل العلمي بين الطلاب',
      'دعم الذكاء الاصطناعي (د. سامي) مجاناً للإجابة عن الأسئلة'
    ]
  },
  {
    id: 'quarterly',
    nameAr: 'اشتراك 3 أشهر (فصلي)',
    durationMonths: 3,
    priceUsd: 8,
    priceSdg: 10000,
    features: [
      'كل مميزات الاشتراك الشهري لمدة 90 يوماً',
      'تحديثات مستمرة لبنك الأسئلة مع إضافة دورات جديدة',
      'تقارير أداء تحليلية متقدمة ونقاط الضعف',
      'أولوية الإجابة في الاستفسارات العلمية'
    ]
  },
  {
    id: 'annual',
    nameAr: 'اشتراك سنوي شامل (12 شهر)',
    durationMonths: 12,
    priceUsd: 15,
    priceSdg: 20000,
    features: [
      'وصول شامل لجميع المجالس والتخصصات الطبية بدون استثناء',
      'تحديثات تلقائية طوال العام لأحدث أسئلة المجلس باللغة الإنجليزية',
      'شهادة إكمال ومحاكاة معتمدة من المنصة',
      'دعم فني وتواصل مباشر 24/7'
    ]
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'cm1',
    senderName: 'د. مصطفى السر',
    senderRole: 'طبيب متدرب',
    senderSpecialty: 'المختبرات الطبية',
    message: 'السلام عليكم زملاء قسم المختبرات الطبية، أرفقت لكم ملخص قيم بصيغة PDF لنتائج فحص أمراض الدم (Hematology) وتفريغ المصليات المعتمد لامتحان مجلس المهن الطبية.',
    timestamp: '09:25 ص',
    attachment: {
      name: 'Medical_Labs_Hematology_Summary.pdf',
      type: 'pdf',
      size: '4.2 MB',
      url: '#'
    }
  },
  {
    id: 'cm2',
    senderName: 'د. نهى عبد الرحمن',
    senderRole: 'أخصائية تحليل طفيليات',
    senderSpecialty: 'المختبرات الطبية',
    message: 'ممتاز يا دكتور مصطفى! أسئلة الأحياء الدقيقة (Microbiology) في مجلس المهن الطبية يركز فيها الامتحان دائماً على Gram-negative bacilli والـ Culture media المناسبة.',
    timestamp: '09:30 ص'
  },
  {
    id: 'cm3',
    senderName: 'د. عمار ياسر',
    senderRole: 'طبيب متدرب',
    senderSpecialty: 'المختبرات الطبية',
    message: 'شكراً جزيلاً! بالنسبة لأقسام الكيمياء السريرية (Clinical Chemistry)، التفسير الطبي لنتائج الكلى والمصل بالإنجليزية ممتاز وواضح جداً ببنك الأسئلة.',
    timestamp: '09:35 ص'
  },
  {
    id: 'cm4',
    senderName: 'د. سارة خليل',
    senderRole: 'طبيب متدرب',
    senderSpecialty: 'الطب والجراحة العامة',
    message: 'السلام عليكم زملاء الطب والجراحة، هل من أحد يقدر يفيدني في تمرين الباطنية لأسئلة ECG اليوم؟',
    timestamp: '09:15 ص'
  },
  {
    id: 'cm5',
    senderName: 'د. أحمد عثمان',
    senderRole: 'مشرف أكاديمي',
    senderSpecialty: 'الطب والجراحة العامة',
    message: 'وعليكم السلام يا دكتورة سارة. يفضل التركيز على ارتفاع ST في ليدات V1 لـ V4 والتفريق بينها وبين Pericarditis من خلال مقطع PR Depression.',
    timestamp: '09:18 ص'
  },
  {
    id: 'cm6',
    senderName: 'د. رانيا حسن',
    senderRole: 'صيدلية متدربة',
    senderSpecialty: 'الصيدلة والدواء',
    message: 'زملاء قسم الصيدلة، أسئلة تداخلات الأدوية (Drug Interactions) بمجلس الصيدلة تتركز حول Cytochrome P450 Enzymes.',
    timestamp: '10:05 ص'
  },
  {
    id: 'cm7',
    senderName: 'د. مناهل يوسف',
    senderRole: 'تمريض عالي',
    senderSpecialty: 'التمريض والقبالة',
    message: 'زميلاتي في التمريض، أسئلة العناية الحثيثة (ICU Nursing) وعلامات الصدمة الوعائية مهمة جداً في الامتحان.',
    timestamp: '10:20 ص'
  },
  {
    id: 'cm8',
    senderName: 'د. وليد الطيب',
    senderRole: 'طبيب أسنان متدرب',
    senderSpecialty: 'طب وجراحة الأسنان',
    message: 'أسئلة جراحة الفم ومواضع التخدير الموضعي (Inferior Alveolar Nerve Block) ببنك أسئلة مجلس الأسنان شاملة ودقيقة.',
    timestamp: '10:40 ص'
  },
  {
    id: 'cm9',
    senderName: 'إدارة المنصة',
    senderRole: 'إدارة المجلس',
    senderSpecialty: 'تنويه تلقائي',
    message: 'تنويه: يتم مسح الوسائط المرفقة تلقائياً يومياً عند الساعة 04:00 صباحاً بتوقيت الخرطوم لضمان سرعة سيرفرات المحاكاة.',
    timestamp: '04:00 ص'
  }
];

export const INITIAL_PROMO_CODES: PromoCode[] = [
  { code: 'MEDEXAM2026', planId: 'quarterly', discountPercent: 100, isUsed: false, generatedAt: '2026-08-01' },
  { code: 'SUDANBOARD100', planId: 'monthly', discountPercent: 100, isUsed: false, generatedAt: '2026-08-02' },
  { code: 'DOCTOR50', planId: 'annual', discountPercent: 50, isUsed: false, generatedAt: '2026-08-03' }
];

