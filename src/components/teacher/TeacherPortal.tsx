import React, { useState } from 'react';
import {
  useSystem,
  SCHOOL_TEACHER_NAME,
  SCHOOL_TEACHER_PHONE,
  SCHOOL_INTL_PHONE,
  normalizeDigits,
} from '../../context/SystemContext';
import {
  StudentData,
  TeacherTab,
  GRADE_ORDER,
  BroadcastAnnouncement,
  DirectStudentMessage,
} from '../../types';
import {
  Users,
  Radio,
  MessageSquare,
  Send,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Search,
  ChevronLeft,
  ExternalLink,
  Copy,
  Check,
  UserCheck,
  Award,
  Layers,
  FileText,
  AlertTriangle,
  QrCode,
  FileSpreadsheet,
  PhoneOff,
  ShieldAlert,
  DollarSign,
  Database,
  Sigma,
} from 'lucide-react';
import { AttendanceScannerTab } from './AttendanceScannerTab';
import { HomeworkTrackerTab } from './HomeworkTrackerTab';
import { LeaderboardAndReportsTab } from './LeaderboardAndReportsTab';
import { ExamScoresTab } from './ExamScoresTab';
import { TreasuryAccountsTab } from './TreasuryAccountsTab';
import { BackupSyncTab } from './BackupSyncTab';
import { MathVaultTab } from '../common/MathVaultTab';
import { PhoneAuditModal } from './PhoneAuditModal';
import { exportPhoneAuditToExcel, exportPhoneAuditToPDF, analyzeStudentPhoneStatus } from '../../utils/phoneAuditExport';

export const TeacherPortal: React.FC = () => {
  const {
    theme,
    teacherTab,
    setTeacherTab,
    students,
    sortedStudents,
    broadcasts,
    directMessages,
    addBroadcast,
    deleteBroadcast,
    sendDirectMessageToStudent,
    deleteDirectMessage,
    updateStudentAccount,
    addStudentAccount,
    deleteStudentAccount,
    toggleStudentStatus,
    resetStudentPassword,
    changeTeacherPassword,
    sendWhatsAppToStudentParent,
    sendBulkWhatsAppBroadcast,
    generateStudentWhatsAppText,
  } = useSystem();

  const isDark = theme === 'dark';

  // Teacher Security & Password Change
  const [oldTeacherPass, setOldTeacherPass] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('');
  const [confirmTeacherPass, setConfirmTeacherPass] = useState('');
  const [teacherPassFeedback, setTeacherPassFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Local state for Search & Modals
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');

  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // New Student Form state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentBarcode, setNewStudentBarcode] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState(GRADE_ORDER[7]); // 2nd sec
  const [newStudentDays, setNewStudentDays] = useState<'سبت - إثنين - أربعاء' | 'أحد - ثلاثاء - خميس'>('سبت - إثنين - أربعاء');
  const [newStudentPass, setNewStudentPass] = useState('');

  // Broadcast Form state
  const [bcTitle, setBcTitle] = useState('');
  const [bcContent, setBcContent] = useState('');
  const [bcPriority, setBcPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [bcTargetGrade, setBcTargetGrade] = useState<string>('all');
  const [bcFeedback, setBcFeedback] = useState<string | null>(null);

  // Direct Message Form state
  const [selectedDirectStudentBarcode, setSelectedDirectStudentBarcode] = useState<string>(
    students[0]?.barcode || ''
  );
  const [directTitle, setDirectTitle] = useState('');
  const [directMessageText, setDirectMessageText] = useState('');
  const [directCategory, setDirectCategory] = useState<DirectStudentMessage['category']>('general');
  const [directFeedback, setDirectFeedback] = useState<string | null>(null);

  // WhatsApp Dispatch state
  const [selectedWaStudentBarcode, setSelectedWaStudentBarcode] = useState<string>(students[0]?.barcode || '');
  const [waCustomNote, setWaCustomNote] = useState('');
  const [waBulkMessage, setWaBulkMessage] = useState(
    'نحيطكم علماً بأنه سيتم عقد مراجعة هامة وحل نماذج الامتحانات في الحصة القادمة، نرجو التأكيد على حضور الطالب في الموعد المحدد.'
  );
  const [waBulkGrade, setWaBulkGrade] = useState<string>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [bulkDispatchResult, setBulkDispatchResult] = useState<{
    targetCount: number;
    links: { phone: string; message: string; studentName?: string; barcode?: string }[];
  } | null>(null);

  // Reset Password Prompt state
  const [passResetBarcode, setPassResetBarcode] = useState<string | null>(null);
  const [newPassInput, setNewPassInput] = useState('');

  // Phone & WhatsApp Audit Modal state
  const [showPhoneAuditModal, setShowPhoneAuditModal] = useState(false);

  // Filtered Students
  const filteredStudents = sortedStudents.filter((s) => {
    const matchesGrade = selectedGradeFilter === 'all' || s.groupGrade === selectedGradeFilter;
    const term = normalizeDigits(searchTerm.trim()).toLowerCase();
    if (!term) return matchesGrade;
    const matchesName = s.name.toLowerCase().includes(term);
    const matchesBarcode = normalizeDigits(s.barcode).toLowerCase().includes(term);
    const matchesPhone = s.phone.includes(term) || s.parentPhone.includes(term);
    return matchesGrade && (matchesName || matchesBarcode || matchesPhone);
  });

  const selectedStudentObj = students.find((s) => s.barcode === selectedDirectStudentBarcode);
  const studentConversation = directMessages.filter(
    (m) => m.studentBarcode === selectedDirectStudentBarcode
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Card */}
      <div
        className="rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
        style={{
          backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : 'rgba(255, 255, 255, 0.98)',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(179, 135, 40, 0.25)',
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl border"
              style={{
                background: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)',
                borderColor: 'rgba(212, 175, 55, 0.4)',
              }}
            >
              <Users className="w-9 h-9 text-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                  بوابة المعلمة - {SCHOOL_TEACHER_NAME}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  لوحة التواصل وإدارة حسابات أولياء الأمور
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                إرسال الرسائل والتنبيهات العامة للموقع • إرسال تقارير الطلاب الفردية • إدارة وتعديل الحسابات • الإرسال عبر الواتساب
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="px-4 py-2 rounded-2xl border text-center"
              style={{
                backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                borderColor: 'rgba(212, 175, 55, 0.25)',
              }}
            >
              <p className="text-[11px] text-slate-400 font-bold">إجمالي الطلاب المسجلين</p>
              <p className="text-lg font-black text-amber-400">{students.length} طالب/ة</p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-6 pt-6 border-t" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0' }}>
          {[
            {
              id: 'attendance-scanner' as TeacherTab,
              label: '⚡ حضور الباركود',
              desc: 'مسح فوري وإشعار ولي الأمر',
              icon: QrCode,
            },
            {
              id: 'homework-tracker' as TeacherTab,
              label: '📚 متابعة الواجبات',
              desc: 'رصد الواجب وإشعار فوري',
              icon: FileText,
            },
            {
              id: 'exam-scores' as TeacherTab,
              label: '📝 رصد الاختبارات',
              desc: 'كويزات، درجات، وشهادات',
              icon: Award,
            },
            {
              id: 'treasury-accounts' as TeacherTab,
              label: '💰 الخزينة والسندات',
              desc: 'اشتراكات وإيصالات قبض',
              icon: DollarSign,
            },
            {
              id: 'leaderboard' as TeacherTab,
              label: '🏆 لوحة الأوائل',
              desc: 'تقارير وشرف وتكريم',
              icon: Award,
            },
            {
              id: 'math-vault' as TeacherTab,
              label: '📐 بنك الرياضيات',
              desc: 'قوانين وتحديات كويز',
              icon: Sigma,
            },
            {
              id: 'accounts' as TeacherTab,
              label: '👥 حسابات الطلاب',
              desc: 'تعديل البيانات وكلمات السر',
              icon: Users,
            },
            {
              id: 'broadcasts' as TeacherTab,
              label: '📢 رسائل المنصة',
              desc: 'تنبيهات عامة لجميع الحسابات',
              icon: Radio,
            },
            {
              id: 'direct-messages' as TeacherTab,
              label: '💬 رسائل الطلاب',
              desc: 'تقرير وملاحظات خاصة لكل طالب',
              icon: MessageSquare,
            },
            {
              id: 'whatsapp-dispatch' as TeacherTab,
              label: '📲 إرسال واتساب',
              desc: 'رسائل مجمعة وفردية بنقرة واحدة',
              icon: Send,
            },
            {
              id: 'backup-sync' as TeacherTab,
              label: '💾 النسخ والمزامنة',
              desc: 'حفظ واسترجاع البيانات',
              icon: Database,
            },
            {
              id: 'security' as TeacherTab,
              label: '🔐 رمز المرور',
              desc: 'تغيير وتعيين رمز المعلمة',
              icon: KeyRound,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = teacherTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTeacherTab(tab.id)}
                className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? 'border-amber-400 bg-amber-500/15 shadow-lg scale-[1.01]'
                    : isDark
                    ? 'border-slate-800 bg-slate-900/60 hover:border-amber-500/30'
                    : 'border-slate-200 bg-slate-50 hover:border-amber-400/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs sm:text-sm font-black ${isActive ? 'text-amber-400' : isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {tab.label}
                  </span>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">{tab.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 0: ATTENDANCE SCANNER & IMMEDIATE NOTIFICATIONS */}
      {/* ========================================================= */}
      {teacherTab === 'attendance-scanner' && (
        <AttendanceScannerTab />
      )}

      {/* ========================================================= */}
      {/* TAB 0.1: HOMEWORK TRACKER & DIRECT DISPATCH */}
      {/* ========================================================= */}
      {teacherTab === 'homework-tracker' && (
        <HomeworkTrackerTab />
      )}

      {/* ========================================================= */}
      {/* TAB 0.2: EXAM SCORES & QUIZZES */}
      {/* ========================================================= */}
      {teacherTab === 'exam-scores' && (
        <ExamScoresTab />
      )}

      {/* ========================================================= */}
      {/* TAB 0.3: TREASURY & RECEIPTS */}
      {/* ========================================================= */}
      {teacherTab === 'treasury-accounts' && (
        <TreasuryAccountsTab />
      )}

      {/* ========================================================= */}
      {/* TAB 0.4: LEADERBOARD & INDIVIDUAL PERFORMANCE REPORTS */}
      {/* ========================================================= */}
      {teacherTab === 'leaderboard' && (
        <LeaderboardAndReportsTab />
      )}

      {/* ========================================================= */}
      {/* TAB 0.5: MATH VAULT & FORMULAS */}
      {/* ========================================================= */}
      {teacherTab === 'math-vault' && (
        <MathVaultTab />
      )}

      {/* ========================================================= */}
      {/* TAB 0.6: BACKUP & DATA SYNC */}
      {/* ========================================================= */}
      {teacherTab === 'backup-sync' && (
        <BackupSyncTab />
      )}

      {/* ========================================================= */}
      {/* TAB 1: PARENT ACCOUNTS MANAGEMENT */}
      {/* ========================================================= */}
      {teacherTab === 'accounts' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div
            className="p-4 sm:p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
            }}
          >
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم الطالب، الباركود، أو الهاتف..."
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

              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border outline-none font-bold"
                style={{
                  backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                  borderColor: 'rgba(212, 175, 55, 0.25)',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              >
                <option value="all">جميع المراحل الدراسية ({students.length})</option>
                {GRADE_ORDER.map((g) => (
                  <option key={g} value={g}>
                    {g} ({students.filter((s) => s.groupGrade === g).length})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowPhoneAuditModal(true)}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-all shadow-sm"
                title="حصر الأرقام المفقودة وغير الصالحة للواتساب وتصديرها Excel & PDF"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>حصر أرقام الواتساب المفقودة ⚠️</span>
              </button>

              <button
                onClick={() => setShowAddStudentModal(true)}
                className="btn-gold px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة حساب طالب جديد</span>
              </button>
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => {
              const isFrozen = student.accountStatus === 'frozen';
              return (
                <div
                  key={student.barcode}
                  className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                    isFrozen
                      ? 'border-rose-500/40 bg-rose-500/5'
                      : isDark
                      ? 'border-slate-800 bg-slate-900/80 hover:border-amber-500/30'
                      : 'border-slate-200 bg-white hover:border-amber-400/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                            {student.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{student.groupGrade}</p>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isFrozen
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isFrozen ? 'مجمد ❄️' : 'نشط ✅'}
                      </span>
                    </div>

                    <div
                      className="p-3 rounded-xl space-y-1.5 text-xs border"
                      style={{
                        backgroundColor: isDark ? 'rgba(9, 14, 23, 0.6)' : '#f8fafc',
                        borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">كود الباركود:</span>
                        <span className="font-mono font-bold text-amber-400">{student.barcode}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">هاتف ولي الأمر:</span>
                        <span className="font-mono font-bold text-slate-200">{student.parentPhone || student.phone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">كلمة المرور:</span>
                        <span className="font-mono font-bold text-amber-300">{student.password || '123456'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">المجموعة:</span>
                        <span className="font-bold text-slate-300">{student.groupDays}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.1)' }}>
                        <span className="text-slate-400">نقاط التميز:</span>
                        <span className="font-black text-amber-400">⭐ {student.points || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0' }}>
                    <button
                      onClick={() => setEditingStudent(student)}
                      title="تعديل بيانات الحساب"
                      className="p-2 rounded-xl text-xs font-bold border border-slate-700 hover:border-amber-400 bg-slate-800/80 text-amber-300 flex items-center justify-center gap-1 transition-all"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">تعديل</span>
                    </button>

                    <button
                      onClick={() => {
                        setPassResetBarcode(student.barcode);
                        setNewPassInput(student.password || '');
                      }}
                      title="تغيير كلمة المرور"
                      className="p-2 rounded-xl text-xs font-bold border border-slate-700 hover:border-sky-400 bg-slate-800/80 text-sky-300 flex items-center justify-center gap-1 transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">الرمز</span>
                    </button>

                    <button
                      onClick={async () => {
                        const res = await toggleStudentStatus(student.barcode);
                        alert(res.message);
                      }}
                      title={isFrozen ? 'فك التجميد' : 'تجميد الحساب'}
                      className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                        isFrozen
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                      }`}
                    >
                      {isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{isFrozen ? 'تنشيط' : 'تجميد'}</span>
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm(`هل أنتِ متأكدة من حذف حساب الطالب (${student.name}) نهائياً؟`)) {
                          const res = await deleteStudentAccount(student.barcode);
                          alert(res.message);
                        }
                      }}
                      title="حذف الحساب"
                      className="p-2 rounded-xl text-xs font-bold border border-rose-800/40 bg-rose-900/20 text-rose-400 hover:bg-rose-900/40 flex items-center justify-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredStudents.length === 0 && (
            <div className="p-8 text-center rounded-3xl border border-dashed text-slate-400" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
              لم يتم العثور على أي حسابات مطابقة لكلمات البحث.
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: GENERAL WEBSITE BROADCASTS TO ALL PARENTS */}
      {/* ========================================================= */}
      {teacherTab === 'broadcasts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Broadcast Composer */}
          <div
            className="p-6 rounded-3xl border space-y-4 lg:col-span-1 h-fit"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
            }}
          >
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <Radio className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                نشر رسالة عامة عبر المنصة
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              هذه الرسالة تظهر فوراً لجميع أولياء الأمور داخل حساباتهم على هذا الموقع عند فتحه، دون الحاجة لإرسالها عبر الواتساب.
            </p>

            {bcFeedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{bcFeedback}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Quick One-Click Templates for Platform Broadcast */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">قوالب ورسائل جاهزة بنقرة واحدة ⚡:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      label: '🔔 تذكير بموعد الحصة',
                      title: 'تذكير بموعد الحصة القادمة والالتزام بالحضور',
                      content: 'نذكر أبنائنا الطلاب بالالتزام بالحضور في الموعد المحدد للحصة وإحضار الأدوات المدرسية وكشكول الواجب.',
                      priority: 'normal' as const,
                    },
                    {
                      label: '📝 كويز تقييمي',
                      title: 'موعد الاختبار التقييمي الأسبوعي',
                      content: 'نحيطكم علماً بأنه سيتم عقد اختبار تقييمي خلال الحصة القادمة، يرجى المراجعة الجيدة لكافة الدروس السابقة.',
                      priority: 'important' as const,
                    },
                    {
                      label: '📚 تسليم الواجب',
                      title: 'تنبيه هام بشأن تسليم الواجبات والتطبيقات',
                      content: 'يرجى التأكد من إنهاء كافة صفحات الواجب المنزلي، وسيتم فحص الكشاكيل ورصد الدرجات في بداية الحصة مباشرة.',
                      priority: 'normal' as const,
                    },
                    {
                      label: '🌟 تهنئة للمتفوقين',
                      title: 'تهنئة خاصة لأبطال لوحة الشرف والتميز',
                      content: 'خالص الشكر والتقدير لطلابنا المتميزين وأولياء أمورهم على تفوقهم وحصولهم على أعلى الدرجات ونقاط التميز!',
                      priority: 'important' as const,
                    },
                    {
                      label: '🚨 تنبيه عاجل',
                      title: 'إشعار عاجل وهام من إدارة المادة',
                      content: 'يرجى من جميع الطلاب وأولياء الأمور مراجعة التقرير الأكاديمي والاطلاع على التوجيهات الجديدة.',
                      priority: 'urgent' as const,
                    },
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setBcTitle(tpl.title);
                        setBcContent(tpl.content);
                        setBcPriority(tpl.priority);
                      }}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/25 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>{tpl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">عنوان الرسالة أو التنبيه:</label>
                <input
                  type="text"
                  placeholder="مثال: تنبيه هام بخصوص موعد كويز الجبر القادم..."
                  value={bcTitle}
                  onChange={(e) => setBcTitle(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                  style={{
                    backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">درجة الأهمية:</label>
                <select
                  value={bcPriority}
                  onChange={(e) => setBcPriority(e.target.value as any)}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                  style={{
                    backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                >
                  <option value="normal">عادي ℹ️</option>
                  <option value="important">هام ومميز ⭐</option>
                  <option value="urgent">عاجل وفوري 🚨</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">المرحلة المستهدفة:</label>
                <select
                  value={bcTargetGrade}
                  onChange={(e) => setBcTargetGrade(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                  style={{
                    backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                >
                  <option value="all">كافة المراحل وأولياء الأمور (عام)</option>
                  {GRADE_ORDER.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">تفاصيل الرسالة والتوجيهات:</label>
                <textarea
                  rows={4}
                  placeholder="اكتبي نص الرسالة والتوجيهات هنا..."
                  value={bcContent}
                  onChange={(e) => setBcContent(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none font-medium leading-relaxed"
                  style={{
                    backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                />
              </div>

              <button
                onClick={async () => {
                  const res = await addBroadcast({
                    title: bcTitle,
                    content: bcContent,
                    priority: bcPriority,
                    targetGrade: bcTargetGrade,
                  });
                  if (res.success) {
                    setBcFeedback(res.message);
                    setBcTitle('');
                    setBcContent('');
                    setTimeout(() => setBcFeedback(null), 4000);
                  } else {
                    alert(res.message);
                  }
                }}
                className="w-full py-3 btn-gold font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>نشر الرسالة لجميع أولياء الأمور الآن</span>
              </button>
            </div>
          </div>

          {/* Active Broadcasts Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                سجل الرسائل والتنبيهات المنشورة على الموقع ({broadcasts.length})
              </h3>
            </div>

            {broadcasts.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed text-center text-slate-400" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
                لا توجد رسائل عامة منشورة حالياً. استخدمي النموذج لإنشاء رسالة عامة تظهر لكل أولياء الأمور على الموقع.
              </div>
            ) : (
              <div className="space-y-3">
                {broadcasts.map((bc) => (
                  <div
                    key={bc.id}
                    className="p-5 rounded-2xl border space-y-3 relative"
                    style={{
                      backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                      borderColor:
                        bc.priority === 'urgent'
                          ? 'rgba(239, 68, 68, 0.4)'
                          : bc.priority === 'important'
                          ? 'rgba(245, 158, 11, 0.4)'
                          : isDark
                          ? 'rgba(212, 175, 55, 0.2)'
                          : '#e2e8f0',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-200">{bc.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              bc.priority === 'urgent'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : bc.priority === 'important'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {bc.priority === 'urgent' ? 'عاجل 🚨' : bc.priority === 'important' ? 'هام ⭐' : 'عادي ℹ️'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {bc.targetGrade === 'all' ? 'لكل المراحل' : bc.targetGrade}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          تاريخ النشر: {bc.date} • {bc.time} • بواسطة {bc.authorName}
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          if (confirm('هل تريدين حذف هذا الإشعار من المنصة؟')) {
                            await deleteBroadcast(bc.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="حذف الإشعار"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{bc.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DIRECT IN-APP MESSAGES & REPORTS TO INDIVIDUAL STUDENTS */}
      {/* ========================================================= */}
      {teacherTab === 'direct-messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Composer */}
          <div
            className="p-6 rounded-3xl border space-y-4 lg:col-span-1 h-fit"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
            }}
          >
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                إرسال رسالة خاصة لطالب عبر الموقع
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              هذه الرسالة تظهر فقط في صندوق رسائل ولي أمر هذا الطالب المحدد عند تسجيل دخوله للموقع.
            </p>

            {directFeedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{directFeedback}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">اختيار الطالب المستهدف:</label>
                <select
                  value={selectedDirectStudentBarcode}
                  onChange={(e) => setSelectedDirectStudentBarcode(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                  style={{
                    backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                >
                  {sortedStudents.map((s) => (
                    <option key={s.barcode} value={s.barcode}>
                      {s.name} ({s.groupGrade} - {s.barcode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">تصنيف الرسالة:</label>
                <select
                  value={directCategory}
                  onChange={(e) => setDirectCategory(e.target.value as any)}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                  style={{
                    backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                >
                  <option value="general">ملاحظة عامة 💬</option>
                  <option value="achievement">إشادة وتفوق دراسي ⭐</option>
                  <option value="grades">تقرير درجات واختبارات 📝</option>
                  <option value="homework">متابعة واجبات وتمارين 📚</option>
                  <option value="attendance">تنبيه حضور وغياب ⏰</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">عنوان الرسالة:</label>
                <input
                  type="text"
                  placeholder="مثال: تقرير تفوق في اختبار الرياضيات..."
                  value={directTitle}
                  onChange={(e) => setDirectTitle(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                  style={{
                    backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                />
              </div>

              {/* One-Click Direct Message Templates */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">قوالب ورسائل جاهزة بنقرة واحدة ⚡:</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    {
                      label: '🌟 إشادة وتفوق',
                      cat: 'achievement' as const,
                      title: 'إشادة بالتفوق والتميز في مادة الرياضيات',
                      text: 'نحيطكم علماً بأن الطالب أظهر أداءً نموذجياً وتفوقاً ملحوظاً خلال الحصة، خالص التحية والتقدير لجهده واجتهاده المستمر!',
                    },
                    {
                      label: '📚 إتقان الواجب كاملاً',
                      cat: 'homework' as const,
                      title: 'تقرير الواجب المنزلي: ممتاز وكامل',
                      text: 'تم فحص كشكول الواجب وتأكدت المعلمة من حل كافة المسائل والتطبيقات بصورة نموذجية ومنظمة (+5 نقاط تميز).',
                    },
                    {
                      label: '⚠️ ساب جزء من الواجب',
                      cat: 'homework' as const,
                      title: 'ملاحظة واجب: ساب جزء من التمارين',
                      text: 'تنبيه لولي الأمر: قام الطالب بحل جزء من الواجب فقط وترك بعض المسائل، برجاء متابعة إكمال التمرينات المتبقية قبل الحصة القادمة.',
                    },
                    {
                      label: '❌ تقصير في الواجب',
                      cat: 'homework' as const,
                      title: 'تنبيه عاجل: عدم أداء الواجب المنزلي',
                      text: 'نحيطكم علماً بأن الطالب لم يقم بأداء الواجب المطلوب لهذه الحصة، يرجى التنبيه والمتابعة الدقيقة لعدم تكرار ذلك.',
                    },
                    {
                      label: '⏰ تنبيه حضور وتأخير',
                      cat: 'attendance' as const,
                      title: 'تنبيه بخصوص الحضور والمواعيد',
                      text: 'نذكركم بأهمية الالتزام بالحضور في الموعد المحدد قبل بدء الشرح بـ 10 دقائق لضمان الاستفادة الكاملة من وقت الحصة.',
                    },
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setDirectCategory(tpl.cat);
                        setDirectTitle(tpl.title);
                        setDirectMessageText(tpl.text);
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/25 transition-all cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">نص الملاحظة أو التقرير:</label>
                <textarea
                  rows={4}
                  placeholder="اكتبي التقرير الخاص بالطالب هنا..."
                  value={directMessageText}
                  onChange={(e) => setDirectMessageText(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none font-medium leading-relaxed"
                  style={{
                    backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                />
              </div>

              {/* Quick Template Buttons */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-400 font-medium">قوالب سريعة مقترحة:</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedStudentObj) {
                        setDirectTitle(`تقرير درجات واختبارات الطالب/ة ${selectedStudentObj.name}`);
                        setDirectMessageText(
                          `نود إحاطتكم علماً بأن درجة الطالب/ة في ${selectedStudentObj.lastExamTitle || 'آخر اختبار'} هي (${selectedStudentObj.lastExamScore || 'ممتاز'}). نرجو الاستمرار في المتابعة وتشجيع الطالب.`
                        );
                        setDirectCategory('grades');
                      }
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-amber-300 hover:border-amber-400 transition-colors"
                  >
                    📝 قالب تقرير درجات
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedStudentObj) {
                        setDirectTitle(`إشادة وتفوق للطالب/ة ${selectedStudentObj.name}`);
                        setDirectMessageText(
                          `يسعدنا إبلاغكم بتميز الطالب/ة وتفاعله الإيجابي الرائع في حل مسائل الرياضيات اليوم وحصوله على نقاط تميز إضافية ⭐.`
                        );
                        setDirectCategory('achievement');
                      }
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-amber-300 hover:border-amber-400 transition-colors"
                  >
                    ⭐ قالب إشادة وتكريم
                  </button>
                </div>
              </div>

              <button
                onClick={async () => {
                  const res = await sendDirectMessageToStudent(
                    selectedDirectStudentBarcode,
                    directMessageText,
                    directCategory,
                    directTitle
                  );
                  if (res.success) {
                    setDirectFeedback(res.message);
                    setDirectTitle('');
                    setDirectMessageText('');
                    setTimeout(() => setDirectFeedback(null), 4000);
                  } else {
                    alert(res.message);
                  }
                }}
                className="w-full py-3 btn-gold font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>إرسال التقرير لولي الأمر عبر المنصة</span>
              </button>
            </div>
          </div>

          {/* Conversation History with selected Student */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-2xl border flex items-center justify-between" style={{ backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff', borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0' }}>
              <div>
                <h3 className="text-sm font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                  سجل المراسلات والتقارير الخاصة بالطالب: {selectedStudentObj?.name || selectedDirectStudentBarcode}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  الباركود: {selectedStudentObj?.barcode} • المرحلة: {selectedStudentObj?.groupGrade}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {studentConversation.length} رسائل
              </span>
            </div>

            {studentConversation.length === 0 ? (
              <div className="p-8 rounded-3xl border border-dashed text-center text-slate-400" style={{ borderColor: 'rgba(212, 175, 55, 0.2)' }}>
                لا توجد رسائل أو تقارير خاصة مسجلة لهذا الطالب على المنصة بعد. يمكنك إرسال تقرير خاص باستخدام النموذج.
              </div>
            ) : (
              <div className="space-y-3">
                {studentConversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border space-y-2 relative ${
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
                          {msg.sender === 'teacher' ? 'من المعلمة (مس إيمان)' : 'رد من ولي الأمر'}
                        </span>
                        {msg.title && <span className="text-xs font-bold text-slate-200">{msg.title}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          {msg.date} • {msg.time}
                        </span>
                        <button
                          onClick={async () => {
                            if (confirm('هل تريدين حذف هذه الرسالة؟')) {
                              await deleteDirectMessage(msg.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: WHATSAPP DISPATCH CENTER */}
      {/* ========================================================= */}
      {teacherTab === 'whatsapp-dispatch' && (
        <div className="space-y-6">
          {/* Quick Notice & Phone Audit Banner */}
          <div
            className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-rose-300">
                  كشف وتدقيق أرقام الطلاب والواتساب (المفقودة وغير المسجلة)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  يمكنك حصر جميع الطلاب الذين ليس لديهم رقم هاتف أو أرقامهم غير صالحة للواتساب وتصدير الكشف فوراً كملف PDF أو Excel.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPhoneAuditModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md flex items-center gap-1.5 transition-all shrink-0 w-full sm:w-auto justify-center"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>استخراج الكشف (PDF / Excel) ⚡</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section A: Individual Student Report via WhatsApp */}
            <div
              className="p-6 rounded-3xl border space-y-4 flex flex-col justify-between"
              style={{
                backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
                  <Send className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                    إرسال تقرير فردي لولي الأمر عبر الواتساب
                  </h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  يولد رسالة شاملة منسقة تحتوي على تفاصيل حضور ودرجات ونقاط الطالب ورابط حسابه بالمنصة.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">اختيار الطالب:</label>
                    <select
                      value={selectedWaStudentBarcode}
                      onChange={(e) => setSelectedWaStudentBarcode(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                      style={{
                        backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    >
                      {sortedStudents.map((s) => (
                        <option key={s.barcode} value={s.barcode}>
                          {s.name} ({s.groupGrade} - {s.parentPhone || s.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">ملاحظة إضافية خاصة (اختياري):</label>
                    {/* Quick WhatsApp student templates */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {[
                        { label: '🌟 تميز وتفوق', text: 'ما شاء الله، أداء الطالب/ة ممتاز جداً ومشارك فعال بالحصة!' },
                        { label: '📚 متابعة الواجب', text: 'يرجى مراجعة حل الواجب واستكمال التمارين غير المكتملة.' },
                        { label: '⚠️ انتباه وتركيز', text: 'يرجى توجيه الطالب للتركيز أثناء الشرح وتجنب التشتت.' },
                        { label: '📝 كويز قادم', text: 'تذكير بالاستعداد للكويز القادم وحفظ القوانين الرياضية جيداً.' },
                      ].map((t, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setWaCustomNote(t.text)}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/20 transition-all cursor-pointer"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      placeholder="مثال: يرجى متابعة حل الواجب صفحة 24 ومراجعة تمارين الهندسة..."
                      value={waCustomNote}
                      onChange={(e) => setWaCustomNote(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border outline-none"
                      style={{
                        backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    />
                  </div>

                  {/* Preview Card */}
                  {(() => {
                    const st = students.find((s) => s.barcode === selectedWaStudentBarcode);
                    if (!st) return null;
                    const previewText = generateStudentWhatsAppText(st, waCustomNote);
                    return (
                      <div
                        className="p-3.5 rounded-xl border text-[11px] space-y-1 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto"
                        style={{
                          backgroundColor: isDark ? 'rgba(9, 14, 23, 0.9)' : '#f1f5f9',
                          borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#cbd5e1',
                          color: isDark ? '#94a3b8' : '#334155',
                        }}
                      >
                        {previewText}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <button
                onClick={() => {
                  const st = students.find((s) => s.barcode === selectedWaStudentBarcode);
                  if (st) {
                    sendWhatsAppToStudentParent(st, waCustomNote);
                  }
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Send className="w-4 h-4" />
                <span>فتح الواتساب وإرسال تقرير الطالب لولي الأمر</span>
              </button>
            </div>

            {/* Section B: Bulk Broadcast to All Parents on WhatsApp */}
            <div
              className="p-6 rounded-3xl border space-y-4 flex flex-col justify-between"
              style={{
                backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
                borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
                  <Radio className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                    إرسال إشعار لكافة أولياء الأمور عبر الواتساب دفعة واحدة
                  </h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  يتيح لكِ إرسال رسالة جماعية منسقة لكافة أولياء الأمور عبر قائمة إرسال سريعة بضغطة واحدة.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">المرحلة المستهدفة:</label>
                    <select
                      value={waBulkGrade}
                      onChange={(e) => setWaBulkGrade(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                      style={{
                        backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    >
                      <option value="all">كافة أولياء الأمور والطلاب ({students.length})</option>
                      {GRADE_ORDER.map((g) => (
                        <option key={g} value={g}>
                          {g} ({students.filter((s) => s.groupGrade === g).length})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">رسائل وقوالب جاهزة بنقرة واحدة ⚡:</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {[
                        {
                          label: '🔔 موعد الحصة القادمة',
                          text: 'نذكركم بموعد الحصة القادمة في موعدها المحدد تماماً، برجاء إحضار كشكول الواجب والآلة الحاسبة والأدوات الهندسية.',
                        },
                        {
                          label: '📝 كويز تقييمي مهم',
                          text: 'نحيطكم علماً بأنه سيتم عقد اختبار تقييمي خلال الحصة القادمة لقياس مستوى الاستيعاب والتحصيل الدراسي.',
                        },
                        {
                          label: '📚 تنبيه حل الواجبات',
                          text: 'تنبيه هام: يرجى متابعة حل كافة صفحات الواجب المنزلي، وسيتم فحص الكشاكيل ورصد النقاط في بداية الحصة.',
                        },
                        {
                          label: '🏆 تهنئة وتكريم الأوائل',
                          text: 'نهنئ أبنائنا الطلاب المتفوقين في لوحة الشرف على جهودهم وتميزهم المستمر، ونتمنى للجميع دوام النجاح والتفوق!',
                        },
                        {
                          label: '🚨 تنبيه هام جداً',
                          text: 'إشعار هام من إدارة المادة: يرجى مراجعة المنصة التعليمية لمتابعة تقرير الطالب والتوجيهات الدراسية الجديدة.',
                        },
                      ].map((t, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setWaBulkMessage(t.text)}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/20 transition-all cursor-pointer"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <label className="text-xs font-bold text-slate-300 block mb-1">نص الرسالة الجماعية:</label>
                    <textarea
                      rows={4}
                      value={waBulkMessage}
                      onChange={(e) => setWaBulkMessage(e.target.value)}
                      placeholder="اكتبي نص الرسالة هنا..."
                      className="w-full p-2.5 text-xs rounded-xl border outline-none leading-relaxed"
                      style={{
                        backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!waBulkMessage.trim()) {
                    alert('يرجى كتابة نص الرسالة أولاً.');
                    return;
                  }
                  const res = sendBulkWhatsAppBroadcast(waBulkMessage, waBulkGrade);
                  setBulkDispatchResult(res);
                }}
                className="w-full py-3.5 btn-gold font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-4"
              >
                <Send className="w-4 h-4" />
                <span>تجهيز قائمة الإرسال الجماعي عبر الواتساب</span>
              </button>
            </div>
          </div>

          {/* Bulk Dispatch List Modal/Card */}
          {bulkDispatchResult && (
            <div
              className="p-6 rounded-3xl border space-y-4"
              style={{
                backgroundColor: isDark ? 'rgba(18, 25, 38, 0.95)' : '#ffffff',
                borderColor: 'rgba(212, 175, 55, 0.3)',
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-black text-slate-200">
                    تم تجهيز قائمة الإرسال لـ ({bulkDispatchResult.targetCount}) ولي أمر
                  </h4>
                </div>

                <button
                  onClick={() => setBulkDispatchResult(null)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  إغلاق القائمة ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto p-1">
                {bulkDispatchResult.links.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border flex items-center justify-between gap-2"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.7)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.15)',
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-slate-200 truncate">{item.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.phone}</p>
                    </div>

                    <a
                      href={`https://api.whatsapp.com/send?phone=${item.phone}&text=${encodeURIComponent(item.message)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setCopiedIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        copiedIndex === idx
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'btn-gold shadow-sm'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>{copiedIndex === idx ? 'تم الفتح ✓' : 'إرسال'}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: TEACHER SECURITY & PASSWORD CHANGE */}
      {/* ========================================================= */}
      {teacherTab === 'security' && (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
          {/* Main Security Card */}
          <div
            className="p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.92)' : '#ffffff',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#e2e8f0',
            }}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0' }}>
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner"
                  style={{
                    backgroundColor: 'rgba(212, 175, 55, 0.15)',
                    borderColor: 'rgba(212, 175, 55, 0.35)',
                    color: '#d4af37',
                  }}
                >
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                    تغيير وتحديث رمز مرور المعلمة
                  </h3>
                  <p className="text-xs text-slate-400">
                    إدارة أمان حساب المعلمة وتعيين رمز دخول سري جديد ومحمي
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>الحساب محمي ومشفر</span>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setTeacherPassFeedback(null);

                if (!oldTeacherPass.trim()) {
                  setTeacherPassFeedback({ text: 'يرجى إدخال رمز المرور الحالي أولاً.', type: 'error' });
                  return;
                }
                if (!newTeacherPass.trim()) {
                  setTeacherPassFeedback({ text: 'يرجى إدخال رمز المرور الجديد.', type: 'error' });
                  return;
                }
                if (newTeacherPass.trim().length < 4) {
                  setTeacherPassFeedback({ text: 'يجب أن يتكون رمز المرور من 4 خانات على الأقل.', type: 'error' });
                  return;
                }
                if (newTeacherPass.trim() !== confirmTeacherPass.trim()) {
                  setTeacherPassFeedback({ text: 'تأكيد رمز المرور غير متطابق مع الرمز الجديد.', type: 'error' });
                  return;
                }

                setIsChangingPass(true);
                const res = await changeTeacherPassword(oldTeacherPass, newTeacherPass);
                setIsChangingPass(false);

                if (res.success) {
                  setTeacherPassFeedback({ text: res.message, type: 'success' });
                  setOldTeacherPass('');
                  setNewTeacherPass('');
                  setConfirmTeacherPass('');
                } else {
                  setTeacherPassFeedback({ text: res.message, type: 'error' });
                }
              }}
              className="mt-6 space-y-5"
            >
              {/* Feedback alert */}
              {teacherPassFeedback && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-fade-in ${
                    teacherPassFeedback.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {teacherPassFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                  )}
                  <span>{teacherPassFeedback.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    رمز المرور الحالي: <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      placeholder="أدخل الرمز الحالي..."
                      value={oldTeacherPass}
                      onChange={(e) => setOldTeacherPass(e.target.value)}
                      className="w-full pr-9 pl-3 py-2.5 text-xs rounded-xl border outline-none font-mono font-bold"
                      style={{
                        backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    رمز المرور الجديد: <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      placeholder="4 خانات أو أكثر..."
                      value={newTeacherPass}
                      onChange={(e) => setNewTeacherPass(e.target.value)}
                      className="w-full pr-9 pl-3 py-2.5 text-xs rounded-xl border outline-none font-mono font-bold"
                      style={{
                        backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    تأكيد رمز المرور الجديد: <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Check className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      placeholder="أعد إدخال الرمز الجديد..."
                      value={confirmTeacherPass}
                      onChange={(e) => setConfirmTeacherPass(e.target.value)}
                      className="w-full pr-9 pl-3 py-2.5 text-xs rounded-xl border outline-none font-mono font-bold"
                      style={{
                        backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0' }}>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>يتم حفظ وتحديث الرمز فورياً على السحابة وجهازك لضمان عدم فقدانه.</span>
                </div>

                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="btn-gold px-6 py-3 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isChangingPass ? 'جاري حفظ الرمز الجديد...' : 'حفظ وتحديث رمز المرور السري'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Privacy & Protection Advice Card */}
          <div
            className="p-5 rounded-3xl border flex items-start gap-3.5"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.6)' : '#f8fafc',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.15)' : '#e2e8f0',
            }}
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs leading-relaxed text-slate-400">
              <p className="font-bold text-slate-200">إرشادات الأمان والخصوصية:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>تمت إزالة أي إشارة لرمز المرور من شاشة تسجيل الدخول الرئيسية لضمان الخصوصية التامة.</li>
                <li>يظل بإمكانك الدخول دائماً برمز المرور الجديد الذي قمت بتعيينه.</li>
                <li>إذا نسيت رمز المرور، يمكنك تغييره في أي وقت من خلال هذه اللوحة عند تسجيل الدخول.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl border p-6 space-y-4 shadow-2xl"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.98)' : '#ffffff',
              borderColor: 'rgba(212, 175, 55, 0.3)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <h3 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                إضافة حساب طالب وولي أمر جديد
              </h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">اسم الطالب رباعي:</label>
                <input
                  type="text"
                  placeholder="مثال: يوسف خالد محمد محمود"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                  style={{
                    backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">كود الباركود / الرقم السري:</label>
                  <input
                    type="text"
                    placeholder="مثال: STU-3001"
                    value={newStudentBarcode}
                    onChange={(e) => setNewStudentBarcode(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none font-mono font-bold"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">كلمة مرور الحساب:</label>
                  <input
                    type="text"
                    placeholder="مثال: 123456"
                    value={newStudentPass}
                    onChange={(e) => setNewStudentPass(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none font-mono font-bold"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">هاتف ولي الأمر (واتساب):</label>
                  <input
                    type="text"
                    placeholder="01012345678"
                    value={newStudentParentPhone}
                    onChange={(e) => setNewStudentParentPhone(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none font-mono"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">هاتف الطالب الشخصي:</label>
                  <input
                    type="text"
                    placeholder="01234567890"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none font-mono"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">المرحلة الدراسية:</label>
                  <select
                    value={newStudentGrade}
                    onChange={(e) => setNewStudentGrade(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  >
                    {GRADE_ORDER.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">أيام المجموعة:</label>
                  <select
                    value={newStudentDays}
                    onChange={(e) => setNewStudentDays(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  >
                    <option value="سبت - إثنين - أربعاء">سبت - إثنين - أربعاء</option>
                    <option value="أحد - ثلاثاء - خميس">أحد - ثلاثاء - خميس</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  const res = await addStudentAccount({
                    name: newStudentName,
                    barcode: newStudentBarcode,
                    parentPhone: newStudentParentPhone || newStudentPhone,
                    phone: newStudentPhone || newStudentParentPhone,
                    groupGrade: newStudentGrade,
                    groupDays: newStudentDays,
                    password: newStudentPass || '123456',
                    isActivated: true,
                    accountStatus: 'active',
                  });
                  alert(res.message);
                  if (res.success) {
                    setShowAddStudentModal(false);
                    setNewStudentName('');
                    setNewStudentBarcode('');
                    setNewStudentPhone('');
                    setNewStudentParentPhone('');
                    setNewStudentPass('');
                  }
                }}
                className="btn-gold px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg"
              >
                حفظ وإضافة الحساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT STUDENT ACCOUNT */}
      {/* ========================================================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl border p-6 space-y-4 shadow-2xl"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.98)' : '#ffffff',
              borderColor: 'rgba(212, 175, 55, 0.3)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <h3 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                تعديل بيانات حساب الطالب ({editingStudent.name})
              </h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">اسم الطالب:</label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                  style={{
                    backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: isDark ? '#ffffff' : '#0f172a',
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">هاتف ولي الأمر:</label>
                  <input
                    type="text"
                    value={editingStudent.parentPhone}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none font-mono"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">كلمة المرور:</label>
                  <input
                    type="text"
                    value={editingStudent.password || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none font-mono font-bold"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">المرحلة الدراسية:</label>
                  <select
                    value={editingStudent.groupGrade}
                    onChange={(e) => setEditingStudent({ ...editingStudent, groupGrade: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  >
                    {GRADE_ORDER.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">نقاط التميز ⭐:</label>
                  <input
                    type="number"
                    value={editingStudent.points || 0}
                    onChange={(e) => setEditingStudent({ ...editingStudent, points: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold text-amber-400"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">آخر اختبار مسجل:</label>
                  <input
                    type="text"
                    value={editingStudent.lastExamTitle || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, lastExamTitle: e.target.value })}
                    placeholder="مثال: اختبار التفاضل وحساب المثلثات"
                    className="w-full p-2.5 text-xs rounded-xl border outline-none"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">درجة آخر اختبار:</label>
                  <input
                    type="text"
                    value={editingStudent.lastExamScore || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, lastExamScore: e.target.value })}
                    placeholder="مثال: 48 من 50 (96%)"
                    className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold text-amber-400"
                    style={{
                      backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <button
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  const res = await updateStudentAccount(editingStudent.barcode, editingStudent);
                  alert(res.message);
                  if (res.success) {
                    setEditingStudent(null);
                  }
                }}
                className="btn-gold px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RESET PASSWORD */}
      {/* ========================================================= */}
      {passResetBarcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-sm rounded-3xl border p-6 space-y-4 shadow-2xl"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.98)' : '#ffffff',
              borderColor: 'rgba(212, 175, 55, 0.3)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <h3 className="text-base font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                تغيير كلمة مرور الحساب
              </h3>
              <button onClick={() => setPassResetBarcode(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">كلمة المرور الجديدة:</label>
              <input
                type="text"
                placeholder="أدخل كلمة المرور الجديدة..."
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border outline-none font-mono font-bold"
                style={{
                  backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                  borderColor: 'rgba(212, 175, 55, 0.3)',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
              <button
                onClick={() => setPassResetBarcode(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  const res = await resetStudentPassword(passResetBarcode, newPassInput);
                  alert(res.message);
                  if (res.success) {
                    setPassResetBarcode(null);
                  }
                }}
                className="btn-gold px-5 py-2 text-xs font-bold rounded-xl shadow-lg"
              >
                حفظ كلمة المرور
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PHONE & WHATSAPP AUDIT MODAL (EXCEL & PDF EXPORT) */}
      {/* ========================================================= */}
      <PhoneAuditModal
        isOpen={showPhoneAuditModal}
        onClose={() => setShowPhoneAuditModal(false)}
        onEditStudent={(student) => setEditingStudent(student)}
      />
    </div>
  );
};
