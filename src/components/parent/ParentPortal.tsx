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
  Trophy,
  Download,
  FileText,
  Medal,
  DollarSign,
  Receipt,
  Sigma,
  Eye,
  Printer,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { TreasuryReceipt } from '../../types';
import { MathVaultTab } from '../common/MathVaultTab';
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
    sortedStudents,
    exams,
    receipts,
  } = useSystem();

  const isDark = theme === 'dark';
  const [inquiryText, setInquiryText] = useState('');
  const [inquiryFeedback, setInquiryFeedback] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [leaderboardFilter, setLeaderboardFilter] = useState<'student_grade' | 'all'>('student_grade');

  // Attendance Month & Group Schedule State
  const [attendanceMonth, setAttendanceMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [attendanceGroupSchedule, setAttendanceGroupSchedule] = useState<'studentGroup' | 'sat_mon_wed' | 'sun_tue_thu'>('studentGroup');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'late' | 'absent' | 'upcoming'>('all');
  const [attendanceViewLayout, setAttendanceViewLayout] = useState<'table' | 'cards'>('table');
  const [activeVoucher, setActiveVoucher] = useState<TreasuryReceipt | null>(null);

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

  const handleDownloadStudentReport = () => {
    if (!currentStudent) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const totalDays = (currentStudent.totalAttendanceDays || 0) + (currentStudent.totalAbsentDays || 0);
    const attendanceRate = totalDays > 0 ? Math.round(((currentStudent.totalAttendanceDays || 0) / totalDays) * 100) : 100;
    const avgScore =
      currentStudent.totalExamScores && currentStudent.totalExamScores.length > 0
        ? Math.round(currentStudent.totalExamScores.reduce((a, b) => a + b, 0) / currentStudent.totalExamScores.length)
        : 0;

    // Border
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 190, 277);
    doc.setLineWidth(0.5);
    doc.rect(13, 13, 184, 271);

    // Header banner
    doc.setFillColor(245, 240, 225);
    doc.rect(14, 14, 182, 32, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(180, 130, 20);
    doc.text('ACADEMIC PERFORMANCE REPORT CARD', 105, 27, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Teacher: ${SCHOOL_TEACHER_NAME} - Mathematics Center`, 105, 36, { align: 'center' });
    doc.text(`Date Issued: ${new Date().toLocaleDateString('en-US')}`, 105, 42, { align: 'center' });

    // Student summary box
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(20, 52, 170, 36, 3, 3, 'FD');

    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text(`Student: ${currentStudent.name}`, 25, 62);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Barcode ID: ${currentStudent.barcode}`, 25, 71);
    doc.text(`Grade Level: ${currentStudent.groupGrade}`, 25, 80);
    doc.text(`Group Days: ${currentStudent.groupDays}`, 110, 71);
    doc.text(`Parent Contact: ${currentStudent.parentPhone || currentStudent.phone || 'N/A'}`, 110, 80);

    // Metrics grid
    const metrics = [
      { label: 'Excellence Points', value: `${currentStudent.points || 0} Stars`, x: 20, y: 96 },
      { label: 'Attendance Rate', value: `${attendanceRate}% (${currentStudent.totalAttendanceDays || 0} Days)`, x: 108, y: 96 },
      { label: 'Exam Average', value: `${avgScore}%`, x: 20, y: 122 },
      { label: 'Last Exam Title', value: currentStudent.lastExamTitle || 'Regular Quiz', x: 108, y: 122 },
      { label: 'Last Exam Score', value: currentStudent.lastExamScore || 'Pending', x: 20, y: 148 },
      {
        label: 'Homework Status',
        value:
          currentStudent.lastHomeworkStatus === 'done_full'
            ? 'Fully Done (Excellent)'
            : currentStudent.lastHomeworkStatus === 'done_partial'
            ? 'Partially Done (Attention)'
            : currentStudent.lastHomeworkStatus === 'not_done'
            ? 'Missing / Incomplete'
            : 'Pending evaluation',
        x: 108,
        y: 148,
      },
    ];

    metrics.forEach((m) => {
      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(m.x, m.y, 82, 20, 2, 2, 'FD');

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(m.label, m.x + 5, m.y + 7);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(m.value, m.x + 5, m.y + 15);
    });

    // Notes Box
    doc.setFillColor(255, 252, 240);
    doc.setDrawColor(212, 175, 55);
    doc.roundedRect(20, 178, 170, 48, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(180, 130, 20);
    doc.text('Teacher Evaluation & Instructions:', 25, 188);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const hwNote = currentStudent.lastHomeworkNote ? `Homework Note: ${currentStudent.lastHomeworkNote}` : 'Continuous follow-up is appreciated.';
    doc.text(`1. ${hwNote}`, 25, 198);
    doc.text('2. Please maintain regular attendance and solve all mathematics homework exercises.', 25, 206);
    doc.text('3. For detailed reports and online follow-up, visit the student portal anytime.', 25, 214);

    // Official Footer & Signatures
    doc.setDrawColor(180, 180, 180);
    doc.line(25, 255, 75, 255);
    doc.line(135, 255, 185, 255);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Parent Signature', 35, 261);
    doc.text('Center Director Signature', 140, 261);

    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Generated securely by Academic Management System - ${new Date().toLocaleString('en-US')}`, 105, 274, { align: 'center' });

    doc.save(`Academic_Report_${currentStudent.barcode}_${currentStudent.name.replace(/\s+/g, '_')}.pdf`);
  };

  // Filter students for parent leaderboard view
  const leaderboardGradeFilter = leaderboardFilter === 'student_grade' ? currentStudent.groupGrade : 'all';
  const leaderboardFilteredStudents = sortedStudents.filter(
    (s) => leaderboardGradeFilter === 'all' || s.groupGrade === leaderboardGradeFilter
  );
  const parentTopStudents = [...leaderboardFilteredStudents].sort((a, b) => (b.points || 0) - (a.points || 0));
  const currentStudentRank = parentTopStudents.findIndex((s) => s.barcode === currentStudent.barcode) + 1;

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
          { id: 'leaderboard' as ParentTab, label: '🏆 لوحة الشرف والأوائل', icon: Trophy },
          { id: 'homework' as ParentTab, label: '📚 متابعة الواجبات', icon: BookOpen },
          { id: 'grades' as ParentTab, label: '📊 سجل الاختبارات', icon: Award },
          { id: 'payments' as ParentTab, label: '💰 الاشتراكات وسندات القبض', icon: DollarSign },
          { id: 'attendance' as ParentTab, label: '📅 سجل الحضور', icon: CalendarCheck },
          { id: 'math-vault' as ParentTab, label: '📐 خزينة وقوانين الرياضيات', icon: Sigma },
          {
            id: 'broadcasts' as ParentTab,
            label: `📢 تنبيهات مس إيمان (${studentBroadcasts.length})`,
            icon: Radio,
          },
          {
            id: 'inbox' as ParentTab,
            label: `💬 رسائل الطالب (${studentMessages.length})`,
            icon: Inbox,
          },
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
        <div className="space-y-6">
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

            {/* Latest Homework Status Card */}
            <div
              className="p-6 rounded-3xl border space-y-4"
              style={{
                backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                    حالة الواجب المنزلي الأخير
                  </h3>
                </div>
                <button
                  onClick={() => setParentTab('homework')}
                  className="text-[11px] font-bold text-amber-400 hover:underline"
                >
                  التفاصيل الكاملة ←
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">تقييم المس للواجب:</span>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black border ${
                      currentStudent.lastHomeworkStatus === 'done_full'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : currentStudent.lastHomeworkStatus === 'done_partial'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : currentStudent.lastHomeworkStatus === 'not_done'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {currentStudent.lastHomeworkStatus === 'done_full'
                      ? 'عمل الواجب كاملاً ✅'
                      : currentStudent.lastHomeworkStatus === 'done_partial'
                      ? 'ساب جزء من الواجب ⚠️'
                      : currentStudent.lastHomeworkStatus === 'not_done'
                      ? 'قصر في الواجب ❌'
                      : 'بانتظار رصد الحصة ⏳'}
                  </span>
                </div>

                {currentStudent.lastHomeworkNote && (
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 text-xs text-slate-300">
                    <span className="font-bold text-amber-400 block mb-1">ملاحظة المعلمة:</span>
                    {currentStudent.lastHomeworkNote}
                  </div>
                )}

                {currentStudent.lastHomeworkDate && (
                  <p className="text-[10px] text-slate-400">آخر تاريخ متابعة: {currentStudent.lastHomeworkDate}</p>
                )}
              </div>
            </div>

            {/* Official Report Card & Certificate */}
            <div
              className="p-6 rounded-3xl border space-y-4"
              style={{
                backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                    بطاقة التقرير الأكاديمي المعتمدة
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                يمكنك تحميل وطباعة بطاقة الأداء الفردي المعتمدة للطالب/ة بصيغة PDF لمتابعة كافة الدرجات، الحضور، ونقاط التميز.
              </p>

              <button
                onClick={handleDownloadStudentReport}
                className="w-full py-3 btn-gold font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>تحميل بطاقة التقرير الأكاديمي (PDF)</span>
              </button>
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
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW: LEADERBOARD & HONOR BOARD */}
      {/* ========================================================= */}
      {parentTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Header & Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
            <div>
              <h3 className="text-base font-black flex items-center gap-2" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>لوحة الشرف وتكريم أوائل الرياضيات 🏆</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تكريم شهري لأبطال مادة الرياضيات وفقاً لنقاط التميز، الالتزام بالواجبات، ودرجات الاختبارات.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">عرض الأوائل في:</span>
              <select
                value={leaderboardFilter}
                onChange={(e) => setLeaderboardFilter(e.target.value as any)}
                className="p-2 text-xs rounded-xl border outline-none font-bold"
                style={{
                  backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                  borderColor: 'rgba(212, 175, 55, 0.3)',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              >
                <option value="student_grade">مرحلة الطالب ({currentStudent.groupGrade})</option>
                <option value="all">كافة المراحل الدراسية</option>
              </select>
            </div>
          </div>

          {/* Student's Rank Callout Card */}
          <div
            className="p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(18, 25, 38, 0.95) 100%)',
              borderColor: 'rgba(212, 175, 55, 0.4)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-lg">
                {currentStudentRank > 0 ? `#${currentStudentRank}` : '⭐'}
              </div>
              <div>
                <p className="text-xs text-amber-300 font-bold">موقع ابنك/ابنتك في لوحة الشرف:</p>
                <h4 className="text-sm sm:text-base font-black text-slate-100">
                  {currentStudent.name} (المركز {currentStudentRank > 0 ? currentStudentRank : 'المشارك'} من أصل {parentTopStudents.length} طالب)
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] text-slate-400 block font-bold">رصيد النقاط ⭐</span>
                <span className="text-sm font-black text-amber-400">{currentStudent.points || 0} نقطة</span>
              </div>

              <button
                onClick={handleDownloadStudentReport}
                className="px-3.5 py-2 rounded-xl btn-gold text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>شهادة التقرير</span>
              </button>
            </div>
          </div>

          {/* Podium for Top 3 Students */}
          {parentTopStudents.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* 2nd Place */}
              <div
                className="p-5 rounded-3xl border text-center space-y-2 order-2 sm:order-1 relative"
                style={{
                  backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                  borderColor: 'rgba(203, 213, 225, 0.4)',
                }}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-300/20 border border-slate-300 flex items-center justify-center text-slate-300 text-xl font-black">
                  🥈
                </div>
                <p className="text-xs font-black text-slate-300">المركز الثاني</p>
                <h4 className="text-sm font-black text-slate-100 truncate">{parentTopStudents[1]?.name}</h4>
                <p className="text-[11px] text-slate-400">{parentTopStudents[1]?.groupGrade}</p>
                <div className="inline-block px-3 py-1 rounded-full bg-slate-500/10 border border-slate-400/30 text-xs font-black text-slate-300">
                  {parentTopStudents[1]?.points || 0} نقطة ⭐
                </div>
              </div>

              {/* 1st Place - Champion */}
              <div
                className="p-6 rounded-3xl border text-center space-y-2.5 order-1 sm:order-2 relative shadow-2xl scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(18, 25, 38, 0.98) 100%)',
                  borderColor: 'rgba(212, 175, 55, 0.6)',
                }}
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 text-2xl font-black shadow-lg">
                  🥇
                </div>
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-amber-500/30 text-amber-300 border border-amber-500/50 uppercase tracking-wider">
                  الأول على المرحلة 👑
                </span>
                <h4 className="text-base font-black text-amber-200 truncate">{parentTopStudents[0]?.name}</h4>
                <p className="text-xs text-slate-300">{parentTopStudents[0]?.groupGrade}</p>
                <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400 text-sm font-black text-amber-300 shadow-md">
                  {parentTopStudents[0]?.points || 0} نقطة ⭐
                </div>
              </div>

              {/* 3rd Place */}
              <div
                className="p-5 rounded-3xl border text-center space-y-2 order-3 sm:order-3 relative"
                style={{
                  backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                  borderColor: 'rgba(205, 127, 50, 0.4)',
                }}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-700/20 border border-amber-700 flex items-center justify-center text-amber-600 text-xl font-black">
                  🥉
                </div>
                <p className="text-xs font-black text-amber-600">المركز الثالث</p>
                <h4 className="text-sm font-black text-slate-100 truncate">{parentTopStudents[2]?.name}</h4>
                <p className="text-[11px] text-slate-400">{parentTopStudents[2]?.groupGrade}</p>
                <div className="inline-block px-3 py-1 rounded-full bg-amber-700/10 border border-amber-700/30 text-xs font-black text-amber-500">
                  {parentTopStudents[2]?.points || 0} نقطة ⭐
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard List */}
          <div
            className="rounded-3xl border overflow-hidden"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
            }}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <h4 className="text-sm font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                ترتيب الطلاب بالكامل في لوحة الشرف ({parentTopStudents.length} طالب)
              </h4>
            </div>

            <div className="divide-y divide-slate-800">
              {parentTopStudents.map((st, idx) => {
                const isCurrent = st.barcode === currentStudent.barcode;
                return (
                  <div
                    key={st.barcode}
                    className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                      isCurrent
                        ? 'bg-amber-500/15 border-r-4 border-amber-400'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                          idx === 0
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400'
                            : idx === 1
                            ? 'bg-slate-400/20 text-slate-200 border border-slate-400'
                            : idx === 2
                            ? 'bg-amber-700/20 text-amber-500 border border-amber-700'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs sm:text-sm font-black ${isCurrent ? 'text-amber-300 font-black' : 'text-slate-200'}`}>
                            {st.name}
                          </p>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/30 text-amber-300 border border-amber-500/50">
                              ابنك/ابنتك ⭐
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{st.groupGrade} • مجموعة {st.groupDays}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {st.points || 0} نقطة ⭐
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW: HOMEWORK TRACKING FOR CURRENT STUDENT */}
      {/* ========================================================= */}
      {parentTab === 'homework' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
            <div>
              <h3 className="text-base font-black flex items-center gap-2" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>متابعة كشكول وتطبيقات الواجب المنزلي 📚</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                سجل إنجاز الواجبات المنزلية والتمارين المرصودة بواسطة مس إيمان الدمشيتي.
              </p>
            </div>
          </div>

          {/* Current Homework Status Banner */}
          <div
            className="p-6 rounded-3xl border space-y-4 shadow-xl"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
              borderColor:
                currentStudent.lastHomeworkStatus === 'done_full'
                  ? 'rgba(16, 185, 129, 0.4)'
                  : currentStudent.lastHomeworkStatus === 'done_partial'
                  ? 'rgba(245, 158, 11, 0.4)'
                  : currentStudent.lastHomeworkStatus === 'not_done'
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(212, 175, 55, 0.25)',
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-1">تقييم الواجب الأخير المسجل:</span>
                <h4 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
                  {currentStudent.lastHomeworkStatus === 'done_full' && (
                    <span className="text-emerald-400">عمل الواجب كاملاً بنجاح وتفوق ✅</span>
                  )}
                  {currentStudent.lastHomeworkStatus === 'done_partial' && (
                    <span className="text-amber-400">ساب جزء من الواجب (يرجى إكماله) ⚠️</span>
                  )}
                  {currentStudent.lastHomeworkStatus === 'not_done' && (
                    <span className="text-rose-400">قصر في الواجب (لم يقم بالحل) ❌</span>
                  )}
                  {(!currentStudent.lastHomeworkStatus || currentStudent.lastHomeworkStatus === 'unassigned') && (
                    <span className="text-slate-400">بانتظار رصد الحصة القادمة ⏳</span>
                  )}
                </h4>
              </div>

              {currentStudent.lastHomeworkDate && (
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  تاريخ الرصد: {currentStudent.lastHomeworkDate}
                </span>
              )}
            </div>

            {/* Homework Note */}
            {currentStudent.lastHomeworkNote ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                <p className="text-xs font-bold text-amber-300">ملاحظة وتوجيه مس إيمان:</p>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {currentStudent.lastHomeworkNote}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700 text-xs text-slate-400">
                لا توجد ملاحظات كتابية إضافية مرصودة على هذا الواجب.
              </div>
            )}

            {/* Quick Action to Chat With Teacher */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              <a
                href={`https://api.whatsapp.com/send?phone=${SCHOOL_INTL_PHONE}&text=${encodeURIComponent(
                  `السلام عليكم مس إيمان، أنا ولي أمر الطالب/ة ${currentStudent.name}، بخصوص متابعة الواجب المنزلي الأخير.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl btn-gold text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>محادثة المس عبر الواتساب بخصوص الواجب</span>
              </a>

              <button
                onClick={() => setParentTab('inbox')}
                className="px-4 py-2.5 rounded-xl border text-xs font-bold text-slate-300 hover:text-white bg-slate-800/60 border-slate-700 transition-all flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>إرسال استفسار للمس عبر الموقع</span>
              </button>
            </div>
          </div>

          {/* Homework Statistics Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="p-5 rounded-2xl border text-center space-y-1"
              style={{ backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff', borderColor: 'rgba(16, 185, 129, 0.3)' }}
            >
              <div className="w-8 h-8 mx-auto rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black">
                ✓
              </div>
              <p className="text-xs text-slate-400 font-bold">واجبات كاملة ومثالية</p>
              <p className="text-xl font-black text-emerald-400">{currentStudent.totalHomeworkDone || 0}</p>
            </div>

            <div
              className="p-5 rounded-2xl border text-center space-y-1"
              style={{ backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff', borderColor: 'rgba(245, 158, 11, 0.3)' }}
            >
              <div className="w-8 h-8 mx-auto rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-black">
                ⚠️
              </div>
              <p className="text-xs text-slate-400 font-bold">واجبات غير مكتملة (ناقصة)</p>
              <p className="text-xl font-black text-amber-400">{currentStudent.totalHomeworkIncomplete || 0}</p>
            </div>

            <div
              className="p-5 rounded-2xl border text-center space-y-1"
              style={{ backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <div className="w-8 h-8 mx-auto rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-black">
                ✕
              </div>
              <p className="text-xs text-slate-400 font-bold">واجبات لم يتم تسليمها</p>
              <p className="text-xl font-black text-rose-400">{currentStudent.totalHomeworkMissing || 0}</p>
            </div>
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
      {/* VIEW 4: GRADES & EXAM PERFORMANCE */}
      {/* ========================================================= */}
      {parentTab === 'grades' && (() => {
        const studentExams = exams.filter(
          (e) => e.grade === currentStudent.groupGrade
        );

        return (
          <div className="space-y-6">
            {/* Header & Stats */}
            <div
              className="p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{
                backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
              }}
            >
              <div>
                <h3 className="text-lg font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                  📊 سجل درجات الاختبارات والكويزات
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  متابعة الدرجات المحصلة في كويزات واختبارات الحصص لمرحلة {currentStudent.groupGrade}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">متوسط الدرجات</span>
                  <span className="text-base font-black text-amber-400 font-mono">{avgExams}%</span>
                </div>
                <button
                  onClick={handleDownloadStudentReport}
                  className="btn-gold px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>شهادة التقرير (PDF)</span>
                </button>
              </div>
            </div>

            {/* List of Exams */}
            {studentExams.length === 0 ? (
              <div
                className="p-8 rounded-3xl border border-dashed text-center text-slate-400"
                style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}
              >
                لم يتم إدراج اختبارات للمرحلة بعد.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentExams.map((exam) => {
                  const score = exam.scores ? exam.scores[currentStudent.barcode] : undefined;
                  const hasScore = score !== undefined && !isNaN(score);
                  const max = exam.maxScore || 50;
                  const percentage = hasScore ? Math.round((score / max) * 100) : 0;

                  return (
                    <div
                      key={exam.id}
                      className="p-5 rounded-3xl border space-y-3 flex flex-col justify-between"
                      style={{
                        backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                        borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#e2e8f0',
                      }}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="text-sm font-black text-slate-800 dark:text-amber-300">
                              {exam.title}
                            </h4>
                            {exam.topic && (
                              <p className="text-xs text-slate-400 mt-0.5">{exam.topic}</p>
                            )}
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                            🗓️ {exam.date}
                          </span>
                        </div>

                        {/* Score display */}
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-bold">الدرجة المحققة:</span>
                          {hasScore ? (
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-amber-400 font-mono">
                                {score} / {max}
                              </span>
                              <span className="text-xs font-bold text-amber-300 font-mono">
                                ({percentage}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">بانتظار رصد الدرجة</span>
                          )}
                        </div>
                      </div>

                      {hasScore && (
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* VIEW 4.1: PAYMENTS & ELECTRONIC RECEIPTS */}
      {/* ========================================================= */}
      {parentTab === 'payments' && (() => {
        const studentReceipts = receipts.filter(
          (r) => r.studentBarcode === currentStudent.barcode
        );

        return (
          <div className="space-y-6">
            {/* Current Month Subscription Card */}
            <div
              className="p-6 rounded-3xl border space-y-4"
              style={{
                backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
                <div>
                  <h3 className="text-lg font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                    💰 حالة اشتراك الشهر الحالي ({currentMonthKey})
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    قيمة الاشتراك الشهري للمرحلة: {requiredAmount} جنيه مصري
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {monthPaid ? (
                    <span className="px-4 py-2 rounded-2xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      تم سداد اشتراك الشهر ({monthPaid.amount} ج.م)
                    </span>
                  ) : (
                    <span className="px-4 py-2 rounded-2xl text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      بانتظار السداد لشهر ({currentMonthKey})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Electronic Receipts Archive */}
            <div
              className="p-6 rounded-3xl border space-y-4"
              style={{
                backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
              }}
            >
              <h3 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                🧾 سندات وإيصالات القبض المسجلة للطالب ({studentReceipts.length})
              </h3>

              {studentReceipts.length === 0 ? (
                <div
                  className="p-8 rounded-2xl border border-dashed text-center text-slate-400 text-xs"
                  style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}
                >
                  لا توجد سندات قبض مسجلة حتى الآن. عند سداد الاشتراك سيصلك إيصال إلكتروني فوري هنا.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-700/30">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-amber-500/10 text-amber-300 border-b border-slate-700/30 font-black">
                      <tr>
                        <th className="p-3">رقم الإيصال</th>
                        <th className="p-3">تاريخ ووقت السداد</th>
                        <th className="p-3">عن شهر</th>
                        <th className="p-3">المبلغ المسدد</th>
                        <th className="p-3">المستلم</th>
                        <th className="p-3 text-center no-print">عرض وطباعة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/20">
                      {studentReceipts.map((rec) => (
                        <tr key={rec.id} className="hover:bg-amber-500/5 transition-colors">
                          <td className="p-3 font-mono font-black text-amber-400">{rec.receiptNumber}</td>
                          <td className="p-3 font-mono text-slate-400">{rec.date} ({rec.time})</td>
                          <td className="p-3 text-slate-300 font-mono">{rec.month}</td>
                          <td className="p-3 font-mono font-black text-emerald-400 text-sm">{rec.amount} ج.م</td>
                          <td className="p-3 text-slate-400">{rec.collectedBy}</td>
                          <td className="p-3 text-center no-print">
                            <button
                              onClick={() => setActiveVoucher(rec)}
                              className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-xs font-black transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              عرض السند 🧾
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* VIEW 4.2: MATH VAULT & LAWS */}
      {/* ========================================================= */}
      {parentTab === 'math-vault' && (
        <MathVaultTab />
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

      {/* LUXURY RECEIPT VOUCHER PREVIEW & PRINT MODAL FOR PARENT */}
      {activeVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl relative border-4 border-amber-400">
            <button
              onClick={() => setActiveVoucher(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 no-print cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Voucher Body for Print / Display */}
            <div className="space-y-6 text-right font-sans">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-amber-400">
                <div className="text-right">
                  <h2 className="text-xl font-black text-amber-900">سند قبض نقدية رسمي</h2>
                  <p className="text-xs font-bold text-amber-700">مجموعات الأستاذة / {SCHOOL_TEACHER_NAME}</p>
                  <p className="text-[11px] text-slate-500">معلمة أولى الرياضيات والتحليل الرياضي</p>
                </div>
                <div className="text-left font-mono">
                  <div className="px-3 py-1 bg-amber-100 border border-amber-300 rounded-xl text-xs font-black text-amber-900">
                    {activeVoucher.receiptNumber}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">{activeVoucher.date}</span>
                </div>
              </div>

              {/* Receipt Content Details */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3 text-xs leading-relaxed">
                <div className="flex justify-between border-b border-amber-200/60 pb-2">
                  <span className="text-slate-500 font-bold">استلمنا من ولي أمر الطالب/ة:</span>
                  <span className="font-black text-slate-900 text-sm">{activeVoucher.studentName}</span>
                </div>

                <div className="flex justify-between border-b border-amber-200/60 pb-2">
                  <span className="text-slate-500 font-bold">كود الباركود التعريفي:</span>
                  <span className="font-mono font-bold text-slate-800">{activeVoucher.studentBarcode}</span>
                </div>

                <div className="flex justify-between border-b border-amber-200/60 pb-2">
                  <span className="text-slate-500 font-bold">المرحلة الدراسية:</span>
                  <span className="font-bold text-slate-800">{activeVoucher.grade}</span>
                </div>

                <div className="flex justify-between border-b border-amber-200/60 pb-2">
                  <span className="text-slate-500 font-bold">سداد اشتراك عن شهر:</span>
                  <span className="font-mono font-bold text-amber-800 text-sm">{activeVoucher.month}</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-bold">المبلغ المسدد وقدره:</span>
                  <div className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-base font-mono shadow-sm">
                    {activeVoucher.amount} جنيه مصري فقط لا غير
                  </div>
                </div>

                {activeVoucher.notes && (
                  <div className="pt-2 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-800">البيان / ملاحظات: </span>
                    {activeVoucher.notes}
                  </div>
                )}
              </div>

              {/* Signatures & Stamps */}
              <div className="flex items-end justify-between pt-4 text-xs font-bold text-slate-700">
                <div>
                  <p className="text-[11px] text-slate-500 mb-1">توقيع وختم الإدارة:</p>
                  <div className="w-24 h-12 border-2 border-dashed border-amber-400 rounded-xl flex items-center justify-center text-[10px] text-amber-800 font-bold">
                    معتمد إلكترونياً
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-slate-500">المستلم: {activeVoucher.collectedBy}</p>
                  <p className="text-[10px] text-slate-400 mt-1">هاتف: {SCHOOL_TEACHER_PHONE}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 no-print">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  طباعة الإيصال (Print)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
