import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { pushNotificationService } from '@/services/PushNotificationService';

interface AttendanceUpdate {
  id: string;
  user_id: string | null;
  status: string;
  timestamp: string;
  category: string | null;
  device_info: any;
}

interface UseRealtimeAttendanceOptions {
  categories?: string[];
  onNewAttendance?: (record: AttendanceUpdate) => void;
  showNotifications?: boolean;
  enablePushNotifications?: boolean;
}

export const useRealtimeAttendance = (options: UseRealtimeAttendanceOptions = {}) => {
  const { toast } = useToast();
  const [recentAttendance, setRecentAttendance] = useState<AttendanceUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleNewAttendance = useCallback(async (payload: any) => {
    const record = payload.new as AttendanceUpdate;
    
    // Filter by categories if specified
    if (options.categories && options.categories.length > 0) {
      if (!record.category || !options.categories.includes(record.category)) {
        return;
      }
    }

    // Only notify for attendance records (not registrations)
    if (record.status === 'present' || record.status === 'late') {
      const studentName = record.device_info?.metadata?.name || 
                          record.device_info?.employee_id || 
                          'A student';
      
      // Update recent attendance list
      setRecentAttendance(prev => [record, ...prev.slice(0, 19)]);

      // Call callback if provided
      options.onNewAttendance?.(record);

      // Show toast notification if enabled
      if (options.showNotifications) {
        toast({
          title: record.status === 'present' ? '✓ Attendance Marked' : '⏰ Late Arrival',
          description: `${studentName} marked ${record.status} in Category ${record.category || 'Unknown'}`,
          duration: 5000,
        });
      }

      // Send push notification if enabled
      if (options.enablePushNotifications) {
        try {
          await pushNotificationService.sendAttendanceNotification(
            studentName,
            record.status as 'present' | 'late' | 'absent',
            record.category || 'Unknown',
            new Date(record.timestamp)
          );
        } catch (error) {
          console.error('Failed to send push notification:', error);
        }
      }

      // Also try browser notification as fallback
      if (options.showNotifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`Attendance: ${studentName}`, {
          body: `Marked ${record.status} in Category ${record.category}`,
          icon: '/favicon.ico',
          tag: record.id, // Prevent duplicate notifications
        });
      }
    }
  }, [options, toast]);

  useEffect(() => {
    // Request notification permission
    if (options.showNotifications && 'Notification' in window) {
      Notification.requestPermission();
    }

    // Register service worker for push notifications if enabled
    if (options.enablePushNotifications) {
      pushNotificationService.registerServiceWorker().catch(console.error);
    }

    // Subscribe to realtime attendance updates
    const channel = supabase
      .channel('attendance-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
        },
        handleNewAttendance
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleNewAttendance, options.showNotifications, options.enablePushNotifications]);

  const clearRecentAttendance = useCallback(() => {
    setRecentAttendance([]);
  }, []);

  return {
    recentAttendance,
    isConnected,
    clearRecentAttendance,
  };
};
