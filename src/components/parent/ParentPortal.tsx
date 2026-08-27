import React, { useState } from 'react';
import {
  useSystem,
  SCHOOL_TEACHER_NAME,
  SCHOOL_TEACHER_PHONE,
  SCHOOL_INTL_PHONE,
} from '../../context/SystemContext';
import {
  ParentTab,
  GRADE_ORDER,
  DEFAULT_GROUP_PRICES,
} from '../../types';
import {
  User,
  GraduationCap,
  CalendarCheck,
  Award,
  CreditCard,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  PhoneCall,
  Star,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  Radio,
  Inbox,
  Share2,
  Bell,
  Volume2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarDays,
  Check,
  X,
} from 'lucide-react';
import { requestBrowserNotificationPermission, soundEngine } from '../../utils/notificationEngine';

export const ParentPortal: React.FC = () => {
  const {
    theme,
    currentStudent,
    parentTab,
    setParentTab,
    broadcasts,
    directMessages,
    sendParentReplyToTeacher,
    attendanceToday,
    attendanceHistory,
    payments,
    groupPrices,
  } = useSystem();

  const isDark = theme === 'dark';
  const [inquiryText, setInquiryText] = useState('');
  const [inquiryFeedback, setInquiryFeedback] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Attendance Month & Group Schedule State
  const [attendanceMonth, setAttendanceMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [attendanceGroupSchedule, setAttendanceGroupSchedule] = useState<'studentGroup' | 'sat_mon_wed' | 'sun_tue_thu'>('studentGroup');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'late' | 'absent' | 'upcoming'>('all');
  const [attendanceViewLayout, setAttendanceViewLayout] = useState<'table' | 'cards'>('table');

  if (!currentStudent) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-slate-400">لم يتم تحديد حساب الطالب. يرجى تسجيل الدخول أولاً.</p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const totalDays = (currentStudent.totalAttendanceDays || 0) + (currentStudent.totalAbsentDays || 0);
  const attendanceRate = totalDays > 0 ? Math.round(((currentStudent.totalAttendanceDays || 0) / totalDays) * 100) : 100;
  const avgExams =
    currentStudent.totalExamScores && currentStudent.totalExamScores.length > 0
      ? Math.round(currentStudent.totalExamScores.reduce((a, b) => a + b, 0) / currentStudent.totalExamScores.length)
      : 0;

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const monthPaid = payments[currentMonthKey] && payments[currentMonthKey][currentStudent.barcode];
  const requiredAmount = groupPrices[currentStudent.groupGrade] || DEFAULT_GROUP_PRICES[currentStudent.groupGrade] || 150;

  const todayStatus = attendanceToday[currentStudent.barcode] || 'لم يسجل بعد';

  // Filter Broadcasts relevant to this student (all or their grade)
  const studentBroadcasts = broadcasts.filter(
    (b) => b.targetGrade === 'all' || b.targetGrade === currentStudent.groupGrade
  );

  // Private messages between teacher and this student
  const studentMessages = directMessages.filter(
    (m) => m.studentBarcode === currentStudent.barcode
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Student Profile Banner */}
      <div
        className="rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : 'rgba(255, 255, 255, 0.98)',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(179, 135, 40, 0.25)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border"
              style={{
                background: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)',
                borderColor: 'rgba(212, 175, 55, 0.4)',
              }}
            >
              <GraduationCap className="w-9 h-9 text-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                  {currentStudent.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  كود الطالب: {currentStudent.barcode}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {currentStudent.groupGrade} • مجموعة: {currentStudent.groupDays} • المعلمة: {SCHOOL_TEACHER_NAME}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => {
                requestBrowserNotificationPermission();
                soundEngine.playWhatsAppChime();
              }}
              title="تفعيل واختبار صوت إشعارات الواتساب"
              className="p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold"
              style={{
                backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                borderColor: 'rgba(212, 175, 55, 0.25)',
                color: isDark ? '#fcf6ba' : '#966c15',
              }}
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">نغمة الإشعارات</span>
            </button>

            <div
              className="px-4 py-2 rounded-2xl border text-center"
              style={{
                backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                borderColor: 'rgba(212, 175, 55, 0.25)',
              }}
            >
              <p className="text-[10px] text-slate-400 font-bold">نقاط التميز ⭐</p>
              <p className="text-lg font-black text-amber-400">{currentStudent.points || 0} نقطة</p>
            </div>

            <a
              href={`https://api.whatsapp.com/send?phone=${SCHOOL_INTL_PHONE}`}
              target="_blank"
              rel="noreferrer"
              className="btn-gold px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>محادثة المعلمة</span>
            </a>
          </div>
        </div>

        {/* Quick Highlights Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0' }}>
          <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: isDark ? 'rgba(9, 14, 23, 0.6)' : '#f8fafc', borderColor: 'rgba(212, 175, 55, 0.15)' }}>
            <p className="text-[11px] text-slate-400 font-medium">حالة اليوم ({todayStr})</p>
            <p className={`text-sm font-black mt-0.5 ${todayStatus === 'حضور' ? 'text-emerald-400' : todayStatus === 'تأخير' ? 'text-amber-400' : 'text-slate-400'}`}>
              {todayStatus}
            </p>
          </div>

          <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: isDark ? 'rgba(9, 14, 23, 0.6)' : '#f8fafc', borderColor: 'rgba(212, 175, 55, 0.15)' }}>
            <p className="text-[11px] text-slate-400 font-medium">نسبة الالتزام بالحضور</p>
            <p className="text-sm font-black text-emerald-400 mt-0.5">{attendanceRate}%</p>
          </div>

          <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: isDark ? 'rgba(9, 14, 23, 0.6)' : '#f8fafc', borderColor: 'rgba(212, 175, 55, 0.15)' }}>
            <p className="text-[11px] text-slate-400 font-medium">متوسط درجات الاختبارات</p>
            <p className="text-sm font-black text-sky-400 mt-0.5">{avgExams > 0 ? `${avgExams}%` : 'قيد الرصد'}</p>
          </div>

          <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: isDark ? 'rgba(9, 14, 23, 0.6)' : '#f8fafc', borderColor: 'rgba(212, 175, 55, 0.15)' }}>
            <p className="text-[11px] text-slate-400 font-medium">اشتراك شهر ({currentMonthKey})</p>
            <p className={`text-sm font-black mt-0.5 ${monthPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
              {monthPaid ? 'مسدد بنجاح ✅' : `${requiredAmount} ج.م (مستحق)`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b gap-2 sm:gap-4 overflow-x-auto pb-1" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#e2e8f0' }}>
        {[
          { id: 'overview' as ParentTab, label: '🌟 التقرير الشامل', icon: Sparkles },
          {
            id: 'broadcasts' as ParentTab,
            label: `📢 تنبيهات مس إيمان العامة (${studentBroadcasts.length})`,
            icon: Radio,
          },
          {
            id: 'inbox' as ParentTab,
            label: `💬 رسائل وتقارير الطالب (${studentMessages.length})`,
            icon: Inbox,
          },
          { id: 'grades' as ParentTab, label: '📊 سجل الاختبارات', icon: Award },
          { id: 'attendance' as ParentTab, label: '📅 سجل الحضور', icon: CalendarCheck },
          { id: 'contact' as ParentTab, label: '📞 التواصل والمراسلة', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = parentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setParentTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: OVERVIEW */}
      {/* ========================================================= */}
      {parentTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Latest Exam Card */}
          <div
            className="p-6 rounded-3xl border space-y-4"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                  آخر اختبار رياضيات مسجل
                </h3>
              </div>
            </div>

            {currentStudent.lastExamTitle ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 font-bold">اسم الامتحان:</p>
                  <p className="text-base font-black text-slate-200">{currentStudent.lastExamTitle}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <span className="text-xs text-amber-300 font-bold">النتيجة المحققة:</span>
                  <span className="text-sm font-black text-amber-400">{currentStudent.lastExamScore}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">لم يتم رصد اختبارات بعد في هذه الفترة.</p>
            )}
          </div>

          {/* Guidelines Card */}
          <div
            className="p-6 rounded-3xl border space-y-4"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
            }}
          >
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                تعليمات وتوجيهات مس إيمان الدمشيتي
              </h3>
            </div>

            <ul className="text-xs space-y-2.5 text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>يرجى الحضور قبل موعد الحصة بـ 10 دقائق لتجهيز كشكول التمارين.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>إحضار كارت الباركود الخاص بالطالب في كل حصة لتسجيل الحضور.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>حل الواجبات المحددة أولاً بأول لجمع نقاط التميز والتكريم الشهري ⭐.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: BROADCASTS (General Notices posted on the website) */}
      {/* ========================================================= */}
      {parentTab === 'broadcasts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
              لوحة التنبيهات والرسائل العامة من المعلمة ({studentBroadcasts.length})
            </h3>
          </div>

          {studentBroadcasts.length === 0 ? (
            <div className="p-8 rounded-3xl border border-dashed text-center text-slate-400" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
              لا توجد تنبيهات عامة منشورة حالياً.
            </div>
          ) : (
            <div className="space-y-3">
              {studentBroadcasts.map((bc) => (
                <div
                  key={bc.id}
                  className="p-5 rounded-3xl border space-y-3 shadow-lg"
                  style={{
                    backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                    borderColor:
                      bc.priority === 'urgent'
                        ? 'rgba(239, 68, 68, 0.4)'
                        : bc.priority === 'important'
                        ? 'rgba(245, 158, 11, 0.4)'
                        : isDark
                        ? 'rgba(212, 175, 55, 0.25)'
                        : '#e2e8f0',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-200">{bc.title}</h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            bc.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : bc.priority === 'important'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {bc.priority === 'urgent' ? 'عاجل 🚨' : bc.priority === 'important' ? 'هام ⭐' : 'إشعار ℹ️'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {bc.date} • {bc.time} • بقلم: {bc.authorName}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{bc.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: INBOX (Private Messages & Reports for this Student) */}
      {/* ========================================================= */}
      {parentTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                التقارير والملاحظات الخاصة بالطالب/ة ({studentMessages.length})
              </h3>
            </div>

            {studentMessages.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed text-center text-slate-400" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
                لا توجد تقارير أو رسائل خاصة مسجلة لهذا الطالب حتى الآن.
              </div>
            ) : (
              <div className="space-y-3">
                {studentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-5 rounded-2xl border space-y-2.5 ${
                      msg.sender === 'teacher'
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-sky-500/30 bg-sky-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            msg.sender === 'teacher'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {msg.sender === 'teacher' ? 'من المعلمة مس إيمان' : 'رسالتك للمعلمة'}
                        </span>
                        {msg.title && <span className="text-xs font-bold text-slate-200">{msg.title}</span>}
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {msg.date} • {msg.time}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Reply Form to Teacher */}
          <div
            className="p-6 rounded-3xl border space-y-4 h-fit"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
            }}
          >
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <Send className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                إرسال استفسار أو رد للمس عبر الموقع
              </h4>
            </div>

            {inquiryFeedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                {inquiryFeedback}
              </div>
            )}

            <textarea
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="اكتب رسالتك أو استفسارك هنا للمعلمة..."
              className="w-full p-3 rounded-xl text-xs border outline-none leading-relaxed"
              style={{
                backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                borderColor: 'rgba(212, 175, 55, 0.3)',
                color: isDark ? '#ffffff' : '#0f172a',
              }}
            />

            <button
              onClick={async () => {
                if (!replyText.trim()) {
                  alert('يرجى كتابة نص الرسالة أولاً.');
                  return;
                }
                const res = await sendParentReplyToTeacher(currentStudent.barcode, replyText);
                if (res.success) {
                  setInquiryFeedback(res.message);
                  setReplyText('');
                  setTimeout(() => setInquiryFeedback(null), 4000);
                } else {
                  alert(res.message);
                }
              }}
              className="w-full py-3 btn-gold font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>إرسال الرد للموقع</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 4: GRADES */}
      {/* ========================================================= */}
      {parentTab === 'grades' && (
        <div
          className="p-6 rounded-3xl border space-y-4"
          style={{
            backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
            borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
          }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
            <h3 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
              سجل درجات الاختبارات والكويزات
            </h3>
            <span className="text-xs font-bold text-amber-400">
              متوسط الأداء التراكمي: {avgExams}%
            </span>
          </div>

          {currentStudent.lastExamTitle ? (
            <div className="p-4 rounded-2xl border space-y-2" style={{ backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc', borderColor: 'rgba(212, 175, 55, 0.2)' }}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-200">{currentStudent.lastExamTitle}</h4>
                <span className="text-xs font-bold text-amber-400 font-mono">{currentStudent.lastExamScore}</span>
              </div>
              <p className="text-xs text-slate-400">
                تقييم الأستاذة: أداء ممتاز مع إشادة خاصة بالحل النموذجي للتمارين والواجبات.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 p-4">لا توجد اختبارات مسجلة بعد في المنظومة.</p>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 5: ATTENDANCE (Comprehensive Monthly Schedule & History) */}
      {/* ========================================================= */}
      {parentTab === 'attendance' && (() => {
        const ARABIC_DAYS_MAP: Record<number, string> = {
          0: 'الأحد',
          1: 'الإثنين',
          2: 'الثلاثاء',
          3: 'الأربعاء',
          4: 'الخميس',
          5: 'الجمعة',
          6: 'السبت',
        };

        const ARABIC_MONTHS_NAMES = [
          'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];

        // Determine effective target group days
        let effectiveGroup = currentStudent.groupDays;
        if (attendanceGroupSchedule === 'sat_mon_wed') {
          effectiveGroup = 'سبت - إثنين - أربعاء';
        } else if (attendanceGroupSchedule === 'sun_tue_thu') {
          effectiveGroup = 'أحد - ثلاثاء - خميس';
        }

        // Days of week:
        // 'سبت - إثنين - أربعاء' -> Saturday (6), Monday (1), Wednesday (3)
        // 'أحد - ثلاثاء - خميس' -> Sunday (0), Tuesday (2), Thursday (4)
        const isSatMonWed =
          effectiveGroup.includes('سبت') ||
          effectiveGroup.includes('إثنين') ||
          effectiveGroup.includes('أربعاء');
        const targetDaysOfWeek = isSatMonWed ? [6, 1, 3] : [0, 2, 4];

        const { year, month } = attendanceMonth;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        interface MonthSessionItem {
          date: string;
          dayName: string;
          dayNumber: number;
          sessionIndex: number;
          isToday: boolean;
          isPast: boolean;
          isFuture: boolean;
          status: 'حضور' | 'تأخير' | 'غائب' | 'قادمة' | 'اليوم (بانتظار المسح)';
          rawStatus?: string;
          pointsEarned: number;
          note: string;
        }

        const monthSessions: MonthSessionItem[] = [];
        let counter = 1;

        for (let day = 1; day <= daysInMonth; day++) {
          const dateObj = new Date(year, month, day);
          const dayOfWeek = dateObj.getDay();

          if (targetDaysOfWeek.includes(dayOfWeek)) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isPast = dateStr < todayStr;
            const isFuture = dateStr > todayStr;

            // Check recorded attendance
            let record = attendanceHistory[dateStr]?.[currentStudent.barcode];
            if (isToday && attendanceToday[currentStudent.barcode]) {
              record = attendanceToday[currentStudent.barcode];
            }

            let status: MonthSessionItem['status'];
            let pointsEarned = 0;
            let note = '';

            if (record === 'حضور') {
              status = 'حضور';
              pointsEarned = 5;
              note = 'حضر في الموعد المحدد (+5 نقاط ⭐)';
            } else if (record === 'تأخير') {
              status = 'تأخير';
              pointsEarned = 2;
              note = 'حضر متأخراً عن موعد الحصة (+2 نقطة ⭐)';
            } else if (record === 'غائب') {
              status = 'غائب';
              pointsEarned = 0;
              note = 'تم تسجيل غياب وإشعار ولي الأمر';
            } else {
              if (isToday) {
                status = 'اليوم (بانتظار المسح)';
                note = 'حصة اليوم - بانتظار مسح الباركود عند الدخول';
              } else if (isPast) {
                status = 'غائب';
                pointsEarned = 0;
                note = 'غائب (لم يسجل حضور في هذه الحصة)';
              } else {
                status = 'قادمة';
                note = 'حصة مجدولة قادمة حسب جدول المجموعة';
              }
            }

            monthSessions.push({
              date: dateStr,
              dayName: ARABIC_DAYS_MAP[dayOfWeek],
              dayNumber: day,
              sessionIndex: counter++,
              isToday,
              isPast,
              isFuture,
              status,
              rawStatus: record,
              pointsEarned,
              note,
            });
          }
        }

        // Stats calculation
        const totalScheduled = monthSessions.length;
        const presentCount = monthSessions.filter((s) => s.status === 'حضور').length;
        const lateCount = monthSessions.filter((s) => s.status === 'تأخير').length;
        const absentCount = monthSessions.filter((s) => s.status === 'غائب').length;
        const upcomingCount = monthSessions.filter((s) => s.status === 'قادمة' || s.status === 'اليوم (بانتظار المسح)').length;
        const completedSessions = presentCount + lateCount + absentCount;
        const monthlyRate = completedSessions > 0 ? Math.round(((presentCount + lateCount) / completedSessions) * 100) : 100;
        const totalStarsThisMonth = monthSessions.reduce((acc, s) => acc + s.pointsEarned, 0);

        // Filtered sessions
        const filteredSessions = monthSessions.filter((s) => {
          if (attendanceFilter === 'all') return true;
          if (attendanceFilter === 'present') return s.status === 'حضور';
          if (attendanceFilter === 'late') return s.status === 'تأخير';
          if (attendanceFilter === 'absent') return s.status === 'غائب';
          if (attendanceFilter === 'upcoming') return s.status === 'قادمة' || s.status === 'اليوم (بانتظار المسح)';
          return true;
        });

        // Navigation handlers
        const handlePrevMonth = () => {
          setAttendanceMonth((prev) =>
            prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
          );
        };

        const handleNextMonth = () => {
          setAttendanceMonth((prev) =>
            prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
          );
        };

        const handleCurrentMonth = () => {
          const now = new Date();
          setAttendanceMonth({ year: now.getFullYear(), month: now.getMonth() });
        };

        return (
          <div
            className="p-6 sm:p-8 rounded-3xl border space-y-6"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
            }}
          >
            {/* 1. Header & Month Navigator */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg sm:text-xl font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                    سجل الحضور والغياب الشهري المجدول
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  متابعة دقيقة لكل حصص المجموعة (أيام الحصص المحددة طوال الشهر بالتواريخ وحالات الحضور)
                </p>
              </div>

              {/* Month Navigation Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl border border-slate-700 hover:border-amber-400/60 bg-slate-800/80 text-slate-200 hover:text-amber-300 transition-all text-xs font-bold flex items-center gap-1"
                  title="الشهر السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الشهر السابق</span>
                </button>

                <div
                  className="px-4 py-2 rounded-xl border font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm"
                  style={{
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.35)',
                    color: isDark ? '#fcf6ba' : '#966c15',
                  }}
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>
                    {ARABIC_MONTHS_NAMES[month]} {year}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl border border-slate-700 hover:border-amber-400/60 bg-slate-800/80 text-slate-200 hover:text-amber-300 transition-all text-xs font-bold flex items-center gap-1"
                  title="الشهر القادم"
                >
                  <span>الشهر القادم</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCurrentMonth}
                  className="px-3 py-2 rounded-xl text-xs font-bold btn-gold text-slate-950 shadow transition-all"
                >
                  الشهر الحالي ⚡
                </button>
              </div>
            </div>

            {/* 2. Group Schedule Filter Selector */}
            <div
              className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3"
              style={{
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.65)' : '#f8fafc',
                borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#e2e8f0',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">مواعيد جدول الحصص:</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {effectiveGroup}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAttendanceGroupSchedule('studentGroup')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    attendanceGroupSchedule === 'studentGroup'
                      ? 'btn-gold text-slate-950 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700'
                  }`}
                >
                  🎓 جدول الطالب ({currentStudent.groupDays})
                </button>

                <button
                  type="button"
                  onClick={() => setAttendanceGroupSchedule('sat_mon_wed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    attendanceGroupSchedule === 'sat_mon_wed'
                      ? 'btn-gold text-slate-950 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700'
                  }`}
                >
                  🗓️ سبت - إثنين - أربعاء
                </button>

                <button
                  type="button"
                  onClick={() => setAttendanceGroupSchedule('sun_tue_thu')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    attendanceGroupSchedule === 'sun_tue_thu'
                      ? 'btn-gold text-slate-950 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700'
                  }`}
                >
                  🗓️ أحد - ثلاثاء - خميس
                </button>
              </div>
            </div>

            {/* 3. Monthly Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl border bg-slate-800/40 border-slate-700/60">
                <p className="text-[11px] text-slate-400 font-bold">حصص الشهر المقررة</p>
                <p className="text-lg font-black text-amber-300 mt-1">{totalScheduled} حصة</p>
                <span className="text-[10px] text-slate-500">{isSatMonWed ? 'سبت/إثنين/أربعاء' : 'أحد/ثلاثاء/خميس'}</span>
              </div>

              <div className="p-3.5 rounded-2xl border bg-emerald-500/10 border-emerald-500/30">
                <p className="text-[11px] text-emerald-400 font-bold">حضور معتمد</p>
                <p className="text-lg font-black text-emerald-300 mt-1">{presentCount} حصة</p>
                <span className="text-[10px] text-emerald-500/90">+{presentCount * 5} نقطة ⭐</span>
              </div>

              <div className="p-3.5 rounded-2xl border bg-amber-500/10 border-amber-500/30">
                <p className="text-[11px] text-amber-400 font-bold">حضور متأخر</p>
                <p className="text-lg font-black text-amber-300 mt-1">{lateCount} حصة</p>
                <span className="text-[10px] text-amber-500/90">+{lateCount * 2} نقطة ⭐</span>
              </div>

              <div className="p-3.5 rounded-2xl border bg-rose-500/10 border-rose-500/30">
                <p className="text-[11px] text-rose-400 font-bold">غياب مسجل</p>
                <p className="text-lg font-black text-rose-300 mt-1">{absentCount} حصة</p>
                <span className="text-[10px] text-rose-500/90">من الحصص المنقضية</span>
              </div>

              <div className="p-3.5 rounded-2xl border bg-sky-500/10 border-sky-500/30">
                <p className="text-[11px] text-sky-400 font-bold">حصص قادمة</p>
                <p className="text-lg font-black text-sky-300 mt-1">{upcomingCount} حصة</p>
                <span className="text-[10px] text-sky-500/90">متبقية في الشهر</span>
              </div>

              <div className="p-3.5 rounded-2xl border bg-purple-500/10 border-purple-500/30">
                <p className="text-[11px] text-purple-400 font-bold">الالتزام الشهري</p>
                <p className="text-lg font-black text-purple-300 mt-1">{monthlyRate}%</p>
                <span className="text-[10px] text-purple-500/90">{totalStarsThisMonth} ⭐ مكتسبة</span>
              </div>
            </div>

            {/* 4. Filter Tabs & View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-400 pl-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>تصفية:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    attendanceFilter === 'all'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  الكل ({totalScheduled})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('present')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    attendanceFilter === 'present'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🟢 الحضور ({presentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('late')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    attendanceFilter === 'late'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🟡 التأخير ({lateCount})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('absent')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    attendanceFilter === 'absent'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔴 الغياب ({absentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('upcoming')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    attendanceFilter === 'upcoming'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📅 القادمة ({upcomingCount})
                </button>
              </div>

              {/* View Layout Toggle */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAttendanceViewLayout('table')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    attendanceViewLayout === 'table' ? 'bg-amber-400 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  جدول تفصيلي 📋
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceViewLayout('cards')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    attendanceViewLayout === 'cards' ? 'bg-amber-400 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  بطاقات الحصص 🗂️
                </button>
              </div>
            </div>

            {/* 5. Sessions Table or Cards View */}
            {filteredSessions.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed text-center text-slate-400 space-y-2" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
                <CalendarCheck className="w-8 h-8 mx-auto text-amber-400/60" />
                <p className="text-xs font-bold">لا توجد حصص تطابق التصفية المحددة في هذا الشهر.</p>
              </div>
            ) : attendanceViewLayout === 'table' ? (
              <div className="overflow-x-auto rounded-2xl border shadow-sm" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#e2e8f0' }}>
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr style={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#f1f5f9', color: isDark ? '#e6c667' : '#966c15' }}>
                      <th className="p-3.5 font-bold">رقم الحصة</th>
                      <th className="p-3.5 font-bold">اليوم والتاريخ</th>
                      <th className="p-3.5 font-bold">المادة الدراسية</th>
                      <th className="p-3.5 font-bold">المجموعة</th>
                      <th className="p-3.5 font-bold">حالة الحضور</th>
                      <th className="p-3.5 font-bold">النقاط والملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.1)' : '#f1f5f9' }}>
                    {filteredSessions.map((session) => {
                      const isToday = session.isToday;
                      return (
                        <tr
                          key={session.date}
                          className="hover:bg-amber-500/5 transition-colors"
                          style={{
                            backgroundColor: isToday
                              ? isDark
                                ? 'rgba(212, 175, 55, 0.08)'
                                : '#fefce8'
                              : undefined,
                          }}
                        >
                          {/* Session Number */}
                          <td className="p-3.5 font-mono font-bold text-slate-400">
                            حصة #{session.sessionIndex}
                          </td>

                          {/* Day & Date */}
                          <td className="p-3.5 font-bold">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-400 font-bold">{session.dayName}</span>
                              <span className="font-mono text-slate-300">{session.date}</span>
                              {isToday && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                                  اليوم ⚡
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Subject */}
                          <td className="p-3.5 font-bold text-slate-200">الرياضيات</td>

                          {/* Group */}
                          <td className="p-3.5 text-slate-400">{effectiveGroup}</td>

                          {/* Status Badge */}
                          <td className="p-3.5">
                            <span
                              className={`px-3 py-1 rounded-full font-black text-[11px] inline-flex items-center gap-1.5 shadow-sm ${
                                session.status === 'حضور'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : session.status === 'تأخير'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : session.status === 'غائب'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : session.status === 'اليوم (بانتظار المسح)'
                                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50 animate-pulse'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {session.status === 'حضور' && '🟢 حضور معتمد'}
                              {session.status === 'تأخير' && '🟡 حضور متأخر'}
                              {session.status === 'غائب' && '🔴 غياب مسجل'}
                              {session.status === 'اليوم (بانتظار المسح)' && '⏳ حصة اليوم'}
                              {session.status === 'قادمة' && '📅 حصة قادمة'}
                            </span>
                          </td>

                          {/* Notes & Points */}
                          <td className="p-3.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-300 text-[11px]">{session.note}</span>
                              {session.pointsEarned > 0 && (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                                  +{session.pointsEarned} ⭐
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid Cards Layout */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSessions.map((session) => (
                  <div
                    key={session.date}
                    className="p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all hover:border-amber-400/50"
                    style={{
                      backgroundColor: session.isToday
                        ? isDark
                          ? 'rgba(212, 175, 55, 0.1)'
                          : '#fefce8'
                        : isDark
                        ? 'rgba(15, 23, 42, 0.7)'
                        : '#f8fafc',
                      borderColor: session.isToday
                        ? 'rgba(212, 175, 55, 0.5)'
                        : isDark
                        ? 'rgba(212, 175, 55, 0.15)'
                        : '#e2e8f0',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-400">{session.dayName}</span>
                        <span className="text-xs font-mono font-bold text-slate-300">{session.date}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">حصة #{session.sessionIndex}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`px-3 py-1 rounded-full font-black text-[11px] inline-flex items-center gap-1 ${
                          session.status === 'حضور'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : session.status === 'تأخير'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : session.status === 'غائب'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : session.status === 'اليوم (بانتظار المسح)'
                            ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {session.status === 'حضور' && '🟢 حضور'}
                        {session.status === 'تأخير' && '🟡 تأخير'}
                        {session.status === 'غائب' && '🔴 غياب'}
                        {session.status === 'اليوم (بانتظار المسح)' && '⏳ حصة اليوم'}
                        {session.status === 'قادمة' && '📅 قادمة'}
                      </span>

                      {session.pointsEarned > 0 ? (
                        <span className="text-xs font-bold text-amber-400">+{session.pointsEarned} ⭐</span>
                      ) : (
                        <span className="text-[10px] text-slate-500">{session.note}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* VIEW 6: DIRECT CONTACT */}
      {/* ========================================================= */}
      {parentTab === 'contact' && (
        <div
          className="p-6 sm:p-8 rounded-3xl border space-y-6 max-w-xl mx-auto text-center"
          style={{
            backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
            borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
          }}
        >
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center btn-gold shadow-xl">
            <PhoneCall className="w-8 h-8 text-slate-950" />
          </div>

          <div>
            <h3 className="text-lg font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
              التواصل المباشر مع {SCHOOL_TEACHER_NAME}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              متاحة للرد على استفسارات أولياء الأمور والطلاب ومتابعة الواجبات
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={`https://api.whatsapp.com/send?phone=${SCHOOL_INTL_PHONE}&text=${encodeURIComponent(`السلام عليكم مس إيمان، استفسار من ولي أمر الطالب/ة: ${currentStudent.name}`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>محادثة فورية عبر الواتساب ({SCHOOL_TEACHER_PHONE})</span>
            </a>

            <a
              href={`tel:${SCHOOL_TEACHER_PHONE}`}
              className="w-full py-3.5 border border-slate-700 bg-slate-800/80 hover:border-amber-400 text-slate-200 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <PhoneCall className="w-4 h-4 text-amber-400" />
              <span>اتصال هاتفي مباشر ({SCHOOL_TEACHER_PHONE})</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
