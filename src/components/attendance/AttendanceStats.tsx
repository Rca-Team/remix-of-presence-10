
import React, { useState, useEffect } from 'react';
import { GradientCard } from '@/components/ui/gradient-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, AlertTriangle, UserX } from 'lucide-react';

const AttendanceStats = () => {
  const [stats, setStats] = useState({
    present: 0,
    unauthorized: 0,
    absent: 0,
    total: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id');
        
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }
      
      const totalProfiles = profilesData?.length || 0;
      
      const { data: presentData, error: presentError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('status', 'present')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);
        
      if (presentError) {
        console.error('Error fetching present users:', presentError);
        return;
      }
      
      const presentUsers = presentData?.length || 0;
      
      const { data: unauthorizedData, error: unauthorizedError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('status', 'unauthorized')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);
        
      if (unauthorizedError) {
        console.error('Error fetching unauthorized users:', unauthorizedError);
        return;
      }
      
      const unauthorizedUsers = unauthorizedData?.length || 0;
      
      const absentUsers = Math.max(0, totalProfiles - presentUsers - unauthorizedUsers);
      
      setStats({
        present: presentUsers,
        unauthorized: unauthorizedUsers,
        absent: absentUsers,
        total: totalProfiles
      });
    };
    
    fetchStats();
    
    // Set up a realtime subscription for attendance records changes
    const channel = supabase
      .channel('attendance_stats_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance_records' },
        () => {
          fetchStats();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const presentPercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
  const latePercentage = stats.total > 0 ? Math.round((stats.unauthorized / stats.total) * 100) : 0;
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
        value={stats.unauthorized}
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
