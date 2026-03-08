import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UserCheck, UserX, Clock, Calendar, TrendingUp, LogOut,
  GraduationCap, CheckCircle2, AlertTriangle, XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';
import { format, startOfMonth, eachDayOfInterval, isWeekend, subDays, isSameDay, isToday } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface ChildInfo {
  id: string;
  name: string;
  employee_id: string;
  category: string;
  image_url: string;
}

interface DayRecord {
  date: Date;
  status: 'present' | 'late' | 'absent' | 'future';
  time?: string;
}

const STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/face-images/`;

export default function ParentPortalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null);
  const [monthRecords, setMonthRecords] = useState<DayRecord[]>([]);
  const [trendData, setTrendData] = useState<{ day: string; pct: number }[]>([]);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, total: 0, rate: 0, streak: 0 });
  const [todayStatus, setTodayStatus] = useState<{ status: string; time?: string }>({ status: 'absent' });

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) loadAttendance(selectedChild.employee_id);
  }, [selectedChild]);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('parent_phone, parent_email')
        .eq('user_id', user.id)
        .single();

      // Fetch registered students linked via parent contact
      const { data: records } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('status', 'registered');

      const matched: ChildInfo[] = (records || []).reduce((acc: ChildInfo[], r) => {
        const di = r.device_info as any;
        const meta = di?.metadata || di || {};
        const parentPhone = meta.parent_phone || meta.parentPhone || '';
        const parentEmail = meta.parent_email || meta.parentEmail || '';

        const isLinked =
          (profile?.parent_phone && parentPhone && parentPhone.includes(profile.parent_phone.replace('+91', ''))) ||
          (profile?.parent_email && parentEmail && parentEmail.toLowerCase() === profile.parent_email.toLowerCase());

        if (isLinked || (!profile?.parent_phone && !profile?.parent_email)) {
          const name = meta.name || meta.label || 'Student';
          if (name !== 'Student' && !acc.find(c => c.employee_id === (meta.employee_id || meta.roll_number))) {
            acc.push({
              id: r.id,
              name,
              employee_id: meta.employee_id || meta.roll_number || 'N/A',
              category: r.category || 'A',
              image_url: r.image_url || '',
            });
          }
        }
        return acc;
      }, []);

      setChildren(matched);
      if (matched.length > 0) setSelectedChild(matched[0]);
    } catch (e) {
      console.error('Error loading children:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async (employeeId: string) => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const allDays = eachDayOfInterval({ start: monthStart, end: today });
    const workingDays = allDays.filter(d => !isWeekend(d));

    const { data: records } = await supabase
      .from('attendance_records')
      .select('*')
      .in('status', ['present', 'late'])
      .gte('timestamp', format(monthStart, 'yyyy-MM-dd'));

    const studentRecords = (records || []).filter(r => {
      const di = r.device_info as any;
      const empId = di?.employee_id || di?.metadata?.employee_id || di?.metadata?.roll_number;
      return empId === employeeId;
    });

    // Build date map
    const dateMap: Record<string, { status: string; time: string }> = {};
    studentRecords.forEach(r => {
      const ds = format(new Date(r.timestamp), 'yyyy-MM-dd');
      if (!dateMap[ds]) {
        dateMap[ds] = { status: r.status || 'present', time: format(new Date(r.timestamp), 'h:mm a') };
      }
    });

    // Month calendar
    const monthRecs: DayRecord[] = workingDays.map(d => {
      const ds = format(d, 'yyyy-MM-dd');
      const rec = dateMap[ds];
      return {
        date: d,
        status: rec ? (rec.status as 'present' | 'late') : 'absent',
        time: rec?.time,
      };
    });
    setMonthRecords(monthRecs);

    // Today
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayRec = dateMap[todayStr];
    setTodayStatus(todayRec ? { status: todayRec.status, time: todayRec.time } : { status: isWeekend(today) ? 'weekend' : 'absent' });

    // Stats
    const present = monthRecs.filter(r => r.status === 'present').length;
    const late = monthRecs.filter(r => r.status === 'late').length;
    const absent = monthRecs.filter(r => r.status === 'absent').length;
    const total = workingDays.length;
    let streak = 0;
    for (let i = monthRecs.length - 1; i >= 0; i--) {
      if (monthRecs[i].status === 'present' || monthRecs[i].status === 'late') streak++;
      else break;
    }
    setStats({ present, late, absent, total, rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0, streak });

    // Trend (last 7 working days)
    const last7 = eachDayOfInterval({ start: subDays(today, 9), end: today }).filter(d => !isWeekend(d)).slice(-7);
    setTrendData(last7.map(d => {
      const ds = format(d, 'yyyy-MM-dd');
      const rec = dateMap[ds];
      return { day: format(d, 'EEE'), pct: rec?.status === 'present' ? 100 : rec?.status === 'late' ? 75 : 0 };
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getImgUrl = (url: string) => url?.startsWith('data:') ? url : url ? `${STORAGE_URL}${url}` : '';

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    present: { icon: <CheckCircle2 className="h-8 w-8" />, label: 'Present', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' },
    late: { icon: <AlertTriangle className="h-8 w-8" />, label: 'Late', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    absent: { icon: <XCircle className="h-8 w-8" />, label: 'Absent', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' },
    weekend: { icon: <Calendar className="h-8 w-8" />, label: 'Weekend', color: 'text-muted-foreground', bg: 'bg-muted/50 border-border' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  const sc = statusConfig[todayStatus.status] || statusConfig.absent;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-bold text-foreground text-sm">Parent Portal</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4 pb-20">
        {/* Child Selector */}
        {children.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {children.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedChild(c)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm whitespace-nowrap transition-all ${
                  selectedChild?.id === c.id ? 'border-primary bg-primary/10 font-semibold' : 'border-border'
                }`}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={getImgUrl(c.image_url)} />
                  <AvatarFallback className="text-xs">{c.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {c.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {selectedChild && (
          <>
            {/* Student Info */}
            <Card className="border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/30">
                  <AvatarImage src={getImgUrl(selectedChild.image_url)} />
                  <AvatarFallback className="text-xl">{selectedChild.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-bold text-lg text-foreground">{selectedChild.name}</h2>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <GraduationCap className="h-3 w-3 mr-1" /> Class {selectedChild.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">Roll: {selectedChild.employee_id}</Badge>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-primary">{stats.rate}%</div>
                  <p className="text-[10px] text-muted-foreground">Attendance</p>
                </div>
              </CardContent>
            </Card>

            {/* Today's Status */}
            <Card className={`border ${sc.bg}`}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={sc.color}>{sc.icon}</div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Today's Status</p>
                  <p className={`text-xl font-bold ${sc.color}`}>{sc.label}</p>
                </div>
                {todayStatus.time && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Check-in</p>
                    <p className="font-semibold text-foreground">{todayStatus.time}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Working', value: stats.total, icon: <Calendar className="h-4 w-4 text-blue-500" /> },
                { label: 'Present', value: stats.present, icon: <UserCheck className="h-4 w-4 text-green-500" /> },
                { label: 'Late', value: stats.late, icon: <Clock className="h-4 w-4 text-yellow-500" /> },
                { label: 'Absent', value: stats.absent, icon: <UserX className="h-4 w-4 text-red-500" /> },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="p-3 text-center">
                    <div className="flex justify-center mb-1">{s.icon}</div>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Streak */}
            {stats.streak > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="font-bold text-foreground">{stats.streak}-Day Streak!</p>
                  <p className="text-xs text-muted-foreground">Consecutive attendance days</p>
                </div>
              </div>
            )}

            {/* Monthly Calendar Grid */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(), 'MMMM yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-7 gap-1.5">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-[10px] text-center text-muted-foreground font-medium">{d}</div>
                  ))}
                  {(() => {
                    const monthStart = startOfMonth(new Date());
                    const firstDay = monthStart.getDay();
                    const offset = firstDay === 0 ? 6 : firstDay - 1;
                    const blanks = Array.from({ length: offset }, (_, i) => (
                      <div key={`b-${i}`} />
                    ));
                    const allDays = eachDayOfInterval({ start: monthStart, end: new Date() });
                    const dayEls = allDays.map(d => {
                      const rec = monthRecords.find(r => isSameDay(r.date, d));
                      const isWknd = isWeekend(d);
                      const color = isWknd ? 'bg-muted/30' :
                        rec?.status === 'present' ? 'bg-green-500' :
                        rec?.status === 'late' ? 'bg-yellow-500' :
                        'bg-red-500/70';
                      return (
                        <div
                          key={d.toISOString()}
                          className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-medium ${
                            isWknd ? 'text-muted-foreground bg-muted/20' :
                            rec?.status === 'present' ? 'text-white bg-green-500' :
                            rec?.status === 'late' ? 'text-white bg-yellow-500' :
                            'text-white bg-red-500/80'
                          } ${isToday(d) ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}
                          title={rec?.time ? `${rec.status} at ${rec.time}` : isWknd ? 'Weekend' : 'Absent'}
                        >
                          {d.getDate()}
                        </div>
                      );
                    });
                    return [...blanks, ...dayEls];
                  })()}
                </div>
                <div className="flex items-center gap-4 mt-3 justify-center">
                  {[
                    { color: 'bg-green-500', label: 'Present' },
                    { color: 'bg-yellow-500', label: 'Late' },
                    { color: 'bg-red-500/80', label: 'Absent' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1">
                      <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                      <span className="text-[10px] text-muted-foreground">{l.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trend Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Weekly Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(v: number) => [`${v}%`, 'Attendance']}
                    />
                    <Line
                      type="monotone"
                      dataKey="pct"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {children.length === 0 && !loading && (
          <Card className="text-center py-16">
            <CardContent>
              <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="font-semibold text-lg text-foreground">No Students Linked</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Contact the school admin to link your child to your account.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
