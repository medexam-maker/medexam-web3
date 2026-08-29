export type SpecialtyId = 
  | 'medicine' 
  | 'dentistry' 
  | 'pharmacy' 
  | 'labs' 
  | 'nursing' 
  | 'dental_assistants'
  | 'med_assistants'
  | 'midwifery'
  | 'gen_surgery'
  | 'int_medicine'
  | 'pediatrics'
  | 'obs_gyn'
  | 'dermatology'
  | 'neurology'
  | 'ent'
  | 'radiology' 
  | 'public_health' 
  | 'anesthesia';

export type CouncilId = 'professions' | 'medical' | 'specialties';

export interface DepartmentInfo {
  id: string;
  councilId: CouncilId;
  titleAr: string;
  titleEn: string;
  iconName?: string;
  description: string;
  questionCount: number;
  isActive?: boolean;
}

export interface CouncilInfo {
  id: CouncilId;
  titleAr: string;
  titleEn: string;
  description: string;
  badgeColor: string;
  departments: DepartmentInfo[];
}

export interface SpecialtyInfo {
  id: SpecialtyId;
  councilId?: CouncilId;
  titleAr: string;
  titleEn: string;
  iconName: string;
  description: string;
  questionCount: number;
  activeCount: number;
  badgeColor: string;
  isActive?: boolean;
}

export interface Question {
  id: string;
  specialtyId: SpecialtyId;
  category: string;
  councilId?: CouncilId;
  questionAr: string; // Question text (Arabic or main lead-in)
  questionEn?: string; // Question text (English translation)
  stem?: string; // Long clinical vignette stem\n  imageUrl?: string;
  labTable?: Array<{ test: string; result: string; range: string; abnormal?: boolean }>; // Lab values table
  options: string[]; // Options array
  optionsEn?: string[];
  optionsAr?: string[];
  optionsPct?: number[]; // Peer response stats percentages e.g. [14, 61, 9, 16]
  correctIndex: number;
  explanationAr: string;
  explanationEn?: string;
  explainWrong?: string[]; // Reasons why other options are wrong
  highYieldFact?: string; // Key takeaway rule
  textbookTopic?: {
    title: string;
    overview?: string;
    features?: string[];
    causes?: string[];
    investigations?: string[];
    management?: string[];
    keyPoints?: string[];
  };
  difficulty: 'سهل' | 'متوسط' | 'متقدم' | 'صعب';
  reference?: string;
  lang?: 'en' | 'ar';
}

export interface UserAccount {
  id?: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  isActive?: boolean;
  isSubscribed?: boolean;
  subscriptionStatus?: 'active' | 'expired' | 'free' | 'pending' | 'rejected';
  rejectionReason?: string;
  startDate?: string;
  endDate?: string;
  remainingDays?: number;
  planId?: string;
  activationCodeUsed?: string;
}

export interface SiteSettings {
  demoQuestionLimit?: number;
  examQuestionCount?: number;
  examTimerSeconds?: number;
  heroTitle: string;
  heroSubtitle: string;
  tickerText: string;
  announcementBadge: string;
  apkDownloadUrl: string;
  bankAccountDetails: {
    bankakAccount: string;
    bankakName: string;
    fawryNumber: string;
    faisalAccount: string;
  };
  zohoSettings?: {
    email: string;
    password?: string;
    smtpHost: string;
    smtpPort: number;
  };
  seoPages?: Array<{
    path: string;
    title: string;
    description: string;
    image?: string;
    content?: string;
  }>;
  blogPosts?: Array<{
    id: string;
    title: string;
    excerpt?: string;
    content: string;
    imageUrl?: string;
    createdAt?: string;
  }>;
}

export type ExamMode = 'VISITOR_DEMO' | 'STUDENT_TRAINING';

export interface ProctoringReport {
  isProctored: boolean;
  tabSwitches: number;
  faceLossCount: number;
  audioNoiseAlerts: number;
  integrityScore: number;
  status: string;
  summaryText: string;
  cameraUsed: boolean;
}

export interface ExamAnswerFeedback {
  selectedAnswer: number;
  isCorrect: boolean;
  correctIndex?: number;
  explanationAr?: string;
  explanationEn?: string;
  explainWrong?: string[];
  highYieldFact?: string;
  reference?: string;
  answeredAt?: string;
}

export interface ExamSession {
  id: string;
  specialtyId: SpecialtyId;
  councilId?: string;
  mode: ExamMode;
  categoryFilter?: string;
  questions: Question[];
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  answersFeedback?: Record<string, ExamAnswerFeedback>; // questionId -> detailed validated feedback from server
  flags: Record<string, boolean>; // questionId -> isFlagged
  timeLimitMinutes: number;
  timeRemainingSeconds: number;
  currentQuestionIndex?: number;
    isFinished: boolean;
  score: number;
  passStatus: boolean;
  startedAt: string;
  finishedAt?: string;
  proctoringReport?: ProctoringReport;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  senderSpecialty: string;
  message: string;
  timestamp: string;
  attachment?: {
    name: string;
    type: 'image' | 'pdf';
    size: string;
    url: string;
  };
}

export interface SubscriptionPlan {
  id: string;
  nameAr: string;
  durationMonths: number;
  priceUsd: number;
  priceSdg: number;
  features: string[];
  isPopular?: boolean;
}

export interface SubscriptionRequest {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  specialtyId: SpecialtyId;
  planId: string;
  paymentMethod: 'bankak' | 'fawry' | 'transfer' | 'promo';
  receiptUrl?: string;
  promoCode?: string;
  actionToken?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export interface PromoCode {
  code: string;
  planId: string;
  discountPercent: number;
  isUsed: boolean;
  generatedAt: string;
  boundEmail?: string;
  boundName?: string;
}

export interface CouncilNotice {
  id: string;
  title: string;
  content: string;
  date: string;
  isImportant: boolean;
  category: string;
}

export interface AdminStats {
  totalUsers: number;
  totalExamsTaken: number;
  passRatePercent: number;
  totalQuestions: number;
  pendingSubscriptions: number;
  activeSubscribers: number;
}

