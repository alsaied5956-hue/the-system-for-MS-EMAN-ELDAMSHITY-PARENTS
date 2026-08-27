import React, { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  Download,
  Bell,
  BellRing,
  Volume2,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Info,
  X,
} from 'lucide-react';
import {
  requestBrowserNotificationPermission,
  soundEngine,
} from '../../utils/notificationEngine';
import { InstallAppModal } from './InstallAppModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const NotificationAndInstallBanner: React.FC = () => {
  const { theme, role, currentStudent } = useSystem();
  const isDark = theme === 'dark';

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [testTonePlayed, setTestTonePlayed] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    // Check if notification is supported & permission
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }

    // Check if app is already running in standalone mode (PWA installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    // Listen for PWA installation prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setInstallPrompt(null);
          return;
        }
      } catch (err) {
        console.log('Prompt execution fallback to modal:', err);
      }
    }
    // Open the comprehensive step-by-step install guide modal
    setShowInstallModal(true);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestBrowserNotificationPermission();
    if (granted) {
      setNotifPermission('granted');
      soundEngine.playWhatsAppChime();
      setTestTonePlayed(true);
      setTimeout(() => setTestTonePlayed(false), 3500);
    }
  };

  const handleTestSound = () => {
    soundEngine.playWhatsAppChime();
    setTestTonePlayed(true);
    setTimeout(() => setTestTonePlayed(false), 3000);
  };

  if (bannerDismissed) return null;

  const showInstall = !isInstalled;
  const showNotif = notifPermission !== 'granted';

  // If both are already satisfied, don't show the banner
  if (!showInstall && !showNotif) return null;

  return (
    <div
      className="mx-4 sm:mx-auto max-w-6xl my-3 p-3.5 sm:p-4 rounded-2xl border shadow-lg relative overflow-hidden transition-all duration-300 animate-fade-in"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(18, 25, 38, 0.95) 0%, rgba(30, 27, 75, 0.4) 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)',
        borderColor: isDark ? 'rgba(212, 175, 55, 0.35)' : 'rgba(202, 138, 4, 0.3)',
      }}
    >
      <button
        onClick={() => setBannerDismissed(true)}
        className="absolute top-2.5 left-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        title="إغلاق التنبيه"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pl-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
            style={{
              background: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)',
              color: '#0f172a',
            }}
          >
            <Smartphone className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                {role === 'parent' && currentStudent
                  ? `ميزة الإشعارات الفورية والصوتية للطالب/ة: ${currentStudent.name}`
                  : 'تثبيت المنصة كتطبيق وتفعيل الإشعارات الصوتية الفورية'}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                إشعار مخصص كرسائل واتساب 🔔
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {role === 'parent' && currentStudent
                ? 'ستصلك إشعارات مرئية وصوتية خاصة بابنك فقط لحظة تسجيل حضوره أو درجاته أو إرسال تقرير جديد له.'
                : 'تثبيت التطبيق على جهازك واستقبال الإشعارات الصوتية عند الحضور والدرجات مباشرة.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Audio Test Button */}
          <button
            onClick={handleTestSound}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800/80 hover:border-amber-400 text-slate-300 flex items-center gap-1.5 transition-all"
            title="تجربة صوت نغمة الإشعار"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{testTonePlayed ? 'تم تشغيل النغمة 🔔' : 'تجربة صوت الإشعار'}</span>
          </button>

          {/* Enable Notifications Button */}
          {showNotif && (
            <button
              onClick={handleEnableNotifications}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 flex items-center gap-1.5 transition-all"
            >
              <BellRing className="w-3.5 h-3.5 animate-bounce text-emerald-400" />
              <span>تفعيل الإشعارات 🔔</span>
            </button>
          )}

          {/* Install App Button */}
          {showInstall && (
            <button
              onClick={handleInstallClick}
              className="btn-gold px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت التطبيق 📲</span>
            </button>
          )}
        </div>
      </div>

      {/* Comprehensive PWA Install Guide Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
};
