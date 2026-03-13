import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Users, UserCheck, Clock, TrendingUp, Activity, 
  Wifi, WifiOff, CheckCircle2, UserX, RefreshCw,
  Zap, Search, Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { useRealtimeAttendance } from '@/hooks/useRealtimeAttendance';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  'A': '#3b82f6', 'B': '#22c55e', 'C': '#eab308', 'D': '#f97316', 'Teacher': '#a855f7',
};

interface StudentRecord {
  name: string;
  employee_id: string;
  category: string;
  image_url: string;
  status: 'present' | 'late' | 'absent';
  time?: string;
}

interface LiveEntry {
  id: string;
  name: string;
  category: string;
  status: string;
  time: string;
  imageUrl: string;
}

type StatusFilter = 'all' | 'present' | 'late' | 'absent';

const PrincipalDashboard: React.FC = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [allStudents, setAllStudents] = useState<StudentRecord[]>([]);
  const [liveEntries, setLiveEntries] = useState<LiveEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [overallStats, setOverallStats] = useState({
    totalRegistered: 0, presentToday: 0, lateToday: 0, absentToday: 0, attendanceRate: 0,
  });
  const [weeklyTrend, setWeeklyTrend] = useState<{ day: string; count: number }[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const { isConnected } = useRealtimeAttendance({
    showNotifications: true,
    onNewAttendance: (record) => {
      const name = record.device_info?.metadata?.name || 'Unknown';
      const imageUrl = record.device_info?.metadata?.firebase_image_url || '';
      setLiveEntries(prev => [{
        id: record.id, name, category: record.category || '?',
        status: record.status, time: format(new Date(record.timestamp), 'hh:mm a'), imageUrl,
      }, ...prev].slice(0, 30));
      fetchAllData(true);
    }
  });

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: users } = await supabase
        .from('attendance_records')
        .select('id, user_id, device_info, image_url, category')
        .eq('status', 'registered');

      const processedUsers = (users || []).map(r => {
        const m = (r.device_info as any)?.metadata || {};
        return {
          id: r.id, name: m.name || 'Unknown', category: r.category || 'A',
          employee_id: m.employee_id || '',
          image_url: r.image_url || m.firebase_image_url || '',
        };
      }).filter(u => u.name !== 'Unknown');

      const { data: todayData } = await supabase
        .from('attendance_records')
        .select('*')
        .in('status', ['present', 'late', 'unauthorized'])
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);

      // Also fetch gate entries
      const { data: gateData } = await supabase
        .from('gate_entries')
        .select('student_id, student_name, entry_time')
        .gte('entry_time', `${today}T00:00:00`)
        .lte('entry_time', `${today}T23:59:59`)
        .eq('is_recognized', true);

      const presentMap = new Map<string, string>();
      const lateMap = new Map<string, string>();
      const entries: LiveEntry[] = [];

      // Normalize status: unauthorized = present
      const normalizeStatus = (s: string) => {
        const lower = (s || '').toLowerCase().trim();
        if (lower === 'unauthorized' || lower.includes('present')) return 'present';
        if (lower.includes('late')) return 'late';
        return lower;
      };

      (todayData || []).forEach(r => {
        const m = (r.device_info as any)?.metadata || {};
        const empId = m.employee_id || (r.device_info as any)?.employee_id || r.user_id;
        const time = format(new Date(r.timestamp), 'hh:mm a');
        const normalized = normalizeStatus(r.status || '');
        if (empId) {
          if (normalized === 'present') { presentMap.set(empId, time); lateMap.delete(empId); }
          else if (normalized === 'late' && !presentMap.has(empId)) lateMap.set(empId, time);
        }
        entries.push({
          id: r.id, name: m.name || 'Unknown', category: r.category || '?',
          status: normalized, time, imageUrl: r.image_url || m.firebase_image_url || '',
        });
      });

      // Merge gate entries
      (gateData || []).forEach(g => {
        if (g.student_id && !presentMap.has(g.student_id) && !lateMap.has(g.student_id)) {
          presentMap.set(g.student_id, format(new Date(g.entry_time), 'hh:mm a'));
        }
      });

      entries.sort((a, b) => b.time.localeCompare(a.time));
      setLiveEntries(entries.slice(0, 30));

      // Build student list with status
      const studentList: StudentRecord[] = processedUsers.map(u => {
        let status: 'present' | 'late' | 'absent' = 'absent';
        let time: string | undefined;
        if (presentMap.has(u.employee_id)) {
          status = 'present'; time = presentMap.get(u.employee_id);
        } else if (lateMap.has(u.employee_id)) {
          status = 'late'; time = lateMap.get(u.employee_id);
        }
        // Also check by user id
        if (status === 'absent' && u.id) {
          if (presentMap.has(u.id)) { status = 'present'; time = presentMap.get(u.id); }
          else if (lateMap.has(u.id)) { status = 'late'; time = lateMap.get(u.id); }
        }
        return { name: u.name, employee_id: u.employee_id, category: u.category, image_url: u.image_url, status, time };
      });

      // Sort: present first, then late, then absent
      studentList.sort((a, b) => {
        const order = { present: 0, late: 1, absent: 2 };
        return order[a.status] - order[b.status];
      });

      setAllStudents(studentList);

      const totalPresent = studentList.filter(s => s.status === 'present').length;
      const totalLate = studentList.filter(s => s.status === 'late').length;
      const totalAbsent = studentList.filter(s => s.status === 'absent').length;
      setOverallStats({
        totalRegistered: studentList.length, presentToday: totalPresent, lateToday: totalLate,
        absentToday: totalAbsent,
        attendanceRate: studentList.length > 0 ? Math.round(((totalPresent + totalLate) / studentList.length) * 100) : 0,
      });

      // Weekly trend
      const monthStart = startOfMonth(new Date());
      const workingDays = eachDayOfInterval({ start: monthStart, end: new Date() })
        .filter(d => !isWeekend(d)).slice(-7);

      const { data: weekData } = await supabase
        .from('attendance_records')
        .select('timestamp, device_info')
        .in('status', ['present', 'late', 'unauthorized'])
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
        day: format(d, 'EEE'), count: daily[format(d, 'yyyy-MM-dd')]?.size || 0,
      })));

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      if (!silent) toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let list = allStudents;
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.employee_id.toLowerCase().includes(q));
    }
    return list;
  }, [allStudents, statusFilter, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const statusFilterOptions: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allStudents.length },
    { key: 'present', label: 'Present', count: overallStats.presentToday },
    { key: 'late', label: 'Late', count: overallStats.lateToday },
    { key: 'absent', label: 'Absent', count: overallStats.absentToday },
  ];

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
        <MetricCard label="Registered" value={overallStats.totalRegistered} icon={Users} color="text-primary" bgColor="bg-primary/10" />
        <MetricCard label="Present" value={overallStats.presentToday} icon={CheckCircle2} color="text-green-600 dark:text-green-400" bgColor="bg-green-500/10" subtitle={`${overallStats.attendanceRate}%`} />
        <MetricCard label="Late" value={overallStats.lateToday} icon={Clock} color="text-orange-600 dark:text-orange-400" bgColor="bg-orange-500/10" />
        <MetricCard label="Absent" value={overallStats.absentToday} icon={UserX} color="text-red-600 dark:text-red-400" bgColor="bg-red-500/10" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Student Directory + Chart */}
        <div className="lg:col-span-2 space-y-4">
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
                        borderRadius: '8px', fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Rate Ring + Live Feed */}
        <div className="space-y-4">
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
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {liveEntries.map((entry, i) => (
                        <motion.div
                          key={entry.id}
                          initial={i === 0 ? { opacity: 0, x: -20 } : false}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4 }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={entry.imageUrl?.startsWith('data:') ? entry.imageUrl : ''} />
                            <AvatarFallback className="text-xs font-medium bg-muted">{entry.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{entry.name}</p>
                            <span className="text-[10px] text-muted-foreground">{entry.time}</span>
                          </div>
                          <StatusDot status={entry.status} showLabel />
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

// Metric card
const MetricCard: React.FC<{
  label: string; value: number; icon: React.ElementType;
  color: string; bgColor: string; subtitle?: string;
}> = ({ label, value, icon: Icon, color, bgColor, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-xl border bg-card p-4 hover:shadow-md transition-all"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {subtitle && <span className={cn("text-xs font-medium", color)}>{subtitle}</span>}
        </div>
      </div>
      <div className={cn("rounded-lg p-2", bgColor)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
    </div>
  </motion.div>
);

// Status dot with optional label
const StatusDot: React.FC<{ status: string; showLabel?: boolean }> = ({ status, showLabel }) => {
  const config = {
    present: { color: 'bg-green-500', label: 'Present', textColor: 'text-green-600' },
    late: { color: 'bg-orange-500', label: 'Late', textColor: 'text-orange-600' },
    absent: { color: 'bg-red-500', label: 'Absent', textColor: 'text-red-600' },
  }[status] || { color: 'bg-muted-foreground', label: status, textColor: 'text-muted-foreground' };

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full", config.color)} />
      {showLabel && <span className={cn("text-[10px] font-medium", config.textColor)}>{config.label}</span>}
    </div>
  );
};

export default PrincipalDashboard;
