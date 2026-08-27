// Web Audio API Sound Synthesizer & Browser Notifications Manager
// Plays distinct, pleasant audio tones (similar to WhatsApp message and alert tones)
// and handles browser system push/desktop notifications.

class NotificationSoundEngine {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play WhatsApp-like Double Chime for message / notification
  public playWhatsAppChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // First note (High Crisp chime)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12); // E6

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.4, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      // Second note (Harmonic resolution)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now + 0.12); // A6
      osc2.frequency.exponentialRampToValueAtTime(2093, now + 0.3); // C7

      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  // Play Attendance Arrival Ping (Gentle Bell)
  public playAttendanceChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, index) => {
        const startTime = now + index * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {
      console.warn('Attendance audio error:', e);
    }
  }

  // Play Exam / Honor Alert Ping
  public playExamHonorChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.linearRampToValueAtTime(880, now + 0.15); // A5
      osc.frequency.linearRampToValueAtTime(1174.66, now + 0.3); // D6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Honor audio error:', e);
    }
  }
}

export const soundEngine = new NotificationSoundEngine();

export function playNotificationSound(type: 'attendance' | 'message' | 'grade' | 'error' = 'message') {
  if (type === 'attendance') {
    soundEngine.playAttendanceChime();
  } else if (type === 'grade') {
    soundEngine.playExamHonorChime();
  } else {
    soundEngine.playWhatsAppChime();
  }
}

// Request permission for native system notifications
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Trigger system and audio notification
export function dispatchTargetedNotification(
  title: string,
  body: string,
  options?: {
    type?: 'attendance' | 'message' | 'grade' | 'broadcast';
    tag?: string;
    icon?: string;
  }
) {
  // 1. Play Sound
  if (options?.type === 'attendance') {
    soundEngine.playAttendanceChime();
  } else if (options?.type === 'grade') {
    soundEngine.playExamHonorChime();
  } else {
    soundEngine.playWhatsAppChime();
  }

  // 2. Trigger System Notification if permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      // Vibrate mobile devices if supported (like WhatsApp: 200ms pulse, 100ms pause, 200ms pulse)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      const notif = new Notification(title, {
        body,
        icon: options?.icon || '/manifest.json',
        badge: '/manifest.json',
        tag: options?.tag || `notif-${Date.now()}`,
        dir: 'rtl',
        lang: 'ar',
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      // Fallback for Service Worker notifications
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: options?.icon || '/manifest.json',
            tag: options?.tag || `notif-${Date.now()}`,
            dir: 'rtl',
            lang: 'ar',
          });
        }).catch(() => {});
      }
    }
  }
}
