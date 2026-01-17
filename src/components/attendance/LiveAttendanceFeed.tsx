import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import {
  Activity,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingUp
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  user_id: string | null;
  timestamp: string;
  status: string | null;
  confidence: number | null;
  category: string | null;
  image_url: string | null;
}

const LiveAttendanceFeed: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchRecords = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: false })
        .limit(20);
      
      if (data) setRecords(data);
    };

    fetchRecords();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('attendance-live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records'
        },
        (payload) => {
          setRecords(prev => [payload.new as AttendanceRecord, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Activity className="w-5 h-5 text-green-500" />
          </motion.div>
          <h3 className="font-semibold">Live Feed</h3>
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{records.length} today</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {records.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ delay: index * 0.02 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  record.status === 'present' 
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                    : record.status === 'late'
                    ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
                    : 'bg-muted/50 border-muted'
                }`}
              >
                {record.image_url ? (
                  <img 
                    src={record.image_url} 
                    alt="" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {record.user_id?.slice(0, 8) || 'Unknown'}
                    </span>
                    {record.confidence && record.confidence > 90 && (
                      <Zap className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(record.timestamp), 'HH:mm:ss')}
                    {record.category && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {record.category}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {record.status === 'present' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : record.status === 'late' ? (
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {record.confidence && (
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(record.confidence)}%
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {records.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No attendance records today</p>
              <p className="text-xs text-muted-foreground/70">Records will appear here in real-time</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LiveAttendanceFeed;
