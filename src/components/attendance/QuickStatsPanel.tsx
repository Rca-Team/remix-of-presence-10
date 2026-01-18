import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  UserCheck,
  Clock,
  Percent,
  CalendarCheck,
  Users
} from 'lucide-react';

interface Stats {
  totalRegistered: number;
  presentCount: number;
  lateCount: number;
  attendanceRate: number;
}

const QuickStatsPanel: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalRegistered: 0,
    presentCount: 0,
    lateCount: 0,
    attendanceRate: 0
  });

  const fetchStats = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's attendance (unique users)
    const { data: todayData } = await supabase
      .from('attendance_records')
      .select('user_id, status, device_info')
      .gte('timestamp', today.toISOString())
      .in('status', ['present', 'late', 'absent']);

    // Get total registered faces
    const { count: registeredCount } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'registered');

    if (todayData) {
      // Count unique users
      const uniquePresent = new Set<string>();
      const uniqueLate = new Set<string>();
      
      todayData.forEach(record => {
        const userId = record.user_id || (record.device_info as any)?.metadata?.employee_id;
        if (userId) {
          if (record.status === 'present') {
            uniquePresent.add(String(userId));
          } else if (record.status === 'late') {
            uniqueLate.add(String(userId));
          }
        }
      });

      const present = uniquePresent.size;
      const late = uniqueLate.size;
      const total = registeredCount || 0;
      
      setStats({
        totalRegistered: total,
        presentCount: present,
        lateCount: late,
        attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
      });
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('quick-stats-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        () => {
          // Refresh stats on any attendance change
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  const statItems = [
    { 
      icon: Users, 
      label: 'Registered', 
      value: stats.totalRegistered,
      color: 'from-indigo-500 to-purple-500',
      textColor: 'text-indigo-500'
    },
    { 
      icon: UserCheck, 
      label: 'Present Today', 
      value: stats.presentCount,
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-500'
    },
    { 
      icon: Clock, 
      label: 'Late Arrivals', 
      value: stats.lateCount,
      color: 'from-orange-500 to-amber-500',
      textColor: 'text-orange-500'
    },
    { 
      icon: Percent, 
      label: 'Attendance Rate', 
      value: `${stats.attendanceRate}%`,
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-500'
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-blue-100 dark:border-blue-900/50 p-4"
        >
          {/* Background Gradient */}
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${item.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
          
          <div className="relative">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} shadow-lg mb-3`}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            
            <motion.div
              key={String(item.value)}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-2xl font-bold ${item.textColor}`}
            >
              {item.value}
            </motion.div>
            
            <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default QuickStatsPanel;
