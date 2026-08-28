import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  PhoneAuditItem,
  analyzeStudentPhoneStatus,
  filterPhoneAuditList,
  exportPhoneAuditToExcel,
  exportPhoneAuditToPDF,
  openInstantPrintView,
  SEQUENTIAL_GRADES,
} from '../../utils/phoneAuditExport';
import {
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  PhoneOff,
  CheckCircle2,
  Search,
  Filter,
  Users,
  Edit,
  ShieldAlert,
  Smartphone,
  ExternalLink,
  Zap,
  Clock,
  Download,
  Printer,
  Sparkles,
  Check,
  X,
  Layers,
  RefreshCw,
  Wrench,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { StudentData } from '../../types';

interface PhoneAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditStudent?: (student: StudentData) => void;
}

export const PhoneAuditModal: React.FC<PhoneAuditModalProps> = ({
  isOpen,
  onClose,
  onEditStudent,
}) => {
  const { students, updateStudentAccount, updateMultipleStudentAccounts, theme } = useSystem();
  const isDark = theme === 'dark';

  // Filters
  const [selectedGradeTab, setSelectedGradeTab] = useState<string>('all'); // 'all', 'primary_all', 'prep_all', 'sec_all', or specific grade
  const [statusFilter, setStatusFilter] = useState<
    | 'all'
    | 'issues_only'
    | 'missing_zero_only'
    | 'duplicates_only'
    | 'fake_only'
    | 'landline_only'
    | 'missing_only'
    | 'no_whatsapp'
    | 'verified_only'
    | 'untested_only'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);
  const [pdfProgressMessage, setPdfProgressMessage] = useState<string | null>(null);

  // Real Deep Diagnostic Audit State & Live Findings Terminal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerProgress, setScannerProgress] = useState(0);
  const [scannerCurrentStudent, setScannerCurrentStudent] = useState<string>('');
  const [scannerCurrentStage, setScannerCurrentStage] = useState<string>('');
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [scannerLiveLogs, setScannerLiveLogs] = useState<{
    id: string;
    type: 'zero_fix' | 'duplicate' | 'landline' | 'fake' | 'missing' | 'verified' | 'untested';
    badge: string;
    badgeBg: string;
    studentName: string;
    grade: string;
    barcode: string;
    phone: string;
    detail: string;
  }[]>([]);
  const [logFilterMode, setLogFilterMode] = useState<'issues_only' | 'all'>('issues_only');
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const scrollToTable = () => {
    setTimeout(() => {
      if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const [scannerFinishedReport, setScannerFinishedReport] = useState<{
    totalScanned: number;
    readyCount: number;
    missingZeroCount: number;
    duplicatesCount: number;
    fakeDummyCount: number;
    landlineCount: number;
    missingCount: number;
    verifiedCount: number;
    autoFixableItems: PhoneAuditItem[];
    duplicatePairs: { studentA: string; studentB: string; phone: string; gradeA: string; gradeB: string }[];
  } | null>(null);

  const [fixSuccessMessage, setFixSuccessMessage] = useState<string | null>(null);

  // Deep analyze all students passing the complete academy cohort for duplicate checks
  const auditedAllStudents: PhoneAuditItem[] = useMemo(() => {
    return students.map((s) => analyzeStudentPhoneStatus(s, students));
  }, [students]);

  // Stage filters
  const primaryAllItems = useMemo(
    () =>
      auditedAllStudents.filter(
        (a) =>
          a.student.groupGrade === 'الصف الرابع الابتدائي' ||
          a.student.groupGrade === 'الصف الخامس الابتدائي' ||
          a.student.groupGrade === 'الصف السادس الابتدائي'
      ),
    [auditedAllStudents]
  );

  const prepAllItems = useMemo(
    () =>
      auditedAllStudents.filter(
        (a) =>
          a.student.groupGrade === 'الصف الأول الإعدادي' ||
          a.student.groupGrade === 'الصف الثاني الإعدادي' ||
          a.student.groupGrade === 'الصف الثالث الإعدادي'
      ),
    [auditedAllStudents]
  );

  const secAllItems = useMemo(
    () =>
      auditedAllStudents.filter(
        (a) =>
          a.student.groupGrade === 'الصف الأول الثانوي' ||
          a.student.groupGrade === 'الصف الثاني الثانوي' ||
          a.student.groupGrade === 'الصف الثالث الثانوي'
      ),
    [auditedAllStudents]
  );

  // Active filtered list based on tab
  const currentGradeItems = useMemo(() => {
    if (selectedGradeTab === 'all') return auditedAllStudents;
    if (selectedGradeTab === 'primary_all') return primaryAllItems;
    if (selectedGradeTab === 'prep_all') return prepAllItems;
    if (selectedGradeTab === 'sec_all') return secAllItems;
    return auditedAllStudents.filter((a) => a.student.groupGrade === selectedGradeTab);
  }, [selectedGradeTab, auditedAllStudents, primaryAllItems, prepAllItems, secAllItems]);

  // Real Statistics for current selected grade scope
  const missingCount = currentGradeItems.filter((a) => a.issueType === 'missing').length;
  const missingZeroCount = currentGradeItems.filter((a) => a.issueType === 'fixable_missing_zero').length;
  const duplicateCount = currentGradeItems.filter((a) => a.issueType === 'duplicate').length;
  const fakeCount = currentGradeItems.filter((a) => a.issueType === 'fake_dummy').length;
  const landlineCount = currentGradeItems.filter((a) => a.issueType === 'landline').length;
  const noWhatsAppCount = currentGradeItems.filter(
    (a) =>
      a.issueType === 'no_whatsapp' ||
      a.issueType === 'landline' ||
      a.issueType === 'invalid_format' ||
      a.issueType === 'fake_dummy'
  ).length;
  const verifiedCount = currentGradeItems.filter((a) => a.issueType === 'verified_active').length;
  const untestedCount = currentGradeItems.filter(
    (a) => a.issueType === 'untested'
  ).length;
  const totalIssuesCount = missingCount + noWhatsAppCount + duplicateCount + missingZeroCount;

  // Filtered and Sequentially Ordered Display List
  const displayItems = useMemo(() => {
    const gradeOrderMap = new Map<string, number>();
    SEQUENTIAL_GRADES.forEach((sg, idx) => {
      gradeOrderMap.set(sg.grade, idx);
    });

    const filtered = currentGradeItems.filter((item) => {
      // 1. Status Filter
      if (statusFilter === 'missing_only' && item.issueType !== 'missing') return false;
      if (statusFilter === 'missing_zero_only' && item.issueType !== 'fixable_missing_zero') return false;
      if (statusFilter === 'duplicates_only' && item.issueType !== 'duplicate') return false;
      if (statusFilter === 'fake_only' && item.issueType !== 'fake_dummy') return false;
      if (statusFilter === 'landline_only' && item.issueType !== 'landline') return false;
      if (
        statusFilter === 'no_whatsapp' &&
        item.issueType !== 'no_whatsapp' &&
        item.issueType !== 'landline' &&
        item.issueType !== 'invalid_format' &&
        item.issueType !== 'fake_dummy'
      )
        return false;
      if (statusFilter === 'verified_only' && item.issueType !== 'verified_active') return false;
      if (
        statusFilter === 'untested_only' &&
        item.issueType !== 'untested' &&
        item.issueType !== 'fixable_missing_zero'
      )
        return false;
      if (statusFilter === 'issues_only' && item.issueType === 'verified_active') return false;

      // 2. Search filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const s = item.student;
      return (
        s.name.toLowerCase().includes(term) ||
        s.barcode.toLowerCase().includes(term) ||
        (item.phoneRaw && item.phoneRaw.includes(term)) ||
        (item.parentPhoneRaw && item.parentPhoneRaw.includes(term)) ||
        (item.formattedPhone && item.formattedPhone.includes(term)) ||
        s.groupGrade.toLowerCase().includes(term)
      );
    });

    // Sort sequentially by grade order, then student name
    return [...filtered].sort((a, b) => {
      const orderA = gradeOrderMap.get(a.student.groupGrade) ?? 99;
      const orderB = gradeOrderMap.get(b.student.groupGrade) ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.student.name.localeCompare(b.student.name, 'ar');
    });
  }, [currentGradeItems, statusFilter, searchTerm]);

  if (!isOpen) return null;

  // Get grade human title for export
  const getGradeExportTitle = (tabKey: string) => {
    if (tabKey === 'all') return 'كافة الصفوف الدراسية (من 4 ابتدائي حتى 3 ثانوي)';
    if (tabKey === 'primary_all') return 'المرحلة الابتدائية (4 و5 و6 ابتدائي)';
    if (tabKey === 'prep_all') return 'المرحلة الإعدادية (1 و2 و3 إعدادي)';
    if (tabKey === 'sec_all') return 'المرحلة الثانوية (1 و2 و3 ثانوي)';
    return tabKey;
  };

  // Filter helper
  const filterAuditItemsByStatus = (items: PhoneAuditItem[]) => {
    if (statusFilter === 'all') return items;
    return items.filter((item) => {
      if (statusFilter === 'missing_only') return item.issueType === 'missing';
      if (statusFilter === 'missing_zero_only') return item.issueType === 'fixable_missing_zero';
      if (statusFilter === 'duplicates_only') return item.issueType === 'duplicate';
      if (statusFilter === 'fake_only') return item.issueType === 'fake_dummy';
      if (statusFilter === 'landline_only') return item.issueType === 'landline';
      if (statusFilter === 'no_whatsapp')
        return (
          item.issueType === 'no_whatsapp' ||
          item.issueType === 'landline' ||
          item.issueType === 'invalid_format' ||
          item.issueType === 'fake_dummy'
        );
      if (statusFilter === 'verified_only') return item.issueType === 'verified_active';
      if (statusFilter === 'untested_only') return item.issueType === 'untested';
      if (statusFilter === 'issues_only') return item.issueType !== 'verified_active';
      return true;
    });
  };

  // Export PDF Handler
  const handleExportPDF = async (specificGrade?: string) => {
    const targetGradeKey = specificGrade || selectedGradeTab;
    let baseItems: PhoneAuditItem[];

    if (targetGradeKey === 'all') baseItems = auditedAllStudents;
    else if (targetGradeKey === 'primary_all') baseItems = primaryAllItems;
    else if (targetGradeKey === 'prep_all') baseItems = prepAllItems;
    else if (targetGradeKey === 'sec_all') baseItems = secAllItems;
    else baseItems = auditedAllStudents.filter((a) => a.student.groupGrade === targetGradeKey);

    const itemsToExport = filterAuditItemsByStatus(baseItems);

    if (!itemsToExport || itemsToExport.length === 0) {
      alert('لا توجد بيانات طلاب مطابقة للتصدير في هذه التصفية المحددة.');
      return;
    }

    setIsExporting('pdf');
    setPdfProgressMessage('⚡ جاري بدء المعالجة وبناء صفحات PDF المنظمة...');
    try {
      await exportPhoneAuditToPDF(
        itemsToExport,
        getGradeExportTitle(targetGradeKey),
        (msg) => setPdfProgressMessage(msg)
      );
    } catch (err) {
      console.error('PDF Export Error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(
        `تنبيه: حدث خطأ أثناء إنشاء ملف الـ PDF (${msg}).\n\n💡 نصيحة: يمكنك النقر على زر (طباعة فورية 🖨️) الموجود بجوار زر الـ PDF لتصدير وحفظ نفس التقرير كـ PDF فوراً بدون انتظار وبجودة ممتازة.`
      );
    } finally {
      setIsExporting(null);
      setPdfProgressMessage(null);
    }
  };

  // Export Excel Handler (High Speed .xls with RTL & preserved leading zeros)
  const handleExportExcel = (specificGrade?: string) => {
    const targetGradeKey = specificGrade || selectedGradeTab;
    let baseItems: PhoneAuditItem[];

    if (targetGradeKey === 'all') baseItems = auditedAllStudents;
    else if (targetGradeKey === 'primary_all') baseItems = primaryAllItems;
    else if (targetGradeKey === 'prep_all') baseItems = prepAllItems;
    else if (targetGradeKey === 'sec_all') baseItems = secAllItems;
    else baseItems = auditedAllStudents.filter((a) => a.student.groupGrade === targetGradeKey);

    const itemsToExport = filterAuditItemsByStatus(baseItems);

    if (!itemsToExport || itemsToExport.length === 0) {
      alert('لا توجد بيانات طلاب مطابقة للتصدير إلى ملف الإكسيل.');
      return;
    }

    setIsExporting('excel');
    try {
      exportPhoneAuditToExcel(itemsToExport, `كشف_أرقام_الواتساب_${getGradeExportTitle(targetGradeKey)}`);
    } catch (err) {
      console.error('Excel Export Error:', err);
      alert('حدث خطأ أثناء تصدير ملف الإكسيل.');
    } finally {
      setIsExporting(null);
    }
  };

  // Instant Native Print / PDF View Handler
  const handleInstantPrint = (specificGrade?: string) => {
    const targetGradeKey = specificGrade || selectedGradeTab;
    let baseItems: PhoneAuditItem[];

    if (targetGradeKey === 'all') baseItems = auditedAllStudents;
    else if (targetGradeKey === 'primary_all') baseItems = primaryAllItems;
    else if (targetGradeKey === 'prep_all') baseItems = prepAllItems;
    else if (targetGradeKey === 'sec_all') baseItems = secAllItems;
    else baseItems = auditedAllStudents.filter((a) => a.student.groupGrade === targetGradeKey);

    const itemsToExport = filterAuditItemsByStatus(baseItems);
    if (!itemsToExport || itemsToExport.length === 0) {
      alert('لا توجد بيانات طلاب مطابقة للطباعة في هذه التصفية.');
      return;
    }

    openInstantPrintView(itemsToExport, getGradeExportTitle(targetGradeKey));
  };

  // Quick WhatsApp Status Setters
  const handleMarkWhatsAppStatus = async (
    barcode: string,
    status: 'verified_active' | 'no_whatsapp' | 'untested',
    notes?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    await updateStudentAccount(barcode, {
      whatsappStatus: status,
      whatsappTestedDate: today,
      whatsappNotes:
        notes ||
        (status === 'verified_active'
          ? 'تم الفحص المباشر والتأكد من فتح الواتساب بنجاح ✅'
          : 'تم الفحص والتأكد أن الرقم ليس عليه حساب واتساب ❌'),
    });
  };

  // One-Click Single Student Missing Zero Fix
  const handleFixSingleStudentZero = async (item: PhoneAuditItem) => {
    if (!item.suggestedFixNumber) return;
    const targetField = item.parentPhoneRaw ? 'parentPhone' : 'phone';
    const res = await updateStudentAccount(item.student.barcode, {
      [targetField]: item.suggestedFixNumber,
      whatsappStatus: 'untested',
      whatsappNotes: `تم تصحيح الرقم بإضافة الصفر الأولي (${item.suggestedFixNumber})`,
    });
    if (res.success) {
      setFixSuccessMessage(`تم بنجاح إصلاح رقم الطالب ${item.student.name} إلى (${item.suggestedFixNumber})!`);
      setTimeout(() => setFixSuccessMessage(null), 4000);
    }
  };

  // One-Click Batch Fix for ALL students with missing leading zero
  const handleBatchFixAllMissingZeros = async () => {
    const fixable = auditedAllStudents.filter((a) => a.canAutoFixZero && a.suggestedFixNumber);
    if (fixable.length === 0) {
      alert('لا توجد أرقام ينقصها الصفر الأولي حالياً.');
      return;
    }

    const updates = fixable.map((item) => {
      const targetField = item.parentPhoneRaw ? 'parentPhone' : 'phone';
      return {
        barcode: item.student.barcode,
        data: {
          [targetField]: item.suggestedFixNumber!,
          whatsappStatus: 'untested' as const,
          whatsappNotes: `تم تصحيح الرقم آلياً بإضافة الصفر الأولي (${item.suggestedFixNumber})`,
        },
      };
    });

    const res = await updateMultipleStudentAccounts(updates);
    if (res.success) {
      setFixSuccessMessage(`⚡ تم بنجاح إصلاح ${fixable.length} رقم طالب كانت تنقصها الصفر وتحديث قاعدة البيانات!`);
      setTimeout(() => setFixSuccessMessage(null), 5000);
      if (scannerFinishedReport) {
        setScannerFinishedReport({
          ...scannerFinishedReport,
          missingZeroCount: 0,
          autoFixableItems: [],
        });
      }
    }
  };

  // Save the real diagnostic results into the database
  const handlePersistDiagnosticAuditResults = async () => {
    const today = new Date().toISOString().split('T')[0];
    const updates = auditedAllStudents.map((item) => {
      return {
        barcode: item.student.barcode,
        data: {
          whatsappStatus: item.issueType,
          whatsappTestedDate: today,
          whatsappNotes: item.issueDescription,
        },
      };
    });

    const res = await updateMultipleStudentAccounts(updates);
    if (res.success) {
      setFixSuccessMessage(`✅ تم تثبيت وحفظ النتائج التشخيصية الشاملة لـ ${updates.length} طالب في قاعدة البيانات!`);
      setTimeout(() => setFixSuccessMessage(null), 5000);
    }
  };

  // REAL AUTOMATED AUDIT RUNNER ("يفحص بجد")
  const startRealAutomatedAudit = async () => {
    setIsScannerOpen(true);
    setIsScanningActive(true);
    setScannerProgress(0);
    setScannerFinishedReport(null);
    setScannerLiveLogs([]);

    const totalStudents = students.length;
    if (totalStudents === 0) {
      setIsScanningActive(false);
      return;
    }

    const stages = [
      'المرحلة 1: فحص الخانات الفارغة وتوحيد الأكواد والبيانات...',
      'المرحلة 2: كشف الأرقام التي ينقصها الصفر الأولي (10 أرقام)...',
      'المرحلة 3: التحقق من كود المحافظة للخطوط الأرضية الثابتة...',
      'المرحلة 4: كشف الأرقام الوهمية والمتسلسلة غير الصالحة...',
      'المرحلة 5: مطابقة تكرار الأرقام بين جميع طلاب المنظومة...',
      'المرحلة 6: التحقق من شركات المحمول وتجهيز روابط الواتساب...',
      'المرحلة 7: تلخيص النتائج وتجهيز تقرير التدقيق الشامل...',
    ];

    const accumulatedLogs: typeof scannerLiveLogs = [];
    const missingZeros: PhoneAuditItem[] = [];
    const dups: PhoneAuditItem[] = [];
    const fakes: PhoneAuditItem[] = [];
    const landlines: PhoneAuditItem[] = [];
    const missings: PhoneAuditItem[] = [];
    const verifieds: PhoneAuditItem[] = [];
    const readyStudents: PhoneAuditItem[] = [];

    for (let i = 0; i < totalStudents; i++) {
      const student = students[i];
      const audit = analyzeStudentPhoneStatus(student, students);

      const stageIdx = Math.min(Math.floor((i / totalStudents) * stages.length), stages.length - 1);
      setScannerCurrentStage(stages[stageIdx]);
      setScannerCurrentStudent(`${student.name} - ${student.groupGrade} (كود: ${student.barcode})`);
      setScannerProgress(Math.round(((i + 1) / totalStudents) * 100));

      if (audit.canAutoFixZero) {
        missingZeros.push(audit);
        accumulatedLogs.push({
          id: `log-${student.barcode}-${i}`,
          type: 'zero_fix',
          badge: '💡 ينقصها صفر',
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          studentName: student.name,
          grade: student.groupGrade,
          barcode: student.barcode,
          phone: audit.cleanDigits,
          detail: `10 أرقام (${audit.cleanDigits}) -> مقترح تصحيحه إلى (${audit.suggestedFixNumber})`,
        });
      } else if (audit.issueType === 'duplicate') {
        dups.push(audit);
        accumulatedLogs.push({
          id: `log-${student.barcode}-${i}`,
          type: 'duplicate',
          badge: '👥 مكرر بين الطلاب',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          studentName: student.name,
          grade: student.groupGrade,
          barcode: student.barcode,
          phone: audit.formattedPhone,
          detail: `مطابق مع الطالب: ${audit.duplicateWithStudent?.name || 'طالب آخر'} (${audit.duplicateWithStudent?.grade || ''})`,
        });
      } else if (audit.issueType === 'landline') {
        landlines.push(audit);
        accumulatedLogs.push({
          id: `log-${student.barcode}-${i}`,
          type: 'landline',
          badge: '☎️ خط أرضي',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          studentName: student.name,
          grade: student.groupGrade,
          barcode: student.barcode,
          phone: audit.formattedPhone,
          detail: `رقم أرضي ثابت لا يدعم الواتساب (${audit.carrierName})`,
        });
      } else if (audit.issueType === 'fake_dummy') {
        fakes.push(audit);
        accumulatedLogs.push({
          id: `log-${student.barcode}-${i}`,
          type: 'fake',
          badge: '❌ رقم وهمي',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          studentName: student.name,
          grade: student.groupGrade,
          barcode: student.barcode,
          phone: audit.phoneRaw || audit.parentPhoneRaw || '---',
          detail: `رقم غير صالح (${audit.issueDescription})`,
        });
      } else if (audit.issueType === 'missing') {
        missings.push(audit);
        accumulatedLogs.push({
          id: `log-${student.barcode}-${i}`,
          type: 'missing',
          badge: '🚫 بدون رقم نهائياً',
          badgeBg: 'bg-red-950/60 text-rose-300 border-red-500/40',
          studentName: student.name,
          grade: student.groupGrade,
          barcode: student.barcode,
          phone: 'غير مسجل',
          detail: 'لم يتم إدخال أي رقم هاتف للطالب أو لولي الأمر',
        });
      } else if (audit.issueType === 'verified_active') {
        verifieds.push(audit);
        readyStudents.push(audit);
        accumulatedLogs.push({
          id: `log-${student.barcode}-${i}`,
          type: 'verified',
          badge: '✅ سليم ومعتمد',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          studentName: student.name,
          grade: student.groupGrade,
          barcode: student.barcode,
          phone: audit.formattedPhone,
          detail: `رقم محمول مصري سليم (${audit.carrierName}) معتمد وجاهز للواتساب`,
        });
      } else {
        readyStudents.push(audit);
        accumulatedLogs.push({
          id: `log-${student.barcode}-${i}`,
          type: 'untested',
          badge: '⏳ بانتظار الفحص',
          badgeBg: 'bg-slate-700/50 text-slate-300 border-slate-600',
          studentName: student.name,
          grade: student.groupGrade,
          barcode: student.barcode,
          phone: audit.formattedPhone,
          detail: `رقم محمول سليم (${audit.carrierName}) بانتظار التحقق`,
        });
      }

      // Live update logs periodically
      if (i % 2 === 0 || i === totalStudents - 1) {
        setScannerLiveLogs([...accumulatedLogs]);
        await new Promise((r) => setTimeout(r, 10));
        if (logsContainerRef.current) {
          logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
      }
    }

    // Compile duplicate pairs
    const duplicatePairs: { studentA: string; studentB: string; phone: string; gradeA: string; gradeB: string }[] = [];
    dups.forEach((item) => {
      if (item.duplicateWithStudent) {
        const exists = duplicatePairs.some(
          (p) =>
            (p.studentA === item.student.name && p.studentB === item.duplicateWithStudent!.name) ||
            (p.studentB === item.student.name && p.studentA === item.duplicateWithStudent!.name)
        );
        if (!exists) {
          duplicatePairs.push({
            studentA: item.student.name,
            studentB: item.duplicateWithStudent.name,
            phone: item.formattedPhone,
            gradeA: item.student.groupGrade,
            gradeB: item.duplicateWithStudent.grade,
          });
        }
      }
    });

    setIsScanningActive(false);
    setScannerProgress(100);
    setScannerCurrentStage('اكتمل الفحص الآلي الشامل بنجاح لجميع طلاب المنظومة ✅');
    setScannerLiveLogs([...accumulatedLogs]);

    setScannerFinishedReport({
      totalScanned: totalStudents,
      readyCount: readyStudents.length,
      missingZeroCount: missingZeros.length,
      duplicatesCount: dups.length,
      fakeDummyCount: fakes.length,
      landlineCount: landlines.length,
      missingCount: missings.length,
      verifiedCount: verifieds.length,
      autoFixableItems: missingZeros,
      duplicatePairs,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-fade-in">
      <div className="min-h-full flex items-start justify-center py-2 sm:py-4">
        <div
          className="w-full max-w-7xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col my-auto"
          style={{
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : '#ffffff',
            borderColor: isDark ? 'rgba(212, 175, 55, 0.4)' : 'rgba(179, 135, 40, 0.4)',
          }}
        >
          {/* ========================================================= */}
          {/* 1. Modal Top Bar */}
          {/* ========================================================= */}
          <div
            className="p-4 sm:p-5 border-b flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
            style={{
              backgroundColor: isDark ? 'rgba(9, 14, 23, 0.95)' : '#f8fafc',
              borderColor: 'rgba(212, 175, 55, 0.25)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-amber-400">
                    تدقيق وحصر أرقام هواتف الطلاب والواتساب
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    من 4 ابتدائي حتى 3 ثانوي ⚡
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  فحص آلي حقيقي وشامل، كشف الأرقام المكررة والناقصة والوهمية، وتصدير PDF وإكسيل منظمين بدون انقسام
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
              {/* Real Automated Deep Check Button */}
              <button
                type="button"
                onClick={startRealAutomatedAudit}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg flex items-center gap-1.5 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                title="تشغيل الفحص الآلي الحقيقي الشامل لكشف المشاكل والأرقام المكررة والناقصة"
              >
                <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>فحص آلي شامل بجد ⚡</span>
              </button>

              {/* Fast Rich Excel Export */}
              <button
                type="button"
                onClick={() => handleExportExcel()}
                disabled={isExporting !== null}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="تصدير كشف Excel عالي السرعة ومنظم بترميز UTF-8 مع الحفاظ على الصفر الأولي"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>تصدير Excel 📊</span>
              </button>

              {/* Multi-Grade Anti-Split PDF Export */}
              <button
                type="button"
                onClick={() => handleExportPDF('all')}
                disabled={isExporting !== null}
                className="px-3.5 py-2 rounded-xl text-xs font-black btn-gold text-slate-950 shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="تحميل ملف PDF منظم لكل الصفوف دون أن ينقسم أي اسم أو صف بالصفحتين"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {isExporting === 'pdf' ? (pdfProgressMessage || '⚡ جاري التحضير...') : 'تحميل PDF لكل الصفوف 📄'}
                </span>
              </button>

              {/* Instant Print / Native Save Button */}
              <button
                type="button"
                onClick={() => handleInstantPrint('all')}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow flex items-center gap-1.5 transition-all cursor-pointer"
                title="فتح نافذة الطباعة الفورية للتقرير الكامل بدون تأخير"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة فورية 🖨️</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 px-3 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white transition-all text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Success Toast Banner */}
          {fixSuccessMessage && (
            <div className="mx-4 my-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{fixSuccessMessage}</span>
              </div>
              <button
                onClick={() => setFixSuccessMessage(null)}
                className="text-emerald-400 hover:text-white text-xs px-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. REAL AUTOMATED SCANNER CONSOLE (Modal Overlay / Drawer) */}
          {/* ========================================================= */}
          {isScannerOpen && (
            <div className="mx-4 my-3 p-5 rounded-3xl bg-slate-900/95 border-2 border-purple-500/40 text-white shadow-2xl animate-fade-in relative overflow-hidden">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
                    <Activity className={`w-5 h-5 ${isScanningActive ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-amber-300 flex items-center gap-2">
                      <span>الفاحص الآلي الحقيقي لأرقام الهواتف والواتساب</span>
                      {isScanningActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/30 text-purple-200 animate-pulse">
                          جاري الفحص المباشر...
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/30 text-emerald-200 font-bold">
                          اكتمل الفحص التشخيصي ✅
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      فحص حقيقي دقيق لـ 6 مراحل: خانات فارغة، نقص الصفر، التكرار بين الطلاب، الأرقام الوهمية، الخطوط الأرضية
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsScannerOpen(false)}
                  className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Progress Bar & Live Ticker */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 mb-4">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-purple-300 font-bold">{scannerCurrentStage || 'جاهز للبدء'}</span>
                  <span className="font-mono font-black text-amber-400">{scannerProgress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400 rounded-full transition-all duration-150"
                    style={{ width: `${scannerProgress}%` }}
                  />
                </div>
                {isScanningActive && (
                  <p className="text-[11px] text-slate-400 mt-2 font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>جاري فحص:</span>
                    <strong className="text-amber-200">{scannerCurrentStudent}</strong>
                  </p>
                )}
              </div>

              {/* Live Findings Terminal Console */}
              <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-3.5 mb-4 shadow-inner">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isScanningActive ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                    <span className="text-xs font-mono font-bold text-slate-200">
                      شريط الرصد اللحظي وتدقيق أرقام الطلاب ({scannerLiveLogs.length} طالب تم فحصهم بدقة):
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLogFilterMode('issues_only')}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                        logFilterMode === 'issues_only'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⚠️ الملاحظات والتنبيهات فقط ({scannerLiveLogs.filter((l) => l.type !== 'verified' && l.type !== 'untested').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogFilterMode('all')}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                        logFilterMode === 'all'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📋 السجل الكامل ({scannerLiveLogs.length})
                    </button>
                  </div>
                </div>

                <div
                  ref={logsContainerRef}
                  className="space-y-1.5 max-h-52 overflow-y-auto pr-1 text-xs font-mono select-text"
                >
                  {scannerLiveLogs.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      {isScanningActive ? 'جاري بدء الفحص المباشر ورصد بيانات الطلاب...' : 'اضغط على زر (فحص آلي شامل بجد ⚡) بالأعلى لبدء الفحص المباشر.'}
                    </div>
                  ) : (
                    scannerLiveLogs
                      .filter((l) => (logFilterMode === 'issues_only' ? l.type !== 'verified' && l.type !== 'untested' : true))
                      .map((log) => (
                        <div
                          key={log.id}
                          className="p-1.5 px-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-between gap-2 hover:bg-slate-850 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-wrap text-right">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${log.badgeBg}`}>
                              {log.badge}
                            </span>
                            <span className="text-slate-200 font-bold">{log.studentName}</span>
                            <span className="text-slate-400 text-[11px]">({log.grade})</span>
                            <span className="text-slate-500 text-[10.5px] font-mono">كود: {log.barcode}</span>
                            <span className="text-slate-300 text-[11px]">- {log.detail}</span>
                          </div>
                          <span className="text-amber-400/90 font-mono text-[11px] font-bold dir-ltr shrink-0">
                            {log.phone}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Finished Diagnostic Report with Interactive Clickable Cards */}
              {scannerFinishedReport && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('verified_only');
                        scrollToTable();
                      }}
                      className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all cursor-pointer text-center group"
                      title="عرض الطلاب المؤكدين في الجدول بالأسفل"
                    >
                      <p className="text-[10px] text-emerald-400 font-bold group-hover:underline">أرقام سليمة ومعتمدة</p>
                      <p className="text-lg font-black text-emerald-300">{scannerFinishedReport.readyCount}</p>
                      <span className="text-[9px] text-emerald-400/70 block mt-0.5">انقر للفلترة 👇</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('missing_zero_only');
                        scrollToTable();
                      }}
                      className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/30 hover:bg-sky-500/25 transition-all cursor-pointer text-center group"
                      title="عرض الأرقام التي ينقصها صفر في الجدول بالأسفل"
                    >
                      <p className="text-[10px] text-sky-400 font-bold group-hover:underline">ينقصها صفر (10 أرقام)</p>
                      <p className="text-lg font-black text-sky-300">{scannerFinishedReport.missingZeroCount}</p>
                      <span className="text-[9px] text-sky-400/70 block mt-0.5">انقر للفلترة 👇</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('duplicates_only');
                        scrollToTable();
                      }}
                      className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 transition-all cursor-pointer text-center group"
                      title="عرض الأرقام المكررة في الجدول بالأسفل"
                    >
                      <p className="text-[10px] text-purple-400 font-bold group-hover:underline">مكررة بين الطلاب</p>
                      <p className="text-lg font-black text-purple-300">{scannerFinishedReport.duplicatesCount}</p>
                      <span className="text-[9px] text-purple-400/70 block mt-0.5">انقر للفلترة 👇</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('fake_only');
                        scrollToTable();
                      }}
                      className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 transition-all cursor-pointer text-center group"
                      title="عرض الأرقام الوهمية في الجدول بالأسفل"
                    >
                      <p className="text-[10px] text-rose-400 font-bold group-hover:underline">أرقام وهمية غير حقيقية</p>
                      <p className="text-lg font-black text-rose-300">{scannerFinishedReport.fakeDummyCount}</p>
                      <span className="text-[9px] text-rose-400/70 block mt-0.5">انقر للفلترة 👇</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('landline_only');
                        scrollToTable();
                      }}
                      className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer text-center group"
                      title="عرض الخطوط الأرضية في الجدول بالأسفل"
                    >
                      <p className="text-[10px] text-amber-400 font-bold group-hover:underline">خطوط أرضية ثابتة</p>
                      <p className="text-lg font-black text-amber-300">{scannerFinishedReport.landlineCount}</p>
                      <span className="text-[9px] text-amber-400/70 block mt-0.5">انقر للفلترة 👇</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('missing_only');
                        scrollToTable();
                      }}
                      className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 hover:bg-red-950/80 transition-all cursor-pointer text-center group"
                      title="عرض الخانات الفارغة في الجدول بالأسفل"
                    >
                      <p className="text-[10px] text-rose-400 font-bold group-hover:underline">فارغة بدون رقم نهائياً</p>
                      <p className="text-lg font-black text-rose-300">{scannerFinishedReport.missingCount}</p>
                      <span className="text-[9px] text-rose-400/70 block mt-0.5">انقر للفلترة 👇</span>
                    </button>
                  </div>

                  {/* Highlight Duplicates if found */}
                  {scannerFinishedReport.duplicatePairs.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        <h5 className="text-xs font-black text-purple-300">
                          أرقام متطابقة مكررة بين أكثر من طالب ({scannerFinishedReport.duplicatePairs.length} حالة تكرار):
                        </h5>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                        {scannerFinishedReport.duplicatePairs.map((dp, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-slate-950/60 border border-purple-500/20 flex items-center justify-between gap-2 flex-wrap"
                          >
                            <span className="font-mono text-amber-300 font-bold dir-ltr">{dp.phone}</span>
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-slate-300 font-bold">
                                {dp.studentA} ({dp.gradeA})
                              </span>
                              <span className="text-purple-400 font-bold">متطابق مع</span>
                              <span className="text-slate-300 font-bold">
                                {dp.studentB} ({dp.gradeB})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar for Diagnostic Results */}
                  <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-800">
                    {/* Instant Fix Missing Zeros Button */}
                    {scannerFinishedReport.missingZeroCount > 0 && (
                      <button
                        type="button"
                        onClick={handleBatchFixAllMissingZeros}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5 text-amber-300" />
                        <span>
                          ⚡ إصلاح فوري لكافة الأرقام الناقصة للصفر ({scannerFinishedReport.missingZeroCount} رقم)
                        </span>
                      </button>
                    )}

                    {/* Persist Accurate Findings to Database */}
                    <button
                      type="button"
                      onClick={handlePersistDiagnosticAuditResults}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>حفظ وتثبيت نتائج الفحص الدقيقة في قاعدة البيانات</span>
                    </button>

                    <button
                      type="button"
                      onClick={startRealAutomatedAudit}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة الفحص الآن</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportPDF('all')}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تصدير PDF الفحص الشامل</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. Stage & Grade Navigation Selector */}
          {/* ========================================================= */}
          <div
            className="p-3 sm:p-4 border-b flex flex-col gap-2.5"
            style={{
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#f8fafc',
              borderColor: 'rgba(212, 175, 55, 0.15)',
            }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 pl-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>المرحلة المحددة:</span>
              </span>

              {/* Master All Grades Button */}
              <button
                type="button"
                onClick={() => setSelectedGradeTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedGradeTab === 'all'
                    ? 'btn-gold text-slate-950 shadow-md font-black'
                    : 'bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700'
                }`}
              >
                <span>⭐ كافة الصفوف (4 ابتدائي لـ 3 ثانوي)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                  {auditedAllStudents.length}
                </span>
              </button>

              {/* Primary Stage All */}
              <button
                type="button"
                onClick={() => setSelectedGradeTab('primary_all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedGradeTab === 'primary_all'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400 font-black'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                <span>المرحلة الابتدائية (4 + 5 + 6)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                  {primaryAllItems.length}
                </span>
              </button>

              {/* Preparatory Stage All */}
              <button
                type="button"
                onClick={() => setSelectedGradeTab('prep_all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedGradeTab === 'prep_all'
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400 font-black'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                <span>المرحلة الإعدادية (1 + 2 + 3 إعدادي)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                  {prepAllItems.length}
                </span>
              </button>

              {/* Secondary Stage All */}
              <button
                type="button"
                onClick={() => setSelectedGradeTab('sec_all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedGradeTab === 'sec_all'
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400 font-black'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                <span>المرحلة الثانوية (1 + 2 + 3 ثانوي)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                  {secAllItems.length}
                </span>
              </button>
            </div>

            {/* Individual Grade Direct Selector Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/50">
              <span className="text-[11px] text-slate-400 font-bold">تحديد صف منفرد:</span>
              {[
                { id: 'الصف الرابع الابتدائي', label: 'سنة 4 ابتدائي' },
                { id: 'الصف الخامس الابتدائي', label: 'سنة 5 ابتدائي' },
                { id: 'الصف السادس الابتدائي', label: 'سنة 6 ابتدائي' },
                { id: 'الصف الأول الإعدادي', label: '1 إعدادي' },
                { id: 'الصف الثاني الإعدادي', label: '2 إعدادي' },
                { id: 'الصف الثالث الإعدادي', label: '3 إعدادي' },
                { id: 'الصف الأول الثانوي', label: '1 ثانوي' },
                { id: 'الصف الثاني الثانوي', label: '2 ثانوي' },
                { id: 'الصف الثالث الثانوي', label: '3 ثانوي' },
              ].map((g) => {
                const count = auditedAllStudents.filter((a) => a.student.groupGrade === g.id).length;
                const isSelected = selectedGradeTab === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGradeTab(g.id)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-slate-800/60 text-slate-400 hover:text-amber-300 border border-slate-700/40'
                    }`}
                  >
                    <span>{g.label}</span>
                    <span className="text-[9px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. Live Diagnostic Metric Cards for Selected Scope */}
          {/* ========================================================= */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3.5 sm:p-4 border-b"
            style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}
          >
            {/* Missing Completely */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'missing_only' ? 'all' : 'missing_only')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                statusFilter === 'missing_only'
                  ? 'ring-2 ring-rose-400 bg-rose-500/20'
                  : 'bg-rose-500/10 hover:bg-rose-500/15'
              } border-rose-500/30 flex items-center justify-between`}
            >
              <div>
                <p className="text-[10px] text-rose-400 font-bold">غير مكتوب أصلًا</p>
                <p className="text-lg font-black text-rose-300 mt-0.5">{missingCount} طالب</p>
                <span className="text-[9.5px] text-rose-400/80">انقر للتصفية</span>
              </div>
              <PhoneOff className="w-5 h-5 text-rose-400/80" />
            </div>

            {/* Missing Leading Zero */}
            <div
              onClick={() => {
                setStatusFilter(statusFilter === 'missing_zero_only' ? 'all' : 'missing_zero_only');
                scrollToTable();
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                statusFilter === 'missing_zero_only'
                  ? 'ring-2 ring-sky-400 bg-sky-500/20'
                  : 'bg-sky-500/10 hover:bg-sky-500/15'
              } border-sky-500/30 flex items-center justify-between`}
            >
              <div>
                <p className="text-[10px] text-sky-400 font-bold">ينقصه صفر أولي</p>
                <p className="text-lg font-black text-sky-300 mt-0.5">{missingZeroCount} طالب</p>
                <span className="text-[9.5px] text-sky-400/80">قابل للإصلاح ⚡</span>
              </div>
              <Wrench className="w-5 h-5 text-sky-400/80" />
            </div>

            {/* Duplicates */}
            <div
              onClick={() => {
                setStatusFilter(statusFilter === 'duplicates_only' ? 'all' : 'duplicates_only');
                scrollToTable();
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                statusFilter === 'duplicates_only'
                  ? 'ring-2 ring-purple-400 bg-purple-500/20'
                  : 'bg-purple-500/10 hover:bg-purple-500/15'
              } border-purple-500/30 flex items-center justify-between`}
            >
              <div>
                <p className="text-[10px] text-purple-400 font-bold">أرقام مكررة</p>
                <p className="text-lg font-black text-purple-300 mt-0.5">{duplicateCount} طالب</p>
                <span className="text-[9.5px] text-purple-400/80">بين الطلاب</span>
              </div>
              <Users className="w-5 h-5 text-purple-400/80" />
            </div>

            {/* Landline / Invalid */}
            <div
              onClick={() => {
                setStatusFilter(statusFilter === 'no_whatsapp' ? 'all' : 'no_whatsapp');
                scrollToTable();
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                statusFilter === 'no_whatsapp'
                  ? 'ring-2 ring-amber-400 bg-amber-500/20'
                  : 'bg-amber-500/10 hover:bg-amber-500/15'
              } border-amber-500/30 flex items-center justify-between`}
            >
              <div>
                <p className="text-[10px] text-amber-400 font-bold">أرضي / ليس عليه واتس</p>
                <p className="text-lg font-black text-amber-300 mt-0.5">{noWhatsAppCount} طالب</p>
                <span className="text-[9.5px] text-amber-400/80">غير مؤهل</span>
              </div>
              <AlertTriangle className="w-5 h-5 text-amber-400/80" />
            </div>

            {/* Verified Active WhatsApp */}
            <div
              onClick={() => {
                setStatusFilter(statusFilter === 'verified_only' ? 'all' : 'verified_only');
                scrollToTable();
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                statusFilter === 'verified_only'
                  ? 'ring-2 ring-emerald-400 bg-emerald-500/20'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/15'
              } border-emerald-500/30 flex items-center justify-between`}
            >
              <div>
                <p className="text-[10px] text-emerald-400 font-bold">واتساب مؤكد وشغال</p>
                <p className="text-lg font-black text-emerald-300 mt-0.5">{verifiedCount} طالب</p>
                <span className="text-[9.5px] text-emerald-400/80">مفحوص ومعتمد</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400/80" />
            </div>

            {/* Untested Mobile numbers */}
            <div
              onClick={() => {
                setStatusFilter(statusFilter === 'untested_only' ? 'all' : 'untested_only');
                scrollToTable();
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                statusFilter === 'untested_only'
                  ? 'ring-2 ring-indigo-400 bg-indigo-500/20'
                  : 'bg-indigo-500/10 hover:bg-indigo-500/15'
              } border-indigo-500/30 flex items-center justify-between`}
            >
              <div>
                <p className="text-[10px] text-indigo-400 font-bold">بانتظار الفحص</p>
                <p className="text-lg font-black text-indigo-300 mt-0.5">{untestedCount} طالب</p>
                <span className="text-[9.5px] text-indigo-400/80">أرقام محمول</span>
              </div>
              <Clock className="w-5 h-5 text-indigo-400/80" />
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. Filter & Search Toolbar */}
          {/* ========================================================= */}
          <div
            className="p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 border-b"
            style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}
          >
            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
              <span className="text-xs font-bold text-slate-400 pl-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>الحالة:</span>
              </span>

              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الكل ({currentGradeItems.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('issues_only')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'issues_only'
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚠️ كل المشاكل ({totalIssuesCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('missing_zero_only')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'missing_zero_only'
                    ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                💡 ينقصها صفر ({missingZeroCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('duplicates_only')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'duplicates_only'
                    ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                👥 مكررة ({duplicateCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('fake_only')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'fake_only'
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ❌ وهمية ({fakeCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('landline_only')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'landline_only'
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ☎️ خط أرضي ({landlineCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('missing_only')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'missing_only'
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🚫 غير مسجل ({missingCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('verified_only')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'verified_only'
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ✅ مؤكد ({verifiedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالاسم أو الباركود أو الرقم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border outline-none font-bold"
                style={{
                  backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                  borderColor: 'rgba(212, 175, 55, 0.25)',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* 6. Live Interactive Table with WhatsApp Checker & Fix Actions */}
          {/* ========================================================= */}
          <div ref={tableRef} className="p-3 sm:p-5">
            {displayItems.length === 0 ? (
              <div
                className="p-12 text-center border border-dashed rounded-3xl space-y-3"
                style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}
              >
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400/80" />
                <h4 className="text-base font-bold text-slate-200">لا توجد سجلات تطابق شروط التصفية الحالية</h4>
                <p className="text-xs text-slate-400">
                  {statusFilter === 'missing_only'
                    ? 'رائع! لا يوجد أي طالب يفتقد رقم الهاتف في هذه المرحلة.'
                    : 'تم تدقيق هذه الفئة بالكامل بنجاح.'}
                </p>
              </div>
            ) : (
              <div
                className="overflow-x-auto rounded-2xl border shadow-sm"
                style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#e2e8f0' }}
              >
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr
                      className="border-b"
                      style={{
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#f1f5f9',
                        borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0',
                        color: isDark ? '#fcf6ba' : '#966c15',
                      }}
                    >
                      <th className="p-3 font-bold">#</th>
                      <th className="p-3 font-bold">كود الطالب</th>
                      <th className="p-3 font-bold">اسم الطالب</th>
                      <th className="p-3 font-bold">المرحلة والمجموعة</th>
                      <th className="p-3 font-bold">الرقم المعتمد</th>
                      <th className="p-3 font-bold">التشخيص وحالة الواتس</th>
                      <th className="p-3 font-bold text-center">فحص الواتساب الفعلي 📲</th>
                      <th className="p-3 font-bold text-center">إجراء وتعديل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.1)' : '#f1f5f9' }}>
                    {displayItems.map((item, index) => {
                      const s = item.student;
                      const isMissing = item.issueType === 'missing';
                      const isVerified = item.issueType === 'verified_active';
                      const isDuplicate = item.issueType === 'duplicate';
                      const isMissingZero = item.issueType === 'fixable_missing_zero';

                      // Check if grade changed to render a distinct separator banner
                      const isMultiGrade =
                        selectedGradeTab === 'all' ||
                        selectedGradeTab === 'primary_all' ||
                        selectedGradeTab === 'prep_all' ||
                        selectedGradeTab === 'sec_all';
                      const prevItem = index > 0 ? displayItems[index - 1] : null;
                      const isFirstOfGrade = isMultiGrade && (!prevItem || prevItem.student.groupGrade !== s.groupGrade);
                      const gradeMeta = SEQUENTIAL_GRADES.find((sg) => sg.grade === s.groupGrade);
                      const gradeStudentCount = displayItems.filter((di) => di.student.groupGrade === s.groupGrade).length;

                      return (
                        <React.Fragment key={s.barcode}>
                          {isFirstOfGrade && (
                            <tr
                              className="border-y"
                              style={{
                                background: isDark
                                  ? 'linear-gradient(90deg, rgba(212, 175, 55, 0.25) 0%, rgba(30, 41, 59, 0.95) 100%)'
                                  : 'linear-gradient(90deg, #fef3c7 0%, #f1f5f9 100%)',
                                borderColor: isDark ? 'rgba(212, 175, 55, 0.4)' : '#d97706',
                              }}
                            >
                              <td colSpan={8} className="p-2.5 px-4 font-black">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{gradeMeta?.icon || '📚'}</span>
                                    <span
                                      className="text-xs sm:text-sm font-black"
                                      style={{ color: isDark ? '#fcf6ba' : '#92400e' }}
                                    >
                                      فاصل الصف الدراسي: {s.groupGrade}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      {gradeMeta?.stage || 'مرحلة دراسية'}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-bold">
                                      ({gradeStudentCount} طالب في هذا الصف)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleExportPDF(s.groupGrade)}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer"
                                      title={`تحميل PDF مخصص لـ ${s.groupGrade}`}
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>PDF الصف</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleInstantPrint(s.groupGrade)}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-500/20 hover:bg-sky-500/35 text-sky-300 border border-sky-500/40 transition-all flex items-center gap-1 cursor-pointer"
                                      title={`طباعة / حفظ فوري كـ PDF لـ ${s.groupGrade}`}
                                    >
                                      <Printer className="w-3 h-3" />
                                      <span>طباعة فورية</span>
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}

                          <tr
                            className="hover:bg-amber-500/5 transition-colors"
                            style={{
                              backgroundColor: isMissing
                                ? isDark
                                  ? 'rgba(239, 68, 68, 0.08)'
                                  : '#fef2f2'
                                : isDuplicate
                                ? isDark
                                  ? 'rgba(168, 85, 247, 0.08)'
                                  : '#faf5ff'
                                : isVerified
                                ? isDark
                                  ? 'rgba(16, 185, 129, 0.05)'
                                  : '#f0fdf4'
                                : undefined,
                            }}
                          >
                            {/* Index */}
                            <td className="p-3 font-bold text-slate-400">{index + 1}</td>

                            {/* Barcode */}
                            <td className="p-3 font-mono font-bold text-amber-400">{s.barcode}</td>

                            {/* Student Name */}
                            <td className="p-3 font-bold text-slate-200">
                              <div>
                                <span>{s.name}</span>
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  كلمة المرور: {s.password || '---'}
                                </span>
                              </div>
                            </td>

                            {/* Grade & Days */}
                            <td className="p-3 text-slate-300">
                              <p className="font-bold">{s.groupGrade}</p>
                              <p className="text-[10px] text-slate-400">{s.groupDays}</p>
                            </td>

                            {/* Phone Display & Carrier */}
                            <td className="p-3">
                              {isMissing ? (
                                <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  غير مدخل ❌
                                </span>
                              ) : (
                                <div>
                                  <p className="font-mono font-bold text-slate-200 dir-ltr text-left">
                                    {item.formattedPhone !== 'غير مسجل'
                                      ? item.formattedPhone
                                      : item.parentPhoneRaw || item.phoneRaw}
                                  </p>
                                  <span className="text-[10px] text-amber-400/80 font-bold">
                                    {item.carrierName}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Status & Diagnostic Details */}
                            <td className="p-3">
                              <div className="space-y-1">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border inline-flex items-center gap-1 ${item.statusBadgeColor}`}
                                >
                                  {item.statusBadgeText}
                                </span>
                                {item.duplicateWithStudent && (
                                  <p className="text-[10px] text-purple-300 font-bold">
                                    مشترك مع: {item.duplicateWithStudent.name}
                                  </p>
                                )}
                                {item.issueDescription && (
                                  <p className="text-[10px] text-slate-400 line-clamp-1">
                                    {item.issueDescription}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Live WhatsApp Testing & Confirmation Buttons */}
                            <td className="p-3 text-center">
                              {item.hasWhatsAppReadyNumber ? (
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  {/* Open Chat Test Button */}
                                  <a
                                    href={item.whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center gap-1 shadow-sm transition-all"
                                    title="فتح محادثة واتساب تجريبية للتأكد هل يفتح واتساب فعلاً"
                                  >
                                    <Smartphone className="w-3 h-3" />
                                    <span>اختبار واتس 📲</span>
                                  </a>

                                  {/* Confirm: Has WhatsApp */}
                                  <button
                                    type="button"
                                    onClick={() => handleMarkWhatsAppStatus(s.barcode, 'verified_active')}
                                    className={`p-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
                                      isVerified
                                        ? 'bg-emerald-500 text-slate-950 font-black'
                                        : 'border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                                    }`}
                                    title="تأكيد: شغال على واتساب"
                                  >
                                    {isVerified ? '✓ معتمد' : 'له واتساب ✅'}
                                  </button>

                                  {/* Confirm: No WhatsApp */}
                                  <button
                                    type="button"
                                    onClick={() => handleMarkWhatsAppStatus(s.barcode, 'no_whatsapp')}
                                    className={`p-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
                                      item.issueType === 'no_whatsapp'
                                        ? 'bg-rose-500 text-white font-black'
                                        : 'border border-rose-500/40 text-rose-300 hover:bg-rose-500/20'
                                    }`}
                                    title="تأكيد: ليس عليه واتساب"
                                  >
                                    ليس عليه ❌
                                  </button>
                                </div>
                              ) : isMissingZero ? (
                                <button
                                  type="button"
                                  onClick={() => handleFixSingleStudentZero(item)}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1 shadow transition-all mx-auto"
                                  title="إصلاح الرقم بإضافة الصفر المفقود تلقائياً"
                                >
                                  <Wrench className="w-3 h-3 text-amber-300" />
                                  <span>إصلاح الصفر (+0)</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">لا يمكن الفحص</span>
                              )}
                            </td>

                            {/* Edit Student Account Button */}
                            <td className="p-3 text-center">
                              {onEditStudent && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onEditStudent(s);
                                  }}
                                  className="p-1.5 px-2.5 rounded-xl border border-slate-700 hover:border-amber-400 bg-slate-800 text-amber-300 hover:text-amber-200 text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                                  title="تعديل أو كتابة رقم الهاتف الآن"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>تعديل ✏️</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 7. Modal Footer & Multi-Grade PDF Actions */}
          {/* ========================================================= */}
          <div
            className="p-3.5 sm:p-5 border-t flex flex-col md:flex-row items-center justify-between gap-3 text-xs"
            style={{
              backgroundColor: isDark ? 'rgba(9, 14, 23, 0.95)' : '#f8fafc',
              borderColor: 'rgba(212, 175, 55, 0.2)',
            }}
          >
            <div className="text-slate-400 flex items-center gap-2">
              <span>التقرير المختار حالياً:</span>
              <span className="font-black text-amber-400">{getGradeExportTitle(selectedGradeTab)}</span>
              <span className="text-slate-500">({displayItems.length} طالب)</span>
            </div>

            {/* Bottom Export Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleExportExcel()}
                disabled={isExporting !== null}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تحميل Excel عالي الكفاءة</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportPDF()}
                disabled={isExporting !== null}
                className="px-4 py-2 rounded-xl text-xs font-black btn-gold text-slate-950 flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>
                  {isExporting === 'pdf' ? (pdfProgressMessage || 'جاري تحضير PDF...') : 'تحميل PDF لكل الصفوف 📄'}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                إغلاق النافذة ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
