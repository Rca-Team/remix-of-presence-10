
import React, { useState, useEffect, useCallback } from 'react';
import { GradientCard } from '@/components/ui/gradient-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, AlertTriangle, UserX } from 'lucide-react';

const AttendanceStats = () => {
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    total: 0
  });

  const fetchStats = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const [profilesRes, todayRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('attendance_records')
        .select('id, status, user_id')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
    ]);
    
    if (profilesRes.error || todayRes.error) {
      console.error('Error fetching stats:', profilesRes.error || todayRes.error);
      return;
    }
    
    const totalProfiles = profilesRes.count || 0;
    const records = todayRes.data || [];
    
    // Count unique users by status (present includes unauthorized for backward compat)
    const presentUsers = new Set<string>();
    const lateUsers = new Set<string>();
    
    for (const rec of records) {
      const userId = rec.user_id || rec.id;
      const status = (rec.status || '').toLowerCase();
      
      if (status === 'present' || status === 'unauthorized') {
        presentUsers.add(userId);
        lateUsers.delete(userId); // If marked present, remove from late
      } else if (status === 'late' && !presentUsers.has(userId)) {
        lateUsers.add(userId);
      }
    }
    
    const presentCount = presentUsers.size;
    const lateCount = lateUsers.size;
    const absentCount = Math.max(0, totalProfiles - presentCount - lateCount);
    
    setStats({
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      total: totalProfiles
    });
  }, []);

  useEffect(() => {
    fetchStats();
    
    const channel = supabase
      .channel('attendance_stats_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance_records' },
        () => fetchStats()
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [fetchStats]);

  const presentPercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
  const latePercentage = stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0;
  const absentPercentage = stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Present Card with ProgressRing */}
      <div className="relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl from-green-500/20 via-green-400/10 to-transparent border-green-500/30">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-green-400/10 to-transparent opacity-50" />
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-30 bg-green-400" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Present Today</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{presentPercentage}%</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.present} of {stats.total}</p>
          </div>
          <ProgressRing 
            value={presentPercentage} 
            size="md" 
            color="success"
            showValue={false}
          >
            <UserCheck className="h-4 w-4 text-green-500" />
          </ProgressRing>
        </div>
      </div>
      
      {/* Late Arrivals Card */}
      <GradientCard
        title="Late Arrivals"
        value={stats.late}
        icon={AlertTriangle}
        gradient="orange"
        subtitle={`${latePercentage}% of total`}
      />
      
      {/* Absent Card */}
      <GradientCard
        title="Absent"
        value={stats.absent}
        icon={UserX}
        gradient="pink"
        subtitle={`${absentPercentage}% of total`}
      />
    </div>
  );
};

export default AttendanceStats;
