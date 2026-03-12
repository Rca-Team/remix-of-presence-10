
import React from 'react';
import { motion } from 'framer-motion';
import { GradientCard } from '@/components/ui/gradient-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, TrendingUp } from 'lucide-react';

interface StatsOverviewProps {
  isLoading: boolean;
  data?: {
    totalUsers?: number;
    presentToday?: number;
    presentPercentage?: number;
    weeklyAverage?: number;
  };
  refetch: () => void;
}

// Define the type for the attendance stats query result
interface AttendanceStats {
  totalUsers: number;
  presentToday: number;
  presentPercentage: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ isLoading, data, refetch }) => {
  // Fetch real-time attendance data
  const { data: attendanceStats, refetch: refetchStats } = useQuery<AttendanceStats>({
    queryKey: ['attendanceStatsRealtime'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get registered faces count (actual students, not profiles)
      const [registeredRes, presentRes, gateRes] = await Promise.all([
        supabase.from('attendance_records')
          .select('id, device_info')
          .eq('status', 'registered'),
        supabase.from('attendance_records')
          .select('user_id, device_info')
          .in('status', ['present', 'late', 'unauthorized'])
          .gte('timestamp', `${today}T00:00:00`)
          .lte('timestamp', `${today}T23:59:59`),
        supabase.from('gate_entries')
          .select('student_id')
          .gte('entry_time', `${today}T00:00:00`)
          .lte('entry_time', `${today}T23:59:59`)
          .eq('is_recognized', true)
      ]);
      
      const registered = (registeredRes.data || []).filter(r => {
        const name = (r.device_info as any)?.metadata?.name || '';
        return name && name !== 'Unknown' && !name.toLowerCase().includes('unknown');
      });
      const totalUsersCount = registered.length;
      
      // Unique present users from attendance + gate
      const uniqueUsers = new Set<string>();
      (presentRes.data || []).forEach(record => {
        const empId = (record.device_info as any)?.metadata?.employee_id || (record.device_info as any)?.employee_id;
        const userId = empId || record.user_id;
        if (userId) uniqueUsers.add(String(userId));
      });
      (gateRes.data || []).forEach(entry => {
        if (entry.student_id) uniqueUsers.add(entry.student_id);
      });
      
      const presentTodayCount = uniqueUsers.size;
      const presentPercentage = totalUsersCount > 0 ? Math.round((presentTodayCount / totalUsersCount) * 100) : 0;
      
      return {
        totalUsers: totalUsersCount,
        presentToday: presentTodayCount,
        presentPercentage
      };
    },
    initialData: data && data.totalUsers !== undefined && data.presentToday !== undefined && data.presentPercentage !== undefined 
      ? {
          totalUsers: data.totalUsers,
          presentToday: data.presentToday,
          presentPercentage: data.presentPercentage
        } 
      : undefined,
    refetchInterval: 2000,
    enabled: !isLoading
  });
  
  React.useEffect(() => {
    // Listen for changes in attendance_records and profiles tables
    const attendanceChannel = supabase
      .channel('stats_attendance_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance_records'
      }, () => {
        refetchStats();
        refetch();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('stats_profiles_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        refetchStats();
        refetch();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [refetch, refetchStats]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {isLoading ? (
        <>
          <Skeleton className="h-36 w-full rounded-3xl shimmer-loading" />
          <Skeleton className="h-36 w-full rounded-3xl shimmer-loading" />
          <Skeleton className="h-36 w-full rounded-3xl shimmer-loading" />
        </>
      ) : (
        <>
          <motion.div variants={itemVariants}>
            <GradientCard
              title="Total Users"
              value={attendanceStats?.totalUsers || 0}
              icon={Users}
              gradient="ios-blue"
              trend={{ value: 12, positive: true }}
              className="h-full"
            />
          </motion.div>
          
          {/* Present Today with ProgressRing */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden rounded-3xl border bg-card p-6 cursor-pointer"
            style={{
              borderColor: 'hsl(var(--ios-green) / 0.3)',
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Animated gradient background */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-ios-green/20 via-ios-mint/10 to-transparent"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Floating orb */}
            <motion.div 
              className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl bg-ios-green/40"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Present Today</p>
                <motion.p 
                  className="mt-3 text-4xl font-bold tracking-tight"
                  key={attendanceStats?.presentToday}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {attendanceStats?.presentToday || 0}
                </motion.p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold px-2.5 py-1 rounded-full bg-ios-green/15 text-ios-green">
                    {attendanceStats?.presentPercentage || 0}%
                  </span>
                  <span className="text-xs text-muted-foreground">attendance</span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <ProgressRing 
                  value={attendanceStats?.presentPercentage || 0} 
                  size="lg" 
                  color={attendanceStats?.presentPercentage! >= 80 ? 'success' : attendanceStats?.presentPercentage! >= 60 ? 'warning' : 'destructive'}
                  showValue={false}
                >
                  <UserCheck className="h-6 w-6 text-ios-green" />
                </ProgressRing>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <GradientCard
              title="Average Weekly"
              value={`${data?.weeklyAverage || 0}%`}
              icon={TrendingUp}
              gradient="ios-purple"
              trend={{ value: 5, positive: true }}
              className="h-full"
            />
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default StatsOverview;