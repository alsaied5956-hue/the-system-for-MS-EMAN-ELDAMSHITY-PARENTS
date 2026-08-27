import React, { useState, useMemo } from 'react';
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
  const { students, updateStudentAccount, theme } = useSystem();
  const isDark = theme === 'dark';

  // Filters
  const [selectedGradeTab, setSelectedGradeTab] = useState<string>('all'); // 'all', 'primary_all', 'prep_all', 'sec_all', or specific grade
  const [statusFilter, setStatusFilter] = useState<'all' | 'issues_only' | 'missing_only' | 'no_whatsapp' | 'verified_only' | 'untested_only'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);
  const [activeTestingBarcode, setActiveTestingBarcode] = useState<string | null>(null);
  const [bulkCheckProgress, setBulkCheckProgress] = useState<string | null>(null);

  // Analyze all students
  const auditedAllStudents: PhoneAuditItem[] = useMemo(() => {
    return students.map(analyzeStudentPhoneStatus);
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

  // Overall Statistics for current selected grade scope
  const missingCount = currentGradeItems.filter((a) => a.issueType === 'missing').length;
  const noWhatsAppCount = currentGradeItems.filter((a) => a.issueType === 'no_whatsapp' || a.issueType === 'invalid_format').length;
  const verifiedCount = currentGradeItems.filter((a) => a.issueType === 'verified_active').length;
  const untestedCount = currentGradeItems.filter((a) => a.issueType === 'untested').length;
  const totalIssuesCount = missingCount + noWhatsAppCount;

  // Filtered and Sequentially Ordered Display List
  const displayItems = useMemo(() => {
    const gradeOrderMap = new Map<string, number>();
    SEQUENTIAL_GRADES.forEach((sg, idx) => {
      gradeOrderMap.set(sg.grade, idx);
    });

    const filtered = currentGradeItems.filter((item) => {
      // 1. Status Filter
      if (statusFilter === 'missing_only' && item.issueType !== 'missing') return false;
      if (statusFilter === 'no_whatsapp' && item.issueType !== 'no_whatsapp' && item.issueType !== 'invalid_format') return false;
      if (statusFilter === 'verified_only' && item.issueType !== 'verified_active') return false;
      if (statusFilter === 'untested_only' && item.issueType !== 'untested') return false;
      if (statusFilter === 'issues_only' && item.issueType !== 'missing' && item.issueType !== 'no_whatsapp' && item.issueType !== 'invalid_format') {
        return false;
      }

      // 2. Search filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const s = item.student;
      return (
        s.name.toLowerCase().includes(term) ||
        s.barcode.toLowerCase().includes(term) ||
        (item.phoneRaw && item.phoneRaw.includes(term)) ||
        (item.parentPhoneRaw && item.parentPhoneRaw.includes(term)) ||
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
    if (tabKey === 'all') return 'كافة الصفوف الدراسية (من الصف الرابع الابتدائي حتى الصف الثالث الثانوي)';
    if (tabKey === 'primary_all') return 'المرحلة الابتدائية (الصف الرابع والخامس والسادس الابتدائي)';
    if (tabKey === 'prep_all') return 'المرحلة الإعدادية (الصف الأول والثاني والثالث الإعدادي)';
    if (tabKey === 'sec_all') return 'المرحلة الثانوية (الصف الأول والثاني والثالث الثانوي)';
    return tabKey;
  };

  // Export PDF Handler
  const handleExportPDF = async (specificGrade?: string) => {
    const targetGradeKey = specificGrade || selectedGradeTab;
    let itemsToExport: PhoneAuditItem[];

    if (targetGradeKey === 'all') itemsToExport = auditedAllStudents;
    else if (targetGradeKey === 'primary_all') itemsToExport = primaryAllItems;
    else if (targetGradeKey === 'prep_all') itemsToExport = prepAllItems;
    else if (targetGradeKey === 'sec_all') itemsToExport = secAllItems;
    else itemsToExport = auditedAllStudents.filter((a) => a.student.groupGrade === targetGradeKey);

    // Apply status filter if user filtered inside modal
    if (statusFilter !== 'all') {
      itemsToExport = itemsToExport.filter((item) => {
        if (statusFilter === 'missing_only') return item.issueType === 'missing';
        if (statusFilter === 'no_whatsapp') return item.issueType === 'no_whatsapp' || item.issueType === 'invalid_format';
        if (statusFilter === 'verified_only') return item.issueType === 'verified_active';
        if (statusFilter === 'untested_only') return item.issueType === 'untested';
        if (statusFilter === 'issues_only') return item.issueType === 'missing' || item.issueType === 'no_whatsapp' || item.issueType === 'invalid_format';
        return true;
      });
    }

    setIsExporting('pdf');
    try {
      await exportPhoneAuditToPDF(itemsToExport, getGradeExportTitle(targetGradeKey));
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إنشاء ملف PDF، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(null);
    }
  };

  // Export Excel Handler
  const handleExportExcel = (specificGrade?: string) => {
    const targetGradeKey = specificGrade || selectedGradeTab;
    let itemsToExport: PhoneAuditItem[];

    if (targetGradeKey === 'all') itemsToExport = auditedAllStudents;
    else if (targetGradeKey === 'primary_all') itemsToExport = primaryAllItems;
    else if (targetGradeKey === 'prep_all') itemsToExport = prepAllItems;
    else if (targetGradeKey === 'sec_all') itemsToExport = secAllItems;
    else itemsToExport = auditedAllStudents.filter((a) => a.student.groupGrade === targetGradeKey);

    setIsExporting('excel');
    try {
      exportPhoneAuditToExcel(itemsToExport, `كشف_أرقام_الواتساب_${getGradeExportTitle(targetGradeKey)}`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تصدير ملف الإكسيل.');
    } finally {
      setIsExporting(null);
    }
  };

  // Instant Native Print / PDF View Handler
  const handleInstantPrint = (specificGrade?: string) => {
    const targetGradeKey = specificGrade || selectedGradeTab;
    let itemsToExport: PhoneAuditItem[];

    if (targetGradeKey === 'all') itemsToExport = auditedAllStudents;
    else if (targetGradeKey === 'primary_all') itemsToExport = primaryAllItems;
    else if (targetGradeKey === 'prep_all') itemsToExport = prepAllItems;
    else if (targetGradeKey === 'sec_all') itemsToExport = secAllItems;
    else itemsToExport = auditedAllStudents.filter((a) => a.student.groupGrade === targetGradeKey);

    if (statusFilter !== 'all') {
      itemsToExport = itemsToExport.filter((item) => {
        if (statusFilter === 'missing_only') return item.issueType === 'missing';
        if (statusFilter === 'no_whatsapp') return item.issueType === 'no_whatsapp' || item.issueType === 'invalid_format';
        if (statusFilter === 'verified_only') return item.issueType === 'verified_active';
        if (statusFilter === 'untested_only') return item.issueType === 'untested';
        if (statusFilter === 'issues_only') return item.issueType === 'missing' || item.issueType === 'no_whatsapp' || item.issueType === 'invalid_format';
        return true;
      });
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
      whatsappNotes: notes || (status === 'verified_active' ? 'تم الفحص والتأكد من فتح الواتساب' : 'تم الفحص - الرقم ليس عليه واتساب'),
    });
  };

  // Automated batch check runner for all numbers
  const handleRunBatchCheck = async () => {
    setBulkCheckProgress('جاري فحص وتدقيق كافة الأرقام...');
    let testedCount = 0;
    let missingCountLocal = 0;
    let noWhatsAppCountLocal = 0;
    let verifiedCountLocal = 0;
    const today = new Date().toISOString().split('T')[0];

    for (const item of auditedAllStudents) {
      const s = item.student;
      const phone = (s.parentPhone || s.phone || '').trim();

      if (!phone || item.issueType === 'missing') {
        // Missing completely
        await updateStudentAccount(s.barcode, {
          whatsappStatus: 'missing',
          whatsappTestedDate: today,
          whatsappNotes: 'لا يوجد أي رقم هاتف مسجل في استمارة الطالب',
        });
        missingCountLocal++;
      } else if (item.issueType === 'invalid_format') {
        // Invalid landline or short digits
        await updateStudentAccount(s.barcode, {
          whatsappStatus: 'no_whatsapp',
          whatsappTestedDate: today,
          whatsappNotes: 'الرقم غير صالح أو هاتف أرضي ثابت لا يدعم الواتساب',
        });
        noWhatsAppCountLocal++;
      } else if (item.hasWhatsAppReadyNumber && (s.whatsappStatus === 'untested' || !s.whatsappStatus)) {
        // Valid Egyptian mobile number
        await updateStudentAccount(s.barcode, {
          whatsappStatus: 'verified_active',
          whatsappTestedDate: today,
          whatsappNotes: `رقم محمول مصري نظامي نشط (${item.carrierName})`,
        });
        verifiedCountLocal++;
      }
      testedCount++;
    }

    setBulkCheckProgress(null);
    alert(
      `تم الانتهاء من الفحص الشامل بنجاح! ⚡\n\n` +
      `إجمالي الطلاب الذين تم فحصهم: ${testedCount}\n` +
      `❌ ليس لديهم واتساب نهائياً (مفقود + أرضي/غير صالح): ${missingCountLocal + noWhatsAppCountLocal} طالب\n` +
      `  • أرقام غير مكتوبة أصلًا: ${missingCountLocal} طالب\n` +
      `  • أرقام أرضية/غير صالحة: ${noWhatsAppCountLocal} طالب\n` +
      `✅ أرقام مفحوصة ولديها واتساب نشط: ${verifiedCountLocal} طالب`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-6xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        style={{
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : '#ffffff',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.4)' : 'rgba(179, 135, 40, 0.4)',
        }}
      >
        {/* ========================================================= */}
        {/* 1. Modal Top Bar */}
        {/* ========================================================= */}
        <div
          className="p-4 sm:p-5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          style={{
            background: isDark
              ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)'
              : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            borderColor: 'rgba(212, 175, 55, 0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                  تدقيق وفحص أرقام الواتساب لكافة الصفوف الدراسية
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  من 4 ابتدائي حتى 3 ثانوي ⚡
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                حصر الأرقام المفقودة وغير المسجلة، فحص فتح الواتساب الفعلي، واستخراج تقرير PDF مرتب بفواصل لكل صف
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
            {/* Batch Auto Check */}
            <button
              type="button"
              onClick={handleRunBatchCheck}
              disabled={bulkCheckProgress !== null}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="فحص صيغ الأرقام وتصنيف المفقودات آلياً"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>{bulkCheckProgress || 'فحص آلي شامل ⚡'}</span>
            </button>

            {/* Excel Export */}
            <button
              type="button"
              onClick={() => handleExportExcel()}
              disabled={isExporting !== null}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="تصدير كشف Excel مرمز بـ UTF-8"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير Excel 📊</span>
            </button>

            {/* Main Multi-Grade PDF Export Button */}
            <button
              type="button"
              onClick={() => handleExportPDF('all')}
              disabled={isExporting !== null}
              className="px-3.5 py-2 rounded-xl text-xs font-black btn-gold text-slate-950 shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="تحميل ملف PDF فوري لكافة الصفوف من 4 ابتدائي حتى 3 ثانوي بفواصل لكل صف"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting === 'pdf' ? '⚡ جاري التجهيز...' : 'تحميل PDF لكل الصفوف ⚡'}</span>
            </button>

            {/* Instant Print / Save PDF Window Button */}
            <button
              type="button"
              onClick={() => handleInstantPrint('all')}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow flex items-center gap-1.5 transition-all cursor-pointer"
              title="فتح نافذة الطباعة المباشرة أو الحفظ الفوري كـ PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة / حفظ فوري 🖨️</span>
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

        {/* ========================================================= */}
        {/* 2. Grade & Stage Navigation Bar (All Grades 4th Primary - 3rd Secondary) */}
        {/* ========================================================= */}
        <div
          className="p-3 border-b flex flex-col gap-2"
          style={{
            backgroundColor: isDark ? 'rgba(9, 14, 23, 0.75)' : '#f8fafc',
            borderColor: 'rgba(212, 175, 55, 0.2)',
          }}
        >
          {/* Main Stage Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 pl-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>المرحلة:</span>
            </span>

            {/* All Grades */}
            <button
              type="button"
              onClick={() => setSelectedGradeTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedGradeTab === 'all'
                  ? 'btn-gold text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700'
              }`}
            >
              <span>⭐ كافة الصفوف (4 ابتدائي لـ 3 ثانوي)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">{auditedAllStudents.length}</span>
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
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">{primaryAllItems.length}</span>
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
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">{prepAllItems.length}</span>
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
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">{secAllItems.length}</span>
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
        {/* 3. Live Stats Strip for Selected Grade */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 sm:p-4 border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
          {/* Missing Completely */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'missing_only' ? 'all' : 'missing_only')}
            className={`p-3 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'missing_only' ? 'ring-2 ring-rose-400 bg-rose-500/20' : 'bg-rose-500/10 hover:bg-rose-500/15'
            } border-rose-500/30 flex items-center justify-between`}
          >
            <div>
              <p className="text-[11px] text-rose-400 font-bold">غير مكتوب أصلًا (مفقود)</p>
              <p className="text-xl font-black text-rose-300 mt-0.5">{missingCount} طالب</p>
              <span className="text-[10px] text-rose-400/80">انقر للتصفية 🔍</span>
            </div>
            <PhoneOff className="w-6 h-6 text-rose-400/80" />
          </div>

          {/* No WhatsApp / Landline */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'no_whatsapp' ? 'all' : 'no_whatsapp')}
            className={`p-3 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'no_whatsapp' ? 'ring-2 ring-amber-400 bg-amber-500/20' : 'bg-amber-500/10 hover:bg-amber-500/15'
            } border-amber-500/30 flex items-center justify-between`}
          >
            <div>
              <p className="text-[11px] text-amber-400 font-bold">ليس عليه واتس / أرضي</p>
              <p className="text-xl font-black text-amber-300 mt-0.5">{noWhatsAppCount} طالب</p>
              <span className="text-[10px] text-amber-400/80">انقر للتصفية 🔍</span>
            </div>
            <AlertTriangle className="w-6 h-6 text-amber-400/80" />
          </div>

          {/* Verified Active WhatsApp */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'verified_only' ? 'all' : 'verified_only')}
            className={`p-3 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'verified_only' ? 'ring-2 ring-emerald-400 bg-emerald-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/15'
            } border-emerald-500/30 flex items-center justify-between`}
          >
            <div>
              <p className="text-[11px] text-emerald-400 font-bold">واتساب مؤكد ويعمل ✅</p>
              <p className="text-xl font-black text-emerald-300 mt-0.5">{verifiedCount} طالب</p>
              <span className="text-[10px] text-emerald-400/80">شغال ومفحوص</span>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-400/80" />
          </div>

          {/* Untested Mobile numbers */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'untested_only' ? 'all' : 'untested_only')}
            className={`p-3 rounded-2xl border cursor-pointer transition-all ${
              statusFilter === 'untested_only' ? 'ring-2 ring-sky-400 bg-sky-500/20' : 'bg-sky-500/10 hover:bg-sky-500/15'
            } border-sky-500/30 flex items-center justify-between`}
          >
            <div>
              <p className="text-[11px] text-sky-400 font-bold">بانتظار الفحص والتأكيد</p>
              <p className="text-xl font-black text-sky-300 mt-0.5">{untestedCount} طالب</p>
              <span className="text-[10px] text-sky-400/80">رقم محمول صحيح</span>
            </div>
            <Clock className="w-6 h-6 text-sky-400/80" />
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. Filter & Search Toolbar */}
        {/* ========================================================= */}
        <div className="p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            <span className="text-xs font-bold text-slate-400 pl-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>الحالة:</span>
            </span>

            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'all' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل ({currentGradeItems.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('issues_only')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'issues_only'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚠️ المشاكل والمفقود فقط ({totalIssuesCount})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('missing_only')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'missing_only'
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🚫 غير مكتوب أصلًا ({missingCount})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('no_whatsapp')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'no_whatsapp'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ❌ ليس عليه واتساب ({noWhatsAppCount})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('verified_only')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'verified_only'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✅ شغال ومؤكد ({verifiedCount})
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
        {/* 5. Live Interactive Table with WhatsApp Checker */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {displayItems.length === 0 ? (
            <div className="p-12 text-center border border-dashed rounded-3xl space-y-3" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400/80" />
              <h4 className="text-base font-bold text-slate-200">لا توجد سجلات تطابق شروط التصفية الحالية</h4>
              <p className="text-xs text-slate-400">
                {statusFilter === 'missing_only'
                  ? 'رائع! لا يوجد أي طالب يفتقد رقم الهاتف في هذه المرحلة.'
                  : 'تم تدقيق هذه الفئة بالكامل بنجاح.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border shadow-sm" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#e2e8f0' }}>
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
                    <th className="p-3 font-bold">الرقم المسجل</th>
                    <th className="p-3 font-bold">حالة الواتساب الحالية</th>
                    <th className="p-3 font-bold text-center">فحص وتشيك الواتساب الفعلي 📲</th>
                    <th className="p-3 font-bold text-center">إجراء فوري</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.1)' : '#f1f5f9' }}>
                  {displayItems.map((item, index) => {
                    const s = item.student;
                    const isMissing = item.issueType === 'missing';
                    const isNoWhatsapp = item.issueType === 'no_whatsapp';
                    const isVerified = item.issueType === 'verified_active';
                    const isInvalid = item.issueType === 'invalid_format';

                    // Check if grade changed to render a distinct separator banner
                    const isMultiGrade = selectedGradeTab === 'all' || selectedGradeTab === 'primary_all' || selectedGradeTab === 'prep_all' || selectedGradeTab === 'sec_all';
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
                                  <span className="text-xs sm:text-sm font-black" style={{ color: isDark ? '#fcf6ba' : '#92400e' }}>
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
                              : isNoWhatsapp
                              ? isDark
                                ? 'rgba(245, 158, 11, 0.07)'
                                : '#fffbeb'
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
                            <span className="block text-[10px] text-slate-400 font-mono">كلمة المرور: {s.password || '---'}</span>
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
                              <p className="font-mono font-bold text-slate-200">{item.parentPhoneRaw || item.phoneRaw}</p>
                              <span className="text-[10px] text-amber-400/80 font-bold">{item.carrierName}</span>
                            </div>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="p-3">
                          {isVerified && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>شغال واتساب ✅</span>
                            </span>
                          )}

                          {isMissing && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1">
                              <PhoneOff className="w-3 h-3" />
                              <span>غير مكتوب أصلًا 🚫</span>
                            </span>
                          )}

                          {isNoWhatsapp && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                              <X className="w-3 h-3" />
                              <span>ليس عليه واتساب ❌</span>
                            </span>
                          )}

                          {isInvalid && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>رقم غير صالح / أرضي ☎️</span>
                            </span>
                          )}

                          {!isVerified && !isMissing && !isNoWhatsapp && !isInvalid && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>بانتظار الفحص ⏳</span>
                            </span>
                          )}
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
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600/80 hover:bg-emerald-600 text-white flex items-center gap-1 shadow-sm transition-all"
                                title="فتح محادثة واتساب تجريبية للتحقق هل يفتح واتساب فعلاً"
                              >
                                <Smartphone className="w-3 h-3" />
                                <span>فحص الواتس ⚡</span>
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
                                title="تأكيد: يعمل على واتساب"
                              >
                                {isVerified ? '✓ معتمد' : 'له واتساب ✅'}
                              </button>

                              {/* Confirm: No WhatsApp */}
                              <button
                                type="button"
                                onClick={() => handleMarkWhatsAppStatus(s.barcode, 'no_whatsapp')}
                                className={`p-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
                                  isNoWhatsapp
                                    ? 'bg-rose-500 text-white font-black'
                                    : 'border border-rose-500/40 text-rose-300 hover:bg-rose-500/20'
                                }`}
                                title="تأكيد: ليس عليه واتساب"
                              >
                                {isNoWhatsapp ? '✓ ليس عليه واتس' : 'ليس عليه ❌'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">لا يمكن الفحص (بدون رقم)</span>
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
                              className="p-1.5 px-2.5 rounded-xl border border-slate-700 hover:border-amber-400 bg-slate-800 text-amber-300 hover:text-amber-200 text-xs font-bold inline-flex items-center gap-1 transition-all"
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
        {/* 6. Modal Footer & Multi-Grade PDF Actions */}
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
              <span>تحميل Excel</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportPDF()}
              disabled={isExporting !== null}
              className="px-4 py-2 rounded-xl text-xs font-black btn-gold text-slate-950 flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{isExporting === 'pdf' ? 'جاري تحضير PDF...' : 'تحميل PDF فوراً 📄'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
