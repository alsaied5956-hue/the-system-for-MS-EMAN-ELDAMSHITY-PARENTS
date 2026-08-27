import React, { useState } from 'react';
import {
  useSystem,
  SCHOOL_TEACHER_NAME,
  SCHOOL_TEACHER_PHONE,
  SCHOOL_INTL_PHONE,
} from '../../context/SystemContext';
import {
  User,
  GraduationCap,
  Sparkles,
  Lock,
  Phone,
  Barcode,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Users,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const {
    theme,
    loginAsParent,
    activateParentFirstTime,
    loginAsTeacher,
    students,
  } = useSystem();

  const isDark = theme === 'dark';

  // Primary active role tab: 'parent' or 'teacher'
  const [activeRoleTab, setActiveRoleTab] = useState<'parent' | 'teacher'>('parent');

  // Parent tab sub-mode: 'login' or 'activate'
  const [parentSubMode, setParentSubMode] = useState<'login' | 'activate'>('login');

  // Parent form state
  const [parentBarcodeOrPhone, setParentBarcodeOrPhone] = useState('');
  const [parentPassword, setParentPassword] = useState('');

  // Activation form state
  const [activateBarcode, setActivateBarcode] = useState('');
  const [activatePhone, setActivatePhone] = useState('');
  const [activatePassword, setActivatePassword] = useState('');

  // Teacher form state
  const [teacherPass, setTeacherPass] = useState('');

  // Feedback state
  const [feedback, setFeedback] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Submit Handler for Parent Login
  const handleParentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!parentBarcodeOrPhone.trim()) {
      setFeedback({ text: 'يرجى إدخال كود الباركود أو رقم الهاتف المسجل.', type: 'error' });
      return;
    }
    if (!parentPassword.trim()) {
      setFeedback({ text: 'يرجى إدخال كلمة المرور الخاصة بحساب الطالب.', type: 'error' });
      return;
    }

    const res = loginAsParent(parentBarcodeOrPhone, parentPassword);
    if (!res.success) {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  // Submit Handler for Parent Activation
  const handleParentActivation = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!activateBarcode.trim() || !activatePhone.trim() || !activatePassword.trim()) {
      setFeedback({ text: 'يرجى ملء جميع الحقول المطلوبة لتفعيل الحساب.', type: 'error' });
      return;
    }

    const res = activateParentFirstTime(activateBarcode, activatePhone, activatePassword);
    if (!res.success) {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  // Submit Handler for Teacher Login
  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!teacherPass.trim()) {
      setFeedback({ text: 'يرجى إدخال رمز المرور الخاص بالمعلمة.', type: 'error' });
      return;
    }

    const res = loginAsTeacher(teacherPass);
    if (!res.success) {
      setFeedback({ text: res.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl space-y-6">
        {/* Main Card */}
        <div
          className="rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          style={{
            backgroundColor: isDark ? 'rgba(18, 25, 38, 0.94)' : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDark ? 'rgba(212, 175, 55, 0.35)' : 'rgba(179, 135, 40, 0.25)',
          }}
        >
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-xl border mb-3"
              style={{
                background: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)',
                borderColor: 'rgba(212, 175, 55, 0.4)',
              }}
            >
              <GraduationCap className="w-9 h-9 text-slate-950" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
              منصة متابعة الطلاب وأولياء الأمور
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              بإشراف خبيرة الرياضيات: <span className="text-amber-400 font-bold">{SCHOOL_TEACHER_NAME}</span>
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl border mb-6" style={{ backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f1f5f9', borderColor: 'rgba(212, 175, 55, 0.2)' }}>
            <button
              type="button"
              onClick={() => {
                setActiveRoleTab('parent');
                setFeedback(null);
              }}
              className={`py-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                activeRoleTab === 'parent'
                  ? 'btn-gold shadow-lg text-slate-950 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>بوابة أولياء الأمور والطلاب</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRoleTab('teacher');
                setFeedback(null);
              }}
              className={`py-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                activeRoleTab === 'teacher'
                  ? 'btn-gold shadow-lg text-slate-950 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>بوابة المعلمة (مس إيمان)</span>
            </button>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 ${
                feedback.type === 'error'
                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              }`}
            >
              {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: PARENT PORTAL */}
          {/* ========================================================= */}
          {activeRoleTab === 'parent' && (
            <div className="space-y-4">
              {/* Sub Mode Toggle */}
              <div className="flex border-b pb-2 gap-4 text-xs font-bold" style={{ borderColor: 'rgba(212, 175, 55, 0.15)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setParentSubMode('login');
                    setFeedback(null);
                  }}
                  className={`pb-2 border-b-2 transition-all ${
                    parentSubMode === 'login'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  تسجيل الدخول المباشر
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setParentSubMode('activate');
                    setFeedback(null);
                  }}
                  className={`pb-2 border-b-2 transition-all ${
                    parentSubMode === 'activate'
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  تفعيل الحساب لأول مرة
                </button>
              </div>

              {parentSubMode === 'login' ? (
                <form onSubmit={handleParentLogin} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      كود الباركود الخاص بالطالب أو رقم هاتف ولي الأمر:
                    </label>
                    <div className="relative">
                      <Barcode className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="مثال: STU-2025 أو 01198765432"
                        value={parentBarcodeOrPhone}
                        onChange={(e) => setParentBarcodeOrPhone(e.target.value)}
                        className="w-full pr-10 pl-3 py-2.5 text-xs rounded-xl border outline-none font-bold"
                        style={{
                          backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                          borderColor: 'rgba(212, 175, 55, 0.3)',
                          color: isDark ? '#ffffff' : '#0f172a',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>كلمة المرور الخاصة بالطالب:</span>
                      <span className="text-[10px] text-amber-400 font-semibold">مطلوبة إجبارياً *</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="أدخل كلمة المرور..."
                        value={parentPassword}
                        onChange={(e) => setParentPassword(e.target.value)}
                        className="w-full pr-10 pl-3 py-2.5 text-xs rounded-xl border outline-none font-bold font-mono"
                        style={{
                          backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                          borderColor: 'rgba(212, 175, 55, 0.3)',
                          color: isDark ? '#ffffff' : '#0f172a',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      * إذا لم تقم بتعيين كلمة مرور بعد، انتقل إلى تبويب <strong>«تفعيل الحساب لأول مرة»</strong> أعلاه.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 btn-gold font-bold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>دخول لحساب الطالب ومتابعة الدرجات والرسائل</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleParentActivation} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      كود الباركود المطبوع على كارت الطالب:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: STU-2025"
                      value={activateBarcode}
                      onChange={(e) => setActivateBarcode(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border outline-none font-bold"
                      style={{
                        backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      رقم هاتف ولي الأمر المسجل بالمنظومة:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: 01012345678"
                      value={activatePhone}
                      onChange={(e) => setActivatePhone(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border outline-none font-mono"
                      style={{
                        backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      تعيين كلمة مرور جديدة لحساب ولي الأمر:
                    </label>
                    <input
                      type="password"
                      placeholder="اكتب كلمة مرور سهلة الحفظ..."
                      value={activatePassword}
                      onChange={(e) => setActivatePassword(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border outline-none font-mono font-bold"
                      style={{
                        backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 btn-gold font-bold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>تفعيل الحساب والدخول فوراً</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: TEACHER PORTAL */}
          {/* ========================================================= */}
          {activeRoleTab === 'teacher' && (
            <div className="space-y-4">
              <form onSubmit={handleTeacherLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    رمز المرور الخاص بالأستاذة إيمان الدمشيتي:
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      placeholder="أدخل رمز المرور السري..."
                      value={teacherPass}
                      onChange={(e) => setTeacherPass(e.target.value)}
                      className="w-full pr-10 pl-3 py-2.5 text-xs rounded-xl border outline-none font-mono font-bold"
                      style={{
                        backgroundColor: isDark ? 'rgba(9, 14, 23, 0.8)' : '#f8fafc',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        color: isDark ? '#ffffff' : '#0f172a',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 btn-gold font-bold text-xs rounded-xl shadow-xl flex items-center justify-center gap-2"
                >
                  <span>دخول لوحة تحكم المعلمة</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
