import React, { useState } from 'react';
import { useSystem, SCHOOL_TEACHER_NAME } from '../../context/SystemContext';
import { StudentData, GRADE_ORDER } from '../../types';
import {
  Award,
  Trophy,
  Medal,
  Star,
  Sparkles,
  Download,
  Share2,
  Printer,
  CheckCircle2,
  TrendingUp,
  FileText,
  Send,
  Calendar,
} from 'lucide-react';
import jsPDF from 'jspdf';

export const LeaderboardAndReportsTab: React.FC = () => {
  const { theme, sortedStudents, students, sendWhatsAppToStudentParent } = useSystem();
  const isDark = theme === 'dark';

  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<StudentData | null>(null);

  // Filter and sort students for leaderboard (by star points, then by attendance, then by exam average)
  const filteredStudents = sortedStudents.filter(
    (s) => selectedGrade === 'all' || s.groupGrade === selectedGrade
  );

  const topStudents = [...filteredStudents].sort((a, b) => {
    if ((b.points || 0) !== (a.points || 0)) {
      return (b.points || 0) - (a.points || 0);
    }
    const aAvg =
      a.totalExamScores && a.totalExamScores.length > 0
        ? a.totalExamScores.reduce((acc, v) => acc + v, 0) / a.totalExamScores.length
        : 0;
    const bAvg =
      b.totalExamScores && b.totalExamScores.length > 0
        ? b.totalExamScores.reduce((acc, v) => acc + v, 0) / b.totalExamScores.length
        : 0;
    return bAvg - aAvg;
  });

  // Export Student Individual Performance Report as PDF
  const handleExportIndividualReport = (student: StudentData) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const totalDays = (student.totalAttendanceDays || 0) + (student.totalAbsentDays || 0);
    const attendanceRate = totalDays > 0 ? Math.round(((student.totalAttendanceDays || 0) / totalDays) * 100) : 100;
    const avgScore =
      student.totalExamScores && student.totalExamScores.length > 0
        ? Math.round(student.totalExamScores.reduce((a, b) => a + b, 0) / student.totalExamScores.length)
        : 0;

    // Elegant certificate border
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
    doc.text(`Student: ${student.name}`, 25, 62);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Barcode ID: ${student.barcode}`, 25, 71);
    doc.text(`Grade Level: ${student.groupGrade}`, 25, 80);
    doc.text(`Group Days: ${student.groupDays}`, 110, 71);
    doc.text(`Parent Contact: ${student.parentPhone || student.phone || 'N/A'}`, 110, 80);

    // Metrics grid
    const metrics = [
      { label: 'Excellence Points', value: `${student.points || 0} Stars`, x: 20, y: 96 },
      { label: 'Attendance Rate', value: `${attendanceRate}% (${student.totalAttendanceDays || 0} Days)`, x: 108, y: 96 },
      { label: 'Exam Average', value: `${avgScore}%`, x: 20, y: 122 },
      { label: 'Last Exam Title', value: student.lastExamTitle || 'Regular Quiz', x: 108, y: 122 },
      { label: 'Last Exam Score', value: student.lastExamScore || 'Pending', x: 20, y: 148 },
      {
        label: 'Homework Status',
        value:
          student.lastHomeworkStatus === 'done_full'
            ? 'Fully Done (Excellent)'
            : student.lastHomeworkStatus === 'done_partial'
            ? 'Partially Done (Attention)'
            : student.lastHomeworkStatus === 'not_done'
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
    const hwNote = student.lastHomeworkNote ? `Homework Note: ${student.lastHomeworkNote}` : 'Continuous follow-up is appreciated.';
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

    doc.save(`Academic_Report_${student.barcode}_${student.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div
        className="p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.95)' : '#ffffff',
          borderColor: 'rgba(212, 175, 55, 0.3)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 flex items-center justify-center text-slate-950 shadow-lg shrink-0">
              <Trophy className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                  لوحة شرف الأوائل والتقارير الفردية الشاملة 🏆
                </h2>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  لوحة التكريم والتميز الأكاديمي
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                عرض مباشر لأوائل كل مرحلة حسب نقاط التميز والاختبارات، مع إمكانية استخراج كشف درجات وتقرير أداء مفصل لكل طالب.
              </p>
            </div>
          </div>

          {/* Grade Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="p-2.5 text-xs rounded-xl border outline-none font-bold shadow-sm"
              style={{
                backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                borderColor: 'rgba(212, 175, 55, 0.3)',
                color: isDark ? '#ffffff' : '#0f172a',
              }}
            >
              <option value="all">كافة المراحل الدراسية</option>
              {GRADE_ORDER.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Podium for Top 3 Students */}
      {topStudents.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 2nd Place */}
          <div
            className="p-6 rounded-3xl border text-center relative overflow-hidden flex flex-col justify-between order-2 md:order-1"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.85)' : '#ffffff',
              borderColor: 'rgba(148, 163, 184, 0.4)',
            }}
          >
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-300/20 border border-slate-400 flex items-center justify-center text-slate-300 mb-3 shadow-inner">
                <Medal className="w-8 h-8 text-slate-300" />
              </div>
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-slate-500/20 text-slate-300 border border-slate-400/40 mb-2">
                المركز الثاني 🥈
              </span>
              <h3 className="text-base font-black text-slate-100">{topStudents[1].name}</h3>
              <p className="text-xs text-slate-400 mt-1">{topStudents[1].groupGrade}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">نقاط التميز:</span>
                <span className="font-bold text-amber-400">⭐ {topStudents[1].points || 0}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForReport(topStudents[1])}
                className="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all flex items-center justify-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>عرض التقرير الأكاديمي</span>
              </button>
            </div>
          </div>

          {/* 1st Place Champion */}
          <div
            className="p-6 rounded-3xl border-2 text-center relative overflow-hidden flex flex-col justify-between order-1 md:order-2 shadow-2xl scale-105"
            style={{
              backgroundColor: isDark ? 'rgba(30, 25, 15, 0.95)' : '#fffdf5',
              borderColor: 'rgba(212, 175, 55, 0.8)',
            }}
          >
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500"></div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/30 border border-amber-400 flex items-center justify-center text-amber-300 mb-3 shadow-xl">
                <Trophy className="w-9 h-9 text-amber-400" />
              </div>
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-md mb-2">
                المركز الأول - بطل التميز 👑
              </span>
              <h3 className="text-lg font-black text-amber-300">{topStudents[0].name}</h3>
              <p className="text-xs text-slate-300 mt-1">{topStudents[0].groupGrade}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-amber-500/30 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold">نقاط التميز:</span>
                <span className="font-black text-amber-400 text-sm">⭐ {topStudents[0].points || 0} نقطة</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForReport(topStudents[0])}
                className="w-full py-2.5 rounded-xl text-xs font-black btn-gold shadow-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>عرض التقرير وتصدير شهادة التكريم</span>
              </button>
            </div>
          </div>

          {/* 3rd Place */}
          <div
            className="p-6 rounded-3xl border text-center relative overflow-hidden flex flex-col justify-between order-3"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.85)' : '#ffffff',
              borderColor: 'rgba(180, 83, 9, 0.4)',
            }}
          >
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-800/20 border border-amber-700 flex items-center justify-center text-amber-600 mb-3 shadow-inner">
                <Medal className="w-8 h-8 text-amber-600" />
              </div>
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-amber-800/30 text-amber-400 border border-amber-700/40 mb-2">
                المركز الثالث 🥉
              </span>
              <h3 className="text-base font-black text-slate-100">{topStudents[2].name}</h3>
              <p className="text-xs text-slate-400 mt-1">{topStudents[2].groupGrade}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">نقاط التميز:</span>
                <span className="font-bold text-amber-400">⭐ {topStudents[2].points || 0}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForReport(topStudents[2])}
                className="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all flex items-center justify-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>عرض التقرير الأكاديمي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Leaderboard Table */}
      <div
        className="p-6 rounded-3xl border shadow-xl space-y-4"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
        }}
      >
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0' }}>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
              الترتيب العام للطلاب ({filteredStudents.length} طالب/ة)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr
                className="border-b text-slate-400 font-bold"
                style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0' }}
              >
                <th className="p-3">الترتيب</th>
                <th className="p-3">اسم الطالب</th>
                <th className="p-3">المرحلة الدراسية</th>
                <th className="p-3 text-center">نقاط التميز</th>
                <th className="p-3 text-center">نسبة الحضور</th>
                <th className="p-3 text-center">متوسط الاختبارات</th>
                <th className="p-3 text-center">التقرير الفردي</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.1)' : '#f1f5f9' }}>
              {topStudents.map((st, index) => {
                const totalDays = (st.totalAttendanceDays || 0) + (st.totalAbsentDays || 0);
                const attRate = totalDays > 0 ? Math.round(((st.totalAttendanceDays || 0) / totalDays) * 100) : 100;
                const examAvg =
                  st.totalExamScores && st.totalExamScores.length > 0
                    ? Math.round(st.totalExamScores.reduce((a, b) => a + b, 0) / st.totalExamScores.length)
                    : 0;

                return (
                  <tr
                    key={st.barcode}
                    className="hover:bg-amber-500/5 transition-colors font-medium text-slate-200"
                  >
                    <td className="p-3 font-bold">
                      {index === 0 ? (
                        <span className="w-6 h-6 rounded-full bg-yellow-500 text-slate-950 font-black inline-flex items-center justify-center text-xs">
                          1
                        </span>
                      ) : index === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black inline-flex items-center justify-center text-xs">
                          2
                        </span>
                      ) : index === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black inline-flex items-center justify-center text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">#{index + 1}</span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-slate-100">{st.name}</td>
                    <td className="p-3 text-slate-400">{st.groupGrade}</td>
                    <td className="p-3 text-center font-black text-amber-400">⭐ {st.points || 0}</td>
                    <td className="p-3 text-center">
                      <span className={`font-bold ${attRate >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {attRate}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-sky-400">
                      {examAvg > 0 ? `${examAvg}%` : 'قيد الرصد'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForReport(st)}
                        className="px-3 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
                      >
                        عرض التقرير 📄
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detailed Report Modal */}
      {selectedStudentForReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-2xl rounded-3xl border p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.98)' : '#ffffff',
              borderColor: 'rgba(212, 175, 55, 0.4)',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#e2e8f0' }}>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  تقرير أداء أكاديمي فردي شامل
                </span>
                <h3 className="text-lg font-black text-slate-100 mt-1">{selectedStudentForReport.name}</h3>
                <p className="text-xs text-slate-400">
                  كود الطالب: <span className="font-mono text-amber-400">{selectedStudentForReport.barcode}</span> • {selectedStudentForReport.groupGrade}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentForReport(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Performance Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-[10px] text-slate-400 font-bold">نقاط التميز</p>
                <p className="text-base font-black text-amber-400 mt-0.5">⭐ {selectedStudentForReport.points || 0}</p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-slate-400 font-bold">نسبة الالتزام بالحضور</p>
                <p className="text-base font-black text-emerald-400 mt-0.5">
                  {Math.round(
                    (((selectedStudentForReport.totalAttendanceDays || 0) /
                      Math.max(1, (selectedStudentForReport.totalAttendanceDays || 0) + (selectedStudentForReport.totalAbsentDays || 0))) *
                      100)
                  )}
                  %
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
                <p className="text-[10px] text-slate-400 font-bold">متوسط الاختبارات</p>
                <p className="text-base font-black text-sky-400 mt-0.5">
                  {selectedStudentForReport.totalExamScores && selectedStudentForReport.totalExamScores.length > 0
                    ? `${Math.round(selectedStudentForReport.totalExamScores.reduce((a, b) => a + b, 0) / selectedStudentForReport.totalExamScores.length)}%`
                    : 'قيد الرصد'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                <p className="text-[10px] text-slate-400 font-bold">حالة الواجب الأخير</p>
                <p className="text-xs font-black text-purple-300 mt-1">
                  {selectedStudentForReport.lastHomeworkStatus === 'done_full'
                    ? '✅ كامل'
                    : selectedStudentForReport.lastHomeworkStatus === 'done_partial'
                    ? '⚠️ ناقص'
                    : selectedStudentForReport.lastHomeworkStatus === 'not_done'
                    ? '❌ مقصر'
                    : 'لم يسجل'}
                </p>
              </div>
            </div>

            {/* Academic Notes & Last Exam Info */}
            <div className="p-4 rounded-2xl border space-y-2 bg-slate-900/60 border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">آخر اختبار مسجل:</span>
                <span className="font-bold text-amber-300">
                  {selectedStudentForReport.lastExamTitle || 'اختبار الجبر والمثلثات'} ({selectedStudentForReport.lastExamScore || 'قيد الرصد'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">رقم ولي الأمر:</span>
                <span className="font-mono text-slate-200 font-bold">
                  {selectedStudentForReport.parentPhone || selectedStudentForReport.phone || 'غير مسجل'}
                </span>
              </div>
            </div>

            {/* Actions: PDF Export & WhatsApp Report */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleExportIndividualReport(selectedStudentForReport)}
                className="w-full sm:flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تحميل تقرير الطالب (PDF جاهز للطباعة)</span>
              </button>

              <button
                type="button"
                onClick={() => sendWhatsAppToStudentParent(selectedStudentForReport)}
                className="w-full sm:flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال التقرير لولي الأمر عبر الواتساب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
