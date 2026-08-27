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
    lastExamTitle: 'اختبار الهندسة الفراغية',
    lastExamScore: '44 من 50 (88%)',
    isActivated: true,
    accountStatus: 'active',
    password: '2024password',
  },
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
    lastExamTitle: 'اختبار الجبر والعلاقات',
    lastExamScore: '49 من 50 (98%)',
    isActivated: true,
    accountStatus: 'active',
    password: '1003password',
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
  addStudentAccount: (student: Omit<StudentData, 'points' | 'totalAttendanceDays' | 'totalAbsentDays' | 'totalExamScores'>) => Promise<{ success: boolean; message: string }>;
  deleteStudentAccount: (barcode: string) => Promise<{ success: boolean; message: string }>;
  toggleStudentStatus: (barcode: string) => Promise<{ success: boolean; message: string }>;
  resetStudentPassword: (barcode: string, newPass: string) => Promise<{ success: boolean; message: string }>;

  // WhatsApp Dispatchers
  generateStudentWhatsAppText: (student: StudentData, customNote?: string) => string;
  sendWhatsAppToStudentParent: (student: StudentData, customNote?: string) => void;
  sendBulkWhatsAppBroadcast: (
    message: string,
    targetGrade?: string
  ) => { targetCount: number; links: WhatsAppQueueItem[] };
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
      newTeacherPass?: string
    ) => {
      const stateToSave = {
        teacherPassword: newTeacherPass || teacherPassword,
        students: newStudents || students,
        broadcasts: newBroadcasts || broadcasts,
        directMessages: newMessages || directMessages,
        attendanceHistory: newHistory || attendanceHistory,
        payments: newPayments || payments,
        groupPrices: newPrices || groupPrices,
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
    [teacherPassword, students, broadcasts, directMessages, attendanceHistory, payments, groupPrices]
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
        markAttendance,
        recordPayment,
        addBroadcast,
        deleteBroadcast,
        sendDirectMessageToStudent,
        sendParentReplyToTeacher,
        deleteDirectMessage,
        markMessagesAsRead,
        updateStudentAccount,
        addStudentAccount,
        deleteStudentAccount,
        toggleStudentStatus,
        resetStudentPassword,
        generateStudentWhatsAppText,
        sendWhatsAppToStudentParent,
        sendBulkWhatsAppBroadcast,
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
