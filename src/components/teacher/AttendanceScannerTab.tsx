import React, { useState, useEffect, useRef } from 'react';
import { useSystem, SCHOOL_TEACHER_NAME, normalizeDigits } from '../../context/SystemContext';
import { StudentData, AttendanceType } from '../../types';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Sparkles,
  Volume2,
  Calendar,
  Layers,
  UserCheck,
  Check,
  Zap,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { playNotificationSound } from '../../utils/notificationEngine';

export const AttendanceScannerTab: React.FC = () => {
  const {
    theme,
    students,
    sortedStudents,
    attendanceToday,
    attendanceHistory,
    markAttendance,
  } = useSystem();

  const isDark = theme === 'dark';
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [inputBarcode, setInputBarcode] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [lastScannedStudent, setLastScannedStudent] = useState<{
    student: StudentData;
    status: AttendanceType;
    time: string;
  } | null>(null);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto focus input
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const currentDayAttendance = selectedDate === todayStr ? attendanceToday : (attendanceHistory[selectedDate] || {});

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeDigits(inputBarcode.trim());
    if (!cleanCode) return;

    const targetStudent = students.find(
      (s) => s.barcode.toLowerCase() === cleanCode.toLowerCase()
    );

    if (!targetStudent) {
      playNotificationSound('error');
      setScanMessage({
        text: `كود الباركود (${cleanCode}) غير مسجل في قائمة الطلاب!`,
        type: 'error',
      });
      setInputBarcode('');
      return;
    }

    setIsSubmitting(true);
    const result = await markAttendance(targetStudent.barcode, 'حضور', selectedDate);
    setIsSubmitting(false);

    if (result.success) {
      playNotificationSound('attendance');
      setLastScannedStudent({
        student: targetStudent,
        status: 'حضور',
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      });
      setScanMessage({
        text: `تم تسجيل حضور الطالب/ة (${targetStudent.name}) لتاريخ (${selectedDate}) وتنبيه ولي أمره بنجاح!`,
        type: 'success',
      });
      setInputBarcode('');
    } else {
      setScanMessage({ text: result.message, type: 'error' });
    }
  };

  const handleManualMark = async (student: StudentData, status: AttendanceType) => {
    setIsSubmitting(true);
    const result = await markAttendance(student.barcode, status, selectedDate);
    setIsSubmitting(false);

    if (result.success) {
      playNotificationSound('attendance');
      setLastScannedStudent({
        student,
        status,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      });
      setScanMessage({
        text: `تم تسجيل (${status}) للطالب (${student.name}) لتاريخ (${selectedDate}) وتنبيه ولي أمره.`,
        type: 'success',
      });
    }
  };

  // Filter students list
  const filteredStudents = sortedStudents.filter((s) => {
    const matchesGrade = selectedGrade === 'all' || s.groupGrade === selectedGrade;
    const matchesGroup = selectedGroup === 'all' || s.groupDays === selectedGroup;
    return matchesGrade && matchesGroup;
  });

  const presentCount = Object.values(currentDayAttendance).filter((st) => st === 'حضور').length;
  const lateCount = Object.values(currentDayAttendance).filter((st) => st === 'تأخير').length;
  const absentCount = Object.values(currentDayAttendance).filter((st) => st === 'غائب').length;

  return (
    <div className="space-y-6">
      {/* Scanner Hero Header */}
      <div
        className="rounded-3xl border p-6 shadow-xl relative overflow-hidden"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.95)' : '#ffffff',
          borderColor: 'rgba(212, 175, 55, 0.3)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                  ماسح الباركود وتسجيل الحضور الفوري
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> إشعار مباشر لولي الأمر
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                بمجرد مسح كود الطالب أو الضغط على زر الحضور، يصل إشعار مرئي وصوتي مباشر على هاتف ولي أمر الطالب وحده.
              </p>
            </div>
          </div>

          {/* Quick Today Stats */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center min-w-[75px]">
              <p className="text-[10px] text-emerald-400 font-bold">حضور اليوم</p>
              <p className="text-base font-black text-emerald-400">{presentCount}</p>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center min-w-[75px]">
              <p className="text-[10px] text-amber-400 font-bold">تأخير</p>
              <p className="text-base font-black text-amber-400">{lateCount}</p>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center min-w-[75px]">
              <p className="text-[10px] text-rose-400 font-bold">غياب</p>
              <p className="text-base font-black text-rose-400">{absentCount}</p>
            </div>
          </div>
        </div>

        {/* Barcode Scanner Input Form */}
        <form onSubmit={handleBarcodeSubmit} className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                ref={barcodeInputRef}
                type="text"
                value={inputBarcode}
                onChange={(e) => setInputBarcode(e.target.value)}
                placeholder="امسح الباركود بجهاز الاسكانر أو اكتب كود الطالب واضغط Enter..."
                className="w-full pl-4 pr-11 py-3.5 text-sm rounded-2xl border outline-none font-mono font-bold transition-all focus:ring-2 focus:ring-amber-400/50"
                style={{
                  backgroundColor: isDark ? 'rgba(9, 14, 23, 0.9)' : '#f8fafc',
                  borderColor: 'rgba(212, 175, 55, 0.4)',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
              <QrCode className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-amber-400" />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !inputBarcode.trim()}
              className="btn-gold w-full sm:w-auto px-7 py-3.5 rounded-2xl text-xs font-black shadow-lg flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              تسجيل الحضور وإشعار ولي الأمر
            </button>
          </div>

          {/* Scan Alert Message */}
          {scanMessage && (
            <div
              className={`mt-4 p-3 rounded-2xl border text-xs font-bold flex items-center justify-between animate-fade-in ${
                scanMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {scanMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{scanMessage.text}</span>
              </div>
              <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Last Scanned Quick Card */}
      {lastScannedStudent && (
        <div
          className="rounded-3xl border p-5 shadow-lg flex items-center justify-between flex-wrap gap-4 animate-fade-in"
          style={{
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
            borderColor: 'rgba(16, 185, 129, 0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/30">
              ✓
            </div>
            <div>
              <p className="text-[11px] text-emerald-400 font-bold">آخر طالب تم تسجيله وتنبيه ولي أمره:</p>
              <h4 className="text-base font-black text-slate-100">{lastScannedStudent.student.name}</h4>
              <p className="text-xs text-slate-400 font-mono">
                كود: {lastScannedStudent.student.barcode} • المجموعة: {lastScannedStudent.student.groupDays} • الوقت: {lastScannedStudent.time}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-md">
              <Bell className="w-3.5 h-3.5" /> وصل إشعار لولي الأمر
            </span>
          </div>
        </div>
      )}

      {/* Filter and manual attendance roster */}
      <div
        className="rounded-3xl border p-6 shadow-xl space-y-6"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.95)' : '#ffffff',
          borderColor: 'rgba(212, 175, 55, 0.25)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
              كشف حضور الطلاب السريع
            </h3>
            <p className="text-xs text-slate-400">
              يمكنك أيضاً تسجيل الحضور بنقرة زر واحدة لكل طالب لإرسال إشعار فوري لولي أمره
            </p>
          </div>

          {/* Filters & Date Picker */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl border" style={{ backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc', borderColor: 'rgba(212, 175, 55, 0.3)' }}>
              <span className="text-[11px] font-bold text-amber-400 pr-1">📅 التاريخ:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold font-mono outline-none cursor-pointer"
                style={{ color: isDark ? '#ffffff' : '#0f172a' }}
              />
            </div>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="p-2 text-xs rounded-xl border outline-none font-bold"
              style={{
                backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                borderColor: 'rgba(212, 175, 55, 0.3)',
                color: isDark ? '#ffffff' : '#0f172a',
              }}
            >
              <option value="all">جميع المراحل الدراسية</option>
              <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
              <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
              <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
              <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
              <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
              <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
            </select>

            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="p-2 text-xs rounded-xl border outline-none font-bold"
              style={{
                backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                borderColor: 'rgba(212, 175, 55, 0.3)',
                color: isDark ? '#ffffff' : '#0f172a',
              }}
            >
              <option value="all">جميع المجموعات والأيام</option>
              {Array.from(new Set(students.map((s) => s.groupDays))).map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Rows */}
        <div className="space-y-3">
          {filteredStudents.map((stu) => {
            const statusOnDate = currentDayAttendance[stu.barcode];
            return (
              <div
                key={stu.barcode}
                className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-amber-400/40"
                style={{
                  backgroundColor: isDark ? 'rgba(9, 14, 23, 0.7)' : '#f8fafc',
                  borderColor: statusOnDate === 'حضور' ? 'rgba(16, 185, 129, 0.4)' : isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                      statusOnDate === 'حضور'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : statusOnDate === 'تأخير'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : statusOnDate === 'غائب'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {statusOnDate ? statusOnDate.slice(0, 1) : '–'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-100">{stu.name}</h4>
                      <span className="text-[11px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
                        {stu.barcode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {stu.groupGrade} • {stu.groupDays} • رصيد النقاط: ⭐ {stu.points || 0}
                    </p>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManualMark(stu, 'حضور')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      statusOnDate === 'حضور'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> حضور
                  </button>

                  <button
                    onClick={() => handleManualMark(stu, 'تأخير')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      statusOnDate === 'تأخير'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> تأخير
                  </button>

                  <button
                    onClick={() => handleManualMark(stu, 'غائب')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      statusOnDate === 'غائب'
                        ? 'bg-rose-500 text-slate-950 font-black shadow-md'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> غائب
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
