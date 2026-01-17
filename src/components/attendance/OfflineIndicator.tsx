import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { offlineService } from '@/services/OfflineAttendanceService';
import { useToast } from '@/hooks/use-toast';

const OfflineIndicator: React.FC = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState({ isOnline: navigator.onLine, pendingCount: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineService.subscribe(setStatus);
    return unsubscribe;
  }, []);

  const handleSync = async () => {
    if (!status.isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await offlineService.syncPendingRecords();
      toast({
        title: 'Sync Complete',
        description: `Synced ${result.synced} records${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: 'Could not sync offline records',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
          status.isOnline 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        {status.isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-xs font-medium">
          {status.isOnline ? 'Online' : 'Offline'}
        </span>
        {status.pendingCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold">
            {status.pendingCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-64 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/20 shadow-2xl z-50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                status.isOnline 
                  ? 'bg-green-500/20' 
                  : 'bg-orange-500/20'
              }`}>
                {status.isOnline ? (
                  <Cloud className="w-5 h-5 text-green-400" />
                ) : (
                  <CloudOff className="w-5 h-5 text-orange-400" />
                )}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {status.isOnline ? 'Connected' : 'Offline Mode'}
                </p>
                <p className="text-xs text-slate-400">
                  {status.isOnline 
                    ? 'Real-time sync active' 
                    : 'Data saved locally'}
                </p>
              </div>
            </div>

            {status.pendingCount > 0 && (
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-3">
                <p className="text-sm text-orange-300">
                  <strong>{status.pendingCount}</strong> attendance record{status.pendingCount > 1 ? 's' : ''} pending sync
                </p>
              </div>
            )}

            {status.isOnline && status.pendingCount > 0 && (
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            )}

            {!status.isOnline && (
              <p className="text-xs text-slate-500 text-center">
                Attendance will sync automatically when online
              </p>
            )}

            {status.isOnline && status.pendingCount === 0 && (
              <div className="flex items-center gap-2 text-green-400 justify-center">
                <Check className="w-4 h-4" />
                <span className="text-sm">All synced</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflineIndicator;
