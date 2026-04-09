import { useState, useEffect } from 'react';
import { Bell, BellRing, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pushNotificationService } from '@/services/PushNotificationService';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationPermissionGateProps {
  children: React.ReactNode;
}

const NotificationPermissionGate: React.FC<NotificationPermissionGateProps> = ({ children }) => {
  const [permissionState, setPermissionState] = useState<'loading' | 'prompt' | 'granted' | 'denied'>('loading');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      // Not supported - let them through
      setPermissionState('granted');
      return;
    }

    const perm = Notification.permission;
    if (perm === 'granted') {
      // Also ensure service worker + subscription
      await pushNotificationService.registerServiceWorker();
      await pushNotificationService.subscribe();
      setPermissionState('granted');
    } else if (perm === 'denied') {
      setPermissionState('denied');
    } else {
      setPermissionState('prompt');
    }
  };

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const perm = await pushNotificationService.requestPermission();
      if (perm === 'granted') {
        await pushNotificationService.registerServiceWorker();
        await pushNotificationService.subscribe();
        // Show a welcome notification
        await pushNotificationService.showLocalNotification('🔔 Notifications Enabled!', {
          body: 'You will now receive real-time alerts for attendance, emergencies & security.',
          tag: 'welcome-notification',
        });
        setPermissionState('granted');
      } else {
        setPermissionState('denied');
      }
    } catch (e) {
      console.error('Notification permission error:', e);
      setPermissionState('denied');
    } finally {
      setIsRequesting(false);
    }
  };

  if (permissionState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="h-10 w-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (permissionState === 'granted') {
    return <>{children}</>;
  }

  // Show gate UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full rounded-2xl border border-cyan-500/30 bg-slate-900/90 backdrop-blur-xl p-8 text-center space-y-6 shadow-2xl shadow-cyan-500/10"
      >
        {/* Icon */}
        <motion.div
          animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
          transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.8 }}
          className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"
        >
          <BellRing className="h-10 w-10 text-white" />
        </motion.div>

        <h2 className="text-2xl font-bold text-white">Enable Notifications</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          To keep you safe and informed, this app requires push notifications. You'll receive:
        </p>

        {/* Benefits list */}
        <div className="text-left space-y-3">
          {[
            { icon: '✅', text: 'Real-time attendance alerts (present, late, absent)' },
            { icon: '🚨', text: 'Emergency & security alerts instantly' },
            { icon: '🚪', text: 'Gate entry & unknown person warnings' },
            { icon: '📢', text: 'School announcements & circulars' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-3 text-sm text-slate-300"
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </div>

        {permissionState === 'prompt' && (
          <Button
            onClick={handleEnable}
            disabled={isRequesting}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-base"
          >
            {isRequesting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Enabling...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Enable Notifications & Continue
              </span>
            )}
          </Button>
        )}

        {permissionState === 'denied' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>Notifications were blocked. Please enable them in your browser settings to continue.</span>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p><strong>Chrome:</strong> Click 🔒 icon in address bar → Notifications → Allow</p>
              <p><strong>Safari:</strong> Settings → Notifications → Allow for this site</p>
              <p><strong>Firefox:</strong> Click 🔒 icon → Permissions → Allow Notifications</p>
            </div>
            <Button
              onClick={() => checkPermission()}
              variant="outline"
              className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              I've Enabled It — Check Again
            </Button>
          </div>
        )}

        <p className="text-xs text-slate-600">
          <Shield className="inline h-3 w-3 mr-1" />
          We only send important school-related alerts. No spam.
        </p>
      </motion.div>
    </div>
  );
};

export default NotificationPermissionGate;
