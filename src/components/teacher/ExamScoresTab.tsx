import React, { useState } from 'react';
import {
  useSystem,
  SCHOOL_TEACHER_NAME,
} from '../../context/SystemContext';
import { GRADE_ORDER, ExamRecord } from '../../types';
import {
  Award,
  Plus,
  Trash2,
  Send,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Search,
  Users,
  Star,
  Check,
  TrendingUp,
} from 'lucide-react';

export const ExamScoresTab: React.FC = () => {
  const {
    theme,
    students,
    exams,
    addExam,
    saveExamScores,
    deleteExam,
    sendExamResultWhatsApp,
  } = useSystem();

  const isDark = theme === 'dark';

  const [selectedGrade, setSelectedGrade] = useState<string>(GRADE_ORDER[7]); // 2nd sec default
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form for new exam
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState(GRADE_ORDER[7]);
  const [newMaxScore, setNewMaxScore] = useState<number>(50);
  const [newTopic, setNewTopic] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  // Scores editing buffer
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const [scoresBuffer, setScoresBuffer] = useState<Record<string, number>>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Sync buffer when selected exam changes
  React.useEffect(() => {
    if (currentExam) {
      setScoresBuffer(currentExam.scores || {});
    }
  }, [selectedExamId, currentExam]);

  // Filtered exams by selected grade
  const gradeExams = exams.filter((e) => !selectedGrade || selectedGrade === 'all' || e.grade === selectedGrade);

  // Filtered students for current exam
  const gradeStudents = students.filter(
    (s) => !currentExam || s.groupGrade === currentExam.grade
  );

  const displayedStudents = gradeStudents.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    return s.name.toLowerCase().includes(term) || s.barcode.toLowerCase().includes(term);
  });

  const handleScoreChange = (barcode: string, val: string) => {
    const num = parseFloat(val);
    setScoresBuffer((prev) => ({
      ...prev,
      [barcode]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSaveAllScores = async () => {
    if (!currentExam) return;
    const res = await saveExamScores(currentExam.id, scoresBuffer);
    setSaveStatus(res.message);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await addExam({
      title: newTitle.trim(),
      grade: newGrade,
      maxScore: newMaxScore,
      topic: newTopic,
      date: newDate,
    });

    if (res.success) {
      setShowAddModal(false);
      setNewTitle('');
      setNewTopic('');
      setSelectedGrade(newGrade);
      // Auto select the new exam
      if (exams.length > 0) {
        setSelectedExamId(exams[0].id);
      }
    }
  };

  // Quick stats for current exam
  const scoredCount = currentExam
    ? Object.keys(scoresBuffer).filter((k) => scoresBuffer[k] !== undefined && scoresBuffer[k] > 0).length
    : 0;

  const totalGradeStudents = gradeStudents.length;

  const averageScore = currentExam && scoredCount > 0
    ? (
        Object.values(scoresBuffer).reduce<number>((acc, curr) => acc + (Number(curr) || 0), 0) /
        scoredCount
      ).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div
        className="p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-amber-300">
              سجل رصد درجات الاختبارات والكويزات
            </h2>
            <p className="text-xs text-slate-400">
              إنشاء كويزات جديدة، رصد الدرجات فورياً، تحديث لوحة الشرف، وإرسال النتيجة بواتساب فوري لولي الأمر.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto px-5 py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إضافة اختبار / كويز جديد
        </button>
      </div>

      {/* Grade Selector & Exam Tabs */}
      <div
        className="p-5 rounded-3xl border space-y-4"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-black text-amber-400 shrink-0 ml-1">اختر المرحلة:</span>
            {GRADE_ORDER.map((gr) => (
              <button
                key={gr}
                onClick={() => setSelectedGrade(gr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedGrade === gr
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {gr}
              </button>
            ))}
          </div>
        </div>

        {/* Exams List Selector */}
        <div className="pt-3 border-t border-slate-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">
              الاختبارات المتوفرة لهذه المرحلة ({gradeExams.length}):
            </span>
          </div>

          {gradeExams.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-amber-500/5 border border-dashed border-amber-500/30">
              <p className="text-sm font-bold text-amber-400 mb-2">لا توجد اختبارات مسجلة لهذه المرحلة حتى الآن</p>
              <button
                onClick={() => {
                  setNewGrade(selectedGrade);
                  setShowAddModal(true);
                }}
                className="text-xs text-amber-300 underline font-bold"
              >
                + اضغط هنا لإنشاء أول اختبار لـ ({selectedGrade})
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {gradeExams.map((exam) => {
                const isSelected = currentExam?.id === exam.id;
                return (
                  <div
                    key={exam.id}
                    onClick={() => setSelectedExamId(exam.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/10'
                        : isDark
                        ? 'border-slate-800 bg-slate-900/60 hover:border-amber-500/30'
                        : 'border-slate-200 bg-slate-50 hover:border-amber-400/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-amber-300 leading-snug">
                          {exam.title}
                        </h4>
                        {exam.topic && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{exam.topic}</p>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-400 border border-amber-400/30 shrink-0">
                        {exam.maxScore} درجة
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/20 text-[11px] text-slate-400">
                      <span>🗓️ {exam.date}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`هل أنتِ متأكدة من حذف سجل اختبار (${exam.title})؟`)) {
                            deleteExam(exam.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="حذف الاختبار"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Grading Table & Student Score Entry */}
      {currentExam && (
        <div
          className="p-6 rounded-3xl border space-y-5"
          style={{
            backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
            borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
          }}
        >
          {/* Exam Header Details & Summary */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-700/30">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-800 dark:text-amber-300">
                  {currentExam.title}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentExam.grade}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  الدرجة العظمى: {currentExam.maxScore}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                تاريخ الرصد: {currentExam.date} {currentExam.topic ? `• موضوع الدرس: ${currentExam.topic}` : ''}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
              <div className="px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-[10px] text-slate-400 block font-bold">تم رصدهم</span>
                <span className="text-sm font-black text-amber-400">{scoredCount} / {totalGradeStudents}</span>
              </div>
              <div className="px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] text-slate-400 block font-bold">متوسط الدرجات</span>
                <span className="text-sm font-black text-emerald-400">{averageScore}</span>
              </div>
              <button
                onClick={handleSaveAllScores}
                className="px-4 py-2 rounded-2xl font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                حفظ كافة الدرجات
              </button>
            </div>
          </div>

          {saveStatus && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              {saveStatus}
            </div>
          )}

          {/* Search bar inside grading sheet */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في طلاب الفصل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border outline-none"
                style={{
                  backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                  borderColor: 'rgba(212, 175, 55, 0.25)',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
            </div>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 cursor-pointer no-print"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة كشف الدرجات
            </button>
          </div>

          {/* Grading List Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-700/30">
            <table className="w-full text-right text-xs">
              <thead className="bg-amber-500/10 text-amber-300 border-b border-slate-700/30 font-black">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">كود الباركود</th>
                  <th className="p-3">الدرجة المحصلة (من {currentExam.maxScore})</th>
                  <th className="p-3">النسبة المئوية</th>
                  <th className="p-3">التقدير والوسام</th>
                  <th className="p-3 text-center no-print">إشعار ولي الأمر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {displayedStudents.map((st, idx) => {
                  const score = scoresBuffer[st.barcode];
                  const hasScore = score !== undefined && !isNaN(score);
                  const max = currentExam.maxScore || 50;
                  const percentage = hasScore ? Math.round((score / max) * 100) : 0;

                  let gradeTag = { label: 'لم تُرصد بعد', color: 'text-slate-400 bg-slate-800' };
                  if (hasScore) {
                    if (percentage >= 95) gradeTag = { label: 'ممتاز مرتفع ⭐', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' };
                    else if (percentage >= 85) gradeTag = { label: 'جيد جداً مرتفع 🌟', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
                    else if (percentage >= 75) gradeTag = { label: 'جيد 👏', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' };
                    else if (percentage >= 50) gradeTag = { label: 'مقبول ⚠️', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' };
                    else gradeTag = { label: 'يحتاج تحسين 🚨', color: 'text-red-400 bg-red-500/20 border-red-500/30' };
                  }

                  return (
                    <tr
                      key={st.barcode}
                      className={`hover:bg-amber-500/5 transition-colors ${
                        hasScore && percentage >= 90 ? 'bg-amber-500/[0.02]' : ''
                      }`}
                    >
                      <td className="p-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black text-[11px]">
                            {st.name.charAt(0)}
                          </div>
                          <span>{st.name}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{st.barcode}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={currentExam.maxScore}
                            step="0.5"
                            placeholder="0"
                            value={scoresBuffer[st.barcode] ?? ''}
                            onChange={(e) => handleScoreChange(st.barcode, e.target.value)}
                            className="w-20 px-2.5 py-1.5 rounded-xl border font-bold text-center outline-none focus:border-amber-400"
                            style={{
                              backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                              borderColor: hasScore ? 'rgba(212, 175, 55, 0.4)' : 'rgba(100, 116, 139, 0.3)',
                              color: isDark ? '#ffffff' : '#0f172a',
                            }}
                          />
                          <span className="text-slate-400 text-[11px]">/ {currentExam.maxScore}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {hasScore ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-400">{percentage}%</span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${gradeTag.color}`}>
                          {gradeTag.label}
                        </span>
                      </td>
                      <td className="p-3 text-center no-print">
                        <button
                          onClick={() => sendExamResultWhatsApp(currentExam.id, st.barcode)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                          title="إرسال تقرير النتيجة لولي الأمر على واتساب"
                        >
                          <Send className="w-3 h-3" />
                          واتساب
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New Exam Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg p-6 rounded-3xl border shadow-2xl relative"
            style={{
              backgroundColor: isDark ? '#111827' : '#ffffff',
              borderColor: 'rgba(212, 175, 55, 0.4)',
            }}
          >
            <h3 className="text-lg font-black text-amber-400 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              إنشاء كويز / اختبار جديد
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              أدخلي بيانات الاختبار ليتم إدراجه فوراً في كشوف الدرجات للمرحلة الدراسية المحددة.
            </p>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">عنوان أو اسم الاختبار *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اختبار شهر أكتوبر - الجبر وحساب المثلثات"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المرحلة الدراسية *</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none bg-slate-900 border-slate-700 text-white"
                  >
                    {GRADE_ORDER.map((gr) => (
                      <option key={gr} value={gr}>{gr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الدرجة العظمى *</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    required
                    value={newMaxScore}
                    onChange={(e) => setNewMaxScore(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">موضوع الدرس / الوحدة</label>
                  <input
                    type="text"
                    placeholder="مثال: الدوال الحقيقية واللوغاريتمات"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ عقد الاختبار</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  إنشاء وحفظ الاختبار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
