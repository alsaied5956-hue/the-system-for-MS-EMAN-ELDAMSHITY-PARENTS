import React, { useState, useEffect } from 'react';
import { useSystem, SCHOOL_TEACHER_NAME } from '../../context/SystemContext';
import {
  Download,
  Smartphone,
  Laptop,
  Apple,
  Share,
  PlusSquare,
  MoreVertical,
  ExternalLink,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Wifi,
  Bell,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Global reference for install prompt event across components
let globalInstallPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalInstallPrompt = e as BeforeInstallPromptEvent;
  });
}

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { theme } = useSystem();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [copied, setCopied] = useState(false);
  const [canPromptDirectly, setCanPromptDirectly] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Detect OS for default tab
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
        setActiveTab('ios');
      } else if (/Android/.test(ua)) {
        setActiveTab('android');
      } else {
        setActiveTab('desktop');
      }
    }

    if (globalInstallPrompt) {
      setCanPromptDirectly(true);
    }

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      globalInstallPrompt = e as BeforeInstallPromptEvent;
      setCanPromptDirectly(true);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    if (globalInstallPrompt) {
      setIsInstalling(true);
      try {
        await globalInstallPrompt.prompt();
        const choice = await globalInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalledSuccess(true);
          globalInstallPrompt = null;
          setCanPromptDirectly(false);
          setTimeout(() => {
            onClose();
          }, 2500);
        }
      } catch (err) {
        console.log('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]"
        style={{
          backgroundColor: isDark ? '#0b111e' : '#ffffff',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.4)' : 'rgba(202, 138, 4, 0.3)',
          boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 25px 50px -12px rgba(202, 138, 4, 0.15)',
        }}
      >
        {/* Header */}
        <div
          className="p-5 sm:p-6 border-b relative"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(18, 25, 38, 0.95) 0%, rgba(30, 27, 75, 0.5) 100%)'
              : 'linear-gradient(135deg, #fefce8 0%, #ffffff 100%)',
            borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#f1f5f9',
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)',
                color: '#070a11',
              }}
            >
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                  تثبيت منظومة {SCHOOL_TEACHER_NAME}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  تطبيق أصلي 📲
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تثبيت المنصة على شاشة جهازك للوصول السريع والإشعارات الفورية
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Direct Prompt Button if Available */}
          {canPromptDirectly && !installedSuccess && (
            <div
              className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse"
              style={{
                backgroundColor: isDark ? 'rgba(212, 175, 55, 0.12)' : 'rgba(254, 240, 138, 0.4)',
                borderColor: 'rgba(212, 175, 55, 0.4)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: isDark ? '#fcf6ba' : '#966c15' }}>
                    متصفحك يدعم التثبيت الفوري بنقرة واحدة!
                  </p>
                  <p className="text-[11px] text-slate-400">
                    اضغط الزر لتثبيت الأيقونة على هاتفك فوراً.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="btn-gold w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalling ? 'جاري التثبيت...' : 'تثبيت الآن بنقرة واحدة 🚀'}</span>
              </button>
            </div>
          )}

          {installedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center text-xs font-bold flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>تم تثبيت التطبيق بنجاح على جهازك! ستجده الآن على شاشتك الرئيسية.</span>
            </div>
          )}

          {/* Key Advantages of App */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div
              className="p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1"
              style={{
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0',
              }}
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold" style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>
                إشعارات صوتية
              </span>
              <span className="text-[9px] text-slate-400">لحظة الحضور والدرجات</span>
            </div>

            <div
              className="p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1"
              style={{
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0',
              }}
            >
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold" style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>
                فتح سريع وفوري
              </span>
              <span className="text-[9px] text-slate-400">حتى مع ضعف الإنترنت</span>
            </div>

            <div
              className="p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1"
              style={{
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0',
              }}
            >
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span className="text-[11px] font-bold" style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>
                خصوصية وحفظ
              </span>
              <span className="text-[9px] text-slate-400">حفظ جلسة الدخول دائماً</span>
            </div>
          </div>

          {/* OS Selector Tabs */}
          <div>
            <p className="text-xs font-bold text-slate-400 mb-2.5">اختر نوع جهازك لمعرفة خطوات التثبيت:</p>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-900/60 border border-slate-800">
              <button
                onClick={() => setActiveTab('android')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'android'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>أندرويد</span>
              </button>

              <button
                onClick={() => setActiveTab('ios')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'ios'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>آيفون (iOS)</span>
              </button>

              <button
                onClick={() => setActiveTab('desktop')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'desktop'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>الكمبيوتر</span>
              </button>
            </div>
          </div>

          {/* Instructions Step-by-Step */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: isDark ? 'rgba(18, 25, 38, 0.7)' : '#f8fafc',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#e2e8f0',
            }}
          >
            {activeTab === 'android' && (
              <>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-black flex-shrink-0">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>
                      اضغط على قائمة المتصفح (⋮)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      اضغط على النقاط الثلاث أعلى أو أسفل شاشة متصفح Chrome أو Samsung Internet.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-black flex-shrink-0">
                    2
                  </span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>
                      اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»
                    </p>
                    <p className="text-[11px] text-slate-400">
                      (Install App أو Add to Home screen) من القائمة المنسدلة.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-black flex-shrink-0">
                    3
                  </span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>
                      اضغط «تثبيت (Install)»
                    </p>
                    <p className="text-[11px] text-slate-400">
                      سيتم تثبيت التطبيق فورياً على شاشة هاتفك بأيقونة المنظومة الذهبية.
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'ios' && (
              <>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-black flex-shrink-0">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>
                      افتح الموقع في متصفح سفاري (Safari)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      (ميزة تثبيت التطبيقات في آيفون تتطلب متصفح Safari الأصلي).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-black flex-shrink-0">
                    2
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>
                      اضغط على زر المشاركة
                      <Share className="w-3.5 h-3.5 text-blue-400 inline" />
                      أسفل الشاشة
                    </p>
                    <p className="text-[11px] text-slate-400">
                      أيقونة المربع الذي يخرج منه سهم للأعلى في شريط أدوات سفاري.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-black flex-shrink-0">
                    3
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>
                      مرر لأسفل واختر «إضافة إلى الصفحة الرئيسية»
                      <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline" />
                    </p>
                    <p className="text-[11px] text-slate-400">
                      (Add to Home Screen) ثم اضغط "إضافة (Add)" في أعلى اليمين.
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'desktop' && (
              <>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-black flex-shrink-0">
                    1
                  </span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>
                      اضغط على أيقونة التثبيت (⊕) في شريط العنوان
                    </p>
                    <p className="text-[11px] text-slate-400">
                      ستجد رمز تثبيت التطبيق في أقصى يسار أو يمين شريط الرابط أعلى Chrome أو Edge.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs font-black flex-shrink-0">
                    2
                  </span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>
                      أو من قائمة المتصفح (⋮)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      اختر «تثبيت منظومة مس إيمان للرياضيات» (Install app).
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions: Copy Link & Open in Standalone Tab */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button
              onClick={handleOpenInNewTab}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 flex items-center justify-center gap-2 transition-all"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>فتح في نافذة مستقلة كاملة 🌐</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800/80 hover:border-slate-500 text-slate-200 flex items-center justify-center gap-2 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'تم نسخ الرابط! ✅' : 'نسخ رابط المنظومة 📋'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t text-center text-xs text-slate-400"
          style={{
            backgroundColor: isDark ? 'rgba(7, 10, 17, 0.95)' : '#f8fafc',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
          }}
        >
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
