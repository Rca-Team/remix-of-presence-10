
import React from 'react';
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
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Count all users
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (usersError) throw usersError;
      
      // Count present users today
      const { count: presentToday, error: presentError } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'present')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);
      
      if (presentError) throw presentError;
      
      const totalUsersCount = totalUsers || 0;
      const presentTodayCount = presentToday || 0;
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
    refetchInterval: 2000, // Poll every 2 seconds for realtime feel
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-in-up">
      {isLoading ? (
        <>
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </>
      ) : (
        <>
          <GradientCard
            title="Total Users"
            value={attendanceStats?.totalUsers || 0}
            icon={Users}
            gradient="cyan"
            trend={{ value: 12, positive: true }}
          />
          
          {/* Present Today with ProgressRing */}
          <div className="relative overflow-hidden rounded-xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl from-green-500/20 via-green-400/10 to-transparent border-green-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-green-400/10 to-transparent opacity-50" />
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-30 bg-green-400" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{attendanceStats?.presentToday || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{attendanceStats?.presentPercentage || 0}% attendance</p>
              </div>
              <ProgressRing 
                value={attendanceStats?.presentPercentage || 0} 
                size="lg" 
                color={attendanceStats?.presentPercentage! >= 80 ? 'success' : attendanceStats?.presentPercentage! >= 60 ? 'warning' : 'destructive'}
                showValue={false}
              >
                <UserCheck className="h-5 w-5 text-green-500" />
              </ProgressRing>
            </div>
          </div>
          
          <GradientCard
            title="Average Weekly"
            value={`${data?.weeklyAverage || 0}%`}
            icon={TrendingUp}
            gradient="purple"
            trend={{ value: 5, positive: true }}
          />
        </>
      )}
    </div>
  );
};

export default StatsOverview;
