import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StudentData,
  SystemUser,
  BroadcastAnnouncement,
  DirectStudentMessage,
  PaymentRecord,
  WhatsAppQueueItem,
  TeacherTab,
  ParentTab,
  UserRole,
  ThemeMode,
  GRADE_ORDER,
  DEFAULT_GROUP_PRICES,
  AttendanceType,
  ExamRecord,
  TreasuryReceipt,
} from '../types';
import { systemDataRef, onValue, set } from '../lib/firebase';
import { dispatchTargetedNotification } from '../utils/notificationEngine';

export const SCHOOL_TEACHER_NAME = "مس إيمان الدمشيتي";
export const SCHOOL_TEACHER_PHONE = "01070642904";
export const SCHOOL_INTL_PHONE = "201070642904";

export const normalizeDigits = (str: string): string => {
  if (!str) return '';
  return String(str)
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9')
    .trim();
};

const LOCAL_STORAGE_KEY = 'eman_parent_portal_data_v1';
const THEME_STORAGE_KEY = 'eman_portal_theme';

const INITIAL_BROADCASTS: BroadcastAnnouncement[] = [
  {
    id: 'bc-1',
    title: '📢 تنبيه هام بخصوص موعد الاختبار الشامل القادم',
    content: 'أبنائي الطلاب وأولياء الأمور الكرام، يرجى التكرم بالعلم بأن الاختبار الشامل لمادة الرياضيات سيعقد الأسبوع القادم في المواعيد المحددة لكل مجموعة. يرجى مراجعة كافة تمارين كشكول الواجبات.',
    date: new Date().toISOString().split('T')[0],
    time: '04:30 م',
    priority: 'urgent',
    targetGrade: 'all',
    authorName: SCHOOL_TEACHER_NAME,
  },
  {
    id: 'bc-2',
    title: '⭐ جدول تكريم الطلاب المتميزين لشهر مارس',
    content: 'تهانينا الحارة لجميع الطلاب المتميزين الحاصلين على أعلى نقاط التميز والكويزات الدورية، سيتم توزيع شهادات التقدير والجوائز في بداية الحصة القادمة.',
    date: new Date().toISOString().split('T')[0],
    time: '02:15 م',
    priority: 'important',
    targetGrade: 'all',
    authorName: SCHOOL_TEACHER_NAME,
  },
];

const INITIAL_DIRECT_MESSAGES: DirectStudentMessage[] = [
  {
    id: 'msg-1',
    studentBarcode: 'STU-2025',
    sender: 'teacher',
    senderName: SCHOOL_TEACHER_NAME,
    title: 'تقييم أداء وتفوق في اختبار التفاضل',
    message: 'ما شاء الله، أداء مريم في اختبار التفاضل وحساب المثلثات كان نموذجياً ومتقناً. نرجو الاستمرار على هذا المستوى الرائع.',
    date: new Date().toISOString().split('T')[0],
    time: '05:00 م',
    category: 'achievement',
    isRead: false,
  },
  {
    id: 'msg-2',
    studentBarcode: 'STU-2024',
    sender: 'teacher',
    senderName: SCHOOL_TEACHER_NAME,
    title: 'ملاحظة حول تسليم تمارين الهندسة الفراغية',
    message: 'يرجى من أحمد إحضار كشكول التمارين لمراجعة المسائل المتبقية في الهندسة الفراغية والتأكيد على حل الواجب كاملاً.',
    date: new Date().toISOString().split('T')[0],
    time: '03:40 م',
    category: 'homework',
    isRead: false,
  },
];

const INITIAL_STUDENTS: StudentData[] = [
  // --- الصف الرابع الابتدائي (سنة رابعة) ---
  {
    barcode: 'P4-001',
    name: 'عمر خالد عبد الرحمن يوسف',
    phone: '01091234567',
    parentPhone: '01091234567',
    groupGrade: 'الصف الرابع الابتدائي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 40,
    totalAttendanceDays: 10,
    totalAbsentDays: 0,
    totalExamScores: [95, 90, 100],
    lastExamTitle: 'اختبار الكسور والعمليات الحسابية',
    lastExamScore: '50 من 50 (100%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'p4password1',
    whatsappStatus: 'verified_active',
    whatsappTestedDate: '2026-08-20',
  },
  {
    barcode: 'P4-002',
    name: 'سارة مصطفى أحمد إبراهيم',
    phone: '',
    parentPhone: '',
    groupGrade: 'الصف الرابع الابتدائي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 25,
    totalAttendanceDays: 8,
    totalAbsentDays: 1,
    totalExamScores: [85, 88],
    lastExamTitle: 'اختبار الرياضيات التراكمي',
    lastExamScore: '44 من 50 (88%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'p4password2',
    whatsappStatus: 'missing',
    whatsappNotes: 'لم يقدم ولي الأمر رقم الهاتف حتى الآن',
  },
  {
    barcode: 'P4-003',
    name: 'يوسف إيهاب محمد عبد العال',
    phone: '01555566778',
    parentPhone: '01555566778',
    groupGrade: 'الصف الرابع الابتدائي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 30,
    totalAttendanceDays: 9,
    totalAbsentDays: 0,
    totalExamScores: [92, 94],
    lastExamTitle: 'اختبار الأشكال الهندسية والقياس',
    lastExamScore: '47 من 50 (94%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'p4password3',
    whatsappStatus: 'untested',
  },
  {
    barcode: 'P4-004',
    name: 'ملك حسام الدين فاروق',
    phone: '0233445566',
    parentPhone: '0233445566',
    groupGrade: 'الصف الرابع الابتدائي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 15,
    totalAttendanceDays: 6,
    totalAbsentDays: 2,
    totalExamScores: [75, 80],
    lastExamTitle: 'اختبار الشهر الأول',
    lastExamScore: '40 من 50 (80%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'p4password4',
    whatsappStatus: 'no_whatsapp',
    whatsappNotes: 'رقم أرضي لا يدعم تطبيق الواتساب',
  },

  // --- الصف الخامس الابتدائي (سنة خامسة) ---
  {
    barcode: 'P5-001',
    name: 'حمزة محمود عبد الله حسن',
    phone: '01122334455',
    parentPhone: '01122334455',
    groupGrade: 'الصف الخامس الابتدائي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 50,
    totalAttendanceDays: 12,
    totalAbsentDays: 0,
    totalExamScores: [98, 96, 95],
    lastExamTitle: 'اختبار ضرب وقسمة الكسور العشرية',
    lastExamScore: '49 من 50 (98%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'p5password1',
    whatsappStatus: 'verified_active',
    whatsappTestedDate: '2026-08-22',
  },
  {
    barcode: 'P5-002',
    name: 'نور الهدى عادل سامي',
    phone: '01288990011',
    parentPhone: '01288990011',
    groupGrade: 'الصف الخامس الابتدائي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 35,
    totalAttendanceDays: 10,
    totalAbsentDays: 1,
    totalExamScores: [90, 88],
    lastExamTitle: 'اختبار المقارنة والأنماط',
    lastExamScore: '45 من 50 (90%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'p5password2',
    whatsappStatus: 'untested',
  },
  {
    barcode: 'P5-003',
    name: 'كريم وائل سمير رضوان',
    phone: '',
    parentPhone: '',
    groupGrade: 'الصف الخامس الابتدائي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 20,
    totalAttendanceDays: 7,
    totalAbsentDays: 2,
    totalExamScores: [82, 80],
    lastExamTitle: 'اختبار الشهر الثاني',
    lastExamScore: '41 من 50 (82%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'p5password3',
    whatsappStatus: 'missing',
    whatsappNotes: 'رقم الهاتف غير مسجل في استمارة التسجيل',
  },
  {
    barcode: 'P5-004',
    name: 'جنى شريف عبد المنعم',
    phone: '0100123',
    parentPhone: '0100123',
    groupGrade: 'الصف الخامس الابتدائي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 30,
    totalAttendanceDays: 9,
    totalAbsentDays: 1,
    totalExamScores: [88, 92],
    lastExamTitle: 'اختبار الأعداد العشرية والمساحات',
    lastExamScore: '46 من 50 (92%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'p5password4',
    whatsappStatus: 'no_whatsapp',
    whatsappNotes: 'رقم ناقص (7 أرقام فقط)',
  },

  // --- الصف السادس الابتدائي (سنة سادسة) ---
  {
    barcode: 'P6-001',
    name: 'عبد الرحمن طارق فتحي قاسم',
    phone: '01066778899',
    parentPhone: '01066778899',
    groupGrade: 'الصف السادس الابتدائي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 55,
    totalAttendanceDays: 13,
    totalAbsentDays: 0,
    totalExamScores: [100, 98, 96],
    lastExamTitle: 'اختبار النسبة والتناسب والمعدل',
    lastExamScore: '50 من 50 (100%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'p6password1',
    whatsappStatus: 'verified_active',
    whatsappTestedDate: '2026-08-25',
  },
  {
    barcode: 'P6-002',
    name: 'حبيبة أحمد جمال الدين',
    phone: '01144556677',
    parentPhone: '01144556677',
    groupGrade: 'الصف السادس الابتدائي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 40,
    totalAttendanceDays: 11,
    totalAbsentDays: 1,
    totalExamScores: [94, 90],
    lastExamTitle: 'اختبار الدائرة والمحيط والمساحة',
    lastExamScore: '47 من 50 (94%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'p6password2',
    whatsappStatus: 'untested',
  },
  {
    barcode: 'P6-003',
    name: 'بلال تامر أشرف البنا',
    phone: '',
    parentPhone: '',
    groupGrade: 'الصف السادس الابتدائي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 15,
    totalAttendanceDays: 5,
    totalAbsentDays: 3,
    totalExamScores: [70, 75],
    lastExamTitle: 'اختبار الإحصاء والاحتمالات',
    lastExamScore: '38 من 50 (76%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'p6password3',
    whatsappStatus: 'missing',
  },
  {
    barcode: 'P6-004',
    name: 'ريتاج ياسر خيري منصور',
    phone: '01277889900',
    parentPhone: '01277889900',
    groupGrade: 'الصف السادس الابتدائي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 45,
    totalAttendanceDays: 12,
    totalAbsentDays: 0,
    totalExamScores: [96, 92],
    lastExamTitle: 'اختبار المعادلات والمتباينات',
    lastExamScore: '48 من 50 (96%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'p6password4',
    whatsappStatus: 'verified_active',
    whatsappTestedDate: '2026-08-26',
  },

  // --- المرحلة الإعدادية ---
  // 1. الصف الأول الإعدادي
  {
    barcode: 'M1-001',
    name: 'سيف الدين ماجد صبحي الغندور',
    phone: '01033445566',
    parentPhone: '01033445566',
    groupGrade: 'الصف الأول الإعدادي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 42,
    totalAttendanceDays: 11,
    totalAbsentDays: 0,
    totalExamScores: [95, 90, 92],
    lastExamTitle: 'اختبار الأعداد النسبية والحدود الجبرية',
    lastExamScore: '47 من 50 (94%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'm1password1',
    whatsappStatus: 'verified_active',
    whatsappTestedDate: '2026-08-24',
  },
  {
    barcode: 'M1-002',
    name: 'مريم إبراهيم خليل النجار',
    phone: '',
    parentPhone: '',
    groupGrade: 'الصف الأول الإعدادي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 28,
    totalAttendanceDays: 8,
    totalAbsentDays: 1,
    totalExamScores: [88, 85],
    lastExamTitle: 'اختبار الزوايا والمضلعات',
    lastExamScore: '44 من 50 (88%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'm1password2',
    whatsappStatus: 'missing',
    whatsappNotes: 'لم يقدم ولي الأمر رقم الهاتف حتى الآن',
  },
  {
    barcode: 'M1-003',
    name: 'ياسين أحمد فؤاد الشناوي',
    phone: '01511223344',
    parentPhone: '01511223344',
    groupGrade: 'الصف الأول الإعدادي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 36,
    totalAttendanceDays: 10,
    totalAbsentDays: 0,
    totalExamScores: [90, 94],
    lastExamTitle: 'اختبار الجبر الشهري',
    lastExamScore: '46 من 50 (92%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'm1password3',
    whatsappStatus: 'untested',
  },

  // 2. الصف الثاني الإعدادي
  {
    barcode: 'M2-001',
    name: 'فارس وليد عبد العزيز النحاس',
    phone: '01222334411',
    parentPhone: '01222334411',
    groupGrade: 'الصف الثاني الإعدادي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 50,
    totalAttendanceDays: 13,
    totalAbsentDays: 0,
    totalExamScores: [98, 100, 96],
    lastExamTitle: 'اختبار متوسطات المثلث والتباين',
    lastExamScore: '50 من 50 (100%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'm2password1',
    whatsappStatus: 'verified_active',
    whatsappTestedDate: '2026-08-25',
  },
  {
    barcode: 'M2-002',
    name: 'شهد كريم محمود البنا',
    phone: '01199887766',
    parentPhone: '01199887766',
    groupGrade: 'الصف الثاني الإعدادي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 38,
    totalAttendanceDays: 11,
    totalAbsentDays: 1,
    totalExamScores: [92, 88],
    lastExamTitle: 'اختبار الجذور التكعيبية والأعداد الحقيقية',
    lastExamScore: '46 من 50 (92%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'm2password2',
    whatsappStatus: 'verified_active',
  },
  {
    barcode: 'M2-003',
    name: 'حازم شريف إسماعيل رضوان',
    phone: '022345678',
    parentPhone: '022345678',
    groupGrade: 'الصف الثاني الإعدادي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 22,
    totalAttendanceDays: 7,
    totalAbsentDays: 2,
    totalExamScores: [78, 82],
    lastExamTitle: 'اختبار الهندسة التحليلية التمهيدي',
    lastExamScore: '40 من 50 (80%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'm2password3',
    whatsappStatus: 'no_whatsapp',
    whatsappNotes: 'رقم أرضي لا يدعم تطبيق الواتساب',
  },

  // 3. الصف الثالث الإعدادي (الشهادة الإعدادية)
  {
    barcode: 'M3-001',
    name: 'محمد عصام الدين عبد العاطي',
    phone: '01088990022',
    parentPhone: '01088990022',
    groupGrade: 'الصف الثالث الإعدادي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 58,
    totalAttendanceDays: 15,
    totalAbsentDays: 0,
    totalExamScores: [100, 98, 100],
    lastExamTitle: 'اختبار حساب المثلثات والنسب المثلثية الأساسية',
    lastExamScore: '50 من 50 (100%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'm3password1',
    whatsappStatus: 'verified_active',
    whatsappTestedDate: '2026-08-26',
  },
  {
    barcode: 'M3-002',
    name: 'هنا عمرو صلاح عبد الوهاب',
    phone: '01200112233',
    parentPhone: '01200112233',
    groupGrade: 'الصف الثالث الإعدادي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 48,
    totalAttendanceDays: 14,
    totalAbsentDays: 0,
    totalExamScores: [96, 94],
    lastExamTitle: 'اختبار حاصل الضرب الديكارتي والعلاقات',
    lastExamScore: '48 من 50 (96%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'm3password2',
    whatsappStatus: 'verified_active',
  },
  {
    barcode: 'M3-003',
    name: 'عمر أشرف متولي غانم',
    phone: '',
    parentPhone: '',
    groupGrade: 'الصف الثالث الإعدادي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 20,
    totalAttendanceDays: 6,
    totalAbsentDays: 3,
    totalExamScores: [75, 78],
    lastExamTitle: 'اختبار منتصف الفصل الدراسي',
    lastExamScore: '39 من 50 (78%)',
    isActivated: true,
    accountStatus: 'active',
    password: 'm3password3',
    whatsappStatus: 'missing',
  },

  // --- المرحلة الثانوية ---
  // 1. الصف الأول الثانوي
  {
    barcode: 'STU-1003',
    name: 'زياد طارق إبراهيم كمال',
    phone: '01234567890',
    parentPhone: '01234567890',
    groupGrade: 'الصف الأول الثانوي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 20,
    totalAttendanceDays: 8,
    totalAbsentDays: 0,
    totalExamScores: [95, 98],
    lastExamTitle: 'اختبار الجبر والعلاقات والمصفوفات',
    lastExamScore: '49 من 50 (98%)',
    isActivated: true,
    accountStatus: 'active',
    password: '1003password',
    whatsappStatus: 'verified_active',
  },
  {
    barcode: 'S1-002',
    name: 'روان وليد السيد عبد الحليم',
    phone: '01044556677',
    parentPhone: '01044556677',
    groupGrade: 'الصف الأول الثانوي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 44,
    totalAttendanceDays: 12,
    totalAbsentDays: 1,
    totalExamScores: [92, 95],
    lastExamTitle: 'اختبار حساب المثلثات والزوايا الموجهة',
    lastExamScore: '47 من 50 (94%)',
    isActivated: true,
    accountStatus: 'active',
    password: 's1password2',
    whatsappStatus: 'verified_active',
  },
  {
    barcode: 'S1-003',
    name: 'أدهم وائل عبد الحميد',
    phone: '01599884422',
    parentPhone: '01599884422',
    groupGrade: 'الصف الأول الثانوي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 30,
    totalAttendanceDays: 9,
    totalAbsentDays: 1,
    totalExamScores: [86, 88],
    lastExamTitle: 'اختبار المتجهات والعمليات الهندسية',
    lastExamScore: '43 من 50 (86%)',
    isActivated: true,
    accountStatus: 'active',
    password: 's1password3',
    whatsappStatus: 'untested',
  },

  // 2. الصف الثاني الثانوي
  {
    barcode: 'STU-2025',
    name: 'مريم علي حسن عبد العزيز',
    phone: '01198765432',
    parentPhone: '01198765432',
    groupGrade: 'الصف الثاني الثانوي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 45,
    totalAttendanceDays: 14,
    totalAbsentDays: 1,
    totalExamScores: [92, 88, 96, 90],
    lastExamTitle: 'اختبار التفاضل وحساب المثلثات',
    lastExamScore: '48 من 50 (96%)',
    isActivated: true,
    accountStatus: 'active',
    password: '2025password',
    whatsappStatus: 'verified_active',
    whatsappTestedDate: '2026-08-25',
  },
  {
    barcode: 'STU-2024',
    name: 'أحمد محمد محمود السعيد',
    phone: '01012345678',
    parentPhone: '01012345678',
    groupGrade: 'الصف الثاني الثانوي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 35,
    totalAttendanceDays: 12,
    totalAbsentDays: 2,
    totalExamScores: [85, 90, 80, 88],
    lastExamTitle: 'اختبار الهندسة الفراغية والاستاتيكا',
    lastExamScore: '44 من 50 (88%)',
    isActivated: true,
    accountStatus: 'active',
    password: '2024password',
    whatsappStatus: 'verified_active',
  },
  {
    barcode: 'S2-003',
    name: 'فريدة إسلام كمال الدين',
    phone: '',
    parentPhone: '',
    groupGrade: 'الصف الثاني الثانوي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 26,
    totalAttendanceDays: 8,
    totalAbsentDays: 2,
    totalExamScores: [84, 80],
    lastExamTitle: 'اختبار الدوال الحقيقية ورسم المنحنيات',
    lastExamScore: '42 من 50 (84%)',
    isActivated: true,
    accountStatus: 'active',
    password: 's2password3',
    whatsappStatus: 'missing',
    whatsappNotes: 'رقم هاتف الطالب وولي الأمر غير مسجلين',
  },

  // 3. الصف الثالث الثانوي (الثانوية العامة)
  {
    barcode: 'S3-001',
    name: 'محمود عبد الله حسني الشريف',
    phone: '01099881122',
    parentPhone: '01099881122',
    groupGrade: 'الصف الثالث الثانوي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 65,
    totalAttendanceDays: 16,
    totalAbsentDays: 0,
    totalExamScores: [100, 98, 100, 98],
    lastExamTitle: 'اختبار التفاضل والتكامل الشامل (ثانوية عامة)',
    lastExamScore: '50 من 50 (100%)',
    isActivated: true,
    accountStatus: 'active',
    password: 's3password1',
    whatsappStatus: 'verified_active',
    whatsappTestedDate: '2026-08-26',
  },
  {
    barcode: 'S3-002',
    name: 'سلمى هشام مصطفى درويش',
    phone: '01277665544',
    parentPhone: '01277665544',
    groupGrade: 'الصف الثالث الثانوي',
    groupDays: 'أحد - ثلاثاء - خميس',
    points: 56,
    totalAttendanceDays: 15,
    totalAbsentDays: 1,
    totalExamScores: [96, 98, 94],
    lastExamTitle: 'اختبار الجبر والهندسة الفراغية التراكمي',
    lastExamScore: '48 من 50 (96%)',
    isActivated: true,
    accountStatus: 'active',
    password: 's3password2',
    whatsappStatus: 'verified_active',
  },
  {
    barcode: 'S3-003',
    name: 'عمر خالد فوزي عبد الغني',
    phone: '01122113344',
    parentPhone: '01122113344',
    groupGrade: 'الصف الثالث الثانوي',
    groupDays: 'سبت - إثنين - أربعاء',
    points: 40,
    totalAttendanceDays: 11,
    totalAbsentDays: 2,
    totalExamScores: [88, 90],
    lastExamTitle: 'اختبار الديناميكا وقوانين نيوتن',
    lastExamScore: '45 من 50 (90%)',
    isActivated: true,
    accountStatus: 'active',
    password: 's3password3',
    whatsappStatus: 'untested',
  },
];

const INITIAL_EXAMS: ExamRecord[] = [
  {
    id: 'exam-1',
    title: 'اختبار نصف الفصل - الجبر وحساب المثلثات',
    grade: 'الصف الثاني الثانوي',
    maxScore: 50,
    topic: 'الدوال الحقيقية والمثلثات',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    scores: {
      'STU-2025': 50,
      'STU-2024': 48,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exam-2',
    title: 'كويز سريع - الهندسة والتحليل الإحصائي',
    grade: 'الصف الثالث الإعدادي',
    maxScore: 30,
    topic: 'النسب المثلثية وميل الخط المستقيم',
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    scores: {
      'P6-001': 29,
    },
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_RECEIPTS: TreasuryReceipt[] = [
  {
    id: 'rec-1',
    receiptNumber: 'REC-2026-001',
    studentBarcode: 'STU-2025',
    studentName: 'مريم السيد أحمد',
    grade: 'الصف الثاني الثانوي',
    month: new Date().toISOString().slice(0, 7),
    amount: 200,
    date: new Date().toISOString().split('T')[0],
    time: '04:15 م',
    notes: 'سداد اشتراك الشهر نقداً بالسنتر',
    collectedBy: SCHOOL_TEACHER_NAME,
  },
  {
    id: 'rec-2',
    receiptNumber: 'REC-2026-002',
    studentBarcode: 'STU-2024',
    studentName: 'أحمد محمود علي',
    grade: 'الصف الثاني الثانوي',
    month: new Date().toISOString().slice(0, 7),
    amount: 200,
    date: new Date().toISOString().split('T')[0],
    time: '04:30 م',
    notes: 'تم الدفع بالكامل',
    collectedBy: SCHOOL_TEACHER_NAME,
  },
];

interface SystemContextType {
  // Theme & Network
  theme: ThemeMode;
  toggleTheme: () => void;
  isOnline: boolean;
  isCloudSyncing: boolean;

  // Session & Authentication
  role: UserRole;
  currentUser: SystemUser | null;
  currentStudent: StudentData | null;
  loginAsTeacher: (pass: string, user?: string) => { success: boolean; message: string };
  changeTeacherPassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  loginAsParent: (barcodeOrPhone: string, pass?: string) => { success: boolean; message: string };
  activateParentFirstTime: (barcode: string, phone: string, pass: string) => { success: boolean; message: string };
  logout: () => void;

  // Navigation tabs
  teacherTab: TeacherTab;
  setTeacherTab: (tab: TeacherTab) => void;
  parentTab: ParentTab;
  setParentTab: (tab: ParentTab) => void;

  // Data Stores
  students: StudentData[];
  sortedStudents: StudentData[];
  studentsMap: Map<string, StudentData>;
  broadcasts: BroadcastAnnouncement[];
  directMessages: DirectStudentMessage[];
  groupPrices: Record<string, number>;
  attendanceHistory: Record<string, Record<string, AttendanceType>>;
  attendanceToday: Record<string, AttendanceType>;
  payments: Record<string, Record<string, PaymentRecord>>;
  exams: ExamRecord[];
  receipts: TreasuryReceipt[];

  // Attendance & Quick Scanner Operations
  markAttendance: (
    studentBarcode: string,
    status: AttendanceType,
    date?: string
  ) => Promise<{ success: boolean; message: string }>;
  recordPayment: (
    studentBarcode: string,
    amount: number,
    monthKey?: string
  ) => Promise<{ success: boolean; message: string }>;

  // Broadcasts (General Website Announcements for All Parents)
  addBroadcast: (announcement: {
    title: string;
    content: string;
    priority?: 'normal' | 'important' | 'urgent';
    targetGrade?: string;
  }) => Promise<{ success: boolean; message: string }>;
  deleteBroadcast: (id: string) => Promise<{ success: boolean; message: string }>;

  // Direct In-App Messaging between Teacher & Individual Student
  sendDirectMessageToStudent: (
    studentBarcode: string,
    message: string,
    category?: DirectStudentMessage['category'],
    title?: string
  ) => Promise<{ success: boolean; message: string }>;
  sendParentReplyToTeacher: (
    studentBarcode: string,
    message: string
  ) => Promise<{ success: boolean; message: string }>;
  deleteDirectMessage: (id: string) => Promise<{ success: boolean; message: string }>;
  markMessagesAsRead: (studentBarcode: string) => Promise<void>;

  // Student & Parent Account Management (Teacher only)
  updateStudentAccount: (barcode: string, updated: Partial<StudentData>) => Promise<{ success: boolean; message: string }>;
  updateMultipleStudentAccounts: (updates: { barcode: string; data: Partial<StudentData> }[]) => Promise<{ success: boolean; message: string }>;
  addStudentAccount: (student: Omit<StudentData, 'points' | 'totalAttendanceDays' | 'totalAbsentDays' | 'totalExamScores'>) => Promise<{ success: boolean; message: string }>;
  deleteStudentAccount: (barcode: string) => Promise<{ success: boolean; message: string }>;
  toggleStudentStatus: (barcode: string) => Promise<{ success: boolean; message: string }>;
  resetStudentPassword: (barcode: string, newPass: string) => Promise<{ success: boolean; message: string }>;

  // Homework Management & Instant Multi-Channel Alerts
  recordHomeworkStatus: (
    barcode: string,
    status: 'done_full' | 'done_partial' | 'not_done',
    note?: string,
    options?: { sendPlatformMessage?: boolean; openWhatsApp?: boolean }
  ) => Promise<{ success: boolean; message: string }>;

  // Exams & Quiz Scores Manager
  addExam: (exam: {
    title: string;
    grade: string;
    maxScore: number;
    topic?: string;
    date?: string;
  }) => Promise<{ success: boolean; message: string }>;
  saveExamScores: (
    examId: string,
    scores: Record<string, number>
  ) => Promise<{ success: boolean; message: string }>;
  deleteExam: (examId: string) => Promise<{ success: boolean; message: string }>;
  sendExamResultWhatsApp: (examId: string, studentBarcode: string) => void;

  // Treasury & Receipts Manager
  recordTreasuryReceipt: (data: {
    studentBarcode: string;
    month: string;
    amount: number;
    notes?: string;
  }) => Promise<{ success: boolean; message: string; receipt?: TreasuryReceipt }>;
  deleteTreasuryReceipt: (receiptId: string) => Promise<{ success: boolean; message: string }>;

  // Backup & Restore
  exportFullBackup: () => any;
  restoreFullBackup: (backupData: any) => Promise<{ success: boolean; message: string }>;
  resetToInitialDemoData: () => Promise<{ success: boolean; message: string }>;

  // WhatsApp Dispatchers
  generateStudentWhatsAppText: (student: StudentData, customNote?: string) => string;
  generateHomeworkWhatsAppText: (
    student: StudentData,
    status: 'done_full' | 'done_partial' | 'not_done',
    note?: string
  ) => string;
  sendWhatsAppToStudentParent: (student: StudentData, customNote?: string) => void;
  sendHomeworkWhatsAppAlert: (
    student: StudentData,
    status: 'done_full' | 'done_partial' | 'not_done',
    note?: string
  ) => void;
  sendBulkWhatsAppBroadcast: (
    message: string,
    targetGrade?: string
  ) => { targetCount: number; links: WhatsAppQueueItem[] };
  sendBulkPlatformBroadcast: (
    title: string,
    message: string,
    targetGrade?: string,
    priority?: 'normal' | 'important' | 'urgent'
  ) => Promise<{ success: boolean; message: string }>;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
    return saved || 'dark';
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [role, setRole] = useState<UserRole>('guest');
  const [currentStudentBarcode, setCurrentStudentBarcode] = useState<string | null>(null);

  // Navigation Tabs
  const [teacherTab, setTeacherTab] = useState<TeacherTab>('accounts');
  const [parentTab, setParentTab] = useState<ParentTab>('overview');

  // Core Data
  const [teacherPassword, setTeacherPassword] = useState<string>('2468');
  const [students, setStudents] = useState<StudentData[]>(INITIAL_STUDENTS);
  const [broadcasts, setBroadcasts] = useState<BroadcastAnnouncement[]>(INITIAL_BROADCASTS);
  const [directMessages, setDirectMessages] = useState<DirectStudentMessage[]>(INITIAL_DIRECT_MESSAGES);
  const [groupPrices, setGroupPrices] = useState<Record<string, number>>(DEFAULT_GROUP_PRICES);
  const [attendanceHistory, setAttendanceHistory] = useState<Record<string, Record<string, AttendanceType>>>({});
  const [attendanceToday, setAttendanceToday] = useState<Record<string, AttendanceType>>({});
  const [payments, setPayments] = useState<Record<string, Record<string, PaymentRecord>>>({});
  const [exams, setExams] = useState<ExamRecord[]>(INITIAL_EXAMS);
  const [receipts, setReceipts] = useState<TreasuryReceipt[]>(INITIAL_RECEIPTS);

  // Theme Toggler
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync to Storage Helper
  const persistState = useCallback(
    async (
      newStudents?: StudentData[],
      newBroadcasts?: BroadcastAnnouncement[],
      newMessages?: DirectStudentMessage[],
      newHistory?: Record<string, Record<string, AttendanceType>>,
      newPayments?: Record<string, Record<string, PaymentRecord>>,
      newPrices?: Record<string, number>,
      newTeacherPass?: string,
      newExams?: ExamRecord[],
      newReceipts?: TreasuryReceipt[]
    ) => {
      const stateToSave = {
        teacherPassword: newTeacherPass || teacherPassword,
        students: newStudents || students,
        broadcasts: newBroadcasts || broadcasts,
        directMessages: newMessages || directMessages,
        attendanceHistory: newHistory || attendanceHistory,
        payments: newPayments || payments,
        groupPrices: newPrices || groupPrices,
        exams: newExams || exams,
        receipts: newReceipts || receipts,
        timestamp: new Date().toISOString(),
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        if (navigator.onLine) {
          setIsCloudSyncing(true);
          await set(systemDataRef, stateToSave);
          setTimeout(() => setIsCloudSyncing(false), 500);
        }
      } catch (err) {
        console.warn('Sync warning:', err);
        setIsCloudSyncing(false);
      }
    },
    [teacherPassword, students, broadcasts, directMessages, attendanceHistory, payments, groupPrices, exams, receipts]
  );

  // Keep track of previous state to detect real-time changes targeting the active user
  const isFirstLoadRef = useRef(true);
  const activeRoleRef = useRef(role);
  const activeStudentBarcodeRef = useRef(currentStudentBarcode);
  const prevDirectMessagesRef = useRef<DirectStudentMessage[]>(directMessages);
  const prevAttendanceTodayRef = useRef<Record<string, AttendanceType>>({});
  const prevStudentsRef = useRef<StudentData[]>(students);

  useEffect(() => {
    activeRoleRef.current = role;
    activeStudentBarcodeRef.current = currentStudentBarcode;
  }, [role, currentStudentBarcode]);

  // Load from LocalStorage and Realtime Firebase
  useEffect(() => {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed.teacherPassword) setTeacherPassword(parsed.teacherPassword);
        if (parsed.students && Array.isArray(parsed.students)) setStudents(parsed.students);
        if (parsed.broadcasts && Array.isArray(parsed.broadcasts)) setBroadcasts(parsed.broadcasts);
        if (parsed.directMessages && Array.isArray(parsed.directMessages)) setDirectMessages(parsed.directMessages);
        if (parsed.groupPrices) setGroupPrices(parsed.groupPrices);
        if (parsed.attendanceHistory) setAttendanceHistory(parsed.attendanceHistory);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.exams && Array.isArray(parsed.exams)) setExams(parsed.exams);
        if (parsed.receipts && Array.isArray(parsed.receipts)) setReceipts(parsed.receipts);
      } catch (e) {
        console.error('Error loading local data:', e);
      }
    }

    try {
      const unsubscribe = onValue(
        systemDataRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setIsCloudSyncing(true);

            // DETECT TARGETED UPDATES FOR ACTIVE PARENT
            const currRole = activeRoleRef.current;
            const myBarcode = activeStudentBarcodeRef.current?.toLowerCase();

            if (!isFirstLoadRef.current && currRole === 'parent' && myBarcode) {
              const todayStr = new Date().toISOString().split('T')[0];
              const newAttHistory = data.attendanceHistory || {};
              const todayAtt = newAttHistory[todayStr] || {};
              const myTodayStatus = todayAtt[myBarcode];
              const prevStatus = prevAttendanceTodayRef.current[myBarcode];

              // 1. Target Attendance changed for this student specifically
              if (myTodayStatus && myTodayStatus !== prevStatus) {
                const currentStu = (data.students || []).find((s: StudentData) => s.barcode.toLowerCase() === myBarcode);
                const stuName = currentStu?.name || 'ابنكم';

                dispatchTargetedNotification(
                  `📢 تسجيل حضور الطالب: ${stuName}`,
                  `تم تسجيل حالة (${myTodayStatus}) للطالب/ة في حصة الرياضيات مع مس إيمان الدمشيتي.`,
                  { type: 'attendance', tag: `att-${myBarcode}-${Date.now()}` }
                );
              }

              // 2. Target Private Message received for this student
              const newMsgs: DirectStudentMessage[] = data.directMessages || [];
              const prevMsgs = prevDirectMessagesRef.current || [];
              const myNewMessages = newMsgs.filter(
                (m) =>
                  m.studentBarcode.toLowerCase() === myBarcode &&
                  m.sender === 'teacher' &&
                  !prevMsgs.some((pm) => pm.id === m.id)
              );

              if (myNewMessages.length > 0) {
                const latestMsg = myNewMessages[0];
                dispatchTargetedNotification(
                  `💬 ${latestMsg.title || 'رسالة جديدة من مس إيمان الدمشيتي'}`,
                  latestMsg.message,
                  { type: 'message', tag: `msg-${latestMsg.id}` }
                );
              }

              // 3. New Grade / Points awarded specifically to this student
              const newStudentsList: StudentData[] = data.students || [];
              const myNewData = newStudentsList.find((s) => s.barcode.toLowerCase() === myBarcode);
              const myPrevData = prevStudentsRef.current.find((s) => s.barcode.toLowerCase() === myBarcode);

              if (myNewData && myPrevData) {
                if (
                  myNewData.lastExamScore &&
                  myNewData.lastExamScore !== myPrevData.lastExamScore
                ) {
                  dispatchTargetedNotification(
                    `📝 تم رصد درجات اختبار جديدة (${myNewData.name})`,
                    `الاختبار: ${myNewData.lastExamTitle || 'اختبار الرياضيات'} - الدرجة: ${myNewData.lastExamScore}`,
                    { type: 'grade', tag: `grade-${myBarcode}-${Date.now()}` }
                  );
                } else if ((myNewData.points || 0) > (myPrevData.points || 0)) {
                  dispatchTargetedNotification(
                    `⭐ نقاط تميز وتفوق جديدة! (${myNewData.name})`,
                    `حصل الطالب على نقاط تميز إضافية! الرصيد الجديد: ${myNewData.points} نقطة.`,
                    { type: 'grade', tag: `points-${myBarcode}-${Date.now()}` }
                  );
                }
              }
            }

            // Update refs
            const todayStr = new Date().toISOString().split('T')[0];
            prevAttendanceTodayRef.current = (data.attendanceHistory || {})[todayStr] || {};
            prevDirectMessagesRef.current = data.directMessages || [];
            prevStudentsRef.current = data.students || [];
            isFirstLoadRef.current = false;

            if (data.teacherPassword) setTeacherPassword(data.teacherPassword);
            if (data.students && Array.isArray(data.students)) setStudents(data.students);
            if (data.broadcasts && Array.isArray(data.broadcasts)) setBroadcasts(data.broadcasts);
            if (data.directMessages && Array.isArray(data.directMessages)) setDirectMessages(data.directMessages);
            if (data.groupPrices) setGroupPrices(data.groupPrices);
            if (data.attendanceHistory) setAttendanceHistory(data.attendanceHistory);
            if (data.payments) setPayments(data.payments);
            if (data.exams && Array.isArray(data.exams)) setExams(data.exams);
            if (data.receipts && Array.isArray(data.receipts)) setReceipts(data.receipts);
            setTimeout(() => setIsCloudSyncing(false), 400);
          }
        },
        (error) => {
          console.warn('Firebase sync listener error:', error);
          setIsCloudSyncing(false);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase init warning:', e);
    }
  }, []);

  // Today attendance map
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (attendanceHistory[today]) {
      setAttendanceToday(attendanceHistory[today]);
    } else {
      setAttendanceToday({});
    }
  }, [attendanceHistory]);

  // Current student object
  const currentStudent = useMemo(() => {
    if (!currentStudentBarcode) return null;
    return students.find((s) => s.barcode.toLowerCase() === currentStudentBarcode.toLowerCase()) || null;
  }, [students, currentStudentBarcode]);

  // Sorted students map & list
  const studentsMap = useMemo(() => {
    const map = new Map<string, StudentData>();
    students.forEach((s) => map.set(s.barcode.toLowerCase(), s));
    return map;
  }, [students]);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const gradeA = GRADE_ORDER.indexOf(a.groupGrade as any);
      const gradeB = GRADE_ORDER.indexOf(b.groupGrade as any);
      if (gradeA !== gradeB) return (gradeA === -1 ? 99 : gradeA) - (gradeB === -1 ? 99 : gradeB);
      return a.name.localeCompare(b.name, 'ar');
    });
  }, [students]);

  // LOGIN AS TEACHER
  const loginAsTeacher = useCallback((pass: string, user?: string) => {
    const rawPass = (pass || '').trim();
    const normalizedPass = normalizeDigits(rawPass);
    const expectedPass = teacherPassword || '2468';
    const normalizedExpected = normalizeDigits(expectedPass);

    if (
      normalizedPass === normalizedExpected ||
      rawPass === expectedPass ||
      rawPass === `eman${expectedPass}`
    ) {
      const teacherUser: SystemUser = {
        username: 'eman',
        pass: expectedPass,
        role: 'teacher',
      };
      setCurrentUser(teacherUser);
      setRole('teacher');
      setTeacherTab('accounts');
      return { success: true, message: 'مرحباً بك يا أستاذة إيمان الدمشيتي في بوابة المعلمة!' };
    }

    return { success: false, message: 'رمز الدخول للمعلمة غير صحيح. يرجى التأكد من كلمة المرور.' };
  }, [teacherPassword]);

  // CHANGE TEACHER PASSWORD
  const changeTeacherPassword = useCallback(async (oldPass: string, newPass: string) => {
    const normOld = normalizeDigits(oldPass.trim());
    const expected = teacherPassword || '2468';
    const currNorm = normalizeDigits(expected);

    if (normOld !== currNorm && oldPass.trim() !== expected) {
      return { success: false, message: 'رمز المرور الحالي غير صحيح.' };
    }

    const cleanNew = newPass.trim();
    if (cleanNew.length < 4) {
      return { success: false, message: 'يجب أن يتكون رمز المرور الجديد من 4 خانات على الأقل.' };
    }

    setTeacherPassword(cleanNew);
    await persistState(undefined, undefined, undefined, undefined, undefined, undefined, cleanNew);
    return { success: true, message: 'تم تغيير وتحديث رمز مرور المعلمة بنجاح وحفظه سحابياً!' };
  }, [teacherPassword, persistState]);

  // LOGIN AS PARENT
  const loginAsParent = useCallback(
    (barcodeOrPhone: string, pass?: string) => {
      const cleanTarget = normalizeDigits(barcodeOrPhone.trim()).toLowerCase();
      const rawTarget = barcodeOrPhone.trim().toLowerCase();
      const rawPass = (pass || '').trim();
      const normalizedPass = normalizeDigits(rawPass);

      if (!cleanTarget) {
        return { success: false, message: 'يرجى إدخال كود الباركود أو رقم الهاتف المسجل.' };
      }

      if (!rawPass) {
        return { success: false, message: 'يرجى إدخال كلمة المرور الخاصة بحساب الطالب.' };
      }

      const student = students.find((s) => {
        const sBarcode = normalizeDigits(s.barcode || '').toLowerCase();
        const sPhone = normalizeDigits(s.phone || '').replace(/[^0-9]/g, '');
        const sParentPhone = normalizeDigits(s.parentPhone || '').replace(/[^0-9]/g, '');
        const cleanTargetDigits = cleanTarget.replace(/[^0-9]/g, '');

        return (
          sBarcode === cleanTarget ||
          sBarcode === rawTarget ||
          (cleanTargetDigits && (sPhone === cleanTargetDigits || sParentPhone === cleanTargetDigits))
        );
      });

      if (!student) {
        return { success: false, message: 'لم يتم العثور على حساب طالب مسجل بهذا الباركود أو رقم الهاتف.' };
      }

      if (student.accountStatus === 'frozen' || student.accountStatus === 'blocked') {
        return { success: false, message: `حساب الطالب مجمد مؤقتاً: ${student.statusReason || 'يرجى مراجعة المعلمة'}.` };
      }

      // Mandatory Password check
      const studentPassword = (student.password || '').trim();
      if (!studentPassword) {
        return {
          success: false,
          message: 'لم يتم تعيين كلمة مرور لهذا الحساب بعد. يرجى التوجه لتبويب «تفعيل الحساب لأول مرة» لإنشاء كلمة المرور.',
        };
      }

      const sPassNormalized = normalizeDigits(studentPassword);
      const isPassMatch =
        sPassNormalized === normalizedPass ||
        studentPassword === rawPass ||
        studentPassword.toLowerCase() === rawPass.toLowerCase();

      if (!isPassMatch) {
        return { success: false, message: 'كلمة المرور غير صحيحة. يرجى التأكد من كلمة المرور وإعادة المحاولة.' };
      }

      setCurrentStudentBarcode(student.barcode);
      setRole('parent');
      setParentTab('overview');
      return { success: true, message: `مرحباً بك يا ولي أمر الطالب/ة: ${student.name}!` };
    },
    [students]
  );

  // ACTIVATE PARENT FIRST TIME
  const activateParentFirstTime = useCallback(
    (barcode: string, phone: string, pass: string) => {
      const cleanBarcode = normalizeDigits(barcode.trim()).toLowerCase();
      const cleanPhone = normalizeDigits(phone).replace(/[^0-9]/g, '');
      const cleanPass = normalizeDigits(pass.trim());

      const student = students.find((s) => {
        const sBarcode = normalizeDigits(s.barcode || '').toLowerCase();
        const sPhone = normalizeDigits(s.phone || '').replace(/[^0-9]/g, '');
        const sParentPhone = normalizeDigits(s.parentPhone || '').replace(/[^0-9]/g, '');
        return (
          sBarcode === cleanBarcode &&
          (sParentPhone === cleanPhone || sPhone === cleanPhone)
        );
      });

      if (!student) {
        return { success: false, message: 'بيانات كود الباركود أو رقم الهاتف غير متطابقة مع سجلات المنظومة.' };
      }

      if (cleanPass.length < 3) {
        return { success: false, message: 'يرجى كتابة كلمة مرور تتكون من 3 أحرف أو أرقام على الأقل.' };
      }

      const nextStudents = students.map((s) =>
        s.barcode === student.barcode
          ? { ...s, isActivated: true, password: cleanPass, accountStatus: 'active' as const }
          : s
      );

      setStudents(nextStudents);
      setCurrentStudentBarcode(student.barcode);
      setRole('parent');
      setParentTab('overview');
      persistState(nextStudents);

      return { success: true, message: 'تم تفعيل حساب ولي الأمر بنجاح! تم تسجيل دخولك مباشرة.' };
    },
    [students, persistState]
  );

  // LOGOUT
  const logout = useCallback(() => {
    setCurrentUser(null);
    setCurrentStudentBarcode(null);
    setRole('guest');
  }, []);

  // ATTENDANCE RECORDING (With Student-Targeted Audio/Visual Push Notification)
  const markAttendance = useCallback(
    async (studentBarcode: string, status: AttendanceType, date?: string) => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const targetStudent = students.find((s) => s.barcode.toLowerCase() === studentBarcode.toLowerCase());

      if (!targetStudent) {
        return { success: false, message: 'الطالب غير مسجل في النظام.' };
      }

      // Update Attendance History
      const nextHistory = {
        ...attendanceHistory,
        [targetDate]: {
          ...(attendanceHistory[targetDate] || {}),
          [targetStudent.barcode]: status,
        },
      };

      // Recalculate attendance counts and points for the target student
      const isPresent = status === 'حضور' || status === 'تأخير';
      const prevStatus = attendanceHistory[targetDate]?.[targetStudent.barcode];

      const nextStudents = students.map((s) => {
        if (s.barcode.toLowerCase() === targetStudent.barcode.toLowerCase()) {
          let updatedAtt = s.totalAttendanceDays || 0;
          let updatedAbs = s.totalAbsentDays || 0;
          let updatedPts = s.points || 0;

          // Adjust counts if not already marked today
          if (!prevStatus) {
            if (isPresent) {
              updatedAtt += 1;
              updatedPts += status === 'حضور' ? 5 : 2; // Add excellence points for presence
            } else {
              updatedAbs += 1;
            }
          }

          return {
            ...s,
            totalAttendanceDays: updatedAtt,
            totalAbsentDays: updatedAbs,
            points: updatedPts,
          };
        }
        return s;
      });

      // Automatically log a direct message for the student's parent inbox
      const statusLabel =
        status === 'حضور'
          ? 'تم تسجيل حضور الطالب/ة في موعد الحصة بنجاح 🟢'
          : status === 'تأخير'
          ? 'تم تسجيل وصول متأخر للحصة 🟡'
          : 'تنبيه: تم تسجيل غياب الطالب/ة عن حصة اليوم 🔴';

      const newMsg: DirectStudentMessage = {
        id: `att-msg-${Date.now()}`,
        studentBarcode: targetStudent.barcode,
        sender: 'teacher',
        senderName: SCHOOL_TEACHER_NAME,
        title: `إشعار حضور فوري (${targetStudent.name})`,
        message: `نحيطكم علماً بأنه في تاريخ ${targetDate} ${statusLabel}. رصيد نقاط التميز الحالي: ⭐ ${
          targetStudent.points || 0
        } نقطة.`,
        date: targetDate,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        category: 'attendance',
        isRead: false,
      };

      const nextMessages = [newMsg, ...directMessages];

      setAttendanceHistory(nextHistory);
      setStudents(nextStudents);
      setDirectMessages(nextMessages);

      await persistState(nextStudents, undefined, nextMessages, nextHistory);

      return {
        success: true,
        message: `تم تسجيل (${status}) للطالب/ة (${targetStudent.name}) وإرسال إشعار فوري لولي أمره فقط.`,
      };
    },
    [students, attendanceHistory, directMessages, persistState]
  );

  // PAYMENT RECORDING
  const recordPayment = useCallback(
    async (studentBarcode: string, amount: number, monthKey?: string) => {
      const currentMonth = monthKey || new Date().toISOString().slice(0, 7);
      const targetStudent = students.find((s) => s.barcode.toLowerCase() === studentBarcode.toLowerCase());

      if (!targetStudent) {
        return { success: false, message: 'الطالب غير موجود.' };
      }

      const nextPayments = {
        ...payments,
        [currentMonth]: {
          ...(payments[currentMonth] || {}),
          [targetStudent.barcode]: {
            amount,
            date: new Date().toISOString().split('T')[0],
          },
        },
      };

      // Add direct receipt message for the parent
      const newMsg: DirectStudentMessage = {
        id: `pay-msg-${Date.now()}`,
        studentBarcode: targetStudent.barcode,
        sender: 'teacher',
        senderName: SCHOOL_TEACHER_NAME,
        title: `إيصال استلام مصاريف شهر ${currentMonth}`,
        message: `تم استلام سداد اشتراك شهر (${currentMonth}) بمبلغ ${amount} ج.م للطالب/ة (${targetStudent.name}) بنجاح. شكراً لتعاونكم وثقتكم.`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        category: 'general',
        isRead: false,
      };

      const nextMessages = [newMsg, ...directMessages];

      setPayments(nextPayments);
      setDirectMessages(nextMessages);
      await persistState(undefined, undefined, nextMessages, undefined, nextPayments);

      return {
        success: true,
        message: `تم تسجيل سداد مبلغ ${amount} ج.م للطالب (${targetStudent.name}) وإشعار ولي الأمر.`,
      };
    },
    [students, payments, directMessages, persistState]
  );

  // BROADCASTS (General Announcements to all parents on the site)
  const addBroadcast = useCallback(
    async (announcement: {
      title: string;
      content: string;
      priority?: 'normal' | 'important' | 'urgent';
      targetGrade?: string;
    }) => {
      if (!announcement.title.trim() || !announcement.content.trim()) {
        return { success: false, message: 'يرجى كتابة عنوان وتفاصيل الرسالة العامة.' };
      }

      const newBc: BroadcastAnnouncement = {
        id: `bc-${Date.now()}`,
        title: announcement.title.trim(),
        content: announcement.content.trim(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        priority: announcement.priority || 'normal',
        targetGrade: announcement.targetGrade || 'all',
        authorName: SCHOOL_TEACHER_NAME,
      };

      const nextBroadcasts = [newBc, ...broadcasts];
      setBroadcasts(nextBroadcasts);
      await persistState(undefined, nextBroadcasts);
      return { success: true, message: 'تم نشر الرسالة العامة لكافة أولياء الأمور عبر المنصة بنجاح!' };
    },
    [broadcasts, persistState]
  );

  const deleteBroadcast = useCallback(
    async (id: string) => {
      const nextBroadcasts = broadcasts.filter((b) => b.id !== id);
      setBroadcasts(nextBroadcasts);
      await persistState(undefined, nextBroadcasts);
      return { success: true, message: 'تم حذف الإشعار العام بنجاح.' };
    },
    [broadcasts, persistState]
  );

  // DIRECT MESSAGING (Between Teacher & Individual Student)
  const sendDirectMessageToStudent = useCallback(
    async (
      studentBarcode: string,
      message: string,
      category: DirectStudentMessage['category'] = 'general',
      title?: string
    ) => {
      if (!message.trim()) {
        return { success: false, message: 'يرجى كتابة نص الرسالة.' };
      }

      const target = students.find((s) => s.barcode === studentBarcode);
      if (!target) {
        return { success: false, message: 'الطالب غير موجود.' };
      }

      const newMsg: DirectStudentMessage = {
        id: `msg-${Date.now()}`,
        studentBarcode,
        sender: 'teacher',
        senderName: SCHOOL_TEACHER_NAME,
        title: title || 'ملاحظة خاصة من مس إيمان الدمشيتي',
        message: message.trim(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        category,
        isRead: false,
      };

      const nextMessages = [newMsg, ...directMessages];
      setDirectMessages(nextMessages);
      await persistState(undefined, undefined, nextMessages);
      return { success: true, message: `تم إرسال الرسالة الخاصة لولي أمر الطالب (${target.name}) عبر المنصة بنجاح!` };
    },
    [students, directMessages, persistState]
  );

  const sendParentReplyToTeacher = useCallback(
    async (studentBarcode: string, message: string) => {
      if (!message.trim()) {
        return { success: false, message: 'يرجى كتابة نص الرسالة.' };
      }

      const student = students.find((s) => s.barcode === studentBarcode);
      const studentName = student ? student.name : 'ولي أمر';

      const newMsg: DirectStudentMessage = {
        id: `msg-${Date.now()}`,
        studentBarcode,
        sender: 'parent',
        senderName: `ولي أمر (${studentName})`,
        title: `رد/استفسار من ولي أمر ${studentName}`,
        message: message.trim(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        category: 'general',
        isRead: false,
      };

      const nextMessages = [newMsg, ...directMessages];
      setDirectMessages(nextMessages);
      await persistState(undefined, undefined, nextMessages);
      return { success: true, message: 'تم إرسال ردك لمس إيمان بنجاح!' };
    },
    [students, directMessages, persistState]
  );

  const deleteDirectMessage = useCallback(
    async (id: string) => {
      const nextMessages = directMessages.filter((m) => m.id !== id);
      setDirectMessages(nextMessages);
      await persistState(undefined, undefined, nextMessages);
      return { success: true, message: 'تم حذف الرسالة بنجاح.' };
    },
    [directMessages, persistState]
  );

  const markMessagesAsRead = useCallback(
    async (studentBarcode: string) => {
      let changed = false;
      const nextMessages = directMessages.map((m) => {
        if (m.studentBarcode === studentBarcode && !m.isRead) {
          changed = true;
          return { ...m, isRead: true };
        }
        return m;
      });

      if (changed) {
        setDirectMessages(nextMessages);
        await persistState(undefined, undefined, nextMessages);
      }
    },
    [directMessages, persistState]
  );

  // STUDENT & PARENT ACCOUNT MANAGEMENT (Teacher Only)
  const updateStudentAccount = useCallback(
    async (barcode: string, updated: Partial<StudentData>) => {
      const nextStudents = students.map((s) => (s.barcode === barcode ? { ...s, ...updated } : s));
      setStudents(nextStudents);
      await persistState(nextStudents);
      return { success: true, message: 'تم تحديث بيانات حساب الطالب وولي الأمر بنجاح!' };
    },
    [students, persistState]
  );

  const updateMultipleStudentAccounts = useCallback(
    async (updates: { barcode: string; data: Partial<StudentData> }[]) => {
      const updateMap = new Map(updates.map((u) => [u.barcode, u.data]));
      const nextStudents = students.map((s) => {
        const patch = updateMap.get(s.barcode);
        return patch ? { ...s, ...patch } : s;
      });
      setStudents(nextStudents);
      await persistState(nextStudents);
      return { success: true, message: `تم تحديث ${updates.length} حساب طالب بنجاح!` };
    },
    [students, persistState]
  );

  const addStudentAccount = useCallback(
    async (student: Omit<StudentData, 'points' | 'totalAttendanceDays' | 'totalAbsentDays' | 'totalExamScores'>) => {
      const cleanBarcode = normalizeDigits(student.barcode.trim());
      if (!cleanBarcode || !student.name.trim()) {
        return { success: false, message: 'يرجى إدخال اسم الطالب وكود الباركود.' };
      }

      if (students.some((s) => s.barcode.toLowerCase() === cleanBarcode.toLowerCase())) {
        return { success: false, message: 'كود الباركود هذا مستخدم لطالب آخر بالفعل.' };
      }

      const newStudent: StudentData = {
        ...student,
        barcode: cleanBarcode,
        points: 10,
        totalAttendanceDays: 0,
        totalAbsentDays: 0,
        totalExamScores: [],
        isActivated: true,
        accountStatus: 'active',
        password: student.password || '123456',
      };

      const nextStudents = [newStudent, ...students];
      setStudents(nextStudents);
      await persistState(nextStudents);
      return { success: true, message: `تمت إضافة حساب الطالب (${student.name}) بنجاح!` };
    },
    [students, persistState]
  );

  const deleteStudentAccount = useCallback(
    async (barcode: string) => {
      const nextStudents = students.filter((s) => s.barcode !== barcode);
      setStudents(nextStudents);
      await persistState(nextStudents);
      return { success: true, message: 'تم حذف حساب الطالب بنجاح.' };
    },
    [students, persistState]
  );

  const toggleStudentStatus = useCallback(
    async (barcode: string) => {
      const student = students.find((s) => s.barcode === barcode);
      if (!student) return { success: false, message: 'الطالب غير موجود.' };

      const nextStatus = student.accountStatus === 'frozen' ? 'active' : 'frozen';
      const reason = nextStatus === 'frozen' ? 'تم تجميد الحساب مؤقتاً بواسطة المعلمة' : undefined;

      const nextStudents = students.map((s) =>
        s.barcode === barcode ? { ...s, accountStatus: nextStatus as any, statusReason: reason } : s
      );

      setStudents(nextStudents);
      await persistState(nextStudents);
      return {
        success: true,
        message: nextStatus === 'frozen' ? 'تم تجميد حساب الطالب مؤقتاً.' : 'تم تفعيل وفك تجميد الحساب بنجاح.',
      };
    },
    [students, persistState]
  );

  const resetStudentPassword = useCallback(
    async (barcode: string, newPass: string) => {
      const cleanPass = normalizeDigits(newPass.trim());
      if (cleanPass.length < 3) {
        return { success: false, message: 'كلمة المرور يجب ألا تقل عن 3 خانات.' };
      }

      const nextStudents = students.map((s) => (s.barcode === barcode ? { ...s, password: cleanPass, isActivated: true } : s));
      setStudents(nextStudents);
      await persistState(nextStudents);
      return { success: true, message: `تم تعديل كلمة مرور الحساب إلى (${cleanPass}) بنجاح!` };
    },
    [students, persistState]
  );

  // WHATSAPP GENERATOR & DISPATCHERS
  const generateStudentWhatsAppText = useCallback(
    (student: StudentData, customNote?: string) => {
      const totalDays = (student.totalAttendanceDays || 0) + (student.totalAbsentDays || 0);
      const attendanceRate = totalDays > 0 ? Math.round(((student.totalAttendanceDays || 0) / totalDays) * 100) : 100;
      const todayStatus = attendanceToday[student.barcode] || 'لم يسجل اليوم';

      let text = `🌟 *تقرير الطالب/ة الأكاديمي - ${SCHOOL_TEACHER_NAME}*\n`;
      text += `━━━━━━━━━━━━━━━━━━━\n`;
      text += `👤 *اسم الطالب:* ${student.name}\n`;
      text += `🔢 *كود الباركود:* ${student.barcode}\n`;
      text += `📚 *المرحلة:* ${student.groupGrade}\n`;
      text += `🗓️ *المجموعة:* ${student.groupDays}\n\n`;

      text += `📊 *مؤشرات الأداء والالتزام:*\n`;
      text += `• حالة اليوم: ${todayStatus}\n`;
      text += `• إجمالي الحضور: ${student.totalAttendanceDays || 0} حصة\n`;
      text += `• نسبة الالتزام: ${attendanceRate}%\n`;
      text += `• رصيد نقاط التميز: ⭐ ${student.points || 0} نقطة\n\n`;

      if (student.lastExamTitle) {
        text += `📝 *آخر اختبار مسجل:*\n`;
        text += `• الاختبار: ${student.lastExamTitle}\n`;
        text += `• الدرجة: ${student.lastExamScore || 'قيد الرصد'}\n\n`;
      }

      if (customNote && customNote.trim()) {
        text += `💬 *ملاحظة خاصة من المعلمة:*\n`;
        text += `${customNote.trim()}\n\n`;
      }

      text += `━━━━━━━━━━━━━━━━━━━\n`;
      text += `🌐 لمتابعة تفاصيل الطالب عبر موقع المنصة:\n`;
      text += `رابط المنصة: ${window.location.origin}\n`;
      text += `كود الدخول: ${student.barcode}\n`;
      text += `مع تمنياتنا بدوام التميز والتفوق 🌸`;

      return text;
    },
    [attendanceToday]
  );

  const sendWhatsAppToStudentParent = useCallback(
    (student: StudentData, customNote?: string) => {
      const rawPhone = student.parentPhone || student.phone;
      const cleanPhone = normalizeDigits(rawPhone).replace(/[^0-9]/g, '');
      if (!cleanPhone) {
        alert('لا يوجد رقم هاتف مسجل لولي الأمر.');
        return;
      }

      const intlPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone}`;
      const msg = generateStudentWhatsAppText(student, customNote);
      window.open(`https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(msg)}`, '_blank');
    },
    [generateStudentWhatsAppText]
  );

  const sendBulkWhatsAppBroadcast = useCallback(
    (message: string, targetGrade: string = 'all') => {
      const filtered = students.filter((s) => {
        if (targetGrade !== 'all' && s.groupGrade !== targetGrade) return false;
        return !!(s.parentPhone || s.phone);
      });

      const links: WhatsAppQueueItem[] = filtered.map((s) => {
        const rawPhone = s.parentPhone || s.phone;
        const cleanPhone = normalizeDigits(rawPhone).replace(/[^0-9]/g, '');
        const intlPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone}`;

        const fullMsg = `📢 *إشعار هام من ${SCHOOL_TEACHER_NAME}*\n━━━━━━━━━━━━━━━━━━━\nولي أمر الطالب/ة: *${s.name}*\n\n${message.trim()}\n\n━━━━━━━━━━━━━━━━━━━\n🌐 المنصة: ${window.location.origin}`;

        return {
          phone: intlPhone,
          message: fullMsg,
          studentName: s.name,
          barcode: s.barcode,
        };
      });

      return { targetCount: filtered.length, links };
    },
    [students]
  );

  const generateHomeworkWhatsAppText = useCallback(
    (
      student: StudentData,
      status: 'done_full' | 'done_partial' | 'not_done',
      note?: string
    ) => {
      const today = new Date().toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      let statusBadge = '✅ تم أداء الواجب كاملاً بإتقان';
      let toneAdvice = 'نشكر الطالب/ة على التميز والحرص والاجتهاد المستمر! 🌟';
      let starAward = '+5 نقاط تميز ⭐';

      if (status === 'done_partial') {
        statusBadge = '⚠️ تم حل جزء من الواجب (واجب ناقص)';
        toneAdvice = 'نرجو من ولي الأمر التكرم بمتابعة الطالب لاستكمال الأجزاء المتبقية ومراجعة الحلول.';
        starAward = '+2 نقطة تميز';
      } else if (status === 'not_done') {
        statusBadge = '❌ لم يقم الطالب بأداء الواجب (مقصر)';
        toneAdvice = 'نحيطكم علماً بضرورة حل الواجب والالتزام بالحصة القادمة حرصاً على مستوى الطالب ومستقبله الدراسي.';
        starAward = '0 نقاط تميز';
      }

      let text = `📚 *تقرير متابعة الواجب المنزلي - ${SCHOOL_TEACHER_NAME}*\n`;
      text += `━━━━━━━━━━━━━━━━━━━\n`;
      text += `👤 *اسم الطالب:* ${student.name}\n`;
      text += `🔢 *كود الطالب:* ${student.barcode}\n`;
      text += `🎓 *المرحلة:* ${student.groupGrade}\n`;
      text += `🗓️ *تاريخ الحصة:* ${today}\n\n`;

      text += `📌 *حالة الواجب اليوم:* \n`;
      text += `${statusBadge}\n`;
      text += `• المكافأة: ${starAward}\n\n`;

      if (note && note.trim()) {
        text += `📝 *تفاصيل وملاحظة المعلمة:* \n`;
        text += `${note.trim()}\n\n`;
      }

      text += `💡 *توجيه المتابعة:* \n`;
      text += `${toneAdvice}\n\n`;

      text += `━━━━━━━━━━━━━━━━━━━\n`;
      text += `🌐 لمتابعة سجل الطالب والتقارير عبر المنصة:\n`;
      text += `رابط المنصة: ${window.location.origin}\n`;
      text += `مع تحيات مس إيمان ومساعديها 🌸`;

      return text;
    },
    []
  );

  const sendHomeworkWhatsAppAlert = useCallback(
    (
      student: StudentData,
      status: 'done_full' | 'done_partial' | 'not_done',
      note?: string
    ) => {
      const rawPhone = student.parentPhone || student.phone;
      const cleanPhone = normalizeDigits(rawPhone).replace(/[^0-9]/g, '');
      if (!cleanPhone) {
        alert('لا يوجد رقم هاتف مسجل لولي أمر هذا الطالب.');
        return;
      }

      const intlPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone}`;
      const msg = generateHomeworkWhatsAppText(student, status, note);
      window.open(`https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(msg)}`, '_blank');
    },
    [generateHomeworkWhatsAppText]
  );

  const recordHomeworkStatus = useCallback(
    async (
      barcode: string,
      status: 'done_full' | 'done_partial' | 'not_done',
      note?: string,
      options?: { sendPlatformMessage?: boolean; openWhatsApp?: boolean }
    ) => {
      const targetStudent = students.find((s) => s.barcode === barcode);
      if (!targetStudent) {
        return { success: false, message: 'الطالب غير موجود بالنظام.' };
      }

      const todayStr = new Date().toISOString().split('T')[0];
      let pointDelta = 0;
      let statusLabel = 'واجب كامل';

      let doneCount = targetStudent.totalHomeworkDone || 0;
      let incCount = targetStudent.totalHomeworkIncomplete || 0;
      let missCount = targetStudent.totalHomeworkMissing || 0;

      if (status === 'done_full') {
        pointDelta = 5;
        statusLabel = 'أداء الواجب كاملاً';
        doneCount += 1;
      } else if (status === 'done_partial') {
        pointDelta = 2;
        statusLabel = 'حل جزء من الواجب (واجب ناقص)';
        incCount += 1;
      } else {
        pointDelta = 0;
        statusLabel = 'عدم أداء الواجب (مقصر)';
        missCount += 1;
      }

      const updatedStudent: StudentData = {
        ...targetStudent,
        points: Math.max(0, (targetStudent.points || 0) + pointDelta),
        lastHomeworkStatus: status,
        lastHomeworkDate: todayStr,
        lastHomeworkNote: note || '',
        totalHomeworkDone: doneCount,
        totalHomeworkIncomplete: incCount,
        totalHomeworkMissing: missCount,
      };

      const nextStudents = students.map((s) => (s.barcode === barcode ? updatedStudent : s));
      setStudents(nextStudents);
      await persistState(nextStudents);

      // Auto-send In-App Platform Notification if requested
      if (options?.sendPlatformMessage) {
        const platformTitle = `متابعة الواجب: ${statusLabel}`;
        const platformContent = `نحيطكم علماً بحالة الواجب المنزلي للطالب/ة (${targetStudent.name}) لتاريخ ${todayStr}:\nالحالة: ${statusLabel} (${pointDelta > 0 ? `+${pointDelta} نقاط تميز` : 'بدون نقاط'}).\n${note ? `ملاحظة المعلمة: ${note}` : ''}`;
        await sendDirectMessageToStudent(barcode, platformContent, 'homework', platformTitle);
      }

      // Auto-open WhatsApp if requested
      if (options?.openWhatsApp) {
        sendHomeworkWhatsAppAlert(updatedStudent, status, note);
      }

      return {
        success: true,
        message: `تم تسجيل (${statusLabel}) للطالب (${targetStudent.name}) بنجاح!`,
      };
    },
    [students, persistState, sendDirectMessageToStudent, sendHomeworkWhatsAppAlert]
  );

  const sendBulkPlatformBroadcast = useCallback(
    async (
      title: string,
      message: string,
      targetGrade: string = 'all',
      priority: 'normal' | 'important' | 'urgent' = 'normal'
    ) => {
      if (!title.trim() || !message.trim()) {
        return { success: false, message: 'يرجى كتابة عنوان ونص الرسالة أولاً.' };
      }

      const res = await addBroadcast(title.trim(), message.trim(), priority, targetGrade);
      return res;
    },
    [addBroadcast]
  );

  // EXAMS & QUIZ SCORES OPERATIONS
  const addExam = useCallback(
    async (newExamData: {
      title: string;
      grade: string;
      maxScore: number;
      topic?: string;
      date?: string;
    }) => {
      if (!newExamData.title.trim()) {
        return { success: false, message: 'يرجى إدخال اسم الاختبار أو الكويز.' };
      }

      const newExam: ExamRecord = {
        id: `exam-${Date.now()}`,
        title: newExamData.title.trim(),
        grade: newExamData.grade,
        maxScore: Number(newExamData.maxScore) || 50,
        topic: newExamData.topic?.trim() || '',
        date: newExamData.date || new Date().toISOString().split('T')[0],
        scores: {},
        createdAt: new Date().toISOString(),
      };

      const nextExams = [newExam, ...exams];
      setExams(nextExams);
      await persistState(undefined, undefined, undefined, undefined, undefined, undefined, undefined, nextExams);
      return { success: true, message: `تم إنشاء (${newExam.title}) بنجاح! يمكنك الآن رصد درجات الطلاب.` };
    },
    [exams, persistState]
  );

  const saveExamScores = useCallback(
    async (examId: string, scoresMap: Record<string, number>) => {
      const targetExam = exams.find((e) => e.id === examId);
      if (!targetExam) {
        return { success: false, message: 'الاختبار غير موجود.' };
      }

      const updatedExam: ExamRecord = {
        ...targetExam,
        scores: { ...targetExam.scores, ...scoresMap },
      };

      const nextExams = exams.map((e) => (e.id === examId ? updatedExam : e));

      // Update student performance records, calculate percentage, award star points
      const nextStudents = students.map((st) => {
        const score = scoresMap[st.barcode];
        if (score !== undefined && !isNaN(score)) {
          const maxScore = targetExam.maxScore || 50;
          const percentage = Math.round((score / maxScore) * 100);
          const scoreString = `${score} من ${maxScore} (${percentage}%)`;

          // Points bonus: +10 for 100%, +5 for >= 90%, +3 for >= 80%
          let pointBonus = 0;
          if (percentage >= 100) pointBonus = 10;
          else if (percentage >= 90) pointBonus = 5;
          else if (percentage >= 80) pointBonus = 3;

          const existingScores = st.totalExamScores || [];
          return {
            ...st,
            lastExamTitle: targetExam.title,
            lastExamScore: scoreString,
            totalExamScores: [...existingScores, percentage],
            points: (st.points || 0) + pointBonus,
          };
        }
        return st;
      });

      setExams(nextExams);
      setStudents(nextStudents);
      await persistState(nextStudents, undefined, undefined, undefined, undefined, undefined, undefined, nextExams);

      return {
        success: true,
        message: `تم حفظ درجات اختبار (${targetExam.title}) وتحديث سجلات الطلاب ولوحة الشرف بنجاح!`,
      };
    },
    [exams, students, persistState]
  );

  const deleteExam = useCallback(
    async (examId: string) => {
      const nextExams = exams.filter((e) => e.id !== examId);
      setExams(nextExams);
      await persistState(undefined, undefined, undefined, undefined, undefined, undefined, undefined, nextExams);
      return { success: true, message: 'تم حذف سجل الاختبار بنجاح.' };
    },
    [exams, persistState]
  );

  const sendExamResultWhatsApp = useCallback(
    (examId: string, studentBarcode: string) => {
      const exam = exams.find((e) => e.id === examId);
      const student = students.find((s) => s.barcode === studentBarcode);
      if (!exam || !student) return;

      const rawPhone = student.parentPhone || student.phone;
      const cleanPhone = normalizeDigits(rawPhone).replace(/[^0-9]/g, '');
      if (!cleanPhone) {
        alert('لا يوجد رقم هاتف مسجل لولي أمر هذا الطالب.');
        return;
      }

      const score = exam.scores[student.barcode];
      const maxScore = exam.maxScore || 50;
      const scoreText = score !== undefined ? `${score} من ${maxScore} (${Math.round((score / maxScore) * 100)}%)` : 'قيد الرصد';

      let msg = `📝 *نتيجة اختبار الرياضيات - ${SCHOOL_TEACHER_NAME}*\n`;
      msg += `━━━━━━━━━━━━━━━━━━━\n`;
      msg += `👤 *الطالب/ة:* ${student.name}\n`;
      msg += `🔢 *كود الطالب:* ${student.barcode}\n`;
      msg += `📚 *المرحلة:* ${student.groupGrade}\n`;
      msg += `🗓️ *تاريخ الاختبار:* ${exam.date}\n\n`;
      msg += `📌 *عنوان الاختبار:* ${exam.title}\n`;
      msg += `🎯 *الدرجة المحصلة:* ${scoreText}\n`;
      msg += `⭐ *رصيد نقاط التميز الإجمالي:* ${student.points || 0} نقطة\n\n`;
      msg += `━━━━━━━━━━━━━━━━━━━\n`;
      msg += `🌐 لمتابعة تفاصيل الطالب عبر المنصة: ${window.location.origin}\n`;
      msg += `مع أطيب التمنيات بالتفوق والنجاح 🌸`;

      const intlPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone}`;
      window.open(`https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(msg)}`, '_blank');
    },
    [exams, students]
  );

  // TREASURY & RECEIPTS OPERATIONS
  const recordTreasuryReceipt = useCallback(
    async (data: {
      studentBarcode: string;
      month: string;
      amount: number;
      notes?: string;
    }) => {
      const student = students.find((s) => s.barcode.toLowerCase() === data.studentBarcode.toLowerCase());
      if (!student) {
        return { success: false, message: 'الطالب غير موجود.' };
      }

      const count = receipts.length + 1;
      const recNumber = `REC-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

      const newReceipt: TreasuryReceipt = {
        id: `rec-${Date.now()}`,
        receiptNumber: recNumber,
        studentBarcode: student.barcode,
        studentName: student.name,
        grade: student.groupGrade,
        month: data.month,
        amount: Number(data.amount) || 0,
        date: todayStr,
        time: timeStr,
        notes: data.notes || 'سداد اشتراك شهري',
        collectedBy: SCHOOL_TEACHER_NAME,
      };

      const nextReceipts = [newReceipt, ...receipts];

      // Also register into payments state
      const nextPayments = {
        ...payments,
        [data.month]: {
          ...(payments[data.month] || {}),
          [student.barcode]: {
            amount: Number(data.amount) || 0,
            date: todayStr,
          },
        },
      };

      // Add direct message to parent inbox
      const receiptMsg: DirectStudentMessage = {
        id: `rec-msg-${Date.now()}`,
        studentBarcode: student.barcode,
        sender: 'teacher',
        senderName: SCHOOL_TEACHER_NAME,
        title: `سند قبض إلكتروني رقم (${recNumber})`,
        message: `تم استلام سداد اشتراك شهر (${data.month}) بمبلغ ${data.amount} ج.م للطالب/ة (${student.name}). رقم الإيصال: ${recNumber}. نشكركم على ثقتكم وتعاونكم المثمر.`,
        date: todayStr,
        time: timeStr,
        category: 'general',
        isRead: false,
      };

      const nextMessages = [receiptMsg, ...directMessages];

      setReceipts(nextReceipts);
      setPayments(nextPayments);
      setDirectMessages(nextMessages);

      await persistState(
        undefined,
        undefined,
        nextMessages,
        undefined,
        nextPayments,
        undefined,
        undefined,
        undefined,
        nextReceipts
      );

      return {
        success: true,
        message: `تم إصدار سند القبض الإلكتروني (${recNumber}) بنجاح بمبلغ ${data.amount} ج.م!`,
        receipt: newReceipt,
      };
    },
    [students, receipts, payments, directMessages, persistState]
  );

  const deleteTreasuryReceipt = useCallback(
    async (receiptId: string) => {
      const nextReceipts = receipts.filter((r) => r.id !== receiptId);
      setReceipts(nextReceipts);
      await persistState(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        nextReceipts
      );
      return { success: true, message: 'تم إلغاء وحذف سند القبض بنجاح.' };
    },
    [receipts, persistState]
  );

  // BACKUP & RESTORE
  const exportFullBackup = useCallback(() => {
    const backupObj = {
      system: 'منظومة مس إيمان الدمشيتي للرياضيات',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      teacherPassword,
      students,
      broadcasts,
      directMessages,
      attendanceHistory,
      payments,
      groupPrices,
      exams,
      receipts,
    };
    return backupObj;
  }, [
    teacherPassword,
    students,
    broadcasts,
    directMessages,
    attendanceHistory,
    payments,
    groupPrices,
    exams,
    receipts,
  ]);

  const restoreFullBackup = useCallback(
    async (backupData: any) => {
      try {
        if (!backupData || typeof backupData !== 'object') {
          return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو تالف.' };
        }

        if (backupData.students && Array.isArray(backupData.students)) {
          setStudents(backupData.students);
        }
        if (backupData.broadcasts && Array.isArray(backupData.broadcasts)) {
          setBroadcasts(backupData.broadcasts);
        }
        if (backupData.directMessages && Array.isArray(backupData.directMessages)) {
          setDirectMessages(backupData.directMessages);
        }
        if (backupData.attendanceHistory && typeof backupData.attendanceHistory === 'object') {
          setAttendanceHistory(backupData.attendanceHistory);
        }
        if (backupData.payments && typeof backupData.payments === 'object') {
          setPayments(backupData.payments);
        }
        if (backupData.groupPrices && typeof backupData.groupPrices === 'object') {
          setGroupPrices(backupData.groupPrices);
        }
        if (backupData.exams && Array.isArray(backupData.exams)) {
          setExams(backupData.exams);
        }
        if (backupData.receipts && Array.isArray(backupData.receipts)) {
          setReceipts(backupData.receipts);
        }
        if (backupData.teacherPassword) {
          setTeacherPassword(backupData.teacherPassword);
        }

        await persistState(
          backupData.students,
          backupData.broadcasts,
          backupData.directMessages,
          backupData.attendanceHistory,
          backupData.payments,
          backupData.groupPrices,
          backupData.teacherPassword,
          backupData.exams,
          backupData.receipts
        );

        return { success: true, message: 'تم استرجاع النسخة الاحتياطية بنجاح ومزامنتها سحابياً!' };
      } catch (err: any) {
        return { success: false, message: `حدث خطأ أثناء استعادة النسخة: ${err.message}` };
      }
    },
    [persistState]
  );

  const resetToInitialDemoData = useCallback(async () => {
    setStudents(INITIAL_STUDENTS);
    setBroadcasts(INITIAL_BROADCASTS);
    setDirectMessages(INITIAL_DIRECT_MESSAGES);
    setExams(INITIAL_EXAMS);
    setReceipts(INITIAL_RECEIPTS);
    setAttendanceHistory({});
    setPayments({});
    setTeacherPassword('2468');

    await persistState(
      INITIAL_STUDENTS,
      INITIAL_BROADCASTS,
      INITIAL_DIRECT_MESSAGES,
      {},
      {},
      DEFAULT_GROUP_PRICES,
      '2468',
      INITIAL_EXAMS,
      INITIAL_RECEIPTS
    );

    return { success: true, message: 'تمت إعادة تعيين البيانات التجريبية للمنظومة بنجاح.' };
  }, [persistState]);

  return (
    <SystemContext.Provider
      value={{
        theme,
        toggleTheme,
        isOnline,
        isCloudSyncing,
        role,
        currentUser,
        currentStudent,
        loginAsTeacher,
        changeTeacherPassword,
        loginAsParent,
        activateParentFirstTime,
        logout,
        teacherTab,
        setTeacherTab,
        parentTab,
        setParentTab,
        students,
        sortedStudents,
        studentsMap,
        broadcasts,
        directMessages,
        groupPrices,
        attendanceHistory,
        attendanceToday,
        payments,
        exams,
        receipts,
        markAttendance,
        recordPayment,
        addBroadcast,
        deleteBroadcast,
        sendDirectMessageToStudent,
        sendParentReplyToTeacher,
        deleteDirectMessage,
        markMessagesAsRead,
        updateStudentAccount,
        updateMultipleStudentAccounts,
        addStudentAccount,
        deleteStudentAccount,
        toggleStudentStatus,
        resetStudentPassword,
        recordHomeworkStatus,
        addExam,
        saveExamScores,
        deleteExam,
        sendExamResultWhatsApp,
        recordTreasuryReceipt,
        deleteTreasuryReceipt,
        exportFullBackup,
        restoreFullBackup,
        resetToInitialDemoData,
        generateStudentWhatsAppText,
        generateHomeworkWhatsAppText,
        sendWhatsAppToStudentParent,
        sendHomeworkWhatsAppAlert,
        sendBulkWhatsAppBroadcast,
        sendBulkPlatformBroadcast,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = (): SystemContextType => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
