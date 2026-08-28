import React, { useState } from 'react';
import { useSystem, SCHOOL_TEACHER_NAME, normalizeDigits } from '../../context/SystemContext';
import { StudentData, GRADE_ORDER } from '../../types';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Send,
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  Layers,
  Award,
  Calendar,
  Check,
  Zap,
} from 'lucide-react';

export const HomeworkTrackerTab: React.FC = () => {
  const {
    theme,
    sortedStudents,
    recordHomeworkStatus,
    sendHomeworkWhatsAppAlert,
  } = useSystem();

  const isDark = theme === 'dark';
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const filteredStudents = sortedStudents.filter((s) => {
    const matchesGrade = selectedGrade === 'all' || s.groupGrade === selectedGrade;
    const term = normalizeDigits(searchTerm.trim()).toLowerCase();
    if (!term) return matchesGrade;
    const matchesName = s.name.toLowerCase().includes(term);
    const matchesBarcode = normalizeDigits(s.barcode).toLowerCase().includes(term);
    return matchesGrade && (matchesName || matchesBarcode);
  });

  const handleAction = async (
    student: StudentData,
    status: 'done_full' | 'done_partial' | 'not_done',
    channel: 'platform_only' | 'whatsapp_only' | 'both'
  ) => {
    const note = activeNotes[student.barcode] || '';
    setIsProcessing(student.barcode);

    try {
      if (channel === 'whatsapp_only') {
        sendHomeworkWhatsAppAlert(student, status, note);
        await recordHomeworkStatus(student.barcode, status, note, {
          sendPlatformMessage: false,
          openWhatsApp: false,
        });
      } else if (channel === 'platform_only') {
        const res = await recordHomeworkStatus(student.barcode, status, note, {
          sendPlatformMessage: true,
          openWhatsApp: false,
        });
        if (res.success) {
          setSuccessFeedback(res.message);
          setTimeout(() => setSuccessFeedback(null), 3500);
        }
      } else if (channel === 'both') {
        const res = await recordHomeworkStatus(student.barcode, status, note, {
          sendPlatformMessage: true,
          openWhatsApp: true,
        });
        if (res.success) {
          setSuccessFeedback(`تم تسجيل الواجب وإرسال الإشعار على المنصة والواتساب للطالب (${student.name})`);
          setTimeout(() => setSuccessFeedback(null), 3500);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
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
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                  نظام متابعة الواجبات المدرسية والتمارين 📚
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  إرسال فوري بنقرة واحدة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                رصد وتقييم تسليم الواجب (كامل ✅ / ناقص ⚠️ / مقصر ❌) وإرسال إشعار فوري لولي الأمر عبر المنصة أو الواتساب.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="px-4 py-2 rounded-2xl border text-center"
              style={{
                backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                borderColor: 'rgba(212, 175, 55, 0.25)',
              }}
            >
              <p className="text-[10px] text-slate-400 font-bold">الطلاب المستهدفين</p>
              <p className="text-lg font-black text-amber-400">{filteredStudents.length} طالب/ة</p>
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {successFeedback && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successFeedback}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div
        className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.9)' : '#ffffff',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#e2e8f0',
        }}
      >
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم الطالب أو الباركود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border outline-none font-bold"
            style={{
              backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
              borderColor: 'rgba(212, 175, 55, 0.25)',
              color: isDark ? '#ffffff' : '#0f172a',
            }}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedGrade('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedGrade === 'all'
                ? 'btn-gold shadow-md'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            كافة الصفوف
          </button>
          {GRADE_ORDER.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGrade(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedGrade === g
                  ? 'btn-gold shadow-md'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Student Homework Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((st) => {
          const currentNote = activeNotes[st.barcode] ?? (st.lastHomeworkNote || '');
          const lastStatus = st.lastHomeworkStatus;

          return (
            <div
              key={st.barcode}
              className="p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition-all hover:border-amber-400/50 shadow-md"
              style={{
                backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#e2e8f0',
              }}
            >
              <div>
                {/* Student header info */}
                <div className="flex items-start justify-between gap-2 border-b pb-3" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0' }}>
                  <div>
                    <h3 className="text-sm font-black text-slate-100 line-clamp-1">{st.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      كود: <span className="font-mono text-amber-400">{st.barcode}</span> • {st.groupGrade}
                    </p>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ⭐ {st.points || 0} نقطة
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">آخر تقييم مسجل:</span>
                  {lastStatus === 'done_full' ? (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✅ كامل (+5 نقاط)
                    </span>
                  ) : lastStatus === 'done_partial' ? (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ⚠️ ناقص (+2 نقطة)
                    </span>
                  ) : lastStatus === 'not_done' ? (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      ❌ مقصر (0 نقاط)
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">لم يرصد بعد</span>
                  )}
                </div>

                {/* Optional Note input */}
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="ملاحظة خاصة بالواجب (مثال: ص 24 تمرين 3)..."
                    value={currentNote}
                    onChange={(e) => setActiveNotes({ ...activeNotes, [st.barcode]: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border outline-none font-medium"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.25)',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons Matrix */}
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0' }}>
                <p className="text-[10px] font-bold text-slate-400">تقييم الواجب وإرسال التنبيه فوراً:</p>

                {/* Status Selection Row */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    disabled={isProcessing === st.barcode}
                    onClick={() => handleAction(st, 'done_full', 'both')}
                    className="p-2 rounded-xl text-[11px] font-black bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer disabled:opacity-50"
                    title="تسجيل واجب كامل وإرسال إشعار على المنصة والواتساب"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>كامل ✅</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing === st.barcode}
                    onClick={() => handleAction(st, 'done_partial', 'both')}
                    className="p-2 rounded-xl text-[11px] font-black bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer disabled:opacity-50"
                    title="تسجيل واجب ناقص وإرسال إشعار على المنصة والواتساب"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>ناقص ⚠️</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing === st.barcode}
                    onClick={() => handleAction(st, 'not_done', 'both')}
                    className="p-2 rounded-xl text-[11px] font-black bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer disabled:opacity-50"
                    title="تسجيل عدم حل الواجب وإرسال تنبيه تقصير"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>مقصر ❌</span>
                  </button>
                </div>

                {/* Quick Channel Split: Platform Only OR WhatsApp Only */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const stVal = lastStatus && lastStatus !== 'unassigned' ? lastStatus : 'done_full';
                      handleAction(st, stVal, 'platform_only');
                    }}
                    className="flex-1 py-1 px-2 rounded-lg text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-400 flex items-center justify-center gap-1 transition-all"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>المنصة فقط</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const stVal = lastStatus && lastStatus !== 'unassigned' ? lastStatus : 'done_full';
                      handleAction(st, stVal, 'whatsapp_only');
                    }}
                    className="flex-1 py-1 px-2 rounded-lg text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:border-emerald-500 flex items-center justify-center gap-1 transition-all"
                  >
                    <Send className="w-3 h-3" />
                    <span>واتساب فقط</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
