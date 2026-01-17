import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  Activity,
  Percent,
  Timer,
  CalendarCheck
} from 'lucide-react';

interface Stats {
  totalToday: number;
  presentCount: number;
  lateCount: number;
  avgTime: string;
  attendanceRate: number;
  streak: number;
}

const QuickStatsPanel: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalToday: 0,
    presentCount: 0,
    lateCount: 0,
    avgTime: '08:30',
    attendanceRate: 0,
    streak: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, count } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact' })
        .gte('timestamp', today.toISOString());

      if (data) {
        const present = data.filter(r => r.status === 'present').length;
        const late = data.filter(r => r.status === 'late').length;
        const total = count || data.length;
        
        setStats({
          totalToday: total,
          presentCount: present,
          lateCount: late,
          avgTime: '08:30',
          attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
          streak: 5
        });
      }
    };

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statItems = [
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
    { 
      icon: CalendarCheck, 
      label: 'Day Streak', 
      value: stats.streak,
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-500'
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
              key={item.value}
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
