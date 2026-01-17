import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { GradientCard } from '@/components/ui/gradient-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { 
  School, 
  Users, 
  UserCheck, 
  TrendingUp, 
  BarChart3,
  GraduationCap,
  Calendar,
  Eye,
  UserPlus,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import CategoryStatsCard from './CategoryStatsCard';
import TeacherPermissionsManager from './TeacherPermissionsManager';
import AttendanceExport from './AttendanceExport';
import AttendanceTrendsChart from './AttendanceTrendsChart';
import RolePromoter from './RolePromoter';
import UserAccessManager from './UserAccessManager';
import BulkImageRegistration from './BulkImageRegistration';
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

type Category = 'A' | 'B' | 'C' | 'D' | 'Teacher';

interface CategoryStats {
  category: string;
  totalUsers: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendancePercentage: number;
}

interface UserWithImage {
  id: string;
  name: string;
  category: string;
  image_url: string;
  employee_id: string;
  department: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'A': '#3b82f6',
  'B': '#22c55e',
  'C': '#eab308',
  'D': '#f97316',
  'Teacher': '#a855f7',
};

const PrincipalDashboard: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithImage[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    presentToday: 0,
    overallAttendanceRate: 0,
  });
  const [monthlyTrend, setMonthlyTrend] = useState<{ day: string; attendance: number }[]>([]);

  // Real-time attendance notifications
  const { recentAttendance, isConnected } = useRealtimeAttendance({
    showNotifications: true,
    onNewAttendance: () => {
      // Refresh data when new attendance is marked
      fetchAllData();
    }
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Fetch all registered users
      const { data: users, error: usersError } = await supabase
        .from('attendance_records')
        .select('id, user_id, device_info, image_url, category')
        .eq('status', 'registered');

      if (usersError) throw usersError;

      // Process users
      const processedUsers: UserWithImage[] = (users || []).map(record => {
        const deviceInfo = record.device_info as any;
        const metadata = deviceInfo?.metadata || {};
        return {
          id: record.id,
          name: metadata.name || 'Unknown',
          category: record.category || 'A',
          image_url: record.image_url || metadata.firebase_image_url || '',
          employee_id: metadata.employee_id || 'N/A',
          department: metadata.department || 'N/A',
        };
      }).filter(u => u.name !== 'Unknown');

      setAllUsers(processedUsers);

      // Fetch today's attendance
      const { data: todayAttendance, error: todayError } = await supabase
        .from('attendance_records')
        .select('*')
        .in('status', ['present', 'late'])
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);

      if (todayError) throw todayError;

      // Build present set
      const presentEmployeeIds = new Set(
        (todayAttendance || []).map(r => (r.device_info as any)?.employee_id || (r.device_info as any)?.metadata?.employee_id)
          .filter(Boolean)
      );

      // Calculate category stats
      const categories: Category[] = ['A', 'B', 'C', 'D', 'Teacher'];
      const stats: CategoryStats[] = categories.map(cat => {
        const categoryUsers = processedUsers.filter(u => u.category === cat);
        const presentCount = categoryUsers.filter(u => presentEmployeeIds.has(u.employee_id)).length;
        const lateCount = 0; // Would need additional logic to determine late
        
        return {
          category: cat,
          totalUsers: categoryUsers.length,
          presentToday: presentCount,
          absentToday: categoryUsers.length - presentCount,
          lateToday: lateCount,
          attendancePercentage: categoryUsers.length > 0 
            ? Math.round((presentCount / categoryUsers.length) * 100) 
            : 0,
        };
      });

      setCategoryStats(stats);

      // Calculate overall stats
      const totalStudents = processedUsers.filter(u => u.category !== 'Teacher').length;
      const totalTeachers = processedUsers.filter(u => u.category === 'Teacher').length;
      const totalPresent = stats.reduce((sum, s) => sum + s.presentToday, 0);
      const totalAll = stats.reduce((sum, s) => sum + s.totalUsers, 0);

      setOverallStats({
        totalStudents,
        totalTeachers,
        presentToday: totalPresent,
        overallAttendanceRate: totalAll > 0 ? Math.round((totalPresent / totalAll) * 100) : 0,
      });

      // Fetch monthly trend
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      const workingDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
        .filter(day => !isWeekend(day) && day <= new Date());

      const { data: monthlyAttendance } = await supabase
        .from('attendance_records')
        .select('timestamp, device_info')
        .in('status', ['present', 'late'])
        .gte('timestamp', format(monthStart, 'yyyy-MM-dd'))
        .lte('timestamp', format(new Date(), 'yyyy-MM-dd'));

      const dailyCount: Record<string, Set<string>> = {};
      (monthlyAttendance || []).forEach(record => {
        const dateStr = format(new Date(record.timestamp), 'yyyy-MM-dd');
        const empId = (record.device_info as any)?.employee_id;
        if (!dailyCount[dateStr]) dailyCount[dateStr] = new Set();
        if (empId) dailyCount[dateStr].add(empId);
      });

      const trend = workingDays.slice(-14).map(day => ({
        day: format(day, 'dd MMM'),
        attendance: dailyCount[format(day, 'yyyy-MM-dd')]?.size || 0,
      }));

      setMonthlyTrend(trend);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pieData = categoryStats.map(s => ({
    name: s.category === 'Teacher' ? 'Teachers' : `Cat ${s.category}`,
    value: s.totalUsers,
    color: CATEGORY_COLORS[s.category],
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats with GradientCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard
          title="Total Students"
          value={overallStats.totalStudents}
          icon={Users}
          gradient="blue"
          subtitle="Registered in system"
        />

        <GradientCard
          title="Total Teachers"
          value={overallStats.totalTeachers}
          icon={GraduationCap}
          gradient="purple"
          subtitle="Active instructors"
        />

        <GradientCard
          title="Present Today"
          value={overallStats.presentToday}
          icon={UserCheck}
          gradient="green"
          subtitle={`of ${overallStats.totalStudents + overallStats.totalTeachers} total`}
        />

        {/* Attendance Rate with ProgressRing */}
        <Card className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl from-cyan-500/20 via-cyan-400/10 to-transparent border-cyan-500/30 hover:shadow-cyan-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-cyan-400/10 to-transparent opacity-50" />
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-30 transition-opacity group-hover:opacity-60 bg-cyan-400" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
              <p className="mt-1 text-xs text-muted-foreground">Today's performance</p>
            </div>
            <ProgressRing
              value={overallStats.overallAttendanceRate}
              size="lg"
              color={overallStats.overallAttendanceRate >= 80 ? 'success' : overallStats.overallAttendanceRate >= 60 ? 'warning' : 'destructive'}
              thickness={6}
            />
          </div>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <AttendanceExport />
      </div>

      {/* Category Stats Cards */}
      <CategoryStatsCard stats={categoryStats} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Eye className="h-4 w-4" />
            All Users
          </TabsTrigger>
          <TabsTrigger value="promote" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Manage Access
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2">
            <Zap className="h-4 w-4" />
            Bulk Register
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Attendance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <AttendanceTrendsChart showAllCategories />
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Registered Users ({allUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {allUsers.map(user => (
                  <div key={user.id} className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <Avatar className="h-16 w-16 mb-3">
                      <AvatarImage 
                        src={user.image_url?.startsWith('data:') 
                          ? user.image_url 
                          : user.image_url 
                            ? `https://zovwmlqnrsionbolcpng.supabase.co/storage/v1/object/public/face-images/${user.image_url}` 
                            : ''
                        } 
                        alt={user.name}
                      />
                      <AvatarFallback className="text-lg">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-center truncate w-full">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate w-full text-center">{user.employee_id}</p>
                    <Badge 
                      variant="secondary" 
                      className="mt-2"
                      style={{ backgroundColor: `${CATEGORY_COLORS[user.category]}20`, color: CATEGORY_COLORS[user.category] }}
                    >
                      {user.category === 'Teacher' ? 'Teacher' : `Category ${user.category}`}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promote">
          <UserAccessManager />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkImageRegistration />
        </TabsContent>

        <TabsContent value="permissions">
          <TeacherPermissionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrincipalDashboard;
