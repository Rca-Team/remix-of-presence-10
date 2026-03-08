import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, UserCheck, Clock, TrendingUp, Activity, 
  Wifi, WifiOff, ArrowUpRight, ArrowDownRight,
  CheckCircle2, AlertTriangle, UserX, RefreshCw,
  Calendar, BarChart3, Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
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

interface LiveEntry {
  id: string;
  name: string;
  category: string;
  status: string;
  time: string;
  imageUrl: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'A': '#3b82f6', 'B': '#22c55e', 'C': '#eab308', 'D': '#f97316', 'Teacher': '#a855f7',
};

const PrincipalDashboard: React.FC = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [liveEntries, setLiveEntries] = useState<LiveEntry[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalRegistered: 0, presentToday: 0, lateToday: 0, absentToday: 0, attendanceRate: 0,
  });
  const [weeklyTrend, setWeeklyTrend] = useState<{ day: string; count: number }[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const { recentAttendance, isConnected } = useRealtimeAttendance({
    showNotifications: true,
    onNewAttendance: (record) => {
      const name = record.device_info?.metadata?.name || 'Unknown';
      const imageUrl = record.device_info?.metadata?.firebase_image_url || '';
      setLiveEntries(prev => [{
        id: record.id,
        name,
        category: record.category || '?',
        status: record.status,
        time: format(new Date(record.timestamp), 'hh:mm a'),
        imageUrl,
      }, ...prev].slice(0, 30));
      // Refresh stats
      fetchAllData(true);
    }
  });

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Registered users
      const { data: users } = await supabase
        .from('attendance_records')
        .select('id, user_id, device_info, image_url, category')
        .eq('status', 'registered');

      const processedUsers = (users || []).map(r => {
        const m = (r.device_info as any)?.metadata || {};
        return { id: r.id, name: m.name || 'Unknown', category: r.category || 'A', employee_id: m.employee_id || '', image_url: r.image_url || m.firebase_image_url || '' };
      }).filter(u => u.name !== 'Unknown');

      // Today's attendance
      const { data: todayData } = await supabase
        .from('attendance_records')
        .select('*')
        .in('status', ['present', 'late'])
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);

      const presentIds = new Set<string>();
      const lateIds = new Set<string>();
      const entries: LiveEntry[] = [];

      (todayData || []).forEach(r => {
        const m = (r.device_info as any)?.metadata || {};
        const empId = m.employee_id || (r.device_info as any)?.employee_id || r.user_id;
        if (empId) {
          if (r.status === 'present') presentIds.add(empId);
          if (r.status === 'late') lateIds.add(empId);
        }
        entries.push({
          id: r.id,
          name: m.name || 'Unknown',
          category: r.category || '?',
          status: r.status || 'present',
          time: format(new Date(r.timestamp), 'hh:mm a'),
          imageUrl: r.image_url || m.firebase_image_url || '',
        });
      });

      // Sort entries by time (latest first)
      entries.sort((a, b) => b.time.localeCompare(a.time));
      setLiveEntries(entries.slice(0, 30));

      // Category stats
      const categories: Category[] = ['A', 'B', 'C', 'D', 'Teacher'];
      const stats = categories.map(cat => {
        const catUsers = processedUsers.filter(u => u.category === cat);
        const present = catUsers.filter(u => presentIds.has(u.employee_id)).length;
        const late = catUsers.filter(u => lateIds.has(u.employee_id)).length;
        return {
          category: cat, totalUsers: catUsers.length, presentToday: present,
          lateToday: late, absentToday: catUsers.length - present - late,
          attendancePercentage: catUsers.length > 0 ? Math.round(((present + late) / catUsers.length) * 100) : 0,
        };
      });
      setCategoryStats(stats);

      const totalReg = processedUsers.length;
      const totalPresent = stats.reduce((s, c) => s + c.presentToday, 0);
      const totalLate = stats.reduce((s, c) => s + c.lateToday, 0);
      const totalAbsent = totalReg - totalPresent - totalLate;
      setOverallStats({
        totalRegistered: totalReg, presentToday: totalPresent, lateToday: totalLate,
        absentToday: Math.max(0, totalAbsent),
        attendanceRate: totalReg > 0 ? Math.round(((totalPresent + totalLate) / totalReg) * 100) : 0,
      });

      // Weekly trend (last 7 working days)
      const monthStart = startOfMonth(new Date());
      const workingDays = eachDayOfInterval({ start: monthStart, end: new Date() })
        .filter(d => !isWeekend(d)).slice(-7);

      const { data: weekData } = await supabase
        .from('attendance_records')
        .select('timestamp, device_info')
        .in('status', ['present', 'late'])
        .gte('timestamp', format(workingDays[0] || new Date(), 'yyyy-MM-dd'))
        .lte('timestamp', format(new Date(), "yyyy-MM-dd'T'23:59:59"));

      const daily: Record<string, Set<string>> = {};
      (weekData || []).forEach(r => {
        const d = format(new Date(r.timestamp), 'yyyy-MM-dd');
        const e = (r.device_info as any)?.employee_id || (r.device_info as any)?.metadata?.employee_id;
        if (!daily[d]) daily[d] = new Set();
        if (e) daily[d].add(e);
      });

      setWeeklyTrend(workingDays.map(d => ({
        day: format(d, 'EEE'),
        count: daily[format(d, 'yyyy-MM-dd')]?.size || 0,
      })));

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      if (!silent) toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const pieData = categoryStats.filter(s => s.totalUsers > 0).map(s => ({
    name: s.category === 'Teacher' ? 'Teachers' : `Cat ${s.category}`,
    value: s.presentToday + s.lateToday,
    total: s.totalUsers,
    color: CATEGORY_COLORS[s.category],
  }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status & Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="gap-1.5 text-green-600 border-green-500/30 bg-green-500/10">
              <Wifi className="w-3 h-3" /> Live
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 text-muted-foreground">
              <WifiOff className="w-3 h-3" /> Offline
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            Updated {format(lastRefreshed, 'hh:mm a')}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => fetchAllData()} className="gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Registered"
          value={overallStats.totalRegistered}
          icon={Users}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <MetricCard
          label="Present"
          value={overallStats.presentToday}
          icon={CheckCircle2}
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-500/10"
          subtitle={`${overallStats.attendanceRate}%`}
        />
        <MetricCard
          label="Late"
          value={overallStats.lateToday}
          icon={Clock}
          color="text-orange-600 dark:text-orange-400"
          bgColor="bg-orange-500/10"
        />
        <MetricCard
          label="Absent"
          value={overallStats.absentToday}
          icon={UserX}
          color="text-red-600 dark:text-red-400"
          bgColor="bg-red-500/10"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("grid gap-3", isMobile ? "grid-cols-1" : "grid-cols-5")}>
                {categoryStats.map(stat => (
                  <div key={stat.category} className="relative overflow-hidden rounded-lg border bg-card p-3 group hover:shadow-md transition-all">
                    <div
                      className="absolute top-0 left-0 h-1 transition-all duration-500"
                      style={{
                        width: `${stat.attendancePercentage}%`,
                        backgroundColor: CATEGORY_COLORS[stat.category],
                      }}
                    />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: CATEGORY_COLORS[stat.category] }}>
                        {stat.category === 'Teacher' ? 'Teachers' : `Cat ${stat.category}`}
                      </span>
                      <span className="text-lg font-bold">{stat.attendancePercentage}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        {stat.presentToday}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                        {stat.lateToday}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                        {stat.absentToday}
                      </span>
                      <span className="ml-auto font-medium">{stat.totalUsers} total</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                This Week's Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrend} barSize={isMobile ? 20 : 32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribution Pie */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Today's Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={60}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(val, name, props) => [`${val} / ${props.payload.total}`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground flex-1">{d.name}</span>
                        <span className="font-semibold">{d.value}/{d.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Live Feed */}
        <div className="space-y-4">
          {/* Attendance Rate Ring */}
          <Card className="overflow-hidden">
            <CardContent className="p-5 flex items-center gap-5">
              <ProgressRing
                value={overallStats.attendanceRate}
                size="lg"
                color={overallStats.attendanceRate >= 80 ? 'success' : overallStats.attendanceRate >= 60 ? 'warning' : 'destructive'}
                thickness={7}
              />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Rate</p>
                <p className="text-3xl font-bold">{overallStats.attendanceRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overallStats.presentToday + overallStats.lateToday} of {overallStats.totalRegistered} present
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Live Feed */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Live Activity
                {isConnected && (
                  <span className="relative flex h-2 w-2 ml-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <AnimatePresence initial={false}>
                  {liveEntries.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No attendance yet today</p>
                      <p className="text-xs mt-1">Entries will appear here in real-time</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {liveEntries.map((entry, i) => (
                        <motion.div
                          key={entry.id}
                          initial={i === 0 ? { opacity: 0, x: -20, backgroundColor: 'hsl(var(--primary) / 0.1)' } : false}
                          animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                          transition={{ duration: 0.4 }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarImage src={entry.imageUrl?.startsWith('data:') ? entry.imageUrl : ''} alt={entry.name} />
                            <AvatarFallback className="text-xs font-medium bg-muted">
                              {entry.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{entry.name}</p>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${CATEGORY_COLORS[entry.category] || '#888'}15`,
                                  color: CATEGORY_COLORS[entry.category] || '#888',
                                }}
                              >
                                {entry.category}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{entry.time}</span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-5 border",
                              entry.status === 'present' && "text-green-600 border-green-500/30 bg-green-500/10",
                              entry.status === 'late' && "text-orange-600 border-orange-500/30 bg-orange-500/10",
                            )}
                          >
                            {entry.status === 'present' ? '✓' : '⏰'} {entry.status}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Compact metric card component
const MetricCard: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subtitle?: string;
}> = ({ label, value, icon: Icon, color, bgColor, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-xl border bg-card p-4 hover:shadow-md transition-all"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {subtitle && (
            <span className={cn("text-xs font-medium", color)}>{subtitle}</span>
          )}
        </div>
      </div>
      <div className={cn("rounded-lg p-2", bgColor)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
    </div>
  </motion.div>
);

export default PrincipalDashboard;
