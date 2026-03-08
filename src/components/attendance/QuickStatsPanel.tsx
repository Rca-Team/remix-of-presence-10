import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, Clock, Percent, Users } from 'lucide-react';

interface Stats {
  totalRegistered: number;
  presentCount: number;
  lateCount: number;
  attendanceRate: number;
}

const QuickStatsPanel: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalRegistered: 0, presentCount: 0, lateCount: 0, attendanceRate: 0
  });

  const fetchStats = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's attendance records
    const { data: todayData } = await supabase
      .from('attendance_records')
      .select('user_id, status, device_info')
      .gte('timestamp', today.toISOString())
      .in('status', ['present', 'late', 'absent']);

    // Count total registered students from face_descriptors (unique user_ids)
    const { data: faceData } = await supabase
      .from('face_descriptors')
      .select('user_id');

    const uniqueRegistered = new Set<string>();
    faceData?.forEach(f => { if (f.user_id) uniqueRegistered.add(f.user_id); });
    const total = uniqueRegistered.size;

    const uniquePresent = new Set<string>();
    const uniqueLate = new Set<string>();

    todayData?.forEach(record => {
      const userId = record.user_id || (record.device_info as any)?.metadata?.employee_id;
      if (userId) {
        if (record.status === 'present') uniquePresent.add(String(userId));
        else if (record.status === 'late') uniqueLate.add(String(userId));
      }
    });

    const present = uniquePresent.size;
    const late = uniqueLate.size;

    setStats({
      totalRegistered: total,
      presentCount: present,
      lateCount: late,
      attendanceRate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
    });
  }, []);

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel('quick-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchStats]);

  const statItems = [
    { icon: Users, label: 'Registered', value: stats.totalRegistered, colorVar: '--ios-purple' },
    { icon: UserCheck, label: 'Present', value: stats.presentCount, colorVar: '--ios-green' },
    { icon: Clock, label: 'Late', value: stats.lateCount, colorVar: '--ios-orange' },
    { icon: Percent, label: 'Rate', value: `${stats.attendanceRate}%`, colorVar: '--ios-blue' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 p-3.5 sm:p-4 shadow-sm"
        >
          {/* Gradient orb */}
          <div
            className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-15 blur-xl"
            style={{ background: `hsl(var(${item.colorVar}))` }}
          />

          <div className="relative">
            <div
              className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl mb-2.5 shadow-sm"
              style={{ background: `hsl(var(${item.colorVar}) / 0.12)` }}
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: `hsl(var(${item.colorVar}))` }} />
            </div>

            <motion.div
              key={String(item.value)}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xl sm:text-2xl font-bold text-foreground"
            >
              {item.value}
            </motion.div>

            <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default QuickStatsPanel;
