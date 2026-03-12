
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
    
    // Get total registered faces (not profiles - registered faces are the actual students)
    const [registeredRes, todayAttendanceRes, todayGateRes] = await Promise.all([
      supabase.from('attendance_records')
        .select('id, device_info')
        .eq('status', 'registered'),
      supabase.from('attendance_records')
        .select('id, status, user_id, device_info')
        .in('status', ['present', 'late', 'unauthorized'])
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`),
      supabase.from('gate_entries')
        .select('id, student_id, student_name, entry_type')
        .gte('entry_time', `${today}T00:00:00`)
        .lte('entry_time', `${today}T23:59:59`)
        .eq('is_recognized', true)
    ]);
    
    if (registeredRes.error || todayAttendanceRes.error) {
      console.error('Error fetching stats:', registeredRes.error || todayAttendanceRes.error);
      return;
    }
    
    // Build set of registered employee IDs and user_ids
    const registeredFaces = (registeredRes.data || []).filter(r => {
      const di = r.device_info as any;
      const name = di?.metadata?.name || '';
      return name && name !== 'Unknown' && !name.toLowerCase().includes('unknown');
    });
    const totalRegistered = registeredFaces.length;
    
    // Build lookup: employee_id -> true, user_id -> employee_id
    const empIdSet = new Set<string>();
    const userIdToEmpId = new Map<string, string>();
    registeredFaces.forEach(r => {
      const di = r.device_info as any;
      const empId = di?.metadata?.employee_id;
      if (empId) {
        empIdSet.add(empId);
      }
    });
    
    const records = todayAttendanceRes.data || [];
    const gateRecords = todayGateRes.data || [];
    
    // Track unique present/late by employee_id
    const presentUsers = new Set<string>();
    const lateUsers = new Set<string>();
    
    for (const rec of records) {
      const di = rec.device_info as any;
      const empId = di?.metadata?.employee_id || di?.employee_id;
      const status = (rec.status || '').toLowerCase();
      
      const identifier = empId || rec.user_id || rec.id;
      
      if (status === 'present' || status === 'unauthorized') {
        presentUsers.add(identifier);
        lateUsers.delete(identifier);
      } else if (status === 'late' && !presentUsers.has(identifier)) {
        lateUsers.add(identifier);
      }
    }
    
    // Also include gate entries
    for (const entry of gateRecords) {
      if (entry.student_id && !presentUsers.has(entry.student_id)) {
        presentUsers.add(entry.student_id);
      }
    }
    
    const presentCount = presentUsers.size;
    const lateCount = lateUsers.size;
    const absentCount = Math.max(0, totalRegistered - presentCount - lateCount);
    
    setStats({
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      total: totalRegistered
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

    const gateChannel = supabase
      .channel('gate_stats_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'gate_entries' },
        () => fetchStats()
      )
      .subscribe();
    
    return () => { 
      supabase.removeChannel(channel);
      supabase.removeChannel(gateChannel);
    };
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
