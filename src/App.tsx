import React from 'react';
import { SystemProvider, useSystem, SCHOOL_TEACHER_NAME, SCHOOL_TEACHER_PHONE } from './context/SystemContext';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/auth/AuthScreen';
import { TeacherPortal } from './components/teacher/TeacherPortal';
import { ParentPortal } from './components/parent/ParentPortal';
import { NotificationAndInstallBanner } from './components/common/NotificationAndInstallBanner';

const MainContent: React.FC = () => {
  const { role, currentStudent, theme } = useSystem();
  const isDark = theme === 'dark';

  return (
    <div
      className="min-h-screen flex flex-col justify-between transition-colors duration-200 font-sans"
      style={{
        backgroundColor: isDark ? 'var(--bg-dark)' : '#f4f6f9',
        color: isDark ? 'var(--text-main)' : '#0f172a',
      }}
    >
      <Navbar />

      {/* PWA App Install & Notification Activation Banner */}
      <NotificationAndInstallBanner />

      <main className="flex-1 w-full pb-12">
        {/* Guest View -> Dual Login / Activation (Parents & Teacher) */}
        {role === 'guest' && <AuthScreen />}

        {/* Parent Portal */}
        {role === 'parent' && currentStudent && <ParentPortal />}

        {/* Teacher Portal (Miss Eman's dedicated communication & accounts dashboard) */}
        {(role === 'teacher' || role === 'admin') && <TeacherPortal />}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-6 text-center text-xs backdrop-blur-md transition-colors"
        style={{
          backgroundColor: isDark ? 'rgba(7, 10, 17, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(179, 135, 40, 0.2)',
          color: isDark ? '#94a3b8' : '#64748b',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-bold" style={{ color: isDark ? '#e6c667' : '#966c15' }}>
            {SCHOOL_TEACHER_NAME} • منصة أولياء الأمور والطلاب
          </p>
          <p className="text-[11px]">
            للتواصل والمتابعة: <span className="font-mono font-bold">{SCHOOL_TEACHER_PHONE}</span> • جميع الحقوق محفوظة © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SystemProvider>
      <MainContent />
    </SystemProvider>
  );
}
