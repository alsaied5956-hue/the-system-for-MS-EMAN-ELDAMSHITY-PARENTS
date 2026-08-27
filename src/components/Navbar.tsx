import React, { useState } from 'react';
import { useSystem, SCHOOL_TEACHER_NAME, SCHOOL_TEACHER_PHONE, SCHOOL_INTL_PHONE } from '../context/SystemContext';
import {
  Sun,
  Moon,
  Cloud,
  CloudLightning,
  LogOut,
  GraduationCap,
  Award,
  MessageSquare,
  Users,
  Download,
  Smartphone,
} from 'lucide-react';
import { InstallAppModal } from './common/InstallAppModal';

export const Navbar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    isOnline,
    isCloudSyncing,
    role,
    currentUser,
    currentStudent,
    logout,
  } = useSystem();

  const isDark = theme === 'dark';
  const [showInstallModal, setShowInstallModal] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-200"
      style={{
        backgroundColor: isDark ? 'rgba(7, 10, 17, 0.92)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDark ? 'rgba(212, 175, 55, 0.25)' : 'rgba(179, 135, 40, 0.25)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)',
            }}
          >
            <GraduationCap className="w-6 h-6 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-lg sm:text-xl font-black tracking-tight"
                style={{
                  color: isDark ? '#fcf6ba' : '#966c15',
                }}
              >
                {SCHOOL_TEACHER_NAME}
              </h1>
              <span
                className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: isDark ? 'rgba(212, 175, 55, 0.12)' : 'rgba(179, 135, 40, 0.1)',
                  borderColor: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(179, 135, 40, 0.3)',
                  color: isDark ? '#e6c667' : '#966c15',
                }}
              >
                <Award className="w-3 h-3" />
                خبيرة الرياضيات
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              بوابة أولياء الأمور والطلاب ومتابعة الدرجات والرسائل
            </p>
          </div>
        </div>

        {/* Controls & User Session */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Sync Status */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
            style={{
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f1f5f9',
              borderColor: isOnline ? (isCloudSyncing ? '#eab308' : '#22c55e') : '#ef4444',
              color: isOnline ? (isCloudSyncing ? '#eab308' : '#22c55e') : '#ef4444',
            }}
            title={isOnline ? (isCloudSyncing ? 'جاري المزامنة مع السحابة...' : 'متزامن سحابياً Realtime') : 'وضع عدم الاتصال'}
          >
            {isCloudSyncing ? (
              <>
                <CloudLightning className="w-3.5 h-3.5 animate-pulse" />
                <span>جاري المزامنة...</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5" />
                <span>{isOnline ? 'سحابي متصل' : 'غير متصل'}</span>
              </>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2 rounded-xl border transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.9)' : '#f8fafc',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.25)' : '#cbd5e1',
              color: isDark ? '#fcf6ba' : '#966c15',
            }}
            title={isDark ? 'التحويل إلى الوضع الفاتح' : 'التحويل إلى الوضع المظلم'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Install App Quick Trigger */}
          <button
            id="navbar-install-app-btn"
            onClick={() => setShowInstallModal(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all duration-200 flex items-center gap-1.5 text-xs font-bold shadow-sm"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(18, 25, 38, 0.9) 100%)'
                : 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.4)' : '#eab308',
              color: isDark ? '#fcf6ba' : '#854d0e',
            }}
            title="تثبيت المنظومة كتطبيق على هاتفك أو كمبيوترك"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">تثبيت التطبيق</span>
            <span className="sm:hidden">تثبيت 📲</span>
          </button>

          {/* Teacher Helpline */}
          <a
            id="teacher-helpline-link"
            href={`https://api.whatsapp.com/send?phone=${SCHOOL_INTL_PHONE}`}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.9)' : '#f8fafc',
              borderColor: 'rgba(212, 175, 55, 0.3)',
              color: isDark ? '#e6c667' : '#966c15',
            }}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>واتساب المعلمة: {SCHOOL_TEACHER_PHONE}</span>
          </a>

          {/* User Badge / Logout */}
          {role !== 'guest' && (
            <div
              className="flex items-center gap-2 pr-2 border-r"
              style={{ borderColor: isDark ? 'rgba(212, 175, 55, 0.3)' : '#cbd5e1' }}
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-tight" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                  {role === 'teacher' || role === 'admin' ? `المعلمة: ${SCHOOL_TEACHER_NAME}` : currentStudent?.name || 'ولي الأمر'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {role === 'teacher' || role === 'admin' ? 'حساب المعلمة (إرسال الرسائل والتنبيهات)' : currentStudent?.groupGrade || 'حساب طالب'}
                </p>
              </div>

              <button
                id="logout-btn"
                onClick={logout}
                className="p-2 rounded-xl border border-rose-800/40 bg-rose-900/20 text-rose-400 hover:bg-rose-900/40 hover:text-rose-300 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </header>
  );
};
