import React, { useState, useRef } from 'react';
import {
  useSystem,
  SCHOOL_TEACHER_NAME,
} from '../../context/SystemContext';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  ShieldCheck,
  FileJson,
  RotateCcw,
  Sparkles,
  Server,
  Cloud,
} from 'lucide-react';

export const BackupSyncTab: React.FC = () => {
  const {
    theme,
    students,
    broadcasts,
    directMessages,
    attendanceHistory,
    payments,
    exams,
    receipts,
    isCloudSyncing,
    isOnline,
    exportFullBackup,
    restoreFullBackup,
    resetToInitialDemoData,
  } = useSystem();

  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Export JSON file
  const handleExportBackup = () => {
    try {
      const data = exportFullBackup();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.href = url;
      link.download = `backup_eman_system_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({
        text: 'تم تصدير وحفظ ملف النسخة الاحتياطية الكاملة للمنظومة على جهازك بنجاح!',
        type: 'success',
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        text: `فشل تصدير النسخة: ${err.message}`,
        type: 'error',
      });
    }
  };

  // Import JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        const res = await restoreFullBackup(parsed);
        setIsRestoring(false);

        if (res.success) {
          setFeedback({ text: res.message, type: 'success' });
        } else {
          setFeedback({ text: res.message, type: 'error' });
        }
        setTimeout(() => setFeedback(null), 5000);
      } catch (err: any) {
        setIsRestoring(false);
        setFeedback({
          text: `ملف النسخة الاحتياطية غير صالح: ${err.message}`,
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemo = async () => {
    if (
      confirm(
        '⚠️ تحذير: هل أنتِ متأكدة من إعادة ضبط البيانات الأولية للنظام؟ سيتم استرجاع الحسابات التجريبية الأصلية.'
      )
    ) {
      const res = await resetToInitialDemoData();
      setFeedback({ text: res.message, type: 'success' });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Calculate stats
  const totalAttendanceDays = Object.keys(attendanceHistory).length;
  let totalAttendanceRecords = 0;
  Object.values(attendanceHistory).forEach((dayMap) => {
    totalAttendanceRecords += Object.keys(dayMap).length;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div
        className="p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-amber-300">
              النسخ الاحتياطي والمزامنة السحابية الشاملة
            </h2>
            <p className="text-xs text-slate-400">
              تأمين وحفظ بيانات الطلاب وسجلات الحضور والدرجات والخزينة في ملفات محلية أو استرجاعها فوراً.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 ${
            isOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <Cloud className="w-4 h-4" />
            {isOnline ? 'المزامنة السحابية متصلة' : 'وضع غير متصل (أوفلاين)'}
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/20 border-red-500/40 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          {feedback.text}
        </div>
      )}

      {/* System Metrics Overview */}
      <div
        className="p-6 rounded-3xl border space-y-4"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
        }}
      >
        <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
          <HardDrive className="w-4 h-4" />
          إحصائيات البيانات المخزنة بالنظام حالياً:
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block font-bold">الطلاب</span>
            <span className="text-lg font-black text-amber-400 font-mono">{students.length}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block font-bold">سجلات الحضور</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{totalAttendanceRecords}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block font-bold">الاختبارات</span>
            <span className="text-lg font-black text-blue-400 font-mono">{exams.length}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block font-bold">سندات الخزينة</span>
            <span className="text-lg font-black text-yellow-400 font-mono">{receipts.length}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block font-bold">رسائل المنصة</span>
            <span className="text-lg font-black text-purple-400 font-mono">{broadcasts.length}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block font-bold">المحادثات الخاصة</span>
            <span className="text-lg font-black text-pink-400 font-mono">{directMessages.length}</span>
          </div>
        </div>
      </div>

      {/* Main Actions: Export / Import / Factory Reset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Backup Box */}
        <div
          className="p-6 rounded-3xl border flex flex-col justify-between space-y-4"
          style={{
            backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
            borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
          }}
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-amber-300">
              تصدير نسخة احتياطية كاملة (JSON)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              يقوم بتوليد وتنزيل ملف مشفر وشامل يحتوي على كافة بيانات المنظومة، السجلات، الحسابات، وكلمات المرور لتأمينه على جهازك.
            </p>
          </div>

          <button
            onClick={handleExportBackup}
            className="w-full py-3 px-4 rounded-2xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:brightness-110 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
            تحميل النسخة الاحتياطية الآن
          </button>
        </div>

        {/* Restore Backup Box */}
        <div
          className="p-6 rounded-3xl border flex flex-col justify-between space-y-4"
          style={{
            backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
            borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
          }}
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-blue-300">
              استيراد واستعادة نسخة سابقة
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              اختر ملف النسخة الاحتياطية (.json) المحفوظ مسبقاً لاسترجاع كافة البيانات فوراً والمزامنة مع السحابة.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="w-full py-3 px-4 rounded-2xl font-black text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                جاري استعادة البيانات...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                اختيار ملف النسخة واسترجاعها
              </>
            )}
          </button>
        </div>
      </div>

      {/* Factory Reset Safety Box */}
      <div
        className="p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
          borderColor: 'rgba(239, 68, 68, 0.3)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-red-400">إعادة ضبط البيانات التجريبية الأولية</h4>
            <p className="text-[11px] text-slate-400">
              استعادة نماذج الطلاب التجريبية الافتراضية وإلغاء كافة السجلات الإضافية المسجلة.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetDemo}
          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/30 transition-all cursor-pointer"
        >
          إعادة تعيين البيانات
        </button>
      </div>
    </div>
  );
};
