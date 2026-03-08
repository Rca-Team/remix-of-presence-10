import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Siren, X, Flame, Lock, LogOut, Activity, HeartPulse, ShieldAlert, CheckCircle, Megaphone } from 'lucide-react';

interface EmergencyAlert {
  id: string;
  event_type: string;
  notes: string | null;
  status: string | null;
  created_at: string;
}

const ALERT_META: Record<string, { icon: React.ElementType; label: string; color: string; bgClass: string }> = {
  fire: { icon: Flame, label: 'FIRE ALARM', color: '#ef4444', bgClass: 'from-red-600 to-orange-600' },
  lockdown: { icon: Lock, label: 'LOCKDOWN', color: '#f59e0b', bgClass: 'from-amber-600 to-yellow-600' },
  evacuation: { icon: LogOut, label: 'EVACUATION', color: '#f97316', bgClass: 'from-orange-600 to-red-600' },
  earthquake: { icon: Activity, label: 'EARTHQUAKE', color: '#a855f7', bgClass: 'from-purple-600 to-indigo-600' },
  medical: { icon: HeartPulse, label: 'MEDICAL EMERGENCY', color: '#ec4899', bgClass: 'from-pink-600 to-rose-600' },
  intruder: { icon: ShieldAlert, label: 'INTRUDER ALERT', color: '#dc2626', bgClass: 'from-red-700 to-red-500' },
  allclear: { icon: CheckCircle, label: 'ALL CLEAR', color: '#22c55e', bgClass: 'from-green-600 to-emerald-600' },
  custom: { icon: Megaphone, label: 'ALERT', color: '#3b82f6', bgClass: 'from-blue-600 to-indigo-600' },
};

// Vibration patterns
const VIBRATION_PATTERNS: Record<string, number[]> = {
  fire: [1000, 200, 1000, 200, 1000, 200, 1000],
  lockdown: [500, 100, 500, 100, 500, 100, 2000],
  evacuation: [800, 200, 800, 200, 800, 200, 800],
  earthquake: [300, 100, 300, 100, 1500, 200, 300, 100, 300],
  medical: [600, 300, 600, 300, 600],
  intruder: [200, 100, 200, 100, 200, 100, 2000, 200, 200, 100, 200],
  allclear: [200, 100, 200],
  custom: [400, 200, 400],
};

// Alarm audio synthesizer using Web Audio API
function playAlarmSound(type: string, duration: number = 5000) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = 0.3;

    const now = ctx.currentTime;
    const end = now + duration / 1000;

    if (type === 'fire' || type === 'evacuation') {
      // Alternating two-tone siren
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.connect(gainNode);
      for (let t = now; t < end; t += 0.5) {
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.setValueAtTime(600, t + 0.25);
      }
      osc.start(now);
      osc.stop(end);
    } else if (type === 'lockdown' || type === 'intruder') {
      // Rapid beeps
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 1000;
      osc.connect(gainNode);
      for (let t = now; t < end; t += 0.3) {
        gainNode.gain.setValueAtTime(0.3, t);
        gainNode.gain.setValueAtTime(0, t + 0.15);
      }
      osc.start(now);
      osc.stop(end);
    } else if (type === 'earthquake') {
      // Low rumbling tone
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 200;
      osc.connect(gainNode);
      gainNode.gain.setValueAtTime(0.2, now);
      for (let t = now; t < end; t += 0.8) {
        gainNode.gain.linearRampToValueAtTime(0.4, t + 0.4);
        gainNode.gain.linearRampToValueAtTime(0.1, t + 0.8);
      }
      osc.start(now);
      osc.stop(end);
    } else if (type === 'medical') {
      // Ambulance-like wail
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.connect(gainNode);
      for (let t = now; t < end; t += 1) {
        osc.frequency.linearRampToValueAtTime(900, t + 0.5);
        osc.frequency.linearRampToValueAtTime(500, t + 1);
      }
      osc.start(now);
      osc.stop(end);
    } else if (type === 'allclear') {
      // Pleasant chime
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.connect(gainNode);
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.3);
      osc.frequency.setValueAtTime(784, now + 0.6);
      gainNode.gain.linearRampToValueAtTime(0, now + 1.5);
      osc.start(now);
      osc.stop(now + 1.5);
    } else {
      // Generic alert beep
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = 700;
      osc.connect(gainNode);
      for (let t = now; t < end; t += 0.6) {
        gainNode.gain.setValueAtTime(0.3, t);
        gainNode.gain.setValueAtTime(0, t + 0.3);
      }
      osc.start(now);
      osc.stop(end);
    }

    return ctx;
  } catch (e) {
    console.warn('Could not play alarm sound:', e);
    return null;
  }
}

const EmergencyAlertListener: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Listen for new emergency events via Supabase Realtime
    const channel = supabase
      .channel('emergency-alerts-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emergency_events' },
        (payload) => {
          const alert = payload.new as EmergencyAlert;
          handleIncomingAlert(alert);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopAlarm();
    };
  }, []);

  const handleIncomingAlert = (alert: EmergencyAlert) => {
    setActiveAlert(alert);

    // Play alarm sound
    const ctx = playAlarmSound(alert.event_type, alert.event_type === 'allclear' ? 2000 : 8000);
    audioCtxRef.current = ctx;

    // Vibrate device
    const pattern = VIBRATION_PATTERNS[alert.event_type] || VIBRATION_PATTERNS.custom;
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
      // Repeat vibration for critical alerts
      if (alert.event_type !== 'allclear') {
        vibrationIntervalRef.current = setInterval(() => {
          navigator.vibrate(pattern);
        }, 3000);
      }
    }

    // Also trigger service worker notification for background
    triggerServiceWorkerNotification(alert);

    // Auto-dismiss all-clear after 5 seconds
    if (alert.event_type === 'allclear') {
      setTimeout(() => dismissAlert(), 5000);
    }
  };

  const triggerServiceWorkerNotification = async (alert: EmergencyAlert) => {
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration?.active) {
        registration.active.postMessage({
          type: 'EMERGENCY_ALERT',
          alertType: alert.event_type,
          message: alert.notes || undefined,
        });
      }
    } catch (e) {
      console.warn('Could not trigger SW notification:', e);
    }
  };

  const dismissAlert = () => {
    stopAlarm();
    setActiveAlert(null);
  };

  const stopAlarm = () => {
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  };

  const meta = activeAlert ? (ALERT_META[activeAlert.event_type] || ALERT_META.custom) : null;
  const Icon = meta?.icon || Siren;

  return (
    <AnimatePresence>
      {activeAlert && meta && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed inset-x-0 top-0 z-[9999] p-3 sm:p-4"
        >
          <div
            className={`max-w-lg mx-auto rounded-2xl bg-gradient-to-r ${meta.bgClass} p-4 shadow-2xl border border-white/20`}
          >
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"
              >
                <Icon className="w-7 h-7 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white tracking-wide">
                    {meta.label}
                  </h3>
                  {activeAlert.event_type !== 'allclear' && (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className="w-3 h-3 rounded-full bg-white"
                    />
                  )}
                </div>
                {activeAlert.notes && (
                  <p className="text-sm text-white/90 mt-1">{activeAlert.notes}</p>
                )}
                <p className="text-xs text-white/60 mt-1">
                  {new Date(activeAlert.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={dismissAlert}
                className="text-white hover:bg-white/20 h-8 w-8 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmergencyAlertListener;
