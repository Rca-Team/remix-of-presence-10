import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, UserCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getCategoryLabel } from '@/constants/schoolConfig';

interface Substitution {
  id: string;
  date: string;
  category: string;
  period_number: number;
  absent_teacher_name: string;
  absent_teacher_id: string;
  substitute_teacher_name: string;
  status: string;
  auto_assigned: boolean;
}

const SubstitutionReport: React.FC = () => {
  const { toast } = useToast();
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchTodaySubstitutions = async () => {
    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('substitutions')
        .select('*')
        .eq('date', today)
        .order('category')
        .order('period_number');

      if (error) throw error;
      setSubstitutions(data || []);
      setLoaded(true);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to fetch substitutions', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const printReport = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const dayName = format(new Date(), 'EEEE, MMMM d, yyyy');

    const { data: allSubs } = await supabase
      .from('substitutions')
      .select('*')
      .eq('date', today)
      .order('category')
      .order('period_number');

    const { data: timings } = await supabase
      .from('period_timings')
      .select('*')
      .order('period_number');

    const timingsMap = new Map((timings || []).map((t: any) => [t.period_number, t]));

    const grouped: Record<string, any[]> = {};
    (allSubs || []).forEach((s: any) => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });

    const absentTeachers = new Map<string, { name: string; periods: { period: number; category: string; substitute: string }[] }>();
    (allSubs || []).forEach((s: any) => {
      if (!absentTeachers.has(s.absent_teacher_id)) {
        absentTeachers.set(s.absent_teacher_id, { name: s.absent_teacher_name, periods: [] });
      }
      absentTeachers.get(s.absent_teacher_id)!.periods.push({
        period: s.period_number,
        category: s.category,
        substitute: s.substitute_teacher_name,
      });
    });

    const totalAbsent = absentTeachers.size;
    const totalSubs = (allSubs || []).length;

    // Build absent teacher summary rows
    const absentRows = Array.from(absentTeachers.entries()).map(([, teacher]) => {
      const periodDetails = teacher.periods
        .map(p => {
          const pt = timingsMap.get(p.period);
          const time = pt ? `${(pt as any).start_time.slice(0, 5)}–${(pt as any).end_time.slice(0, 5)}` : '';
          return `<span style="display:inline-block;background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:4px;margin:2px;font-size:12px;">P${p.period} ${time ? `(${time})` : ''} → ${p.substitute} [${getCategoryLabel(p.category)}]</span>`;
        })
        .join(' ');
      return `<tr>
        <td style="border:1px solid #d1d5db;padding:10px 12px;font-weight:600;color:#dc2626;">${teacher.name}</td>
        <td style="border:1px solid #d1d5db;padding:10px 12px;text-align:center;">${teacher.periods.length}</td>
        <td style="border:1px solid #d1d5db;padding:10px 12px;">${periodDetails}</td>
      </tr>`;
    }).join('');

    // Build class-wise detail rows
    const classRows = Object.entries(grouped).map(([cat, subs]) =>
      subs.map((s: any, i: number) => {
        const pt = timingsMap.get(s.period_number);
        const time = pt ? `${(pt as any).start_time.slice(0, 5)}–${(pt as any).end_time.slice(0, 5)}` : '';
        return `<tr>
          ${i === 0 ? `<td rowspan="${subs.length}" style="border:1px solid #d1d5db;padding:8px 12px;font-weight:600;vertical-align:top;background:#f9fafb;">${getCategoryLabel(cat)}</td>` : ''}
          <td style="border:1px solid #d1d5db;padding:8px 12px;text-align:center;">Period ${s.period_number}${time ? `<br/><span style="font-size:11px;color:#6b7280;">${time}</span>` : ''}</td>
          <td style="border:1px solid #d1d5db;padding:8px 12px;color:#dc2626;">${s.absent_teacher_name}</td>
          <td style="border:1px solid #d1d5db;padding:8px 12px;color:#16a34a;font-weight:600;">${s.substitute_teacher_name}</td>
          <td style="border:1px solid #d1d5db;padding:8px 12px;text-align:center;">
            <span style="background:${s.auto_assigned ? '#dbeafe' : '#fef3c7'};color:${s.auto_assigned ? '#1d4ed8' : '#92400e'};padding:2px 8px;border-radius:12px;font-size:11px;">${s.auto_assigned ? 'Auto' : 'Manual'}</span>
          </td>
        </tr>`;
      }).join('')
    ).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Absent Teachers & Substitution Report</title>
    <style>
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 15mm; } }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; max-width: 950px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; border-bottom: 3px solid #dc2626; padding-bottom: 16px; margin-bottom: 24px; }
      .header h1 { font-size: 22px; margin: 0 0 4px; color: #dc2626; }
      .header p { margin: 2px 0; color: #6b7280; font-size: 13px; }
      .stats { display: flex; gap: 16px; margin-bottom: 24px; }
      .stat-box { flex: 1; border-radius: 8px; padding: 12px; text-align: center; }
      .stat-box .num { font-size: 28px; font-weight: 700; }
      .stat-box .lbl { font-size: 11px; color: #6b7280; text-transform: uppercase; }
      .section-title { font-size: 16px; font-weight: 700; margin: 24px 0 12px; padding: 8px 12px; background: #f3f4f6; border-left: 4px solid #dc2626; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { background: #1e293b; color: white; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
      .footer { text-align: center; margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
    </style></head><body>
      <div class="header">
        <h1>🏫 Absent Teachers & Substitution Report</h1>
        <p><strong>${dayName}</strong></p>
        <p>Generated at ${format(new Date(), 'hh:mm a')}</p>
      </div>
      <div class="stats">
        <div class="stat-box" style="background:#fef2f2;border:1px solid #fecaca;">
          <div class="num" style="color:#dc2626;">${totalAbsent}</div><div class="lbl">Absent Teachers</div>
        </div>
        <div class="stat-box" style="background:#f0fdf4;border:1px solid #bbf7d0;">
          <div class="num" style="color:#16a34a;">${totalSubs}</div><div class="lbl">Substitutions Assigned</div>
        </div>
        <div class="stat-box" style="background:#eff6ff;border:1px solid #bfdbfe;">
          <div class="num" style="color:#1d4ed8;">${Object.keys(grouped).length}</div><div class="lbl">Classes Affected</div>
        </div>
      </div>
      ${totalSubs === 0 ? '<div style="text-align:center;padding:40px;color:#16a34a;font-size:18px;font-weight:600;">✅ All teachers are present today. No substitutions needed.</div>' : `
      <div class="section-title">📋 Absent Teacher Summary</div>
      <table>
        <thead><tr><th>Absent Teacher</th><th style="text-align:center;">Periods Missed</th><th>Substitute Details</th></tr></thead>
        <tbody>${absentRows}</tbody>
      </table>
      <div class="section-title">📚 Class-wise Substitution Details</div>
      <table>
        <thead><tr><th>Class</th><th style="text-align:center;">Period</th><th>Absent Teacher</th><th>Substitute</th><th style="text-align:center;">Type</th></tr></thead>
        <tbody>${classRows}</tbody>
      </table>`}
      <div class="footer">School Attendance System • Absent Teachers & Substitution Report • ${dayName}</div>
    </body></html>`;

    const w = window.open('', '_blank', 'width=950,height=700');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const grouped = substitutions.reduce<Record<string, Substitution[]>>((acc, s) => {
    const key = s.absent_teacher_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-5 w-5 text-destructive" />
            Absent Teachers & Substitution Report
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchTodaySubstitutions} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {loaded ? 'Refresh' : 'Load Today'}
            </Button>
            <Button size="sm" onClick={printReport}>
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Click "Load Today" to see absent teachers and substitutions</p>
          </div>
        ) : substitutions.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="h-10 w-10 mx-auto mb-3 text-green-500" />
            <p className="font-medium text-green-600 dark:text-green-400">All teachers are present today!</p>
            <p className="text-sm text-muted-foreground mt-1">No substitutions needed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-destructive/10">
                <p className="text-2xl font-bold text-destructive">{Object.keys(grouped).length}</p>
                <p className="text-xs text-muted-foreground">Absent Teachers</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{substitutions.length}</p>
                <p className="text-xs text-muted-foreground">Substitutions</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold text-primary">
                  {new Set(substitutions.map(s => s.category)).size}
                </p>
                <p className="text-xs text-muted-foreground">Classes Affected</p>
              </div>
            </div>

            {/* Absent teacher list */}
            {Object.entries(grouped).map(([teacherId, subs]) => (
              <div key={teacherId} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-destructive">{subs[0].absent_teacher_name}</span>
                  <Badge variant="destructive">{subs.length} period(s)</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subs.map(s => (
                    <div key={s.id} className="text-xs bg-muted rounded-md px-2 py-1">
                      <span className="font-medium">P{s.period_number}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="text-green-600 dark:text-green-400 font-medium">{s.substitute_teacher_name}</span>
                      <span className="text-muted-foreground ml-1">({getCategoryLabel(s.category)})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubstitutionReport;
