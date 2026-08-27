import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { StudentData, GRADE_ORDER } from '../types';
import { SCHOOL_TEACHER_NAME, normalizeDigits } from '../context/SystemContext';

export interface PhoneAuditItem {
  student: StudentData;
  issueType: 'missing' | 'invalid_format' | 'untested' | 'verified_active' | 'no_whatsapp';
  carrierName: string;
  issueDescription: string;
  phoneRaw: string;
  parentPhoneRaw: string;
  formattedPhone: string;
  hasWhatsAppReadyNumber: boolean;
  whatsappLink: string;
  statusBadgeText: string;
  statusBadgeColor: string;
}

export const SEQUENTIAL_GRADES = [
  { grade: 'الصف الرابع الابتدائي', label: 'الصف الرابع الابتدائي', icon: '🎒', stage: 'المرحلة الابتدائية' },
  { grade: 'الصف الخامس الابتدائي', label: 'الصف الخامس الابتدائي', icon: '📘', stage: 'المرحلة الابتدائية' },
  { grade: 'الصف السادس الابتدائي', label: 'الصف السادس الابتدائي', icon: '📗', stage: 'المرحلة الابتدائية' },
  { grade: 'الصف الأول الإعدادي', label: 'الصف الأول الإعدادي', icon: '📐', stage: 'المرحلة الإعدادية' },
  { grade: 'الصف الثاني الإعدادي', label: 'الصف الثاني الإعدادي', icon: '📏', stage: 'المرحلة الإعدادية' },
  { grade: 'الصف الثالث الإعدادي', label: 'الصف الثالث الإعدادي (الشهادة الإعدادية)', icon: '📝', stage: 'المرحلة الإعدادية' },
  { grade: 'الصف الأول الثانوي', label: 'الصف الأول الثانوي', icon: '🔬', stage: 'المرحلة الثانوية' },
  { grade: 'الصف الثاني الثانوي', label: 'الصف الثاني الثانوي', icon: '💻', stage: 'المرحلة الثانوية' },
  { grade: 'الصف الثالث الثانوي', label: 'الصف الثالث الثانوي (الثانوية العامة)', icon: '🎓', stage: 'المرحلة الثانوية' },
] as const;

/**
 * Validates Egyptian mobile numbers and carrier
 * Vodafone: 010
 * Etisalat: 011
 * Orange: 012
 * WE: 015
 */
export function analyzeStudentPhoneStatus(student: StudentData): PhoneAuditItem {
  const rawParent = (student.parentPhone || '').trim();
  const rawStudent = (student.phone || '').trim();

  const chosenRaw = rawParent || rawStudent;
  const digits = normalizeDigits(chosenRaw).replace(/\D/g, '');

  let issueType: PhoneAuditItem['issueType'] = 'missing';
  let carrierName = 'غير محدد';
  let issueDescription = '';
  let formattedPhone = 'غير مسجل';
  let hasWhatsAppReadyNumber = false;
  let whatsappLink = '';
  let statusBadgeText = '🚫 غير مسجل أصلًا';
  let statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';

  if (!chosenRaw || digits.length === 0) {
    issueType = 'missing';
    issueDescription = 'لا يوجد أي رقم هاتف مسجل للطالب أو ولي أمره (خانة فارغة)';
    statusBadgeText = '🚫 غير مكتوب أصلًا';
    statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  } else {
    let localNum = digits;
    if (digits.startsWith('20') && digits.length === 12) {
      localNum = '0' + digits.substring(2);
    } else if (digits.startsWith('0020') && digits.length === 14) {
      localNum = '0' + digits.substring(4);
    }

    const isValidEgyptianMobile = /^01[0125]\d{8}$/.test(localNum);

    if (isValidEgyptianMobile) {
      hasWhatsAppReadyNumber = true;
      formattedPhone = localNum;
      whatsappLink = `https://wa.me/2${localNum}?text=${encodeURIComponent(`السلام عليكم ورحمة الله وبركاته، تحياتنا من منصة ${SCHOOL_TEACHER_NAME} بخصوص الطالب/ة ${student.name}.`)}`;

      const prefix = localNum.substring(0, 3);
      if (prefix === '010') carrierName = 'فودافون مصر';
      else if (prefix === '011') carrierName = 'اتصالات مصر';
      else if (prefix === '012') carrierName = 'أورانج مصر';
      else if (prefix === '015') carrierName = 'وي (WE)';

      // Check stored WhatsApp status if already tested
      if (student.whatsappStatus === 'verified_active') {
        issueType = 'verified_active';
        issueDescription = 'الرقم مفحوص وشغال على الواتساب بنجاح ✅';
        statusBadgeText = '✅ واتساب يعمل وشغال';
        statusBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      } else if (student.whatsappStatus === 'no_whatsapp') {
        issueType = 'no_whatsapp';
        issueDescription = 'تم فحص الرقم وتبين أنه ليس عليه حساب واتساب ❌';
        statusBadgeText = '❌ ليس عليه واتساب';
        statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      } else {
        issueType = 'untested';
        issueDescription = `رقم محمول صحيح (${carrierName}) - بانتظار الفحص وتأكيد الواتساب`;
        statusBadgeText = '⏳ بانتظار الفحص';
        statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      }
    } else if (digits.length < 10 || digits.length > 13) {
      issueType = 'invalid_format';
      issueDescription = `رقم غير مكتمل أو غير صالح (${digits.length} أرقام بدلاً من 11 رقم محمول)`;
      formattedPhone = chosenRaw;
      statusBadgeText = '⚠️ رقم ناقص أو غير صالح';
      statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    } else {
      issueType = 'invalid_format';
      carrierName = 'هاتف أرضي / غير محمول';
      issueDescription = 'رقم أرضي أو لا يبدأ بمفتاح المحمول المعتمد (010 / 011 / 012 / 015)';
      formattedPhone = chosenRaw;
      statusBadgeText = '☎️ أرضي / غير محمول';
      statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  }

  return {
    student,
    issueType,
    carrierName,
    issueDescription,
    phoneRaw: rawStudent,
    parentPhoneRaw: rawParent,
    formattedPhone,
    hasWhatsAppReadyNumber,
    whatsappLink,
    statusBadgeText,
    statusBadgeColor,
  };
}

/**
 * Filter students with phone/whatsapp issues or by grade
 */
export function filterPhoneAuditList(
  students: StudentData[],
  gradeFilter: string = 'all',
  statusFilter: 'all' | 'issues_only' | 'missing_only' | 'no_whatsapp' | 'verified_only' | 'untested_only' = 'all'
): PhoneAuditItem[] {
  let list = students.map(analyzeStudentPhoneStatus);

  // Grade filter
  if (gradeFilter !== 'all') {
    if (gradeFilter === 'primary_all') {
      // 4th + 5th + 6th
      list = list.filter(
        (item) =>
          item.student.groupGrade === 'الصف الرابع الابتدائي' ||
          item.student.groupGrade === 'الصف الخامس الابتدائي' ||
          item.student.groupGrade === 'الصف السادس الابتدائي'
      );
    } else if (gradeFilter === 'prep_all') {
      // Prep 1 + 2 + 3
      list = list.filter(
        (item) =>
          item.student.groupGrade === 'الصف الأول الإعدادي' ||
          item.student.groupGrade === 'الصف الثاني الإعدادي' ||
          item.student.groupGrade === 'الصف الثالث الإعدادي'
      );
    } else if (gradeFilter === 'sec_all') {
      // Sec 1 + 2 + 3
      list = list.filter(
        (item) =>
          item.student.groupGrade === 'الصف الأول الثانوي' ||
          item.student.groupGrade === 'الصف الثاني الثانوي' ||
          item.student.groupGrade === 'الصف الثالث الثانوي'
      );
    } else {
      list = list.filter((item) => item.student.groupGrade === gradeFilter);
    }
  }

  // Status filter
  if (statusFilter === 'issues_only') {
    list = list.filter((item) => item.issueType === 'missing' || item.issueType === 'invalid_format' || item.issueType === 'no_whatsapp');
  } else if (statusFilter === 'missing_only') {
    list = list.filter((item) => item.issueType === 'missing');
  } else if (statusFilter === 'no_whatsapp') {
    list = list.filter((item) => item.issueType === 'no_whatsapp' || item.issueType === 'invalid_format');
  } else if (statusFilter === 'verified_only') {
    list = list.filter((item) => item.issueType === 'verified_active');
  } else if (statusFilter === 'untested_only') {
    list = list.filter((item) => item.issueType === 'untested');
  }

  return list;
}

/**
 * Export data as Excel (.csv with UTF-8 BOM for Arabic support in MS Excel)
 */
export function exportPhoneAuditToExcel(
  items: PhoneAuditItem[],
  gradeTitle = 'كشف_هواتف_الطلاب'
): void {
  const headers = [
    'م',
    'اسم الطالب',
    'كود الباركود',
    'المرحلة الدراسية',
    'مواعيد المجموعة',
    'هاتف الطالب المسجل',
    'هاتف ولي الأمر المسجل',
    'شبكة المحمول',
    'حالة الواتساب',
    'تفاصيل الفحص والملاحظات',
    'حالة الحساب',
  ];

  const rows = items.map((item, index) => {
    const s = item.student;
    return [
      index + 1,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.barcode}"`,
      `"${s.groupGrade}"`,
      `"${s.groupDays}"`,
      `"${item.phoneRaw || 'غير مسجل'}"`,
      `"${item.parentPhoneRaw || 'غير مسجل'}"`,
      `"${item.carrierName}"`,
      `"${item.statusBadgeText}"`,
      `"${item.issueDescription.replace(/"/g, '""')}"`,
      `"${s.accountStatus === 'frozen' ? 'مجمد' : 'نشط'}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  const cleanGradeTitle = gradeTitle.replace(/\s+/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${cleanGradeTitle}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to generate badge HTML for a student row
 */
function getBadgeHtml(issueType: PhoneAuditItem['issueType']): string {
  if (issueType === 'verified_active') {
    return `<span style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10.5px; background: #dcfce7; color: #15803d; border: 1px solid #86efac;">✅ شغال واتساب</span>`;
  } else if (issueType === 'missing') {
    return `<span style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10.5px; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;">🚫 بدون رقم أصلًا</span>`;
  } else if (issueType === 'no_whatsapp') {
    return `<span style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10.5px; background: #fef3c7; color: #b45309; border: 1px solid #fcd34d;">❌ لا يوجد واتساب</span>`;
  } else if (issueType === 'invalid_format') {
    return `<span style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10.5px; background: #fef3c7; color: #b45309; border: 1px solid #fcd34d;">⚠️ غير صالح / أرضي</span>`;
  }
  return `<span style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10.5px; background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc;">⏳ بانتظار الفحص</span>`;
}

/**
 * High-Speed & High-Resolution Discrete Page HTML-to-PDF Generation
 * Guarantees that NO student row or name is ever split across two pages.
 * Each page is rendered as an independent A4 container with exact fixed rows.
 */
export async function exportPhoneAuditToPDF(
  items: PhoneAuditItem[],
  gradeTitle = 'كافة الصفوف الدراسية (من الصف الرابع الابتدائي حتى الصف الثالث الثانوي)',
  onProgress?: (msg: string) => void
): Promise<void> {
  const dateFormatted = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate global statistics
  const total = items.length;
  const verifiedCount = items.filter((i) => i.issueType === 'verified_active').length;
  const missingCount = items.filter((i) => i.issueType === 'missing').length;
  const invalidOrNoCount = items.filter((i) => i.issueType === 'no_whatsapp' || i.issueType === 'invalid_format').length;
  const untestedCount = items.filter((i) => i.issueType === 'untested').length;

  // Determine which grades to display
  const uniqueGradesInItems = Array.from(new Set(items.map((i) => i.student.groupGrade)));
  const isMultiGrade = uniqueGradesInItems.length > 1 || gradeTitle.includes('كافة') || gradeTitle.includes('جميع') || gradeTitle.includes('المرحلة');

  // Build the list of grades in exact sequential order (Primary 4 -> Secondary 3)
  const gradesToRender = isMultiGrade
    ? SEQUENTIAL_GRADES.filter((g) => {
        if (gradeTitle.includes('الابتدائية')) return g.stage === 'المرحلة الابتدائية';
        if (gradeTitle.includes('الإعدادية')) return g.stage === 'المرحلة الإعدادية';
        if (gradeTitle.includes('الثانوية')) return g.stage === 'المرحلة الثانوية';
        return true;
      })
    : SEQUENTIAL_GRADES.filter((g) => uniqueGradesInItems.includes(g.grade));

  // Build discrete pages to ensure no student row is ever cut across pages
  interface PagePayload {
    pageNumber: number;
    gradeConfig: (typeof SEQUENTIAL_GRADES)[number];
    itemsChunk: PhoneAuditItem[];
    startIndex: number;
    totalGradeStudents: number;
    isCoverPage: boolean;
  }

  const pages: PagePayload[] = [];
  const ROWS_PER_COVER_PAGE = 10; // First page has large top stats banner
  const ROWS_PER_SUBSEQUENT_PAGE = 15; // Regular pages have compact header

  let isFirstPageGlobal = true;

  for (const gradeConfig of gradesToRender) {
    const gradeItems = items.filter((i) => i.student.groupGrade === gradeConfig.grade);
    
    if (gradeItems.length === 0) {
      if (!isMultiGrade || uniqueGradesInItems.includes(gradeConfig.grade)) {
        pages.push({
          pageNumber: pages.length + 1,
          gradeConfig,
          itemsChunk: [],
          startIndex: 0,
          totalGradeStudents: 0,
          isCoverPage: isFirstPageGlobal,
        });
        isFirstPageGlobal = false;
      }
      continue;
    }

    let cursor = 0;
    while (cursor < gradeItems.length) {
      const isCover = isFirstPageGlobal;
      const pageSize = isCover ? ROWS_PER_COVER_PAGE : ROWS_PER_SUBSEQUENT_PAGE;
      const chunk = gradeItems.slice(cursor, cursor + pageSize);

      pages.push({
        pageNumber: pages.length + 1,
        gradeConfig,
        itemsChunk: chunk,
        startIndex: cursor,
        totalGradeStudents: gradeItems.length,
        isCoverPage: isCover,
      });

      cursor += pageSize;
      isFirstPageGlobal = false;
    }
  }

  if (pages.length === 0) {
    alert('لا توجد بيانات مطابقة للتصدير');
    return;
  }

  const totalPages = pages.length;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Create temporary container for discrete page rendering
  const container = document.createElement('div');
  container.id = 'pdf-discrete-page-host';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '1000px';
  container.style.height = '707px';
  container.style.zIndex = '999999';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  try {
    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const page = pages[pIdx];
      if (onProgress) {
        onProgress(`جاري إنشاء صفحة ${pIdx + 1} من ${totalPages}...`);
      }

      const gradeTotal = page.totalGradeStudents;
      const gVerified = items.filter((i) => i.student.groupGrade === page.gradeConfig.grade && i.issueType === 'verified_active').length;
      const gIssues = items.filter((i) => i.student.groupGrade === page.gradeConfig.grade && (i.issueType === 'missing' || i.issueType === 'no_whatsapp' || i.issueType === 'invalid_format')).length;

      let topHeaderHtml = '';
      if (page.isCoverPage) {
        topHeaderHtml = `
          <!-- Master Header with Stats -->
          <div style="background: #0f172a; padding: 10px 16px; border-radius: 8px; color: #ffffff; margin-bottom: 8px; border-bottom: 3px solid #d4af37;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="background: rgba(212, 175, 55, 0.2); color: #fcf6ba; border: 1px solid rgba(212, 175, 55, 0.4); padding: 1px 8px; border-radius: 10px; font-size: 9px; font-weight: bold;">
                    التقرير المعتمد للاتصال والمتابعة
                  </span>
                  <h1 style="margin: 0; font-size: 16px; font-weight: 900; color: #fcf6ba;">
                    منظومة ${SCHOOL_TEACHER_NAME} التعليمية
                  </h1>
                </div>
                <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
                  كشف حصر وتدقيق أرقام هواتف الطلاب والواتساب | النطاق: <strong style="color: #fef08a;">${gradeTitle}</strong> (${dateFormatted})
                </div>
              </div>
              <div style="text-align: center; background: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.35); padding: 4px 12px; border-radius: 6px;">
                <div style="font-size: 9px; color: #fef08a;">إجمالي الطلاب</div>
                <div style="font-size: 16px; font-weight: 900; color: #ffffff;">${total} طالب/ة</div>
              </div>
            </div>

            <!-- 4 Mini Global Stats -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 8px;">
              <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 8px; border-radius: 4px; text-align: center;">
                <span style="font-size: 9px; color: #6ee7b7;">واتساب نشط: </span>
                <strong style="font-size: 12px; color: #a7f3d0;">${verifiedCount}</strong>
              </div>
              <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 8px; border-radius: 4px; text-align: center;">
                <span style="font-size: 9px; color: #fca5a5;">بدون رقم: </span>
                <strong style="font-size: 12px; color: #fecaca;">${missingCount}</strong>
              </div>
              <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 8px; border-radius: 4px; text-align: center;">
                <span style="font-size: 9px; color: #fde68a;">ليس عليه واتس / أرضي: </span>
                <strong style="font-size: 12px; color: #fef08a;">${invalidOrNoCount}</strong>
              </div>
              <div style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 4px 8px; border-radius: 4px; text-align: center;">
                <span style="font-size: 9px; color: #bae6fd;">بانتظار التأكيد: </span>
                <strong style="font-size: 12px; color: #e0f2fe;">${untestedCount}</strong>
              </div>
            </div>
          </div>
        `;
      } else {
        topHeaderHtml = `
          <!-- Compact Subsequent Header -->
          <div style="background: #0f172a; padding: 6px 14px; border-radius: 6px; color: #ffffff; margin-bottom: 6px; border-bottom: 2px solid #d4af37; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="font-size: 13px; color: #fcf6ba;">منظومة ${SCHOOL_TEACHER_NAME} التعليمية</strong>
              <span style="color: #94a3b8; font-size: 10px;">| كشف تدقيق أرقام الواتساب المعتمد</span>
            </div>
            <div style="font-size: 10px; color: #cbd5e1;">تاريخ الاستخراج: ${dateFormatted}</div>
          </div>
        `;
      }

      // Grade Banner
      const gradeBannerHtml = `
        <div style="background: #1e293b; padding: 6px 12px; border-radius: 6px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 15px;">${page.gradeConfig.icon}</span>
            <strong style="font-size: 13px; color: #fcf6ba;">${page.gradeConfig.label}</strong>
            <span style="background: rgba(212, 175, 55, 0.25); color: #fef08a; padding: 1px 6px; border-radius: 8px; font-size: 9.5px;">
              ${page.gradeConfig.stage}
            </span>
          </div>
          <div style="display: flex; gap: 8px; font-size: 10px;">
            <span style="color: #cbd5e1;">إجمالي طلاب الصف: <strong style="color: #fff;">${gradeTotal}</strong></span>
            <span style="color: #6ee7b7;">واتساب شغال: <strong style="color: #a7f3d0;">${gVerified}</strong></span>
            <span style="color: #fca5a5;">مفقود/أرضي: <strong style="color: #fecaca;">${gIssues}</strong></span>
          </div>
        </div>
      `;

      // Table Content
      let tableRowsHtml = '';
      if (page.itemsChunk.length === 0) {
        tableRowsHtml = `
          <tr>
            <td colspan="8" style="padding: 24px; text-align: center; color: #64748b; font-size: 12px; font-weight: bold; background: #f8fafc;">
              ℹ️ لا يوجد طلاب مسجلين في هذا الصف
            </td>
          </tr>
        `;
      } else {
        tableRowsHtml = page.itemsChunk
          .map((item, localIdx) => {
            const globalRowIdx = page.startIndex + localIdx + 1;
            const s = item.student;
            const isEven = localIdx % 2 === 0;
            const rowBg = item.issueType === 'missing' ? '#fef2f2' : item.issueType === 'no_whatsapp' ? '#fffbeb' : isEven ? '#ffffff' : '#f8fafc';
            const phoneShow = item.parentPhoneRaw || item.phoneRaw || 'غير مسجل';
            const badgeHtml = getBadgeHtml(item.issueType);

            return `
              <tr style="background: ${rowBg}; height: 26px;">
                <td style="padding: 3px 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #64748b; font-size: 10px;">${globalRowIdx}</td>
                <td style="padding: 3px 4px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold; color: #b45309; font-size: 10px;">${s.barcode}</td>
                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a; font-size: 10.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 190px;">${s.name}</td>
                <td style="padding: 3px 6px; border: 1px solid #cbd5e1; color: #475569; font-size: 9.5px;">${s.groupDays}</td>
                <td style="padding: 3px 4px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold; direction: ltr; font-size: 10px; color: ${phoneShow === 'غير مسجل' ? '#ef4444' : '#0f172a'};">${phoneShow}</td>
                <td style="padding: 3px 4px; border: 1px solid #cbd5e1; text-align: center; color: #64748b; font-size: 9.5px;">${item.carrierName}</td>
                <td style="padding: 3px 4px; border: 1px solid #cbd5e1; text-align: center;">${badgeHtml}</td>
                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; font-size: 9.5px; color: #475569;">${item.issueDescription}</td>
              </tr>
            `;
          })
          .join('');
      }

      container.innerHTML = `
        <div style="width: 1000px; height: 707px; box-sizing: border-box; padding: 12px; background: #ffffff; color: #0f172a; font-family: Cairo, system-ui, -apple-system, sans-serif; direction: rtl; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            ${topHeaderHtml}
            ${gradeBannerHtml}

            <!-- Table with bounded rows -->
            <table style="width: 100%; border-collapse: collapse; text-align: right;">
              <thead>
                <tr style="background: #f1f5f9; color: #1e293b; border-bottom: 2px solid #cbd5e1; height: 26px;">
                  <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; width: 28px; font-weight: bold; font-size: 10px;">#</th>
                  <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; width: 70px; font-weight: bold; font-size: 10px;">الباركود</th>
                  <th style="padding: 4px 8px; border: 1px solid #cbd5e1; width: 190px; font-weight: bold; font-size: 10.5px;">اسم الطالب</th>
                  <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 120px; font-weight: bold; font-size: 10px;">المجموعة</th>
                  <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; width: 110px; font-weight: bold; font-size: 10px;">الرقم المسجل</th>
                  <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; width: 85px; font-weight: bold; font-size: 10px;">الشبكة</th>
                  <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; width: 115px; font-weight: bold; font-size: 10px;">حالة الواتساب</th>
                  <th style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 10px;">الملاحظات والتوصيات</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Page Footer -->
          <div style="padding: 4px 10px; background: #f8fafc; border-top: 1px solid #e2e8f0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #64748b; margin-top: auto;">
            <div>منظومة ${SCHOOL_TEACHER_NAME} التعليمية | كشف تدقيق هواتف وواتساب الطلاب المعتمد</div>
            <div style="font-weight: bold; color: #0f172a;">
              صفحة (${pIdx + 1}) من إجمالي (${totalPages})
            </div>
          </div>
        </div>
      `;

      // Fast single-page screenshot in ~60ms
      const canvas = await html2canvas(container, {
        scale: 1.25,
        useCORS: false,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1000,
        windowHeight: 707,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      if (pIdx > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    const cleanTitle = gradeTitle.replace(/[\/\s\\:*?"<>|]+/g, '_');
    const fileName = `كشف_أرقام_الواتساب_${cleanTitle}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Instant Native Print / Save to PDF View (0.01 seconds speed)
 * Guaranteed zero row cuts with strict CSS break-inside: avoid
 */
export function openInstantPrintView(
  items: PhoneAuditItem[],
  gradeTitle = 'كافة الصفوف الدراسية (من الصف الرابع الابتدائي حتى الصف الثالث الثانوي)'
): void {
  const dateFormatted = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const uniqueGradesInItems = Array.from(new Set(items.map((i) => i.student.groupGrade)));
  const isMultiGrade = uniqueGradesInItems.length > 1 || gradeTitle.includes('كافة') || gradeTitle.includes('جميع') || gradeTitle.includes('المرحلة');

  const gradesToRender = isMultiGrade
    ? SEQUENTIAL_GRADES.filter((g) => {
        if (gradeTitle.includes('الابتدائية')) return g.stage === 'المرحلة الابتدائية';
        if (gradeTitle.includes('الإعدادية')) return g.stage === 'المرحلة الإعدادية';
        if (gradeTitle.includes('الثانوية')) return g.stage === 'المرحلة الثانوية';
        return true;
      })
    : SEQUENTIAL_GRADES.filter((g) => uniqueGradesInItems.includes(g.grade));

  const gradeSectionsHtml = gradesToRender
    .map((gradeConfig) => {
      const gradeItems = items.filter((i) => i.student.groupGrade === gradeConfig.grade);
      return `
        <div class="grade-block" style="margin-top: 14px; page-break-inside: avoid; break-inside: avoid; border: 1.5px solid #0f172a; border-radius: 8px; overflow: hidden; margin-bottom: 12px;">
          <div style="background: #0f172a; color: #fff; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 13px; font-weight: bold;">
              ${gradeConfig.icon} ${gradeConfig.label} - <span style="color: #fef08a; font-size: 11px;">${gradeConfig.stage}</span>
            </div>
            <div style="font-size: 11px; color: #cbd5e1;">إجمالي طلاب الصف: ${gradeItems.length}</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: right;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 1.5px solid #cbd5e1;">
                <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; width: 30px;">#</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; width: 75px;">الباركود</th>
                <th style="padding: 5px 10px; border: 1px solid #cbd5e1; width: 210px;">اسم الطالب</th>
                <th style="padding: 5px 8px; border: 1px solid #cbd5e1; width: 140px;">المجموعة</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; width: 115px;">الرقم المسجل</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; width: 85px;">الشبكة</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">حالة الواتساب</th>
                <th style="padding: 5px 10px; border: 1px solid #cbd5e1;">الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${
                gradeItems.length === 0
                  ? `<tr><td colspan="8" style="padding: 12px; text-align: center; color: #64748b;">لا يوجد طلاب</td></tr>`
                  : gradeItems
                      .map((item, idx) => {
                        const s = item.student;
                        const phoneShow = item.parentPhoneRaw || item.phoneRaw || 'غير مسجل';
                        return `
                          <tr style="page-break-inside: avoid; break-inside: avoid; border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
                            <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${s.barcode}</td>
                            <td style="padding: 5px 10px; border: 1px solid #cbd5e1; font-weight: bold;">${s.name}</td>
                            <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">${s.groupDays}</td>
                            <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; direction: ltr; font-weight: bold;">${phoneShow}</td>
                            <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${item.carrierName}</td>
                            <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${item.statusBadgeText}</td>
                            <td style="padding: 5px 10px; border: 1px solid #cbd5e1; color: #475569;">${item.issueDescription}</td>
                          </tr>
                        `;
                      })
                      .join('')
              }
            </tbody>
          </table>
        </div>
      `;
    })
    .join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة الفورية');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>كشف تدقيق أرقام الواتساب - ${gradeTitle}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 8mm;
        }
        body { font-family: Cairo, Arial, sans-serif; direction: rtl; padding: 12px; color: #0f172a; margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        tr { page-break-inside: avoid !important; break-inside: avoid !important; }
        thead { display: table-header-group; }
        .grade-block { page-break-inside: avoid; break-inside: avoid; }
        @media print {
          body { padding: 0; }
          button { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">
        <div>
          <h2 style="margin: 0; font-size: 16px; color: #0f172a;">منظومة ${SCHOOL_TEACHER_NAME} التعليمية</h2>
          <div style="font-size: 12px; color: #475569; margin-top: 2px;">كشف تدقيق أرقام الهواتف والواتساب | ${gradeTitle} (${dateFormatted})</div>
        </div>
        <div style="text-align: left;">
          <button onclick="window.print()" style="background: #0f172a; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: inherit;">🖨️ طباعة الآن / حفظ PDF</button>
        </div>
      </div>
      ${gradeSectionsHtml}
      <script>
        setTimeout(() => { window.print(); }, 300);
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
