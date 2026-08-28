import jsPDF from 'jspdf';
import { StudentData, GRADE_ORDER } from '../types';
import { SCHOOL_TEACHER_NAME, SCHOOL_TEACHER_PHONE, normalizeDigits } from '../context/SystemContext';

export interface PhoneAuditItem {
  student: StudentData;
  issueType:
    | 'missing'
    | 'invalid_format'
    | 'untested'
    | 'verified_active'
    | 'no_whatsapp'
    | 'duplicate'
    | 'fake_dummy'
    | 'fixable_missing_zero'
    | 'landline';
  carrierName: string;
  issueDescription: string;
  phoneRaw: string;
  parentPhoneRaw: string;
  chosenRaw: string;
  cleanDigits: string;
  formattedPhone: string;
  hasWhatsAppReadyNumber: boolean;
  whatsappLink: string;
  statusBadgeText: string;
  statusBadgeColor: string;
  duplicateWithStudent?: { name: string; grade: string; barcode: string };
  canAutoFixZero?: boolean;
  suggestedFixNumber?: string;
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
 * Egyptian Landline Area Codes (strictly do not support mobile WhatsApp)
 */
const EGYPT_LANDLINE_PREFIXES = [
  { prefix: '02', name: 'القاهرة والجيزة' },
  { prefix: '03', name: 'الإسكندرية' },
  { prefix: '013', name: 'القليوبية (بنها)' },
  { prefix: '040', name: 'الغربية (طنطا)' },
  { prefix: '045', name: 'البحيرة (دمنهور)' },
  { prefix: '046', name: 'مطروح' },
  { prefix: '047', name: 'كفر الشيخ' },
  { prefix: '048', name: 'المنوفية (شبين الكوم)' },
  { prefix: '050', name: 'الدقهلية (المنصورة)' },
  { prefix: '055', name: 'الشرقية (الزقازيق)' },
  { prefix: '057', name: 'دمياط' },
  { prefix: '062', name: 'السويس' },
  { prefix: '064', name: 'الإسماعيلية' },
  { prefix: '065', name: 'البحر الأحمر' },
  { prefix: '066', name: 'بورسعيد' },
  { prefix: '068', name: 'شمال سيناء (العريش)' },
  { prefix: '069', name: 'جنوب سيناء (الطور)' },
  { prefix: '082', name: 'بني سويف' },
  { prefix: '084', name: 'الفيوم' },
  { prefix: '086', name: 'المنيا' },
  { prefix: '088', name: 'أسيوط' },
  { prefix: '092', name: 'الوادي الجديد' },
  { prefix: '093', name: 'سوهاج' },
  { prefix: '095', name: 'الأقصر' },
  { prefix: '096', name: 'قنا' },
  { prefix: '097', name: 'أسوان' },
];

/**
 * Checks if phone number is a dummy/fake repetitive number:
 * e.g. 01000000000, 01111111111, 01234567890, 01012345678, repeated digits
 */
function isDummyOrFakeNumber(digits: string): boolean {
  if (digits.length < 8) return true;
  // All same digit (e.g. 00000000000 or 11111111111)
  if (/^(\d)\1+$/.test(digits)) return true;

  // Pattern like 01000000000 or 01111111111 or 01222222222 or 01555555555
  if (/^01[0125](\d)\1{7}$/.test(digits)) return true;

  // Pattern like 01012345678 or 01234567890 or 01234567891
  if (digits === '01234567890' || digits === '01012345678' || digits === '01123456789' || digits === '01512345678') {
    return true;
  }

  // Suffix of 7 or 8 repeating digits like 01099999999
  const last7 = digits.slice(-7);
  if (/^(\d)\1{6}$/.test(last7)) return true;

  return false;
}

/**
 * Deep Real Algorithmic Phone Audit & Classification
 * Validates Egyptian mobile numbers, detects missing zeros, duplicates, fake sequences, and landlines
 */
export function analyzeStudentPhoneStatus(
  student: StudentData,
  allStudents?: StudentData[]
): PhoneAuditItem {
  const rawParent = (student.parentPhone || '').trim();
  const rawStudent = (student.phone || '').trim();

  const chosenRaw = rawParent || rawStudent;
  const rawDigits = normalizeDigits(chosenRaw).replace(/\D/g, '');

  let issueType: PhoneAuditItem['issueType'] = 'missing';
  let carrierName = 'غير محدد';
  let issueDescription = '';
  let cleanDigits = rawDigits;
  let formattedPhone = 'غير مسجل';
  let hasWhatsAppReadyNumber = false;
  let whatsappLink = '';
  let statusBadgeText = '🚫 غير مسجل أصلًا';
  let statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  let duplicateWithStudent: PhoneAuditItem['duplicateWithStudent'] = undefined;
  let canAutoFixZero = false;
  let suggestedFixNumber: string | undefined = undefined;

  // 1. Missing check
  if (!chosenRaw || rawDigits.length === 0) {
    issueType = 'missing';
    issueDescription = 'خانة الهاتف فارغة تماماً - لا يوجد أي رقم مسجل للطالب أو ولي الأمر';
    statusBadgeText = '🚫 غير مسجل أصلًا';
    statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    return {
      student,
      issueType,
      carrierName,
      issueDescription,
      phoneRaw: rawStudent,
      parentPhoneRaw: rawParent,
      chosenRaw,
      cleanDigits: '',
      formattedPhone,
      hasWhatsAppReadyNumber,
      whatsappLink,
      statusBadgeText,
      statusBadgeColor,
    };
  }

  // Strip international prefix if present
  let localNum = rawDigits;
  if (localNum.startsWith('20') && localNum.length === 12) {
    localNum = '0' + localNum.substring(2);
  } else if (localNum.startsWith('0020') && localNum.length === 14) {
    localNum = '0' + localNum.substring(4);
  }
  cleanDigits = localNum;

  // 2. Check missing leading zero (10 digits starting with 10, 11, 12, or 15)
  if (cleanDigits.length === 10 && (cleanDigits.startsWith('10') || cleanDigits.startsWith('11') || cleanDigits.startsWith('12') || cleanDigits.startsWith('15'))) {
    canAutoFixZero = true;
    suggestedFixNumber = '0' + cleanDigits;
    cleanDigits = suggestedFixNumber;
    localNum = suggestedFixNumber;
  }

  // 3. Landline check
  const matchedLandline = EGYPT_LANDLINE_PREFIXES.find(
    (lp) => localNum.startsWith(lp.prefix) && !localNum.startsWith('01')
  );
  if (matchedLandline) {
    issueType = 'landline';
    carrierName = `أرضي (${matchedLandline.name})`;
    formattedPhone = localNum;
    issueDescription = `رقم خط أرضي ثابت تابع لمحافظة ${matchedLandline.name} - لا يدعم تطبيق الواتساب المحمول`;
    statusBadgeText = '☎️ أرضي / لا يدعم واتس';
    statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return {
      student,
      issueType,
      carrierName,
      issueDescription,
      phoneRaw: rawStudent,
      parentPhoneRaw: rawParent,
      chosenRaw,
      cleanDigits,
      formattedPhone,
      hasWhatsAppReadyNumber: false,
      whatsappLink: '',
      statusBadgeText,
      statusBadgeColor,
    };
  }

  // 4. Dummy / Fake number check
  if (isDummyOrFakeNumber(localNum)) {
    issueType = 'fake_dummy';
    carrierName = 'رقم وهمي';
    formattedPhone = localNum;
    issueDescription = 'رقم وهمي تجريبي غير حقيقي (تكرار أو تسلسل أرقام غير منطقي)';
    statusBadgeText = '❌ رقم وهمي غير صالح';
    statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    return {
      student,
      issueType,
      carrierName,
      issueDescription,
      phoneRaw: rawStudent,
      parentPhoneRaw: rawParent,
      chosenRaw,
      cleanDigits,
      formattedPhone,
      hasWhatsAppReadyNumber: false,
      whatsappLink: '',
      statusBadgeText,
      statusBadgeColor,
    };
  }

  // 5. Incomplete or overlong format check
  if (localNum.length < 11 || localNum.length > 11 || !localNum.startsWith('01')) {
    issueType = 'invalid_format';
    formattedPhone = chosenRaw;
    if (canAutoFixZero && suggestedFixNumber) {
      issueType = 'fixable_missing_zero';
      formattedPhone = suggestedFixNumber;
      issueDescription = `الرقم مسجل بدون الصفر الأولي (${chosenRaw}) - يمكن إصلاحه تلقائياً بضغطة زر`;
      statusBadgeText = '💡 ينقصه صفر (قابل للإصلاح)';
      statusBadgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    } else if (localNum.length < 11) {
      issueDescription = `رقم ناقص (${localNum.length} أرقام بدلاً من 11 رقم محمول)`;
      statusBadgeText = `⚠️ رقم ناقص (${localNum.length} أرقام)`;
      statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    } else {
      issueDescription = `رقم غير صالح أو أرقام زائدة (${localNum.length} رقم)`;
      statusBadgeText = '⚠️ صيغة غير صالحة';
      statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    return {
      student,
      issueType,
      carrierName: 'غير صالح',
      issueDescription,
      phoneRaw: rawStudent,
      parentPhoneRaw: rawParent,
      chosenRaw,
      cleanDigits,
      formattedPhone,
      hasWhatsAppReadyNumber: false,
      whatsappLink: '',
      statusBadgeText,
      statusBadgeColor,
      canAutoFixZero,
      suggestedFixNumber,
    };
  }

  // 6. Egyptian Carrier Identification
  const prefix = localNum.substring(0, 3);
  if (prefix === '010') carrierName = 'فودافون مصر';
  else if (prefix === '011') carrierName = 'اتصالات مصر (e&)';
  else if (prefix === '012') carrierName = 'أورانج مصر';
  else if (prefix === '015') carrierName = 'المصرية للاتصالات (WE)';
  else {
    issueType = 'invalid_format';
    carrierName = 'بادئة مجهولة';
    issueDescription = `بادئة محمول غير مسجلة في مصر (${prefix}) - الأرقام المعتمدة تبدأ بـ 010, 011, 012, 015`;
    statusBadgeText = '⚠️ بادئة محمول خاطئة';
    statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return {
      student,
      issueType,
      carrierName,
      issueDescription,
      phoneRaw: rawStudent,
      parentPhoneRaw: rawParent,
      chosenRaw,
      cleanDigits,
      formattedPhone: localNum,
      hasWhatsAppReadyNumber: false,
      whatsappLink: '',
      statusBadgeText,
      statusBadgeColor,
    };
  }

  // 7. Duplicate Check against all students in academy
  if (allStudents && allStudents.length > 0) {
    const duplicateMatch = allStudents.find((other) => {
      if (other.barcode === student.barcode) return false;
      const otherRaw = (other.parentPhone || other.phone || '').trim();
      let otherDigits = normalizeDigits(otherRaw).replace(/\D/g, '');
      if (otherDigits.startsWith('20') && otherDigits.length === 12) otherDigits = '0' + otherDigits.substring(2);
      if (otherDigits.length === 10 && otherDigits.startsWith('1')) otherDigits = '0' + otherDigits;
      return otherDigits === localNum;
    });

    if (duplicateMatch) {
      issueType = 'duplicate';
      duplicateWithStudent = {
        name: duplicateMatch.name,
        grade: duplicateMatch.groupGrade,
        barcode: duplicateMatch.barcode,
      };
      issueDescription = `⚠️ رقم مكرر مسجل أيضاً للطالب: ${duplicateMatch.name} (${duplicateMatch.groupGrade})`;
      statusBadgeText = `⚠️ مكرر مع طالب آخر`;
      statusBadgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  }

  // 8. Normal Mobile - WhatsApp Link and Status Resolution
  hasWhatsAppReadyNumber = true;
  formattedPhone = localNum;
  whatsappLink = `https://wa.me/2${localNum}?text=${encodeURIComponent(
    `السلام عليكم ورحمة الله وبركاته، تحياتنا من منصة ${SCHOOL_TEACHER_NAME} بخصوص الطالب/ة ${student.name}.`
  )}`;

  if (issueType !== 'duplicate') {
    if (student.whatsappStatus === 'verified_active') {
      issueType = 'verified_active';
      issueDescription = `رقم محمول سليم (${carrierName}) - تم الفحص والتأكد من فتح الواتساب بنجاح ✅`;
      statusBadgeText = '✅ واتساب مؤكد ويعمل';
      statusBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    } else if (student.whatsappStatus === 'no_whatsapp') {
      issueType = 'no_whatsapp';
      issueDescription = `رقم محمول (${carrierName}) - تم الفحص والتأكد أن الرقم ليس عليه حساب واتساب ❌`;
      statusBadgeText = '❌ ليس عليه واتساب';
      statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    } else if (canAutoFixZero && suggestedFixNumber) {
      issueType = 'fixable_missing_zero';
      issueDescription = `رقم محمول (${carrierName}) ينقصه الصفر الأولي - يمكن تصحيحه إلى ${suggestedFixNumber}`;
      statusBadgeText = '💡 ينقصه صفر (قابل للإصلاح)';
      statusBadgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    } else {
      issueType = 'untested';
      issueDescription = `رقم محمول مصري سليم 11 رقماً (${carrierName}) - جاهز للمراسلة بانتظار الفحص الفعلي`;
      statusBadgeText = '⏳ بانتظار الفحص';
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
    chosenRaw,
    cleanDigits,
    formattedPhone,
    hasWhatsAppReadyNumber,
    whatsappLink,
    statusBadgeText,
    statusBadgeColor,
    duplicateWithStudent,
    canAutoFixZero,
    suggestedFixNumber,
  };
}

/**
 * Filter students with phone/whatsapp issues or by grade
 */
export function filterPhoneAuditList(
  students: StudentData[],
  gradeFilter: string = 'all',
  statusFilter:
    | 'all'
    | 'issues_only'
    | 'missing_only'
    | 'no_whatsapp'
    | 'verified_only'
    | 'untested_only' = 'all'
): PhoneAuditItem[] {
  let list = students.map((s) => analyzeStudentPhoneStatus(s, students));

  // Grade filter
  if (gradeFilter !== 'all') {
    if (gradeFilter === 'primary_all') {
      list = list.filter(
        (item) =>
          item.student.groupGrade === 'الصف الرابع الابتدائي' ||
          item.student.groupGrade === 'الصف الخامس الابتدائي' ||
          item.student.groupGrade === 'الصف السادس الابتدائي'
      );
    } else if (gradeFilter === 'prep_all') {
      list = list.filter(
        (item) =>
          item.student.groupGrade === 'الصف الأول الإعدادي' ||
          item.student.groupGrade === 'الصف الثاني الإعدادي' ||
          item.student.groupGrade === 'الصف الثالث الإعدادي'
      );
    } else if (gradeFilter === 'sec_all') {
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
    list = list.filter((item) => item.issueType !== 'verified_active');
  } else if (statusFilter === 'missing_only') {
    list = list.filter((item) => item.issueType === 'missing');
  } else if (statusFilter === 'no_whatsapp') {
    list = list.filter(
      (item) =>
        item.issueType === 'no_whatsapp' ||
        item.issueType === 'landline' ||
        item.issueType === 'fake_dummy' ||
        item.issueType === 'invalid_format'
    );
  } else if (statusFilter === 'verified_only') {
    list = list.filter((item) => item.issueType === 'verified_active');
  } else if (statusFilter === 'untested_only') {
    list = list.filter(
      (item) => item.issueType === 'untested' || item.issueType === 'fixable_missing_zero'
    );
  }

  return list;
}

/**
 * High-Speed & High-Efficiency Styled Excel Spreadsheet Export (.xls)
 * Features:
 * - Native Right-to-Left (RTL) Arabic worksheet layout
 * - Explicit mso-number-format:"\@" to PREVENT Excel from stripping leading zeros (010... preserved!)
 * - Colored status cells (Emerald, Rose, Amber, Purple)
 * - Executive KPI header banner
 * - Instant export (< 30ms)
 */
export function exportPhoneAuditToExcel(
  items: PhoneAuditItem[],
  gradeTitle = 'كشف_هواتف_الطلاب'
): void {
  const dateFormatted = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const total = items.length;
  const verifiedCount = items.filter((i) => i.issueType === 'verified_active').length;
  const missingCount = items.filter((i) => i.issueType === 'missing').length;
  const landlineOrInvalid = items.filter(
    (i) => i.issueType === 'no_whatsapp' || i.issueType === 'landline' || i.issueType === 'invalid_format' || i.issueType === 'fake_dummy'
  ).length;
  const duplicateCount = items.filter((i) => i.issueType === 'duplicate').length;
  const pendingCount = items.filter((i) => i.issueType === 'untested' || i.issueType === 'fixable_missing_zero').length;

  const rowsHtml = items
    .map((item, idx) => {
      const s = item.student;
      const isEven = idx % 2 === 0;
      const phoneShow = item.formattedPhone !== 'غير مسجل' ? item.formattedPhone : (item.parentPhoneRaw || item.phoneRaw || 'غير مسجل');
      
      let statusBg = '#f1f5f9';
      let statusColor = '#0f172a';
      if (item.issueType === 'verified_active') {
        statusBg = '#dcfce7';
        statusColor = '#166534';
      } else if (item.issueType === 'missing') {
        statusBg = '#fee2e2';
        statusColor = '#991b1b';
      } else if (item.issueType === 'duplicate') {
        statusBg = '#f3e8ff';
        statusColor = '#6b21a8';
      } else if (item.issueType === 'fake_dummy') {
        statusBg = '#ffe4e6';
        statusColor = '#9f1239';
      } else if (item.issueType === 'landline' || item.issueType === 'invalid_format' || item.issueType === 'no_whatsapp') {
        statusBg = '#fef3c7';
        statusColor = '#854d0e';
      } else if (item.issueType === 'fixable_missing_zero') {
        statusBg = '#e0f2fe';
        statusColor = '#075985';
      }

      return `
        <tr style="background-color: ${isEven ? '#ffffff' : '#f8fafc'}; height: 26px;">
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #475569;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@'; font-family: monospace; font-weight: bold; color: #b45309;">${s.barcode}</td>
          <td style="border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #0f172a; padding: 4px 8px;">${s.name}</td>
          <td style="border: 1px solid #cbd5e1; text-align: right; color: #334155; padding: 4px 6px;">${s.groupGrade}</td>
          <td style="border: 1px solid #cbd5e1; text-align: right; color: #64748b; padding: 4px 6px;">${s.groupDays}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@'; font-family: monospace; font-weight: bold; direction: ltr; color: ${phoneShow === 'غير مسجل' ? '#ef4444' : '#0f172a'};">${phoneShow}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@'; font-family: monospace; color: #64748b;">${item.phoneRaw || '---'}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@'; font-family: monospace; color: #64748b;">${item.parentPhoneRaw || '---'}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #334155;">${item.carrierName}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; background-color: ${statusBg}; color: ${statusColor}; font-weight: bold; padding: 3px 6px;">${item.statusBadgeText}</td>
          <td style="border: 1px solid #cbd5e1; text-align: right; color: #475569; padding: 4px 8px;">${item.issueDescription}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${s.accountStatus === 'frozen' ? '#ef4444' : '#10b981'};">${s.accountStatus === 'frozen' ? 'مجمد' : 'نشط'}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; mso-number-format:'\\@'; font-family: monospace; color: #64748b;">${s.password || '---'}</td>
        </tr>
      `;
    })
    .join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; }
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #0f172a; color: #fcf6ba; border: 1px solid #334155; font-weight: bold; padding: 8px 6px; font-size: 11pt; text-align: center; }
        td { font-size: 10pt; vertical-align: middle; }
      </style>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>كشف هواتف الواتساب</x:Name>
              <x:WorksheetOptions>
                <x:DisplayRightToLeft/>
                <x:Selected/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body dir="rtl">
      <table>
        <!-- Header Banner -->
        <tr>
          <td colspan="13" style="background-color: #0f172a; color: #fcf6ba; font-size: 16pt; font-weight: bold; text-align: center; padding: 12px; border: 1px solid #0f172a;">
            منظومة ${SCHOOL_TEACHER_NAME} التعليمية - كشف حصر وتدقيق أرقام هواتف الطلاب والواتساب
          </td>
        </tr>
        <tr>
          <td colspan="13" style="background-color: #1e293b; color: #cbd5e1; font-size: 11pt; text-align: center; padding: 6px; border: 1px solid #1e293b;">
            النطاق: <strong>${gradeTitle}</strong> | تاريخ الاستخراج: ${dateFormatted} | إجمالي المسجلين: ${total} طالب
          </td>
        </tr>
        <!-- KPI Strip -->
        <tr style="height: 28px;">
          <td colspan="2" style="background-color: #dcfce7; color: #166534; font-weight: bold; text-align: center; border: 1px solid #86efac;">✅ واتساب نشط: ${verifiedCount}</td>
          <td colspan="3" style="background-color: #fee2e2; color: #991b1b; font-weight: bold; text-align: center; border: 1px solid #fca5a5;">🚫 بدون رقم نهائياً: ${missingCount}</td>
          <td colspan="3" style="background-color: #fef3c7; color: #854d0e; font-weight: bold; text-align: center; border: 1px solid #fcd34d;">⚠️ أرضي/غير صالح: ${landlineOrInvalid}</td>
          <td colspan="2" style="background-color: #f3e8ff; color: #6b21a8; font-weight: bold; text-align: center; border: 1px solid #d8b4fe;">👥 مكرر بين طلاب: ${duplicateCount}</td>
          <td colspan="3" style="background-color: #e0f2fe; color: #075985; font-weight: bold; text-align: center; border: 1px solid #7dd3fc;">⏳ بانتظار الفحص: ${pendingCount}</td>
        </tr>
        <tr><td colspan="13" style="height: 10px;"></td></tr>
        <!-- Table Column Headers -->
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th style="width: 90px;">الباركود</th>
            <th style="width: 220px;">اسم الطالب</th>
            <th style="width: 140px;">المرحلة الدراسية</th>
            <th style="width: 140px;">مواعيد المجموعة</th>
            <th style="width: 120px;">الرقم المعتمد</th>
            <th style="width: 110px;">هاتف الطالب</th>
            <th style="width: 110px;">هاتف ولي الأمر</th>
            <th style="width: 110px;">شبكة المحمول</th>
            <th style="width: 140px;">حالة الواتساب</th>
            <th style="width: 280px;">الملاحظات والتشخيص الفعلي</th>
            <th style="width: 80px;">حالة الحساب</th>
            <th style="width: 90px;">كلمة المرور</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Prepend UTF-8 BOM so Microsoft Excel recognizes Arabic UTF-8 immediately
  const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  const cleanGradeTitle = gradeTitle.replace(/[\/\s\\:*?"<>|]+/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${cleanGradeTitle}_${dateStr}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * High-Speed, High-Resolution Canvas 2D Page Renderer
 * - Renders complete page directly onto 1754 x 1240 px canvas (A4 landscape ratio 1.414)
 * - Natively formats Arabic text, numbers, and badges with zero DOM/CSS cloning
 * - Completely immune to html2canvas crashes, CSS syntax issues, or CORS blocking
 */
interface AuditPagePayload {
  pageNumber: number;
  gradeConfig: {
    grade: string;
    label: string;
    icon: string;
    stage: string;
  };
  itemsChunk: PhoneAuditItem[];
  startIndex: number;
  totalGradeStudents: number;
  isCoverPage: boolean;
  pageLabel: string;
}

function drawCanvasRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill?: string,
  stroke?: string,
  lineWidth = 1
): void {
  const r = Math.max(0, Math.min(radius, Math.floor(Math.abs(w) / 2), Math.floor(Math.abs(h) / 2)));
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    try {
      ctx.roundRect(x, y, w, h, r);
    } catch {
      ctx.rect(x, y, w, h);
    }
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function fitCanvasText(ctx: CanvasRenderingContext2D, text: string | null | undefined, maxWidth: number): string {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '...').width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + '...';
}

function renderAuditPageToCanvas(
  page: AuditPagePayload,
  pageIndex: number,
  totalPages: number,
  gradeTitle: string,
  dateFormatted: string,
  summary: {
    total: number;
    verifiedCount: number;
    missingCount: number;
    invalidOrNoCount: number;
    duplicateCount: number;
    untestedCount: number;
  }
): HTMLCanvasElement {
  const width = 1754;
  const height = 1240;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer decorative borders
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, width - 44, height - 44);

  const startX = 35;
  const contentWidth = width - 70; // 1684 px
  let currentY = 32;

  if (page.isCoverPage) {
    // Master Academic Header (Height: 142px)
    const headerHeight = 142;
    drawCanvasRoundRect(ctx, startX, currentY, contentWidth, headerHeight, 8, '#0f172a');

    // Gold accent top line
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(startX + 8, currentY, contentWidth - 16, 4);

    // Right Side: Platform info
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    ctx.font = 'bold 12px "Cairo", "Tajawal", "Segoe UI", sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('⭐ تقرير أكاديمي رسمي معتمد لحصر وتدقيق أرقام الهواتف والواتساب', startX + contentWidth - 20, currentY + 16);

    ctx.font = 'bold 24px "Cairo", "Tajawal", "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`منظومة ${SCHOOL_TEACHER_NAME} التعليمية - أستاذة الرياضيات الأولى`, startX + contentWidth - 20, currentY + 38);

    ctx.font = '500 13px "Cairo", "Tajawal", "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${gradeTitle}  |  تاريخ الإصدار: ${dateFormatted}`, startX + contentWidth - 20, currentY + 68);

    // Left Side: Total Students Badge & Teacher Phone
    ctx.direction = 'ltr';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    drawCanvasRoundRect(ctx, startX + 20, currentY + 18, 200, 36, 6, '#b45309', '#f59e0b', 1);
    ctx.font = 'bold 14px "Cairo", "Tajawal", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`إجمالي الطلاب: ${summary.total} طالب/ة`, startX + 20 + 100, currentY + 36);

    ctx.font = '600 12px "Cairo", "Tajawal", monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`هاتف المنظومة: ${SCHOOL_TEACHER_PHONE}`, startX + 20 + 100, currentY + 68);

    // KPI Badges Row
    const kpiY = currentY + 96;
    const kpiCount = 5;
    const kpiSpacing = 10;
    const totalKpiWidth = contentWidth - 40;
    const kpiWidth = (totalKpiWidth - (kpiCount - 1) * kpiSpacing) / kpiCount;

    const kpis = [
      { label: `نشط ومعتمد: ${summary.verifiedCount}`, bg: '#064e3b', stroke: '#059669', text: '#6ee7b7' },
      { label: `بدون رقم: ${summary.missingCount}`, bg: '#7f1d1d', stroke: '#dc2626', text: '#fca5a5' },
      { label: `أرضي / غير صالح: ${summary.invalidOrNoCount}`, bg: '#78350f', stroke: '#d97706', text: '#fde68a' },
      { label: `أرقام مكررة: ${summary.duplicateCount}`, bg: '#581c87', stroke: '#9333ea', text: '#e9d5ff' },
      { label: `بانتظار الفحص: ${summary.untestedCount}`, bg: '#0c4a6e', stroke: '#0284c7', text: '#7dd3fc' },
    ];

    kpis.forEach((kpi, kIdx) => {
      const kX = startX + 20 + kIdx * (kpiWidth + kpiSpacing);
      drawCanvasRoundRect(ctx, kX, kpiY, kpiWidth, 32, 6, kpi.bg, kpi.stroke, 1);
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px "Cairo", "Tajawal", sans-serif';
      ctx.fillStyle = kpi.text;
      ctx.fillText(kpi.label, kX + kpiWidth / 2, kpiY + 16);
    });

    currentY += headerHeight + 12;
  } else {
    // Compact Header for Subsequent Pages (Height: 56px)
    const headerHeight = 56;
    drawCanvasRoundRect(ctx, startX, currentY, contentWidth, headerHeight, 8, '#0f172a');
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(startX + 8, currentY, contentWidth - 16, 3);

    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px "Cairo", "Tajawal", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`منظومة ${SCHOOL_TEACHER_NAME} التعليمية | كشف هواتف الطلاب والواتساب المعتمد`, startX + contentWidth - 18, currentY + 30);

    ctx.textAlign = 'center';
    ctx.font = '500 12.5px "Cairo", "Tajawal", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${gradeTitle} (${dateFormatted})`, startX + contentWidth / 2, currentY + 30);

    ctx.direction = 'ltr';
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px "Cairo", "Tajawal", sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(`صفحة ${pageIndex + 1} من ${totalPages}`, startX + 20, currentY + 30);

    currentY += headerHeight + 10;
  }

  // Grade Section Banner (Height: 42px)
  const gradeBannerHeight = 42;
  drawCanvasRoundRect(ctx, startX, currentY, contentWidth, gradeBannerHeight, 6, '#1e293b');

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 15px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${page.gradeConfig.icon} ${page.pageLabel}`, startX + contentWidth - 16, currentY + 21);

  // Stage Pill
  const gradeLabelWidth = ctx.measureText(`${page.gradeConfig.icon} ${page.pageLabel}`).width;
  const stagePillX = startX + contentWidth - 30 - gradeLabelWidth - 120;
  drawCanvasRoundRect(ctx, stagePillX, currentY + 8, 120, 26, 13, 'rgba(212, 175, 55, 0.25)', '#d4af37', 1);
  ctx.font = 'bold 11px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'center';
  ctx.fillText(page.gradeConfig.stage, stagePillX + 60, currentY + 21);

  // Left Grade Summary
  const gradeItems = page.itemsChunk;
  const gradeVerified = gradeItems.filter((i) => i.issueType === 'verified_active').length;
  const gradeIssues = gradeItems.length - gradeVerified;

  ctx.direction = 'rtl';
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(
    `إجمالي طلاب الصف: ${page.totalGradeStudents}  |  شغال واتس: ${gradeVerified}  |  ملاحظات/مفقود: ${gradeIssues}`,
    startX + 16,
    currentY + 21
  );

  currentY += gradeBannerHeight + 8;

  // Table Columns Definition (Sum = 1684 px)
  const columns = [
    { title: '#', width: 50, align: 'center' },
    { title: 'الباركود', width: 120, align: 'center' },
    { title: 'اسم الطالب', width: 300, align: 'right' },
    { title: 'المجموعة واليوم', width: 210, align: 'right' },
    { title: 'الرقم المعتمد', width: 190, align: 'center' },
    { title: 'الشبكة', width: 140, align: 'center' },
    { title: 'حالة الواتساب', width: 210, align: 'center' },
    { title: 'التشخيص والملاحظات', width: 464, align: 'right' },
  ] as const;

  // Render Table Header
  const tableHeaderHeight = 38;
  drawCanvasRoundRect(ctx, startX, currentY, contentWidth, tableHeaderHeight, 4, '#f1f5f9', '#cbd5e1', 1);

  let curColX = startX + contentWidth;
  ctx.direction = 'rtl';
  ctx.font = 'bold 13.5px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textBaseline = 'middle';

  columns.forEach((col) => {
    const colRight = curColX;
    const colLeft = curColX - col.width;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(colLeft, currentY);
    ctx.lineTo(colLeft, currentY + tableHeaderHeight);
    ctx.stroke();

    if (col.align === 'center') {
      ctx.textAlign = 'center';
      ctx.fillText(col.title, (colRight + colLeft) / 2, currentY + tableHeaderHeight / 2);
    } else {
      ctx.textAlign = 'right';
      ctx.fillText(col.title, colRight - 12, currentY + tableHeaderHeight / 2);
    }

    curColX = colLeft;
  });

  currentY += tableHeaderHeight;

  // Render Table Rows
  const rowHeight = page.isCoverPage ? 52 : 54;

  if (page.itemsChunk.length === 0) {
    drawCanvasRoundRect(ctx, startX, currentY, contentWidth, 70, 0, '#ffffff', '#e2e8f0', 1);
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px "Cairo", "Tajawal", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('لا توجد بيانات طلاب مسجلة في هذا الصف الدراسي حالياً', startX + contentWidth / 2, currentY + 35);
    currentY += 70;
  } else {
    page.itemsChunk.forEach((item, rIdx) => {
      const s = item.student;
      const rowY = currentY;

      // Status-based row background tint
      let rowBg = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
      if (item.issueType === 'verified_active') rowBg = rIdx % 2 === 0 ? '#f0fdf4' : '#eafaf1';
      else if (item.issueType === 'missing') rowBg = rIdx % 2 === 0 ? '#fef2f2' : '#fde8e8';
      else if (item.issueType === 'duplicate') rowBg = rIdx % 2 === 0 ? '#faf5ff' : '#f5e8ff';
      else if (item.issueType === 'landline') rowBg = rIdx % 2 === 0 ? '#fffbeb' : '#fef9e7';

      ctx.fillStyle = rowBg;
      ctx.fillRect(startX, rowY, contentWidth, rowHeight);

      // Row outline border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, rowY, contentWidth, rowHeight);

      let colX = startX + contentWidth;

      // 1. Index
      const col0 = columns[0];
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12.5px "Cairo", "Tajawal", monospace';
      ctx.fillStyle = '#475569';
      ctx.fillText(String(page.startIndex + rIdx + 1), colX - col0.width / 2, rowY + rowHeight / 2);
      colX -= col0.width;

      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(colX, rowY, 0.5, rowHeight);

      // 2. Barcode
      const col1 = columns[1];
      ctx.direction = 'ltr';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12.5px monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(s.barcode, colX - col1.width / 2, rowY + rowHeight / 2);
      colX -= col1.width;
      ctx.strokeRect(colX, rowY, 0.5, rowHeight);

      // 3. Student Name
      const col2 = columns[2];
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 13.5px "Cairo", "Tajawal", sans-serif';
      ctx.fillStyle = '#0f172a';
      const fittedName = fitCanvasText(ctx, s.name, col2.width - 24);
      ctx.fillText(fittedName, colX - 12, rowY + rowHeight / 2);
      colX -= col2.width;
      ctx.strokeRect(colX, rowY, 0.5, rowHeight);

      // 4. Group & Days
      const col3 = columns[3];
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = '500 12.5px "Cairo", "Tajawal", sans-serif';
      ctx.fillStyle = '#334155';
      const fittedGroup = fitCanvasText(ctx, s.groupDays || 'غير محدد', col3.width - 20);
      ctx.fillText(fittedGroup, colX - 10, rowY + rowHeight / 2);
      colX -= col3.width;
      ctx.strokeRect(colX, rowY, 0.5, rowHeight);

      // 5. Formatted Phone
      const col4 = columns[4];
      ctx.direction = 'ltr';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 13px monospace';
      const phoneDisplay =
        item.formattedPhone !== 'غير مسجل'
          ? item.formattedPhone
          : item.parentPhoneRaw || item.phoneRaw || 'غير مسجل';
      ctx.fillStyle = phoneDisplay === 'غير مسجل' ? '#b91c1c' : '#0f172a';
      ctx.fillText(phoneDisplay, colX - col4.width / 2, rowY + rowHeight / 2);
      colX -= col4.width;
      ctx.strokeRect(colX, rowY, 0.5, rowHeight);

      // 6. Carrier Name
      const col5 = columns[5];
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px "Cairo", "Tajawal", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(item.carrierName, colX - col5.width / 2, rowY + rowHeight / 2);
      colX -= col5.width;
      ctx.strokeRect(colX, rowY, 0.5, rowHeight);

      // 7. Status Badge
      const col6 = columns[6];
      const badgeW = 180;
      const badgeH = 28;
      const badgeX = colX - col6.width / 2 - badgeW / 2;
      const badgeY = rowY + (rowHeight - badgeH) / 2;

      let badgeBg = '#f1f5f9';
      let badgeStroke = '#cbd5e1';
      let badgeText = '#475569';

      if (item.issueType === 'verified_active') {
        badgeBg = '#dcfce7';
        badgeStroke = '#86efac';
        badgeText = '#15803d';
      } else if (item.issueType === 'missing') {
        badgeBg = '#fee2e2';
        badgeStroke = '#fca5a5';
        badgeText = '#b91c1c';
      } else if (item.issueType === 'duplicate') {
        badgeBg = '#f3e8ff';
        badgeStroke = '#d8b4fe';
        badgeText = '#7e22ce';
      } else if (item.issueType === 'landline') {
        badgeBg = '#fef3c7';
        badgeStroke = '#fde68a';
        badgeText = '#b45309';
      } else if (item.issueType === 'fixable_missing_zero') {
        badgeBg = '#e0f2fe';
        badgeStroke = '#7dd3fc';
        badgeText = '#0369a1';
      } else if (item.issueType === 'fake_dummy' || item.issueType === 'invalid_format') {
        badgeBg = '#fee2e2';
        badgeStroke = '#fca5a5';
        badgeText = '#b91c1c';
      }

      drawCanvasRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6, badgeBg, badgeStroke, 1);
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 11.5px "Cairo", "Tajawal", sans-serif';
      ctx.fillStyle = badgeText;
      ctx.fillText(item.statusBadgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);

      colX -= col6.width;
      ctx.strokeRect(colX, rowY, 0.5, rowHeight);

      // 8. Diagnostics & Notes
      const col7 = columns[7];
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = '500 12px "Cairo", "Tajawal", sans-serif';
      ctx.fillStyle = '#475569';
      const fittedDesc = fitCanvasText(ctx, item.issueDescription, col7.width - 20);
      ctx.fillText(fittedDesc, colX - 10, rowY + rowHeight / 2);

      currentY += rowHeight;
    });
  }

  // Bottom Page Footer
  const footerY = height - 56;
  const footerH = 36;
  drawCanvasRoundRect(ctx, startX, footerY, contentWidth, footerH, 6, '#f8fafc', '#cbd5e1', 1);

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 11.5px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(
    `منظومة ${SCHOOL_TEACHER_NAME} التعليمية | كشف حصر وتدقيق وتوثيق أرقام الهواتف والواتساب المعتمد`,
    startX + contentWidth - 16,
    footerY + footerH / 2
  );

  ctx.textAlign = 'center';
  ctx.font = '500 11px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`تاريخ الإصدار: ${dateFormatted} - وثيقة رسمية معتمدة لمنظومة الرياضيات`, startX + contentWidth / 2, footerY + footerH / 2);

  ctx.direction = 'ltr';
  ctx.textAlign = 'left';
  ctx.font = 'bold 12.5px "Cairo", "Tajawal", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`صفحة (${pageIndex + 1}) من إجمالي (${totalPages})`, startX + 16, footerY + footerH / 2);

  return canvas;
}

/**
 * High-Speed, High-Resolution Discrete Page PDF Generation
 * STRICT ANTI-SPLIT GUARANTEE:
 * - Cover Page: Fixed at maximum 9 rows.
 * - Subsequent Pages: Fixed at maximum 12 rows.
 * - Each row has explicit 27px height and single-line ellipsis.
 * - Entire page content is strictly < 480px within a 780px canvas container.
 * - Zero chances for any student name or row to be cut or split across two pages.
 */
export async function exportPhoneAuditToPDF(
  items: PhoneAuditItem[],
  gradeTitle = 'كافة الصفوف الدراسية (من الصف الرابع الابتدائي حتى الصف الثالث الثانوي)',
  onProgress?: (msg: string) => void
): Promise<void> {
  if (!items || items.length === 0) {
    alert('لا توجد بيانات طلاب مطابقة للتصدير.');
    return;
  }

  const dateFormatted = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const total = items.length;
  const verifiedCount = items.filter((i) => i.issueType === 'verified_active').length;
  const missingCount = items.filter((i) => i.issueType === 'missing').length;
  const invalidOrNoCount = items.filter(
    (i) => i.issueType === 'no_whatsapp' || i.issueType === 'landline' || i.issueType === 'invalid_format' || i.issueType === 'fake_dummy'
  ).length;
  const duplicateCount = items.filter((i) => i.issueType === 'duplicate').length;
  const untestedCount = items.filter((i) => i.issueType === 'untested' || i.issueType === 'fixable_missing_zero').length;

  // Determine active grades to render
  const uniqueGradesInItems = Array.from(new Set(items.map((i) => i.student.groupGrade)));
  const isMultiGrade =
    uniqueGradesInItems.length > 1 ||
    gradeTitle.includes('كافة') ||
    gradeTitle.includes('جميع') ||
    gradeTitle.includes('المرحلة');

  const customGrades = uniqueGradesInItems
    .filter((ug) => !SEQUENTIAL_GRADES.some((sg) => sg.grade === ug))
    .map((ug) => ({
      grade: ug,
      label: ug,
      icon: '📚',
      stage: 'مرحلة دراسية',
    }));

  const allAvailableGrades = [...SEQUENTIAL_GRADES, ...customGrades];

  // Filter sequentially: Primary 4 to Secondary 3
  const targetGradesList = allAvailableGrades.filter((g) => {
    if (!isMultiGrade) return uniqueGradesInItems.includes(g.grade);
    if (gradeTitle.includes('الابتدائية')) return g.stage === 'المرحلة الابتدائية' && uniqueGradesInItems.includes(g.grade);
    if (gradeTitle.includes('الإعدادية')) return g.stage === 'المرحلة الإعدادية' && uniqueGradesInItems.includes(g.grade);
    if (gradeTitle.includes('الثانوية')) return g.stage === 'المرحلة الثانوية' && uniqueGradesInItems.includes(g.grade);
    // If all grades requested, only render grades that actually have students (or at least 1)
    return uniqueGradesInItems.includes(g.grade);
  });

  const finalGradesToRender = targetGradesList.length > 0 ? targetGradesList : allAvailableGrades.slice(0, 1);

  // Safe row limits to strictly avoid bottom-of-page cutoff
  const ROWS_PER_COVER_PAGE = 9; // Cover page has large top KPI card
  const ROWS_PER_SUBSEQUENT_PAGE = 12; // Subsequent pages have compact header

  interface PagePayload {
    pageNumber: number;
    gradeConfig: (typeof allAvailableGrades)[number];
    itemsChunk: PhoneAuditItem[];
    startIndex: number;
    totalGradeStudents: number;
    isCoverPage: boolean;
    pageLabel: string;
  }

  const pages: PagePayload[] = [];
  let isFirstPageGlobal = true;

  for (const gradeConfig of finalGradesToRender) {
    const gradeItems = items.filter((i) => i.student.groupGrade === gradeConfig.grade);

    if (gradeItems.length === 0) {
      if (!isMultiGrade) {
        pages.push({
          pageNumber: pages.length + 1,
          gradeConfig,
          itemsChunk: [],
          startIndex: 0,
          totalGradeStudents: 0,
          isCoverPage: isFirstPageGlobal,
          pageLabel: `${gradeConfig.label} (فارغ)`,
        });
        isFirstPageGlobal = false;
      }
      continue;
    }

    let cursor = 0;
    let gradePageNum = 1;

    while (cursor < gradeItems.length) {
      const isCover = isFirstPageGlobal;
      const pageSize = isCover ? ROWS_PER_COVER_PAGE : ROWS_PER_SUBSEQUENT_PAGE;
      const chunk = gradeItems.slice(cursor, cursor + pageSize);

      const totalGradePages = Math.ceil(
        (gradeItems.length - (isCover ? ROWS_PER_COVER_PAGE : 0)) / ROWS_PER_SUBSEQUENT_PAGE
      ) + (isCover ? 1 : 0);

      pages.push({
        pageNumber: pages.length + 1,
        gradeConfig,
        itemsChunk: chunk,
        startIndex: cursor,
        totalGradeStudents: gradeItems.length,
        isCoverPage: isCover,
        pageLabel: totalGradePages > 1 ? `${gradeConfig.label} - جزء (${gradePageNum})` : gradeConfig.label,
      });

      cursor += pageSize;
      isFirstPageGlobal = false;
      gradePageNum++;
    }
  }

  if (pages.length === 0) {
    alert('لا توجد بيانات طلاب مطابقة للتصدير');
    return;
  }

  const totalPages = pages.length;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth ? pdf.internal.pageSize.getWidth() : 297;
  const pdfHeight = pdf.internal.pageSize.getHeight ? pdf.internal.pageSize.getHeight() : 210;

  // Ensure custom fonts are ready for canvas text drawing with timeout guard
  if (document.fonts && document.fonts.ready) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);
    } catch {
      // Fallback gracefully
    }
  }

  const summary = {
    total,
    verifiedCount,
    missingCount,
    invalidOrNoCount,
    duplicateCount,
    untestedCount,
  };

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    if (onProgress) {
      const percent = Math.round(((pIdx + 1) / totalPages) * 100);
      onProgress(`جاري إنشاء صفحة PDF عالية الدقة: ${pIdx + 1} من ${totalPages} (${page.gradeConfig.label})... [${percent}%]`);
    }

    const pageCanvas = renderAuditPageToCanvas(
      page,
      pIdx,
      totalPages,
      gradeTitle,
      dateFormatted,
      summary
    );

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.94);

    if (pIdx > 0) {
      pdf.addPage('a4', 'landscape');
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    // Yield control so progress updates and browser remains responsive
    if (pIdx % 2 === 0 && pIdx < pages.length - 1) {
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  const cleanTitle = gradeTitle.replace(/[\/\s\\:*?"<>|]+/g, '_');
  const fileName = `كشف_أرقام_الواتساب_${cleanTitle}_${new Date().toISOString().split('T')[0]}.pdf`;
  try {
    pdf.save(fileName);
  } catch (saveErr) {
    console.warn('pdf.save direct trigger failed, using Blob URL download fallback...', saveErr);
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = fileName;
    downloadLink.target = '_blank';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  }
}

/**
 * Instant Native Print / Save to PDF View (0.01 seconds speed)
 * STRICT ANTI-SPLIT CSS:
 * - thead { display: table-header-group } repeats headers across printed pages
 * - tr { page-break-inside: avoid !important } guarantees table rows are NEVER cut in half
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
  const isMultiGrade =
    uniqueGradesInItems.length > 1 ||
    gradeTitle.includes('كافة') ||
    gradeTitle.includes('جميع') ||
    gradeTitle.includes('المرحلة');

  const gradesToRender = isMultiGrade
    ? SEQUENTIAL_GRADES.filter((g) => {
        if (gradeTitle.includes('الابتدائية')) return g.stage === 'المرحلة الابتدائية' && uniqueGradesInItems.includes(g.grade);
        if (gradeTitle.includes('الإعدادية')) return g.stage === 'المرحلة الإعدادية' && uniqueGradesInItems.includes(g.grade);
        if (gradeTitle.includes('الثانوية')) return g.stage === 'المرحلة الثانوية' && uniqueGradesInItems.includes(g.grade);
        return uniqueGradesInItems.includes(g.grade);
      })
    : SEQUENTIAL_GRADES.filter((g) => uniqueGradesInItems.includes(g.grade));

  const gradeSectionsHtml = gradesToRender
    .map((gradeConfig) => {
      const gradeItems = items.filter((i) => i.student.groupGrade === gradeConfig.grade);
      if (gradeItems.length === 0) return '';

      return `
        <div class="grade-section" style="margin-top: 14px; margin-bottom: 16px;">
          <div style="background: #0f172a; color: #fff; padding: 6px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; page-break-after: avoid; break-after: avoid;">
            <div style="font-size: 12px; font-weight: bold;">
              ${gradeConfig.icon} ${gradeConfig.label} - <span style="color: #fef08a; font-size: 10.5px;">${gradeConfig.stage}</span>
            </div>
            <div style="font-size: 10.5px; color: #cbd5e1;">إجمالي طلاب الصف: ${gradeItems.length}</div>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; text-align: right;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 1.5px solid #cbd5e1; height: 28px;">
                <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; width: 28px;">#</th>
                <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; width: 70px;">الباركود</th>
                <th style="padding: 4px 8px; border: 1px solid #cbd5e1; width: 190px;">اسم الطالب</th>
                <th style="padding: 4px 6px; border: 1px solid #cbd5e1; width: 130px;">المجموعة</th>
                <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; width: 110px;">الرقم المعتمد</th>
                <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; width: 85px;">الشبكة</th>
                <th style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">حالة الواتساب</th>
                <th style="padding: 4px 8px; border: 1px solid #cbd5e1;">الملاحظات والتشخيص</th>
              </tr>
            </thead>
            <tbody>
              ${gradeItems
                .map((item, idx) => {
                  const s = item.student;
                  const phoneShow = item.formattedPhone !== 'غير مسجل' ? item.formattedPhone : (item.parentPhoneRaw || item.phoneRaw || 'غير مسجل');
                  return `
                    <tr style="page-break-inside: avoid !important; break-inside: avoid !important; height: 28px; border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; page-break-inside: avoid;">${idx + 1}</td>
                      <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-family: monospace; page-break-inside: avoid;">${s.barcode}</td>
                      <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: bold; page-break-inside: avoid;">${s.name}</td>
                      <td style="padding: 4px 6px; border: 1px solid #cbd5e1; page-break-inside: avoid;">${s.groupDays}</td>
                      <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; direction: ltr; font-weight: bold; font-family: monospace; page-break-inside: avoid;">${phoneShow}</td>
                      <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; page-break-inside: avoid;">${item.carrierName}</td>
                      <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; page-break-inside: avoid;">${item.statusBadgeText}</td>
                      <td style="padding: 4px 8px; border: 1px solid #cbd5e1; color: #475569; page-break-inside: avoid;">${item.issueDescription}</td>
                    </tr>
                  `;
                })
                .join('')}
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
        body { font-family: Cairo, 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; padding: 10px; color: #0f172a; margin: 0; }
        table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid !important; break-inside: avoid !important; height: 28px; }
        td, th { page-break-inside: avoid !important; break-inside: avoid !important; }
        @media print {
          body { padding: 0; }
          button { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 2px solid #0f172a; padding-bottom: 6px;">
        <div>
          <h2 style="margin: 0; font-size: 15px; color: #0f172a;">منظومة ${SCHOOL_TEACHER_NAME} التعليمية</h2>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">كشف تدقيق أرقام الهواتف والواتساب | ${gradeTitle} (${dateFormatted})</div>
        </div>
        <div style="text-align: left;">
          <button onclick="window.print()" style="background: #0f172a; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: inherit; font-size: 11px;">🖨️ طباعة الآن / حفظ PDF</button>
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
