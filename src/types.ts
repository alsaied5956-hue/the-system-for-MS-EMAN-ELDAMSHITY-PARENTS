export type AccountStatus = 'active' | 'frozen' | 'blocked';
export type AttendanceType = 'حضور' | 'تأخير' | 'غائب' | 'لم يسجل';
export type UserRole = 'guest' | 'parent' | 'teacher' | 'admin';
export type ThemeMode = 'dark' | 'light';

export interface SystemUser {
  username: string;
  pass: string;
  role: 'teacher' | 'admin';
}

export interface StudentData {
  id?: string;
  barcode: string; // Serial / Barcode identifier (e.g., "STU-2025" or "1001")
  name: string;
  phone: string;
  parentPhone: string;
  groupGrade: string; // e.g., "الصف الثاني الثانوي"
  groupDays: 'سبت - إثنين - أربعاء' | 'أحد - ثلاثاء - خميس';
  points: number; // Star points ⭐
  totalAttendanceDays: number;
  totalAbsentDays: number;
  totalExamScores: number[];
  lastExamTitle?: string;
  lastExamScore?: string;
  
  // Homework tracking state
  lastHomeworkStatus?: 'done_full' | 'done_partial' | 'not_done' | 'unassigned';
  lastHomeworkDate?: string;
  lastHomeworkNote?: string;
  totalHomeworkDone?: number;
  totalHomeworkIncomplete?: number;
  totalHomeworkMissing?: number;

  // Account security & activation
  password?: string;
  isActivated?: boolean;
  accountStatus?: AccountStatus;
  statusReason?: string;
  
  // WhatsApp Verification Status
  whatsappStatus?:
    | 'verified_active'
    | 'no_whatsapp'
    | 'untested'
    | 'missing'
    | 'duplicate'
    | 'fake_dummy'
    | 'invalid_format'
    | 'landline'
    | 'fixable_missing_zero';
  whatsappTestedDate?: string;
  whatsappNotes?: string;
}

export interface BroadcastAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  time: string;
  priority: 'normal' | 'important' | 'urgent';
  targetGrade: string; // 'all' or specific grade
  authorName: string;
}

export interface DirectStudentMessage {
  id: string;
  studentBarcode: string;
  sender: 'teacher' | 'parent';
  senderName: string;
  title?: string;
  message: string;
  date: string;
  time: string;
  category: 'general' | 'grades' | 'attendance' | 'homework' | 'achievement';
  isRead?: boolean;
}

export interface PaymentRecord {
  amount: number;
  date: string;
  time: string;
  note?: string;
}

export interface WhatsAppQueueItem {
  phone: string;
  message: string;
  studentName?: string;
  barcode?: string;
}

export type TeacherTab =
  | 'attendance-scanner'
  | 'homework-tracker'
  | 'leaderboard'
  | 'accounts'
  | 'broadcasts'
  | 'direct-messages'
  | 'whatsapp-dispatch'
  | 'security';

export type ParentTab =
  | 'overview'
  | 'leaderboard'
  | 'homework'
  | 'broadcasts'
  | 'inbox'
  | 'grades'
  | 'attendance'
  | 'contact';

export const GRADE_ORDER = [
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي',
] as const;

export const DEFAULT_GROUP_PRICES: Record<string, number> = {
  'الصف الرابع الابتدائي': 100,
  'الصف الخامس الابتدائي': 100,
  'الصف السادس الابتدائي': 120,
  'الصف الأول الإعدادي': 140,
  'الصف الثاني الإعدادي': 150,
  'الصف الثالث الإعدادي': 160,
  'الصف الأول الثانوي': 180,
  'الصف الثاني الثانوي': 200,
  'الصف الثالث الثانوي': 220,
};

