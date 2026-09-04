import { resolveApiPath } from "../services/platform";
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { ShieldCheck, Plus, Trash2, Edit3, Check, X, Key, FileText, Users, Award, Copy, Sparkles, BookOpen, Settings, Upload, Layers, FileSpreadsheet, Download, Building2, CheckCircle2, Bell, Mail, RefreshCw, Eye, Send, Clock, Phone, UserCheck, AlertCircle, FileUp, FileCheck2, AlertOctagon, Info, BarChart, Activity, Database, Globe, Smartphone } from 'lucide-react';
import { Question, SubscriptionRequest, PromoCode, AdminStats, SpecialtyId, CouncilId, SiteSettings, CouncilInfo } from '../types';
import { DEFAULT_SITE_SETTINGS } from '../data/mockData';
import { authFetch } from '../lib/authFetch';
import { Helmet } from 'react-helmet-async';

interface ImportProcessingReport {
  sourceType: 'word' | 'excel' | 'text';
  fileName: string;
  totalExtracted: number;
  savedCount: number;
  rejectedCount: number;
  rejectionLogs: string[];
  targetSpecialtyTitle: string;
  category: string;
  timestamp: string;
}

interface AdminPanelProps {
  siteSettings?: SiteSettings;
  onUpdateSettings?: (settings: SiteSettings) => void;
  councilsState?: CouncilInfo[];
  onUpdateCouncils?: (councils: CouncilInfo[]) => void;
  onBackToHome?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  plans,
  specialties,
  siteSettings = DEFAULT_SITE_SETTINGS,
  onUpdateSettings,
  councilsState = [],
  onUpdateCouncils,
  onBackToHome
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'questions' | 'bulk_import' | 'councils' | 'ui_settings' | 'proctoring' | 'subs' | 'promo' | 'specialties' | 'dashboard' | 'operators' | 'health' | 'integrity' | 'audit' | 'blog'>('dashboard');

  const [isAdminOwner, setIsAdminOwner] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [operators, setOperators] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [dataIntegrity, setDataIntegrity] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  
  const [androidReleases, setAndroidReleases] = useState<any[]>([]);
  const [isUploadingRelease, setIsUploadingRelease] = useState(false);
  const [releaseForm, setReleaseForm] = useState({ version: '', release_notes: '', is_published: true });
  const [releaseFile, setReleaseFile] = useState<File | null>(null);

  const fetchReleases = async () => {
    try {
      const res = await fetch(resolveApiPath('/api/admin/releases'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.releases) setAndroidReleases(data.releases);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'releases') {
      fetchReleases();
    }
  }, [activeTab]);

  const handleUploadRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseFile || !releaseForm.version) return alert('Version and APK file are required.');
    setIsUploadingRelease(true);
    const formData = new FormData();
    formData.append('apk', releaseFile);
    formData.append('version', releaseForm.version);
    formData.append('release_notes', releaseForm.release_notes);
    formData.append('is_published', releaseForm.is_published.toString());

    try {
      const res = await authFetch('/api/admin/releases', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Release uploaded successfully!');
        setReleaseForm({ version: '', release_notes: '', is_published: true });
        setReleaseFile(null);
        fetchReleases();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    } finally {
      setIsUploadingRelease(false);
    }
  };

  const handleTogglePublishRelease = async (id: string, currentStatus: boolean) => {
    try {
      const res = await authFetch(`/api/admin/releases/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_published: !currentStatus })
      });
      if (res.ok) fetchReleases();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRelease = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this release?')) return;
    try {
      const res = await authFetch(`/api/admin/releases/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchReleases();
    } catch (err) {
      console.error(err);
    }
  };

  const [questions, setQuestions] = useState<Question[]>([]);
  const [pendingSubs, setPendingSubs] = useState<SubscriptionRequest[]>([]);
  const [generatedCodes, setGeneratedCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [specialtiesStatusMap, setSpecialtiesStatusMap] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Proctoring Reports State
  const [proctoringReports, setProctoringReports] = useState<any[]>([]);
  const [proctorSearch, setProctorSearch] = useState('');
  const [proctorFilterSpecialty, setProctorFilterSpecialty] = useState('all');

  // Notification & Receipt Modal states
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);
  const [rejectionModalSub, setRejectionModalSub] = useState<SubscriptionRequest | null>(null);
  const [customRejectionReason, setCustomRejectionReason] = useState<string>('صورة إشعار التحويل غير أصلية أو غير واضحة');
  const [testEmailAddress, setTestEmailAddress] = useState('d@medexam.net');
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [subFilter, setSubFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Filter state for question bank
  const [selectedCouncilFilter, setSelectedCouncilFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Single Question Form Modal state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [qSpecialtyId, setQSpecialtyId] = useState<SpecialtyId>('medicine');
  const [qCouncilId, setQCouncilId] = useState<CouncilId>('medical');
  const [qCategory, setQCategory] = useState('الباطنية - العامة');
  const [qText, setQText] = useState('');
  const [qStem, setQStem] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState<'سهل' | 'متوسط' | 'متقدم'>('متوسط');
  const [qReference, setQReference] = useState('');
  const [qImageUrl, setQImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Bulk Importer State
  const [rawText, setRawText] = useState('');
  const [bulkTargetSpecialty, setBulkTargetSpecialty] = useState<SpecialtyId>('medicine');
  const [bulkCategory, setBulkCategory] = useState('Cardiology');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [importProcessingReport, setImportProcessingReport] = useState<ImportProcessingReport | null>(null);
  const [importSessionId, setImportSessionId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);

  // Batch Progress Tracking State for Netlify & Supabase
  const [uploadProgress, setUploadProgress] = useState<{
    isUploading: boolean;
    currentBatch: number;
    totalBatches: number;
    processedCount: number;
    totalQuestions: number;
    percentage: number;
    statusText: string;
  }>({
    isUploading: false,
    currentBatch: 0,
    totalBatches: 0,
    processedCount: 0,
    totalQuestions: 0,
    percentage: 0,
    statusText: ''
  });

  // Council / Department Add Modal State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptCouncilId, setDeptCouncilId] = useState<CouncilId>('professions');
  const [deptTitleAr, setDeptTitleAr] = useState('');
  const [deptTitleEn, setDeptTitleEn] = useState('');
  const [deptDescription, setDeptDescription] = useState('');

  // UI Customization State
  const [uiForm, setUiForm] = useState<SiteSettings>(siteSettings);

  // Promo Generator state
  const [genCount, setGenCount] = useState(3);
  const [genPlanId, setGenPlanId] = useState('quarterly');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch initial admin data (manual refresh available on demand)
  const loadAdminData = async () => {
    setIsRefreshing(true);
    try {
      const [qRes, sRes, stRes, spRes, prRes, arRes] = await Promise.all([
         authFetch('/api/questions'),
         authFetch('/api/subscriptions/pending'),
         authFetch('/api/admin/stats'),
         authFetch('/api/specialties/status'),
         authFetch('/api/proctoring/reports'),
         authFetch('/api/admin/releases')
       ]);

      if (qRes.ok) setQuestions(await qRes.json());
      if (sRes.ok) setPendingSubs(await sRes.json());
      if (stRes.ok) setStats(await stRes.json());
      if (spRes.ok) {
        const spData = await spRes.json();
        if (spData && spData.statusMap) {
          setSpecialtiesStatusMap(spData.statusMap);
        }
      }
      if (arRes && arRes.ok) {
        const arData = await arRes.json();
        if (arData && arData.releases) {
          setAndroidReleases(arData.releases);
        }
      }
      if (prRes.ok) {
        const prData = await prRes.json();
        if (prData && prData.reports) {
          setProctoringReports(prData.reports);
        }
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleSpecialtyStatus = async (specialtyId: string, currentIsActive: boolean) => {
    try {
      const res = await authFetch('/api/admin/specialties/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialtyId, isActive: !currentIsActive })
      });
      if (res.ok) {
        const data = await res.json();
        setSpecialtiesStatusMap(data.statusMap);
      }
    } catch (err) {
      console.error('Toggle specialty status error:', err);
    }
  };

  useEffect(() => {
    loadAdminData();
    // Real-time polling for new student subscription requests every 5 seconds
    const interval = setInterval(() => {
      authFetch('/api/subscriptions/pending')
        .then(r => r.ok ? r.json() : null)
        .then(data => data && setPendingSubs(data))
        .catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await authFetch(`/api/admin/test-email?to=${encodeURIComponent(testEmailAddress)}`, { method: 'POST' });
      const data = await res.json();
      if (data.emailResult && data.emailResult.sent) {
        setTestEmailResult(`✅ تم إرسال الإيميل التجريبي بنجاح إلى ${testEmailAddress}! (Message ID: ${data.emailResult.messageId})`);
      } else {
        setTestEmailResult(`⚠️ تعذر الإرسال عبر Zoho: ${data.emailResult?.error || 'تحقق من كلمة مرور التطبيق'}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setTestEmailResult(`❌ خطأ في الاتصال: ${message}`);
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Save/Create single question directly and permanently
  
  const handleQuestionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingQuestion) return;
    
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('questionId', editingQuestion.id);

    try {
      const res = await authFetch('/api/upload-image', {
        method: 'POST',
        body: formData, // do not set Content-Type header so browser sets multipart/form-data with boundary
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQImageUrl(data.imageUrl);
      } else {
        alert(data.error || 'Failed to upload image.');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading image.');
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || qOptions.some(o => !o.trim())) {
      alert('يرجى كتابة السؤال وجميع الخيارات الأربعة.');
      return;
    }

    const payload = {
      specialtyId: qSpecialtyId,
      councilId: qCouncilId,
      category: qCategory,
      questionAr: qText,
      stem: qStem,
      options: qOptions,
      correctIndex: qCorrectIndex,
      explanationAr: qExplanation,
      difficulty: qDifficulty,
      reference: qReference,
        imageUrl: qImageUrl,
      lang: /[a-zA-Z]/.test(qText) ? 'en' : 'ar'
    };

    try {
      if (editingQuestion) {
        const res = await authFetch(`/api/questions/${editingQuestion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updatedQ: Question = { ...editingQuestion, ...payload };
          setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? updatedQ : q));
          setShowQuestionModal(false);
          alert('✅ تم تعديل وحفظ السؤال بنجاح في قاعدة البيانات والسيرفر!');
        }
      } else {
        const res = await authFetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          const newQ: Question = data.question || { id: `q_${Date.now()}`, ...payload };
          setQuestions(prev => [newQ, ...prev]);
          // Reset filters so the new question is immediately visible in the table below
          setSelectedCouncilFilter('all');
          setSelectedDeptFilter('all');
          setShowQuestionModal(false);
          alert('✅ تم إضافة السؤال الجديد بنجاح وثباته في بنك الأسئلة المباشر!');
        }
      }
    } catch (err) {
      console.error('Save question error:', err);
      alert('حدث خطأ أثناء حفظ السؤال. يرجى المحاولة مرة أخرى.');
    }
  };

  // Helper to save parsed question list and generate processing summary report using Client-Side Batch Chunking
  const saveParsedQuestionsList = async (
    parsedQuestions: Question[],
    sourceType: 'word' | 'excel' | 'text',
    fileName?: string,
    totalRowsOrBlocks: number = 0,
    rejectedCount: number = 0,
    rejectionLogs: string[] = []
  ) => {
    if (!parsedQuestions || parsedQuestions.length === 0) {
      setImportStatus('لا توجد أسئلة صالحة للحفظ.');
      return;
    }

    const BATCH_SIZE = 15; // 15 questions per batch chunk to prevent Netlify Function timeouts
    const totalQuestions = parsedQuestions.length;
    const totalBatches = Math.ceil(totalQuestions / BATCH_SIZE);

    setUploadProgress({
      isUploading: true,
      currentBatch: 0,
      totalBatches,
      processedCount: 0,
      totalQuestions,
      percentage: 0,
      statusText: `جاري بدء معالجة الحزم وتقسيم الـ ${totalQuestions} سؤال على ${totalBatches} دفعات...`
    });

    let savedCount = 0;
    let skippedDuplicatesCount = 0;
    const allSavedList: Question[] = [];

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      const chunk = parsedQuestions.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE);
      const currentBatchNumber = batchIdx + 1;

      setUploadProgress(prev => ({
        ...prev,
        currentBatch: currentBatchNumber,
        statusText: `جاري رفع الدفعة ${currentBatchNumber} من ${totalBatches} (${chunk.length} سؤال)...`
      }));

      try {
        const res = await authFetch('/api/questions/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: chunk })
        });

        if (res.ok) {
          const data = await res.json();
          savedCount += data.insertedCount || chunk.length;
          skippedDuplicatesCount += data.skippedDuplicates || 0;
          if (data.savedQuestions && Array.isArray(data.savedQuestions)) {
            allSavedList.push(...data.savedQuestions);
          } else {
            allSavedList.push(...chunk);
          }
        } else {
          // Fallback to individual posting if batch fails
          for (const q of chunk) {
            try {
              const singleRes = await authFetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(q)
              });
              if (singleRes.ok) {
                const sData = await singleRes.json();
                allSavedList.push(sData.question || q);
                savedCount++;
              }
            } catch (e) {
              allSavedList.push(q);
              savedCount++;
            }
          }
        }
      } catch (err) {
        console.error(`Batch ${currentBatchNumber} network error:`, err);
        // Fallback local persistence
        allSavedList.push(...chunk);
        savedCount += chunk.length;
      }

      const processedCount = Math.min((batchIdx + 1) * BATCH_SIZE, totalQuestions);
      const percentage = Math.round((processedCount / totalQuestions) * 100);

      setUploadProgress({
        isUploading: true,
        currentBatch: currentBatchNumber,
        totalBatches,
        processedCount,
        totalQuestions,
        percentage,
        statusText: `اكتملت الدفعة ${currentBatchNumber} من ${totalBatches} بنجاح (${percentage}%)`
      });

      // Small async delay between batches (120ms) to ensure Netlify execution thread stays responsive
      await new Promise(r => setTimeout(r, 120));
    }

    setQuestions(prev => [...allSavedList, ...prev]);

    setUploadProgress(prev => ({
      ...prev,
      isUploading: false,
      percentage: 100,
      statusText: `✅ تم استكمال كافة الدفعات الـ ${totalBatches} بنجاح وحفظ ${savedCount} سؤالاً.`
    }));

    const targetSpecObj = specialties.find(s => s.id === bulkTargetSpecialty);
    const specTitle = targetSpecObj ? targetSpecObj.titleAr : bulkTargetSpecialty;

    setImportProcessingReport({
      sourceType,
      fileName: fileName || (sourceType === 'word' ? 'مستند وورد' : sourceType === 'excel' ? 'جدول إكسيل' : 'نص نسيجي'),
      totalExtracted: totalQuestions,
      savedCount,
      rejectedCount: rejectedCount + skippedDuplicatesCount,
      rejectionLogs: skippedDuplicatesCount > 0 
        ? [...rejectionLogs, `تم استبعاد ${skippedDuplicatesCount} سؤالاً مكرراً موجوداً مسبقاً في بنك الأسئلة.`]
        : rejectionLogs,
      targetSpecialtyTitle: specTitle,
      category: bulkCategory,
      timestamp: new Date().toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    setImportStatus(`✅ نجاح إدخال الـ ${totalQuestions} سؤالاً بالكامل عبر الدفعات المقسمة (${savedCount} سؤال مفعل).`);
  };

  // Word (.docx) file parser using Mammoth
  const handleWordFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setImportStatus(`جاري قراءة وفحص مستند الوورد (${file.name})...`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value || '';
      setRawText(text);

      if (!text.trim()) {
        setImportStatus('مستند الوورد فارغ أو لا يحتوي على نصوص مأهولة.');
        setIsParsingFile(false);
        return;
      }

      setImportStatus(`تم استخراج النص بـ Mammoth. جاري تحليل الأسئلة من ${file.name}...`);
      await parseTextBlocksToQuestions(text, 'word', file.name);
    } catch (err) {
      console.error('Word upload error:', err);
      const message = err instanceof Error ? err.message : 'تأكد من اختيار ملف .docx صالح';
      setImportStatus(`حدث خطأ أثناء فحص ملف الوورد: ${message}`);
    } finally {
      setIsParsingFile(false);
    }
  };

  // Excel (.xlsx / .xls / .csv) file parser using XLSX
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setImportStatus(`جاري فحص وقراءة جدول الإكسيل (${file.name})...`);
    setImportPreview(null);
    setImportSessionId(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // 1. Header Validation
      const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
      if (!rawRows || rawRows.length < 2) {
        setImportStatus('جدول الإكسيل فارغ أو لا يحتوي على صفوف بيانات.');
        setIsParsingFile(false);
        if (e.target) e.target.value = '';
        return;
      }

      const actualHeaders = rawRows[0] || [];
      const expectedHeaders = [
        'temp_id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
        'option_e', 'correct_answer', 'explanation', 'reference', 'lab_markdown',
        'council_name', 'specialty_name', 'category_name'
      ];

      if (actualHeaders.length !== expectedHeaders.length || !expectedHeaders.every((val: any, index: number) => String(val).trim() === expectedHeaders[index])) {
        setImportStatus('هيكل الملف غير صحيح. يرجى الالتزام بالترتيب والأسماء الدقيقة للأعمدة الـ 14 كما هو مطلوب بدون أي زيادة أو نقصان.');
        setIsParsingFile(false);
        if (e.target) e.target.value = '';
        return;
      }

      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      if (!jsonData || jsonData.length === 0) {
        setImportStatus('جدول الإكسيل لا يحتوي على صفوف بيانات.');
        setIsParsingFile(false);
        if (e.target) e.target.value = '';
        return;
      }

      if (jsonData.length > 100) {
        setImportStatus('عذراً، الحد الأقصى للملف الواحد هو 100 سؤال.');
        setIsParsingFile(false);
        if (e.target) e.target.value = '';
        return;
      }

      // 2. Global temp_id Uniqueness
      const tempIdSet = new Set<string>();
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const tId = String(row.temp_id || '').trim();
        if (!tId) {
           setImportStatus(`خطأ: رقم السؤال (temp_id) مفقود أو فارغ في الصف ${i + 2}.`);
           setIsParsingFile(false);
           if (e.target) e.target.value = '';
           return;
        }
        if (tempIdSet.has(tId)) {
           setImportStatus(`خطأ: رقم السؤال (temp_id) "${tId}" مكرر في الملف. يجب أن يكون فريداً على مستوى الملف بالكامل.`);
           setIsParsingFile(false);
           if (e.target) e.target.value = '';
           return;
        }
        tempIdSet.add(tId);
      }

      
      // Check required fields based on the 14 columns
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row.question_text || !row.correct_answer || !row.council_name || !row.specialty_name || !row.category_name) {
           setImportStatus(`خطأ: البيانات الأساسية مفقودة في الصف ${i + 2}. يجب توفر نص السؤال، الإجابة الصحيحة، المجلس، التخصص، والقسم الفرعي.`);
           setIsParsingFile(false);
           if (e.target) e.target.value = '';
           return;
        }
        if (!row.option_a && !row.option_b) {
           setImportStatus(`خطأ: الخيارات مفقودة في الصف ${i + 2}.`);
           setIsParsingFile(false);
           if (e.target) e.target.value = '';
           return;
        }
      }
      
      // We will perform local bilingual pairing here before uploading
      const pairedQuestions = new Map<string, any>();
      
      for (const row of jsonData) {
         const tId = String(row.temp_id || '').trim();
         const isEnglish = /[a-zA-Z]/.test(row.question_text); // simple heuristic
         
         const qData = {
           temp_id: tId,
           question_text: row.question_text,
           options: [row.option_a, row.option_b, row.option_c, row.option_d, row.option_e].filter(Boolean),
           correct_answer: row.correct_answer,
           explanation: row.explanation,
           reference: row.reference,
           lab_markdown: row.lab_markdown,
           council_name: row.council_name,
           specialty_name: row.specialty_name,
           category_name: row.category_name
         };
         
         if (pairedQuestions.has(tId)) {
            // Already has one part, merge them based on language
            const existing = pairedQuestions.get(tId);
            if (isEnglish) {
               existing.question_en = qData.question_text;
               existing.options_en = qData.options;
               existing.explanation_en = qData.explanation;
               if (!existing.question_ar) {
                   existing.question_ar = existing.question_text; // The first one was Arabic
                   existing.options_ar = existing.options;
                   existing.explanation_ar = existing.explanation;
               }
            } else {
               existing.question_ar = qData.question_text;
               existing.options_ar = qData.options;
               existing.explanation_ar = qData.explanation;
               if (!existing.question_en) {
                   existing.question_en = existing.question_text; // The first one was English
                   existing.options_en = existing.options;
                   existing.explanation_en = existing.explanation;
               }
            }
            // Keep correct_answer, council, specialty from English ideally, or first one
            if (isEnglish) {
               existing.correct_answer = qData.correct_answer;
               existing.council_name = qData.council_name;
               existing.specialty_name = qData.specialty_name;
               existing.category_name = qData.category_name;
            }
         } else {
            // Store the first one we see
            pairedQuestions.set(tId, {
               ...qData,
               question_en: isEnglish ? qData.question_text : undefined,
               question_ar: !isEnglish ? qData.question_text : undefined,
               options_en: isEnglish ? qData.options : undefined,
               options_ar: !isEnglish ? qData.options : undefined,
               explanation_en: isEnglish ? qData.explanation : undefined,
               explanation_ar: !isEnglish ? qData.explanation : undefined
            });
         }
      }
      
      const pairedData = Array.from(pairedQuestions.values());
      const totalQuestions = pairedData.length;

      const BATCH_SIZE = 15;
      const totalBatches = Math.ceil(totalQuestions / BATCH_SIZE);

      setUploadProgress({
        isUploading: true,
        currentBatch: 0,
        totalBatches,
        processedCount: 0,
        totalQuestions,
        percentage: 0,
        statusText: `جاري رفع ${totalQuestions} سؤال عبر ${totalBatches} دفعات...`
      });

      let currentSessionId: string | null = null;
      let allValid = true;

      for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
        const chunk = jsonData.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE);
        const currentBatchNumber = batchIdx + 1;

        setUploadProgress(prev => ({
          ...prev,
          currentBatch: currentBatchNumber,
          statusText: `جاري رفع الدفعة ${currentBatchNumber} من ${totalBatches} (${chunk.length} سؤال)...`
        }));

        const payload = {
           questionsChunk: chunk,
           sessionId: currentSessionId,
           isFinal: batchIdx === totalBatches - 1
        };

        const res = await authFetch('/api/import/chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Batch ${currentBatchNumber} failed to upload.`);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Server rejected the chunk.');
        }

        if (data.sessionId) {
          currentSessionId = data.sessionId;
          setImportSessionId(data.sessionId);
        }

        const processedCount = Math.min((batchIdx + 1) * BATCH_SIZE, totalQuestions);
        const percentage = Math.round((processedCount / totalQuestions) * 100);

        setUploadProgress({
          isUploading: true,
          currentBatch: currentBatchNumber,
          totalBatches,
          processedCount,
          totalQuestions,
          percentage,
          statusText: `تم رفع الدفعة ${currentBatchNumber} بنجاح (${percentage}%)`
        });
      }

      // If all chunks uploaded successfully, fetch preview
      if (currentSessionId) {
        setImportStatus('تم رفع الأسئلة بنجاح. جاري جلب المعاينة...');
        const previewRes = await authFetch(`/api/import/preview/${currentSessionId}`);
        if (previewRes.ok) {
           const previewData = await previewRes.json();
           setImportPreview(previewData);
           setUploadProgress(prev => ({
             ...prev,
             isUploading: false,
             statusText: 'تم تجهيز المعاينة.'
           }));
        } else {
           throw new Error('فشل في جلب المعاينة من السيرفر.');
        }
      }

    } catch (err) {
      console.error('Excel upload error:', err);
      const message = err instanceof Error ? err.message : 'تأكد من اختيار ملف .xlsx صالح مع الالتزام بالصيغة المطلوبة.';
      setImportStatus(`حدث خطأ أثناء فحص ملف الإكسيل: ${message}`);
      setUploadProgress(prev => ({ ...prev, isUploading: false }));
    } finally {
      setIsParsingFile(false);
      if (e.target) e.target.value = ''; // Reset file input
    }
  };

  const handleCommitImport = async () => {
     if (!importSessionId) return;
     setIsCommitting(true);
     try {
        const res = await authFetch('/api/import/commit', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ sessionId: importSessionId, confirm: true })
        });
        if (res.ok) {
           const data = await res.json();
           if (data.success) {
              setImportStatus(`✅ تم تأكيد وحفظ ${data.committed} سؤالاً بنجاح في قاعدة البيانات!`);
              setImportPreview(null);
              setImportSessionId(null);
              loadAdminData(); // Refresh questions
           } else {
              throw new Error(data.error);
           }
        } else {
           const errData = await res.json().catch(() => ({}));
           throw new Error(errData.error || 'فشل عملية التأكيد.');
        }
     } catch (err) {
        const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
        setImportStatus(`❌ خطأ أثناء التأكيد: ${msg}`);
     } finally {
        setIsCommitting(false);
     }
  };

  const handleAbortImport = async () => {
     if (!importSessionId) return;
     try {
        await authFetch('/api/import/abort', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ sessionId: importSessionId })
        });
     } catch(e) {}
     setImportPreview(null);
     setImportSessionId(null);
     setImportStatus('تم إلغاء عملية الاستيراد.');
  };

  // Text block parser helper
  const parseTextBlocksToQuestions = async (text: string, sourceType: 'word' | 'text' = 'text', fileName?: string) => {
    const blocks = text.split(/\n\s*\n|(?=Question:)/i).filter(b => b.trim().length > 10);
    const parsedQuestions: Question[] = [];
    let rejectedCount = 0;
    const rejectionLogs: string[] = [];

    blocks.forEach((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      let qStr = '';
      const opts: string[] = [];
      let correctIdx = 0;
      let expStr = '';
      let refStr = '';

      lines.forEach(line => {
        if (/^Question:/i.test(line)) {
          qStr = line.replace(/^Question:/i, '').trim();
        } else if (/^[A-D]\s*[:\.\)]/i.test(line)) {
          opts.push(line.replace(/^[A-D]\s*[:\.\)]/i, '').trim());
        } else if (/^Answer\s*[:\.\)]/i.test(line)) {
          const ansChar = line.replace(/^Answer\s*[:\.\)]/i, '').trim().toUpperCase();
          if (ansChar === 'A') correctIdx = 0;
          if (ansChar === 'B') correctIdx = 1;
          if (ansChar === 'C') correctIdx = 2;
          if (ansChar === 'D') correctIdx = 3;
        } else if (/^Explanation\s*[:\.\)]/i.test(line)) {
          expStr = line.replace(/^Explanation\s*[:\.\)]/i, '').trim();
        } else if (/^Reference\s*[:\.\)]/i.test(line)) {
          refStr = line.replace(/^Reference\s*[:\.\)]/i, '').trim();
        } else if (!qStr) {
          qStr += ' ' + line;
        } else if (!expStr) {
          expStr += ' ' + line;
        }
      });

      if (qStr && opts.length >= 2) {
        while (opts.length < 4) opts.push('N/A');
        parsedQuestions.push({
          id: `q_bulk_${Date.now()}_${idx}`,
          specialtyId: bulkTargetSpecialty,
          category: bulkCategory,
          questionAr: qStr,
          options: opts.slice(0, 4),
          correctIndex: correctIdx,
          explanationAr: expStr || 'Standard medical rationale provided for board review.',
          difficulty: 'متوسط',
          reference: refStr || 'Sudanese Board Standard References',
          lang: /[a-zA-Z]/.test(qStr) ? 'en' : 'ar'
        });
      } else {
        rejectedCount++;
        rejectionLogs.push(`الكتلة ${idx + 1}: ${!qStr ? 'نص السؤال غير واضح' : 'الخيارات غير مكتملة'}`);
      }
    });

    if (parsedQuestions.length === 0) {
      setImportStatus('لم يتم التمكن من استخراج أسئلة. التنسيق الموصى به: Question: ... A: ... B: ... C: ... D: ... Answer: B Explanation: ...');
      return;
    }

    await saveParsedQuestionsList(parsedQuestions, sourceType, fileName, blocks.length, rejectedCount, rejectionLogs);
  };

  // Bulk Import Parser (from raw text)
  const handleProcessBulkImport = async () => {
    if (!rawText.trim()) {
      alert('يرجى لتقيد أو لصق نص ملف الوورد/إكسيل المحتوي على الأسئلة.');
      return;
    }
    setImportStatus('جاري تحليل النص واستخراج الأسئلة والخيارات...');
    await parseTextBlocksToQuestions(rawText, 'text');
  };

  // Add sub-department under a council
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptTitleAr.trim()) return;

    const updatedCouncils = councilsState.map(c => {
      if (c.id === deptCouncilId) {
        const newDept = {
          id: `dept_${Date.now()}`,
          councilId: deptCouncilId,
          titleAr: deptTitleAr,
          titleEn: deptTitleEn || deptTitleAr,
          description: deptDescription || 'قسم جديد مضاف بواسطة الأدمن',
          questionCount: 0
        };
        return {
          ...c,
          departments: [...c.departments, newDept]
        };
      }
      return c;
    });

    if (onUpdateCouncils) {
      onUpdateCouncils(updatedCouncils);
    }
    setShowDeptModal(false);
    setDeptTitleAr('');
    setDeptTitleEn('');
    setDeptDescription('');
    alert('تمت إضافة القسم الجديد بنجاح وإتاحته في الشجرة العلمية للمجالس!');
  };

  // Delete sub-department
  const handleDeleteDepartment = (councilId: CouncilId, deptId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم من المجلس؟')) return;

    const updatedCouncils = councilsState.map(c => {
      if (c.id === councilId) {
        return {
          ...c,
          departments: c.departments.filter(d => d.id !== deptId)
        };
      }
      return c;
    });

    if (onUpdateCouncils) {
      onUpdateCouncils(updatedCouncils);
    }
  };

  // Save UI Settings
  const handleSaveUiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSettings) {
      onUpdateSettings(uiForm);
    }
    alert('تم حفظ الإعدادات بنجاح!');
  };

  const handleAddSeoPage = () => {
    setUiForm({
      ...uiForm,
      seoPages: [...(uiForm.seoPages || []), { path: '', title: '', description: '', image: '' }]
    });
  };

  const handleUpdateSeoPage = (index: number, field: string, value: string) => {
    const newSeoPages = [...(uiForm.seoPages || [])];
    newSeoPages[index] = { ...newSeoPages[index], [field]: value };
    setUiForm({ ...uiForm, seoPages: newSeoPages });
  };

  const handleRemoveSeoPage = (index: number) => {
    const newSeoPages = [...(uiForm.seoPages || [])];
    newSeoPages.splice(index, 1);
    setUiForm({ ...uiForm, seoPages: newSeoPages });
  };

  // Delete question with instant local state removal
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال نهائياً من بنك الأسئلة؟')) return;
    setQuestions(prev => prev.filter(q => q.id !== id));
    try {
      await authFetch(`/api/questions/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Update subscription status with instant local update
  const handleUpdateSubStatus = async (id: string, newStatus: 'approved' | 'rejected', rejectionReason?: string) => {
    setPendingSubs(prev => prev.map(s => s.id === id ? { ...s, status: newStatus, rejectionReason } : s));
    try {
      await authFetch(`/api/subscriptions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, rejectionReason })
      });
    } catch (err) {
      console.error('Sub status update error:', err);
    }
  };

  // Generate Promo Codes
  const handleGenerateCodes = async () => {
    try {
      const res = await authFetch('/api/promo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: genCount, planId: genPlanId })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedCodes(data.codes);
      }
    } catch (err) {
      console.error('Generate promo error:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filter questions by council/dept
  const filteredQuestions = questions.filter(q => {
    if (selectedCouncilFilter !== 'all' && q.councilId && q.councilId !== selectedCouncilFilter) return false;
    if (selectedDeptFilter !== 'all' && q.specialtyId !== selectedDeptFilter && q.category !== selectedDeptFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 dir-rtl text-slate-800 font-sans" dir="rtl">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>لوحة التحكم المطلقة للأدمن الرئيسي (melsmani87@gmail.com)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">إدارة منصة MedExam.net</h1>
          <p className="text-xs text-slate-500 mt-1">إضافة/إزالة أقسام المجالس الطبية، ضخ الأسئلة وتخصيص الواجهة والتحكم بطلبات وإشعارات التحويل</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadAdminData}
            disabled={isRefreshing}
            className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-200 transition-colors"
            title="تحديث بينات الأسئلة والطلبات يدوياً"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'جاري التحديث...' : 'تحديث الآن'}</span>
          </button>

          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-200 transition-colors"
            >
              <span>← الرئيسية</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingQuestion(null);
              setQText('');
              setQExplanation('');
              if (selectedDeptFilter !== 'all') {
                setQSpecialtyId(selectedDeptFilter as SpecialtyId);
              }
              setShowQuestionModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سؤال منفرد</span>
          </button>

          <button
            onClick={() => setActiveTab('bulk_import')}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>استيراد وورد / إكسيل</span>
          </button>

          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `medexam_questions_backup_${new Date().toISOString().slice(0,10)}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors"
            title="تحميل نسخة احتياطية كاملة من بنك الأسئلة بصيغة JSON"
          >
            <Download className="w-4 h-4" />
            <span>تصدير نسخة احتياطية</span>
          </button>
        </div>
      </div>

      {/* Simplified Main Tabs Navigation */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-2 mb-8 text-xs font-bold overflow-x-auto">

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'dashboard' ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart className="w-4 h-4" />
          <span>اللوحة (P2.A)</span>
        </button>
        {isAdminOwner && (
          <button
            onClick={() => setActiveTab('operators')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'operators' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>المدراء (P2.0)</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('health')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'health' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>الصحة (P2.D)</span>
        </button>
        <button
          onClick={() => setActiveTab('integrity')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'integrity' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>البيانات (P2.E)</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'audit' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>السجل (P2.F)</span>
        </button>
        <button
          onClick={() => setActiveTab('blog')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'blog' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>المدونة (P2.C)</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 relative ${
            activeTab === 'notifications' ? 'bg-rose-600 text-white shadow-md font-black' : 'text-slate-700 hover:text-slate-900 bg-white/60'
          }`}
        >
          <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-white animate-bounce' : 'text-rose-500'}`} />
          <span>مركز الإشعارات والطلبات</span>
          {pendingSubs.filter(s => s.status === 'pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white border border-white font-black animate-pulse">
              {pendingSubs.filter(s => s.status === 'pending').length} جديد
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'questions' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>بنك الأسئلة والتحكم ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bulk_import')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'bulk_import' ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4 text-cyan-600" />
          <span>استيراد دُفعات (Bulk)</span>
        </button>

        <button
          onClick={() => setActiveTab('councils')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'councils' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-600" />
          <span>المجالس والتخصصات (3)</span>
        </button>

        <button
          onClick={() => setActiveTab('proctoring')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'proctoring' ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-4 h-4 text-indigo-600" />
          <span>تقارير المراقبة والنزاهة ({proctoringReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ui_settings')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'ui_settings' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4 text-teal-600" />
          <span>تخصيص الواجهة والإعلانات</span>
        </button>
         <button
           onClick={() => setActiveTab('releases')}
           className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
             activeTab === 'releases' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
           }`}
         >
           <Smartphone className="w-4 h-4 text-emerald-600" />
           <span>Android Releases</span>
         </button>

        <button
          onClick={() => setActiveTab('seo_settings')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'seo_settings' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-600" />
          <span>إعدادات SEO</span>
        </button>
      </div>

      {/* ==========================================
          TAB 0: LIVE NOTIFICATIONS & REQUESTS CENTER
         ========================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          
          {/* Live System Status & SMTP Diagnostic Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>المراقبة والتحديث المباشر نشط (Live Auto Polling Every 4s)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-white">
                  <Bell className="w-6 h-6 text-rose-400 animate-bounce" />
                  مركز الإشعارات والطلبات الواردة للامتحانات
                </h2>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  هذا القسم مخصص لاستقبال جميع طلبات الاشتراك وإشعارات الدفع المحولة عبر تطبيقات (بنكك، فوري، بنك فيصل) لحظة بلحظة. يتم تحديث القائمة تلقائياً وإشعارات البريد تُرسل مباشرة إلى: <strong className="text-amber-300 font-mono">d@medexam.net</strong> و <strong className="text-amber-300 font-mono">melsmani87@gmail.com</strong>.
                </p>
              </div>

              {/* Action Buttons & Counters */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-xl text-center min-w-[120px]">
                  <span className="text-2xl font-black text-rose-400 block">{pendingSubs.filter(s => s.status === 'pending').length}</span>
                  <span className="text-[10px] text-slate-400 font-bold">طلبات بانتظار التأكيد</span>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-xl text-center min-w-[120px]">
                  <span className="text-2xl font-black text-emerald-400 block">{pendingSubs.filter(s => s.status === 'approved').length}</span>
                  <span className="text-[10px] text-slate-400 font-bold">طلبات مؤكدة ومفعلة</span>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={loadAdminData}
                    disabled={isRefreshing}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'جاري التحديث...' : 'تحديث الطلبات الآن'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Email Dispatch Diagnostic Tool Box */}
            <div className="mt-6 pt-5 border-t border-slate-700/80 bg-slate-950/40 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs">
                <Mail className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-200 block">اختبار تسليم بريد الإشعارات (Zoho SMTP Test):</span>
                  <span className="text-slate-400 text-[11px]">يمكنك إرسال إيميل تجريبي للتأكد من وصول التنبيهات لصندوق البريد الخاص بك.</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="melsmani87@gmail.com"
                  className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingTestEmail ? 'جاري الإرسال...' : 'اختبار الإيميل'}</span>
                </button>
              </div>
            </div>

            {testEmailResult && (
              <div className="mt-3 p-3 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-amber-200 font-mono">
                {testEmailResult}
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">تصفية طلبات الاشتراك والإشعارات:</span>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setSubFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${subFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  الكل ({pendingSubs.length})
                </button>
                <button
                  onClick={() => setSubFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${subFilter === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  بانتظار التدقيق ({pendingSubs.filter(s => s.status === 'pending').length})
                </button>
                <button
                  onClick={() => setSubFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${subFilter === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  المفعلة ({pendingSubs.filter(s => s.status === 'approved').length})
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              آخر تحديث تلقائي: <span className="font-mono font-bold text-slate-700">{new Date().toLocaleTimeString('ar-SD')}</span>
            </div>
          </div>

          {/* Subscriptions / Notifications Cards Grid */}
          {pendingSubs.filter(s => subFilter === 'all' || s.status === subFilter).length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
              <Bell className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-base text-slate-800">لا يوجد أي طلبات أو إشعارات جديدة حالياً</h4>
              <p className="text-xs max-w-md mx-auto">عندما يقوم الطلاب بتقديم طلب اشتراك أو إرفاق إشعار تحويل (بنكك / فوري)، ستظهر الطلبات الحقيقية هنا فوراً مع إمكانية القبول والتفعيل الفوري.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSubs
                .filter(s => subFilter === 'all' || s.status === subFilter)
                .map((sub) => (
                  <div
                    key={sub.id}
                    className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                      sub.status === 'pending'
                        ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20'
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Alert Header Badge */}
                      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${sub.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                            <Bell className="w-3.5 h-3.5 text-amber-600" />
                            <span>إشعار طلب رقم #{sub.id.slice(0, 8)}</span>
                          </span>
                        </div>

                        <span className={`text-[11px] px-3 py-1 rounded-full font-bold flex items-center gap-1 ${
                          sub.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : sub.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {sub.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          <span>{sub.status === 'approved' ? 'تم القبول والتفعيل' : sub.status === 'rejected' ? 'مرفوض' : 'قيد التدقيق والانتظار'}</span>
                        </span>
                      </div>

                      {/* Doctor Details */}
                      <div className="space-y-2 text-xs text-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">اسم الطبيب:</span>
                          <strong className="text-slate-900 font-bold">{sub.userName || 'طبيب مشترِك'}</strong>
                        </div>

                        <div className="flex items-center justify-between font-mono">
                          <span className="text-slate-500 font-sans">البريد الإلكتروني:</span>
                          <span className="text-emerald-700 font-bold">{sub.userEmail}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">رقم الهاتف:</span>
                          <span className="font-mono text-slate-800">{sub.userPhone || 'غير مدخل'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">طريقة الدفع المختارة:</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {sub.paymentMethod === 'bankak' ? 'بنكك (بنك الخرطوم)' : sub.paymentMethod === 'fawry' ? 'فوري' : sub.paymentMethod}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">تاريخ وساعة الطلب:</span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {new Date(sub.createdAt).toLocaleString('ar-SD')}
                          </span>
                        </div>
                      </div>

                      {/* Attached Receipt Image */}
                      {sub.receiptUrl && (
                        <div className="mt-3.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>صورة إشعار التحويل المرفقة:</span>
                            </span>
                            <button
                              onClick={() => setSelectedReceiptImage(sub.receiptUrl || null)}
                              className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                            >
                              تكبير الإشعار
                            </button>
                          </div>
                          {sub.receiptUrl.startsWith('data:image') || sub.receiptUrl.startsWith('http') ? (
                            <img
                              src={sub.receiptUrl}
                              alt="Receipt"
                              onClick={() => setSelectedReceiptImage(sub.receiptUrl || null)}
                              className="w-full h-36 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <div className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 break-all">
                              رقم المرجعية/التحويل: {sub.receiptUrl}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <a
                        href={`https://wa.me/${(sub.userPhone || '').replace(/\+/g, '')}?text=${encodeURIComponent(`مرحباً د. ${sub.userName}، يسعدنا تواصلك مع منصة MedExam.net بشأن طلب اشتراكك.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>مراسلة واتساب</span>
                      </a>

                      <div className="flex items-center gap-2">
                        {sub.status !== 'rejected' && (
                          <button
                            onClick={() => {
                              setRejectionModalSub(sub);
                              setCustomRejectionReason('صورة إشعار التحويل غير جيدة أو المبلغ المحول غير كامل.');
                            }}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            رفض الطلب
                          </button>
                        )}
                        {sub.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateSubStatus(sub.id, 'approved')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>قبول وتفعيل الحساب</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 1: QUESTION BANK CRUD
         ========================================== */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">تصفية حسب المجلس:</span>
              <select
                value={selectedCouncilFilter}
                onChange={(e) => setSelectedCouncilFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
              >
                <option value="all">جميع المجالس الطبية الثلاثة</option>
                <option value="professions">مجلس المهن الطبية والصحية</option>
                <option value="medical">المجلس الطبي السوداني</option>
                <option value="specialization">مجلس التخصصات الطبية (SMSB)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">تصفية حسب التخصص:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
              >
                <option value="all">جميع التخصصات (عرض معاً)</option>
                {specialties.map(s => (
                  <option key={s.id} value={s.id}>{s.titleAr}</option>
                ))}
              </select>
            </div>

            {selectedDeptFilter !== 'all' && (
              <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>بنك أسئلة مخصص: {specialties.find(s => s.id === selectedDeptFilter)?.titleAr}</span>
              </div>
            )}

            <span className="mr-auto text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
              عدد الأسئلة المستعرضة: <strong className="text-emerald-700">{filteredQuestions.length}</strong> سؤالاً
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 overflow-x-auto shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3">المجلس / التخصص</th>
                  <th className="p-3">القسم العلمي</th>
                  <th className="p-3">نص السؤال (English / LTR)</th>
                  <th className="p-3">التوضيح والعلة الطبية</th>
                  <th className="p-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuestions.map((q) => {
                  const spec = specialties.find(s => s.id === q.specialtyId);
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-emerald-700">{spec?.titleAr || q.specialtyId}</td>
                      <td className="p-3 text-slate-600">{q.category}</td>
                      <td className="p-3 text-slate-800 max-w-sm truncate font-medium text-left" dir="ltr">
                        {q.questionAr}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate text-left font-mono" dir="ltr">
                        {q.explanationAr}
                      </td>
                      <td className="p-3 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingQuestion(q);
                            setQSpecialtyId(q.specialtyId);
                            setQCouncilId(q.councilId || 'medical');
                            setQCategory(q.category);
                            setQText(q.questionAr);
                            setQStem(q.stem || '');
                            setQOptions(q.options);
                            setQCorrectIndex(q.correctIndex);
                            setQExplanation(q.explanationAr);
                            setQDifficulty(q.difficulty);
                            setQReference(q.reference || '');
                            setQImageUrl(q.imageUrl || '');
                            setShowQuestionModal(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-emerald-700 rounded-lg border border-slate-200"
                          title="تعديل السؤال"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200"
                          title="حذف السؤال"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: BULK IMPORT (WORD / EXCEL PARSER)
         ========================================== */}
      {activeTab === 'bulk_import' && (
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-6 h-6 text-emerald-600" />
              تغذية بنك الأسئلة تلقائياً من ملفات الوورد والإكسيل (Bulk Importer)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              الادمن يقوم برفع ملفات الوورد (.docx) أو الإكسيل (.xlsx) مباشرة، أو لصق الأسئلة يدوياً. يقوم النظام باستخراج الأسئلة وتنسيق الخيارات وحفظها مباشرة.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>سيتم حفظ جميع الأسئلة المستوردة حصرياً ضمن تخصص: <strong className="text-emerald-800 text-sm underline">{specialties.find(s => s.id === bulkTargetSpecialty)?.titleAr}</strong></span>
            </div>
            <span className="text-[11px] bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
              عزل تام بين الأقسام
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">حدد التخصص المستهدف:</label>
              <select
                value={bulkTargetSpecialty}
                onChange={(e) => setBulkTargetSpecialty(e.target.value as SpecialtyId)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
              >
                {specialties.map(s => (
                  <option key={s.id} value={s.id}>{s.titleAr} ({s.titleEn})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">اسم القسم الفرعي (Category):</label>
              <input
                type="text"
                placeholder="Cardiology, General Surgery, Pediatric Neurology..."
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
              />
            </div>
          </div>

          {/* File Upload Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Word (.docx) File Upload Card */}
            <div className="p-5 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl transition-all text-center space-y-3 relative group">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">رفع مستند وورد (.docx)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">استخراج تلقائي بـ Mammoth مع دعم الجداول والفقرات</p>
              </div>
              <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors">
                <FileUp className="w-4 h-4" />
                <span>اختر ملف Word</span>
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleWordFileUpload}
                  disabled={isParsingFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Excel (.xlsx / .csv) File Upload Card */}
            <div className="p-5 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl transition-all text-center space-y-3 relative group">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">رفع جدول إكسيل (.xlsx, .csv)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">تفليك كامل بـ XLSX بالأعمدة: Question, Option A..D, Answer</p>
              </div>
              <label className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors">
                <Upload className="w-4 h-4" />
                <span>اختر ملف Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelFileUpload}
                  disabled={isParsingFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              أو انسخ وألصق نص الأسئلة المباشر هنا (English Text with LTR):
            </label>
            <textarea
              rows={8}
              placeholder={`Question: A 55-year-old male presents with acute severe retrosternal chest pain...
A: Unstable Angina - Oral Nitroglycerin only
B: Anterior Wall STEMI - Primary Percutaneous Coronary Intervention
C: Acute Pericarditis
D: Aortic Dissection
Answer: B
Explanation: ST-elevation in V1-V4 indicates anterior STEMI. Reperfusion via PPCI within 90 mins is key.
Reference: Oxford Handbook of Clinical Medicine`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl focus:outline-none leading-relaxed text-left"
              dir="ltr"
            />
          </div>

          {/* Live Upload Progress Bar Component for Batching */}
          {(uploadProgress.isUploading || uploadProgress.percentage > 0) && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-white space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <RefreshCw className={`w-4 h-4 ${uploadProgress.isUploading ? 'animate-spin text-emerald-400' : 'text-emerald-500'}`} />
                  <span>{uploadProgress.statusText}</span>
                </div>
                <span className="font-mono text-emerald-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg">
                  {uploadProgress.percentage}%
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-full rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                <div>الدفعة: <span className="text-white font-bold">{uploadProgress.currentBatch}</span> / {uploadProgress.totalBatches}</div>
                <div>الأسئلة المعالجة: <span className="text-emerald-400 font-bold">{uploadProgress.processedCount}</span> / {uploadProgress.totalQuestions}</div>
                <div>تقسيم تلقائي: <span className="text-indigo-300">15 سؤال/دفعة (Netlify Batching)</span></div>
              </div>
            </div>
          )}

          {importStatus && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-emerald-600 shrink-0 ${isParsingFile || uploadProgress.isUploading ? 'animate-spin' : ''}`} />
              <span>{importStatus}</span>
            </div>
          )}

          {importPreview && (
            <div className="mt-8 p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                  <FileCheck2 className="w-5 h-5" />
                  <span>معاينة نتائج الاستيراد (لم يتم الحفظ بعد)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-400">إجمالي الأسئلة</div>
                  <div className="text-xl font-bold text-white mt-1">{importPreview.totalQuestions}</div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-emerald-900/50">
                  <div className="text-[10px] text-emerald-400">صالح للحفظ</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{importPreview.validQuestions}</div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-amber-900/50">
                  <div className="text-[10px] text-amber-400">مكرر (تم تجاهله)</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">{importPreview.duplicateQuestions}</div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-rose-900/50">
                  <div className="text-[10px] text-rose-400">به أخطاء (مرفوض)</div>
                  <div className="text-xl font-bold text-rose-400 mt-1">{importPreview.invalidQuestions}</div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-blue-900/50">
                  <div className="text-[10px] text-blue-400">عدد الصور</div>
                  <div className="text-xl font-bold text-blue-400 mt-1">{importPreview.imageCount}</div>
                </div>
              </div>

              {importPreview.validationErrors && importPreview.validationErrors.length > 0 && (
                <div className="mt-4 p-4 bg-rose-900/20 border border-rose-800/50 rounded-xl">
                  <h5 className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4" />
                    <span>سجل الأخطاء ({importPreview.validationErrors.length} خطأ)</span>
                  </h5>
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {importPreview.validationErrors.map((err: any, idx: number) => (
                      <li key={idx} className="text-[11px] text-rose-300 font-mono bg-rose-950/30 p-2 rounded border border-rose-900/30 flex items-start gap-2">
                        <span className="shrink-0 mt-0.5 text-rose-500">•</span>
                        <span>
                          <strong className="text-rose-200">[{err.temp_id}]</strong>{' '}
                          <span className="text-rose-400 opacity-80">({err.field})</span>:{' '}
                          {err.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importPreview.previewQuestions && importPreview.previewQuestions.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>معاينة أول {importPreview.previewQuestions.length} أسئلة</span>
                  </h5>
                  <div className="space-y-3">
                    {importPreview.previewQuestions.map((q: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs">
                        <div className="font-bold text-emerald-400 mb-1">[{q.temp_id}] {q.categoryName}</div>
                        <div className="text-slate-200 mb-2">{q.leadInAr || q.leadInEn}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-slate-400">
                          {q.options.map((opt: any, oIdx: number) => (
                            <div key={oIdx} className={q.correctIndex === oIdx ? 'text-emerald-300 font-bold bg-emerald-900/20 px-1 rounded' : 'px-1'}>
                              {String.fromCharCode(65 + oIdx)}: {opt.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={handleCommitImport}
                  disabled={isCommitting || importPreview.validQuestions === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors"
                >
                  {isCommitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>تأكيد وحفظ {importPreview.validQuestions} سؤال بالبنك</span>
                </button>
                <button
                  onClick={handleAbortImport}
                  disabled={isCommitting}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>إلغاء التغييرات</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={handleProcessBulkImport}
              disabled={isParsingFile}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl text-xs shadow-md shadow-emerald-200 transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>معالجة النص الملصق وضخه في البنك</span>
            </button>
          </div>

          {/* Import Processing Summary Report Card */}
          {importProcessingReport && (
            <div className="mt-8 p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                  <FileCheck2 className="w-5 h-5" />
                  <span>تقرير نتائج الاستيراد والمعالجة التلقائية</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{importProcessingReport.timestamp}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-400">الملف / المصدر</div>
                  <div className="text-xs font-bold text-emerald-300 truncate mt-1" title={importProcessingReport.fileName}>
                    {importProcessingReport.fileName}
                  </div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-400">إجمالي الأسئلة المكتشفة</div>
                  <div className="text-base font-black text-white mt-0.5">{importProcessingReport.totalExtracted}</div>
                </div>

                <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-800">
                  <div className="text-[10px] text-emerald-400">تم الحفظ بصلابة (Saved)</div>
                  <div className="text-base font-black text-emerald-300 mt-0.5">{importProcessingReport.savedCount}</div>
                </div>

                <div className="p-3 bg-rose-950/60 rounded-xl border border-rose-900">
                  <div className="text-[10px] text-rose-400">المستبعدة / النواقص</div>
                  <div className="text-base font-black text-rose-300 mt-0.5">{importProcessingReport.rejectedCount}</div>
                </div>
              </div>

              <div className="text-xs text-slate-300 flex items-center justify-between bg-slate-800/50 p-3 rounded-xl font-mono">
                <div>التخصص: <span className="text-emerald-400 font-bold">{importProcessingReport.targetSpecialtyTitle}</span></div>
                <div>القسم الفرعي: <span className="text-emerald-400 font-bold">{importProcessingReport.category}</span></div>
              </div>

              {importProcessingReport.rejectedCount > 0 && (
                <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl space-y-1.5 text-xs text-rose-300">
                  <div className="font-bold flex items-center gap-1.5 text-rose-400">
                    <AlertOctagon className="w-4 h-4" />
                    <span>سجل البنود المستبعدة لعدم اكتمال التنسيق ({importProcessingReport.rejectedCount}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-200/90 font-mono max-h-24 overflow-y-auto">
                    {importProcessingReport.rejectionLogs.map((log, idx) => (
                      <li key={idx}>{log}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('questions')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  عرض الأسئلة في البنك الآن ←
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB: PROCTORING & TRANSPARENCY REPORTS
         ========================================== */}
      {activeTab === 'proctoring' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-indigo-600" />
                  <span>تقارير المراقبة والنزاهة الأكاديمية الذكية (Proctoring Ledger)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  رصد دقيق ومباشر لكافة امتحانات المنصة (التجريبية والرسمية). تمت المعالجة بخصوصية 100% على جهاز الطالب دون تسجيل أو رفع أي وسائط للسيرفر.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadAdminData}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>تحديث السجلات</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>ضمان الخصوصية الشاملة: النظام يحتفظ فقط بالأرقام التجميعية للنزاهة وتنقلات الشاشة لدعم الشفافية.</span>
            </div>

            {/* KPI Summary Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="text-xs text-slate-500">إجمالي الامتحانات المراقبة</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{proctoringReports.length}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">جلسات موثقة بالكامل</div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="text-xs text-emerald-700">متوسط معدل النزاهة</div>
                <div className="text-2xl font-black text-emerald-800 mt-1">
                  {proctoringReports.length > 0 
                    ? Math.round(proctoringReports.reduce((acc, r) => acc + (r.integrity_score || r.integrityScore || 100), 0) / proctoringReports.length)
                    : 100}%
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">معيار الشفافية القومي</div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="text-xs text-amber-700">تنقلات التبويب المرصودة</div>
                <div className="text-2xl font-black text-amber-800 mt-1">
                  {proctoringReports.reduce((acc, r) => acc + (r.tab_switches || r.tabSwitches || 0), 0)}
                </div>
                <div className="text-[10px] text-amber-600 mt-0.5">مخالفات خروج من المتصفح</div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                <div className="text-xs text-purple-700">تنبيهات فقدان الكاميرا</div>
                <div className="text-2xl font-black text-purple-800 mt-1">
                  {proctoringReports.reduce((acc, r) => acc + (r.face_loss_count || r.faceLossCount || 0), 0)}
                </div>
                <div className="text-[10px] text-purple-600 mt-0.5">انقطاع التواجد أمام الشاشة</div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <input
                type="text"
                placeholder="بحث برقم الجلسة أو اسم الطالب..."
                value={proctorSearch}
                onChange={(e) => setProctorSearch(e.target.value)}
                className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
              />

              <select
                value={proctorFilterSpecialty}
                onChange={(e) => setProctorFilterSpecialty(e.target.value)}
                className="w-full sm:w-56 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
              >
                <option value="all">جميع التخصصات المراقبة</option>
                {specialties.map(s => (
                  <option key={s.id} value={s.id}>{s.titleAr}</option>
                ))}
              </select>
            </div>

            {/* Reports Ledger Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رقم الجلسة (Session ID)</th>
                    <th className="p-3">التخصص الطبي</th>
                    <th className="p-3">تنقلات التبويب</th>
                    <th className="p-3">فقدان الكاميرا</th>
                    <th className="p-3">معدل النزاهة</th>
                    <th className="p-3">الحالة والشفافية</th>
                    <th className="p-3">التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proctoringReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                        لا توجد تقارير مراقبة مسجلة حالياً. يتم إنشاء التقرير فور إكمال أي طالب للامتحان.
                      </td>
                    </tr>
                  ) : (
                    proctoringReports
                      .filter(r => proctorFilterSpecialty === 'all' || r.specialty_id === proctorFilterSpecialty || r.specialtyId === proctorFilterSpecialty)
                      .filter(r => !proctorSearch || String(r.session_id || r.sessionId || '').toLowerCase().includes(proctorSearch.toLowerCase()))
                      .map((r, idx) => {
                        const score = r.integrity_score ?? r.integrityScore ?? 100;
                        const tabSwitches = r.tab_switches ?? r.tabSwitches ?? 0;
                        const faceLoss = r.face_loss_count ?? r.faceLossCount ?? 0;
                        const specObj = specialties.find(s => s.id === (r.specialty_id || r.specialtyId));

                        return (
                          <tr key={r.id || idx} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-slate-800 text-[11px] dir-ltr text-left">
                              {r.session_id || r.sessionId || `session_${idx}`}
                            </td>
                            <td className="p-3 font-bold text-indigo-900">
                              {specObj?.titleAr || r.specialty_id || r.specialtyId}
                            </td>
                            <td className="p-3 font-mono font-bold text-amber-700">
                              {tabSwitches > 0 ? `⚠️ ${tabSwitches} مرّة` : '0'}
                            </td>
                            <td className="p-3 font-mono font-bold text-purple-700">
                              {faceLoss > 0 ? `📷 ${faceLoss} مرّة` : '0'}
                            </td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                                score >= 85 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                score >= 60 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                {score}%
                              </span>
                            </td>
                            <td className="p-3 text-[11px] text-slate-600 max-w-xs truncate" title={r.summary_text || r.summaryText}>
                              {r.status || r.summary_text || 'معالجة محلية 100% دون رفع وسائط'}
                            </td>
                            <td className="p-3 font-mono text-[10px] text-slate-400">
                              {r.created_at ? new Date(r.created_at).toLocaleString('ar-SD') : 'حديثاً'}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: councilsState & SUB-DEPARTMENTS MANAGER
         ========================================== */}
      {activeTab === 'councils' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">هيكلية المجالس الطبية الثلاثة وإدارة الأقسام الفرعية</h3>
              <p className="text-xs text-slate-500">للأدمن صلاحية إضافة أقسام جديدة أو إزالتها حسب متطلبات امتحانات المجلس</p>
            </div>

            <button
              onClick={() => setShowDeptModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسم علمي جديد للمجلس</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {councilsState.map((council) => (
              <div key={council.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                      {council.titleEn}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">({council.departments.length} أقسام)</span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 mb-2">{council.titleAr}</h4>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">{council.description}</p>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 mb-1">الأقسام التابعة حالياً:</div>
                    {council.departments.map((dept) => (
                      <div key={dept.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{dept.titleAr}</div>
                          <div className="text-[10px] text-slate-500 dir-ltr font-mono text-left">{dept.titleEn}</div>
                        </div>

                        <button
                          onClick={() => handleDeleteDepartment(council.id, dept.id)}
                          className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                          title="إزالة هذا القسم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 4: LANDING PAGE CMS & UI CUSTOMIZATION
         ========================================== */}
      
      {/* ==========================================
          TAB: ANDROID RELEASES
         ========================================== */}
      {activeTab === 'releases' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              إدارة إصدارات تطبيق الأندرويد
            </h3>
            
            <form onSubmit={handleUploadRelease} className="space-y-4 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الإصدار (Version)</label>
                  <input type="text" value={releaseForm.version} onChange={(e) => setReleaseForm({...releaseForm, version: e.target.value})} placeholder="e.g. 1.0.5" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملف الـ APK</label>
                  <input type="file" accept=".apk" onChange={(e) => setReleaseFile(e.target.files?.[0] || null)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الإصدار (Release Notes)</label>
                <textarea value={releaseForm.release_notes} onChange={(e) => setReleaseForm({...releaseForm, release_notes: e.target.value})} rows={2} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm" placeholder="ما الجديد في هذا الإصدار..."></textarea>
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={releaseForm.is_published} onChange={(e) => setReleaseForm({...releaseForm, is_published: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded" />
                  نشر التحديث فوراً
                </label>
                <button type="submit" disabled={isUploadingRelease} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {isUploadingRelease ? 'جاري الرفع...' : 'رفع الإصدار'}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-800">الإصدارات السابقة</h4>
              {androidReleases.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">لا توجد إصدارات مرفوعة بعد.</div>
              ) : (
                androidReleases.map(release => (
                  <div key={release.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-black text-lg text-slate-900">v{release.version}</span>
                        {release.is_published ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">منشور</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">مسودة</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mb-2">{(release.file_size / (1024 * 1024)).toFixed(2)} MB • {new Date(release.created_at).toLocaleDateString()}</div>
                      {release.release_notes && <div className="text-xs text-slate-600">{release.release_notes}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleTogglePublishRelease(release.id, release.is_published)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors" title={release.is_published ? "إلغاء النشر" : "نشر"}>
                        {release.is_published ? <Eye className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4 opacity-50" />}
                      </button>
                      <button onClick={() => handleDeleteRelease(release.id)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ui_settings' && (

        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-emerald-600" />
              تخصيص الواجهة والإعلانات ورابط التطبيق
            </h3>
            <p className="text-xs text-slate-500 mt-1">تغيير العناوين الرئيسية، شريط الإعلانات المتحرك، تفاصيل الحساب البنكي، ورابط تحميل APK</p>
          </div>

          <form onSubmit={handleSaveUiSettings} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
              <div>
                <label className="block text-slate-700 font-bold mb-1">أسئلة الامتحان التجريبي</label>
                <input type="number" min="1" value={uiForm.demoQuestionLimit || 5} onChange={e => setUiForm({ ...uiForm, demoQuestionLimit: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold" />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">عدد أسئلة الامتحان الرسمي</label>
                <input type="number" min="1" value={uiForm.examQuestionCount || 50} onChange={e => setUiForm({ ...uiForm, examQuestionCount: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold" />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">وقت الامتحان (بالثواني)</label>
                <input type="number" min="60" value={uiForm.examTimerSeconds || 3600} onChange={e => setUiForm({ ...uiForm, examTimerSeconds: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold" />
              </div>
            </div>
<div>
              <label className="block text-slate-700 font-bold mb-1">شارة التنبيه العلوية (Announcement Badge):</label>
              <input
                type="text"
                value={uiForm.announcementBadge}
                onChange={(e) => setUiForm({ ...uiForm, announcementBadge: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">العنوان الرئيسي للواجهة (Hero Title):</label>
              <input
                type="text"
                value={uiForm.heroTitle}
                onChange={(e) => setUiForm({ ...uiForm, heroTitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold text-base"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">الوصف الفرعي للواجهة (Hero Subtitle):</label>
              <textarea
                rows={2}
                value={uiForm.heroSubtitle}
                onChange={(e) => setUiForm({ ...uiForm, heroSubtitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">نص الشريط الإخباري المتحرك (Ticker):</label>
              <textarea
                rows={2}
                value={uiForm.tickerText}
                onChange={(e) => setUiForm({ ...uiForm, tickerText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رابط تحميل تطبيق الأندرويد (APK Download Link):</label>
              <input
                type="text"
                value={uiForm.apkDownloadUrl}
                onChange={(e) => setUiForm({ ...uiForm, apkDownloadUrl: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-left"
                dir="ltr"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="font-bold text-slate-900 text-xs">تغيير حسابات التحويل المالي (بنكك، فوري، بنك فيصل):</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">رقم حساب بنكك (بنك الخرطوم):</label>
                  <input
                    type="text"
                    value={uiForm.bankAccountDetails.bankakAccount}
                    onChange={(e) => setUiForm({
                      ...uiForm,
                      bankAccountDetails: { ...uiForm.bankAccountDetails, bankakAccount: e.target.value }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">اسم صاحب الحساب في بنكك:</label>
                  <input
                    type="text"
                    value={uiForm.bankAccountDetails.bankakName}
                    onChange={(e) => setUiForm({
                      ...uiForm,
                      bankAccountDetails: { ...uiForm.bankAccountDetails, bankakName: e.target.value }
                    })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs shadow-md shadow-emerald-200 transition-colors"
            >
              حفظ وتطبيق جميع التعديلات على الواجهة فوراً
            </button>
          </form>
        </div>
      )}

      {/* ==========================================
          SEO SETTINGS MANAGER
         ========================================== */}
      {activeTab === 'seo_settings' && (
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-600" />
              إعدادات محركات البحث SEO
            </h3>
            <p className="text-xs text-slate-500 mt-1">إضافة عناوين ووصف مخصص لكل رابط في الموقع لتحسين الظهور في محركات البحث ومواقع التواصل.</p>
          </div>

          <div className="space-y-4">
            {(uiForm.seoPages || []).map((page, index) => (
              <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                <button
                  type="button"
                  onClick={() => handleRemoveSeoPage(index)}
                  className="absolute top-4 left-4 p-2 bg-rose-100 text-rose-600 rounded-full hover:bg-rose-200"
                  title="حذف الصفحة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-12">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-xs">مسار الرابط (Path):</label>
                    <input
                      type="text"
                      placeholder="مثال: /specialty/medicine"
                      value={page.path}
                      onChange={(e) => handleUpdateSeoPage(index, 'path', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold dir-ltr text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-xs">صورة المشاركة (OG Image):</label>
                    <input
                      type="text"
                      placeholder="رابط الصورة"
                      value={page.image || ''}
                      onChange={(e) => handleUpdateSeoPage(index, 'image', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 dir-ltr text-left"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-slate-700 font-bold mb-1 text-xs">عنوان الصفحة (Title):</label>
                  <input
                    type="text"
                    value={page.title}
                    onChange={(e) => handleUpdateSeoPage(index, 'title', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">وصف الصفحة (Description):</label>
                  <textarea
                    rows={2}
                    value={page.description}
                    onChange={(e) => handleUpdateSeoPage(index, 'description', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleAddSeoPage}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة صفحة SEO جديدة
            </button>

            <button
              type="button"
              onClick={handleSaveUiSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl text-xs shadow-md shadow-blue-200 transition-colors"
            >
              حفظ إعدادات SEO
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 5: SUBSCRIPTIONS & RECEIPTS MANAGER
         ========================================== */}
      {activeTab === 'subs' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 mb-2">مراجعة والتحقق من طلبات الدفع وإشعارات بنكك وفوري</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingSubs.map((sub) => (
              <div
                key={sub.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{sub.userName}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      sub.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {sub.status === 'approved' ? 'مؤكد ومفعل' : 'قيد التدقيق'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 font-mono">
                    <div>البريد: {sub.userEmail}</div>
                    <div>الهاتف: {sub.userPhone || 'غير مدخل'}</div>
                    <div>طريقة الدفع: <strong className="text-emerald-700">{sub.paymentMethod}</strong></div>
                    <div>الخطة المطلوبة: {sub.planId}</div>
                  </div>

                  {sub.receiptUrl && (
                    <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 mb-1 font-bold">صورة إشعار التحويل المرفقة:</div>
                      <img src={sub.receiptUrl} alt="Receipt" className="w-full h-32 object-cover rounded-lg" />
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleUpdateSubStatus(sub.id, 'rejected')}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold"
                  >
                    رفض الطلب
                  </button>
                  <button
                    onClick={() => handleUpdateSubStatus(sub.id, 'approved')}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>تأكيد وتفعيل الحساب</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 6: PROMO CODE GENERATOR
         ========================================== */}
      {activeTab === 'promo' && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              توليد أكواد التفعيل الجاهزة
            </h3>
            <p className="text-xs text-slate-500 mt-1">أنشئ أكواد تفعيل 100% لإهدائها أو توزيعها على الطلاب المميزين</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1">عدد الأكواد المطلوب إنشاءها:</label>
              <input
                type="number"
                min="1"
                max="20"
                value={genCount}
                onChange={(e) => setGenCount(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">نوع خطة الاشتراك المرتبطة بالفيشة:</label>
              <select
                value={genPlanId}
                onChange={(e) => setGenPlanId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900"
              >
                <option value="monthly">شهر كامل (Monthly)</option>
                <option value="quarterly">3 أشهر فصلية (Quarterly)</option>
                <option value="annual">سنة كاملة (Annual)</option>
              </select>
            </div>

            <button
              onClick={handleGenerateCodes}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl text-xs transition-colors shadow-xs"
            >
              إنشاء الأكواد الآن
            </button>
          </div>

          {generatedCodes.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <div className="text-xs text-slate-500 font-bold mb-2">الأكواد المنشأة حديثاً:</div>
              {generatedCodes.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-mono">
                  <span className="text-amber-800 font-bold tracking-widest">{c.code}</span>
                  <button
                    onClick={() => copyToClipboard(c.code)}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-sans font-bold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedCode === c.code ? 'تم النسخ!' : 'نسخ'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB: SPECIALTIES ACTIVATION MANAGEMENT
         ========================================== */}
      {activeTab === 'specialties' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span>إدارة وحالة تفعيل التخصصات والأقسام الطبية</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                يمكنك تخصيص الأقسام غير المفعلة حالياً. الأقسام المعطلة ستظهر للجميع بعبارة: <span className="font-bold text-amber-600">"غير مفعل حالياً - سوف نقوم بتفعيله في الأيام القادمة"</span> لمنع استقبال امتحانات عليها قبل إكمال رفع بنك الأسئلة الخاص بها.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialties.map(spec => {
              const isActive = specialtiesStatusMap[spec.id] !== false;
              return (
                <div key={spec.id} className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isActive ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{spec.titleAr}</div>
                      <div className="text-[11px] text-slate-500 font-mono" dir="ltr">{spec.titleEn}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {isActive ? '✓ مفعل للجميع' : '⏳ غير مفعل (قريباً)'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2">{spec.description}</p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">حالة القسم للطلاب:</span>
                    <button
                      onClick={() => handleToggleSpecialtyStatus(spec.id, isActive)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                        isActive 
                          ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>تعطيل (قريباً)</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>تفعيل القسم الآن</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">إضافة قسم علمي جديد للمجلس</h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDepartment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">المجلس التابع له:</label>
                <select
                  value={deptCouncilId}
                  onChange={(e) => setDeptCouncilId(e.target.value as CouncilId)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                >
                  <option value="professions">مجلس المهن الطبية والصحية</option>
                  <option value="medical">المجلس الطبي السوداني</option>
                  <option value="specialization">مجلس التخصصات الطبية (SMSB)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">اسم القسم باللغة العربية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: التخدير والعناية المكثفة"
                  value={deptTitleAr}
                  onChange={(e) => setDeptTitleAr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">اسم القسم باللغة الإنجليزية (Title EN):</label>
                <input
                  type="text"
                  placeholder="Anesthesia & Intensive Care"
                  value={deptTitleEn}
                  onChange={(e) => setDeptTitleEn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">وصف القسم:</label>
                <textarea
                  rows={2}
                  placeholder="وصف مختصر للقسم والأسئلة..."
                  value={deptDescription}
                  onChange={(e) => setDeptDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              
              </div>
              
              <div>
                <label className="block text-slate-600 mb-1 font-bold">صورة مرفقة (اختياري)</label>
                {editingQuestion ? (
                  <div className="flex items-center gap-4">
                    {qImageUrl ? (
                      <div className="relative">
                        <img src={qImageUrl} alt="Question Attachment" className="h-24 rounded border border-slate-200" />
                        <button type="button" onClick={() => setQImageUrl('')} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 text-xs">X</button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">لا توجد صورة</div>
                    )}
                    <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer shadow-xs transition-colors">
                      {isUploadingImage ? <span>جاري الرفع...</span> : <span>رفع / استبدال الصورة</span>}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQuestionImageUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">يجب حفظ السؤال أولاً قبل التمكن من رفع صورة له.</div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">

                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl shadow-xs"
                >
                  إضافة القسم بنجاح
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Create/Edit Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">
                {editingQuestion ? 'تعديل السؤال الطبي' : 'إضافة سؤال جديد لبنك الأسئلة (English format)'}
              </h3>
              <button onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>سيتم ربط هذا السؤال بقسم: <span className="underline text-emerald-800">{specialties.find(s => s.id === qSpecialtyId)?.titleAr}</span> (ولن يظهر في التخصصات الأخرى)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">التخصص الطبي *</label>
                  <select
                    value={qSpecialtyId}
                    onChange={(e) => setQSpecialtyId(e.target.value as SpecialtyId)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.titleAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">القسم الفرعي (Category) *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Cardiology, General Surgery"
                    value={qCategory}
                    onChange={(e) => setQCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold flex items-center justify-between">
                  <span>وصف الحالة السريرية المعقدة (Clinical Case Vignette / Scenario):</span>
                  <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">خاص بمجلس التخصصات SMSB</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="A 58-year-old male with a 20-year history of diabetes mellitus presents with acute chest tightness, diaphoresis, and blood pressure of 85/50 mmHg..."
                  value={qStem}
                  onChange={(e) => setQStem(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-teal-500 font-serif text-left leading-relaxed text-xs"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">نص السؤال المطلوب (English Question Prompt) *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Which of the following is the most immediate appropriate initial management strategy?"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500 font-sans text-left"
                  dir="ltr"
                />
              </div>

              {/* Options A-D */}
              <div className="space-y-2">
                <label className="block text-slate-600 font-bold">الخيارات الأربعة (A, B, C, D) مع تحديد الصحيح:</label>
                {qOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={qCorrectIndex === idx}
                      onChange={() => setQCorrectIndex(idx)}
                      className="accent-emerald-600"
                    />
                    <span className="font-bold text-slate-500">{String.fromCharCode(65 + idx)}:</span>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...qOptions];
                        updated[idx] = e.target.value;
                        setQOptions(updated);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-left font-sans"
                      dir="ltr"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">الشرح والتفسير الطبي (Medical Rationale) *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed English medical rationale explaining why the option is correct..."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500 text-left font-sans"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">مستوى الصعوبة</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as 'سهل' | 'متوسط' | 'متقدم')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  >
                    <option value="سهل">سهل</option>
                    <option value="متوسط">متوسط</option>
                    <option value="متقدم">متقدم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">المرجع الطبي المعتمد</label>
                  <input
                    type="text"
                    placeholder="Oxford Handbook, Bailey & Love..."
                    value={qReference}
                    onChange={(e) => setQReference(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl shadow-xs"
                >
                  حفظ السؤال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* P2.A Dashboard */}
      {activeTab === 'dashboard' && (
         <div className="space-y-6">
           <h2 className="text-xl font-bold">اللوحة الرئيسية (P2.A)</h2>
           {dashboardMetrics ? (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-slate-500 text-xs">إجمالي الأسئلة</p>
                 <p className="text-2xl font-bold">{dashboardMetrics.totalQuestions}</p>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-slate-500 text-xs">أسئلة معتمدة</p>
                 <p className="text-2xl font-bold">{dashboardMetrics.activeQuestions}</p>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-slate-500 text-xs">المستخدمين / المشتركين</p>
                 <p className="text-2xl font-bold">{dashboardMetrics.activeSubscribers} <span className="text-sm text-slate-400">/ {dashboardMetrics.totalUsers}</span></p>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-slate-500 text-xs">الامتحانات المكتملة</p>
                 <p className="text-2xl font-bold">{dashboardMetrics.completedExams}</p>
               </div>
             </div>
           ) : (
             <p className="text-slate-500">جاري تحميل الإحصائيات...</p>
           )}
         </div>
      )}

      {/* P2.D Health */}
      {activeTab === 'health' && (
         <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-600"/> فحص صحة النظام (P2.D)</h2>
           <button onClick={async () => {
             const res = await fetch(resolveApiPath('/api/admin/health'), { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
             if (res.ok) {
               const d = await res.json();
               setSystemHealth(d.health);
             }
           }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">إجراء فحص الآن</button>
           
           {systemHealth && (
             <div className="grid gap-4 mt-4">
               <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                 <span className="font-bold text-slate-700">اتصال قاعدة البيانات PostgreSQL</span>
                 <span className={`font-black text-sm px-3 py-1 rounded-md ${systemHealth.database === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{systemHealth.database}</span>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                 <span className="font-bold text-slate-700">مفتاح المصادقة (JWT)</span>
                 <span className={`font-black text-sm px-3 py-1 rounded-md ${systemHealth.auth === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{systemHealth.auth}</span>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                 <span className="font-bold text-slate-700">جاهزية بنك الأسئلة والمستورد</span>
                 <span className={`font-black text-sm px-3 py-1 rounded-md ${systemHealth.importer === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{systemHealth.importer}</span>
               </div>
             </div>
           )}
         </div>
      )}

      {/* P2.E Integrity */}
      {activeTab === 'integrity' && (
         <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2"><Database className="w-5 h-5 text-indigo-600"/> سلامة البيانات (P2.E)</h2>
           <button onClick={async () => {
             const res = await fetch(resolveApiPath('/api/admin/integrity'), { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
             if (res.ok) {
               const d = await res.json();
               setDataIntegrity(d.diagnostics);
             }
           }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">فحص سلامة البيانات الآن</button>
           
           {dataIntegrity && (
             <div className="grid gap-4 mt-4">
               <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                 <span className="font-bold text-slate-700">تخصصات غير موجودة (يتامى)</span>
                 <span className={`font-black text-sm px-3 py-1 rounded-md ${dataIntegrity.orphanSpecialties > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{dataIntegrity.orphanSpecialties} أسئلة متعارضة</span>
               </div>
               <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                 <span className="font-bold text-slate-700">أقسام غير موجودة (يتامى)</span>
                 <span className={`font-black text-sm px-3 py-1 rounded-md ${dataIntegrity.orphanCategories > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{dataIntegrity.orphanCategories} أسئلة متعارضة</span>
               </div>
             </div>
           )}
         </div>
      )}
      
      {/* P2.F Audit */}
      {activeTab === 'audit' && (
         <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-slate-700"/> سجل النشاط والإجراءات (P2.F)</h2>
           <button onClick={async () => {
             const res = await fetch(resolveApiPath('/api/admin/audit'), { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
             if (res.ok) {
               const d = await res.json();
               setAuditLogs(d.audit);
             }
           }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">تحديث السجل</button>
           
           <div className="space-y-2 mt-4">
             {auditLogs.map((log, i) => (
               <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-sm">
                 <div>
                   <span className={`font-bold mr-2 ${log.type === 'subscription' ? 'text-indigo-600' : 'text-emerald-600'}`}>{log.type === 'subscription' ? 'مراجعة اشتراك' : 'جلسة استيراد'}</span>
                   <span className="text-slate-700">{log.user}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{log.status}</span>
                   <span className="text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                 </div>
               </div>
             ))}
             {auditLogs.length === 0 && <p className="text-slate-500 py-4 text-center">لا توجد سجلات بعد. اضغط "تحديث السجل".</p>}
           </div>
         </div>
      )}
      
      {/* P2.0 Operators */}
      {activeTab === 'operators' && isAdminOwner && (
         <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600"/> إدارة المدراء التشغيليين (P2.0)</h2>
           
           <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
             <h3 className="font-bold text-emerald-900 mb-4">إضافة مدير تشغيلي جديد</h3>
             <div className="flex flex-col sm:flex-row gap-3">
               <input type="email" id="newOpEmail" placeholder="البريد الإلكتروني للمدير..." className="border border-emerald-200 rounded-xl p-3 flex-1 bg-white" />
               <button onClick={async () => {
                 const em = (document.getElementById('newOpEmail') as HTMLInputElement).value;
                 const res = await fetch(resolveApiPath('/api/admin/operators'), {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                   body: JSON.stringify({ action: 'create', email: em })
                 });
                 if (res.ok) {
                   const d = await res.json();
                   setOperators(d.operators);
                   (document.getElementById('newOpEmail') as HTMLInputElement).value = '';
                 } else {
                   alert((await res.json()).error);
                 }
               }} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm">منح الصلاحية</button>
             </div>
           </div>
           
           <div className="space-y-3 mt-6">
             {operators.map((op, i) => (
               <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-sm shadow-xs">
                 <div>
                   <p className="font-black text-slate-800 text-base">{op.email}</p>
                   <p className="text-xs text-slate-500 mt-1">أضيف بواسطة: {op.createdBy} | {new Date(op.createdAt).toLocaleDateString('ar-EG')}</p>
                 </div>
                 <div className="flex flex-wrap items-center gap-2">
                   <span className={`px-3 py-1.5 rounded-lg text-[11px] font-black ${op.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                     {op.status === 'active' ? 'حساب نشط' : 'معطل'}
                   </span>
                   {op.status === 'active' ? (
                     <button onClick={async () => {
                       const res = await fetch(resolveApiPath('/api/admin/operators'), {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                         body: JSON.stringify({ action: 'disable', email: op.email })
                       });
                       if (res.ok) setOperators((await res.json()).operators);
                     }} className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold rounded-lg transition-colors">تعطيل الدخول</button>
                   ) : (
                     <button onClick={async () => {
                       const res = await fetch(resolveApiPath('/api/admin/operators'), {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                         body: JSON.stringify({ action: 'enable', email: op.email })
                       });
                       if (res.ok) setOperators((await res.json()).operators);
                     }} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-lg transition-colors">تفعيل</button>
                   )}
                   <button onClick={async () => {
                     const res = await fetch(resolveApiPath('/api/admin/operators'), {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                       body: JSON.stringify({ action: 'remove', email: op.email })
                     });
                     if (res.ok) setOperators((await res.json()).operators);
                   }} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg transition-colors">حذف نهائي</button>
                 </div>
               </div>
             ))}
             {operators.length === 0 && (
               <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-2xl border-dashed">
                 <p className="text-slate-500 font-bold">لا يوجد مدراء تشغيليين حالياً.</p>
                 <p className="text-slate-400 text-xs mt-1">قم بإضافة بريد إلكتروني لمنح صلاحيات الإدارة.</p>
               </div>
             )}
           </div>
         </div>
      )}

      {/* P2.C Blog */}
      {activeTab === 'blog' && (
         <div className="space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600"/> إدارة المدونة والمحتوى (P2.C)</h2>
           <p className="text-sm text-slate-500 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
             تم دمج واجهة المحتوى مع المستودع الحالي. المقالات معروضة بناءً على <code className="text-xs bg-slate-200 px-1 rounded text-slate-800">app_settings / blogPostsStore</code>.
           </p>
           
           <div className="grid gap-4 md:grid-cols-2">
             {blogPosts.map(post => (
               <div key={post.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                 <div>
                   <h3 className="font-black text-slate-900 text-lg mb-2">{post.title}</h3>
                   <p className="text-sm text-slate-600 line-clamp-3">{post.excerpt}</p>
                 </div>
                 <div className="flex flex-wrap gap-3 mt-4 text-[11px] font-bold text-slate-500 border-t border-slate-100 pt-3">
                   <span className="bg-slate-100 px-2 py-1 rounded-md">تاريخ: {post.date}</span>
                   <span className="bg-slate-100 px-2 py-1 rounded-md">التصنيف: {post.category}</span>
                   <span className="bg-slate-100 px-2 py-1 rounded-md">المشاهدات: {post.viewsCount || 0}</span>
                 </div>
               </div>
             ))}
             {blogPosts.length === 0 && <p className="text-slate-500 py-6 text-center md:col-span-2">لا يوجد مقالات منشورة حالياً.</p>}
           </div>
         </div>
      )}
      
      {/* Receipt Image Zoom Modal */}
      {selectedReceiptImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-4 shadow-2xl relative flex flex-col items-center">
            <button
              onClick={() => setSelectedReceiptImage(null)}
              className="absolute top-4 left-4 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>معاينة إشعار التحويل المرفق بالكامل</span>
            </h3>
            <img
              src={selectedReceiptImage}
              alt="Full Receipt"
              className="max-h-[75vh] w-auto object-contain rounded-xl border border-slate-200 shadow-md"
            />
          </div>
        </div>
      )}

      {/* Subscription Rejection Modal with Custom Reason */}
      {rejectionModalSub && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-black text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>تحديد سبب رفض إشعار التحويل</span>
              </div>
              <button
                onClick={() => setRejectionModalSub(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>طلب المشترك: <strong className="text-slate-900">{rejectionModalSub.userName}</strong> ({rejectionModalSub.userEmail})</p>
              <p className="text-slate-500">سيتم إرسال إشعار بريدي مباشر للطبيب موضحاً فيه سبب الرفض مع رابط لإعادة الرفع.</p>
            </div>

            {/* Quick Reason Presets */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700">اختر من الأسباب الشائعة للرفض:</label>
              <div className="flex flex-col gap-1.5">
                {[
                  'صورة إشعار التحويل غير واضحة أو مقطوعة',
                  'المبلغ المحول غير مطابق لرسوم الباقة المختارة',
                  'الرقم المرجعي مكرر أو غير معتمد بنظام بنكك',
                  'اسم المحول غير متطابق مع بيانات الحساب'
                ].map((reasonOption, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomRejectionReason(reasonOption)}
                    className={`text-right px-3 py-2 rounded-xl text-[11px] font-bold border transition-colors ${
                      customRejectionReason === reasonOption
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    • {reasonOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-slate-700">نص سبب الرفض الموجه للطبيب:</label>
              <textarea
                rows={3}
                value={customRejectionReason}
                onChange={(e) => setCustomRejectionReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-sans focus:outline-none focus:border-rose-500"
                placeholder="اكتب سبب الرفض هنا..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModalSub(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateSubStatus(rejectionModalSub.id, 'rejected', customRejectionReason);
                  setRejectionModalSub(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                تأكيد الرفض وإرسال البريد
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
