import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Trash2, CalendarDays, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ALL_CLASS_SECTIONS, getCategoryLabel } from '@/constants/schoolConfig';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface PeriodTiming {
  period_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  label: string | null;
}

interface Teacher {
  id: string;
  name: string;
  record_id: string;
}

interface TimetableEntry {
  id?: string;
  category: string;
  day_of_week: number;
  period_number: number;
  teacher_record_id: string;
  teacher_name: string;
  subject_id: string | null;
}

const TimetableManager: React.FC = () => {
  const { toast } = useToast();
  const [periods, setPeriods] = useState<PeriodTiming[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CLASS_SECTIONS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [periodRes, teacherRes, ttRes] = await Promise.all([
        supabase.from('period_timings').select('*').order('period_number'),
        supabase.from('attendance_records')
          .select('id, device_info, image_url')
          .eq('status', 'registered')
          .eq('category', 'Teacher'),
        supabase.from('timetable').select('*').eq('category', selectedCategory),
      ]);

      setPeriods((periodRes.data || []).map((p: any) => ({
        period_number: p.period_number,
        start_time: p.start_time,
        end_time: p.end_time,
        is_break: p.is_break,
        label: p.label,
      })));

      const teacherList = (teacherRes.data || []).map((r: any) => {
        const meta = r.device_info?.metadata || {};
        return { id: r.id, name: meta.name || 'Unknown Teacher', record_id: r.id };
      }).filter((t: Teacher) => t.name !== 'Unknown Teacher');
      setTeachers(teacherList);

      setTimetable((ttRes.data || []).map((t: any) => ({
        id: t.id,
        category: t.category,
        day_of_week: t.day_of_week,
        period_number: t.period_number,
        teacher_record_id: t.teacher_record_id,
        teacher_name: t.teacher_name,
        subject_id: t.subject_id,
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getEntry = (day: number, period: number) =>
    timetable.find(t => t.day_of_week === day && t.period_number === period);

  const setTeacherForSlot = (day: number, period: number, teacherId: string) => {
    const teacher = teachers.find(t => t.record_id === teacherId);
    if (!teacher) return;

    setTimetable(prev => {
      const existing = prev.findIndex(t => t.day_of_week === day && t.period_number === period);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], teacher_record_id: teacherId, teacher_name: teacher.name };
        return updated;
      }
      return [...prev, {
        category: selectedCategory,
        day_of_week: day,
        period_number: period,
        teacher_record_id: teacherId,
        teacher_name: teacher.name,
        subject_id: null,
      }];
    });
  };

  const removeSlot = (day: number, period: number) => {
    setTimetable(prev => prev.filter(t => !(t.day_of_week === day && t.period_number === period)));
  };

  const saveTimetable = async () => {
    setIsSaving(true);
    try {
      // Delete existing entries for this category
      await supabase.from('timetable').delete().eq('category', selectedCategory);

      if (timetable.length > 0) {
        const rows = timetable.map(t => ({
          category: selectedCategory,
          day_of_week: t.day_of_week,
          period_number: t.period_number,
          teacher_record_id: t.teacher_record_id,
          teacher_name: t.teacher_name,
          subject_id: t.subject_id,
        }));
        const { error } = await supabase.from('timetable').insert(rows);
        if (error) throw error;
      }

      toast({ title: 'Saved', description: `Timetable for ${getCategoryLabel(selectedCategory)} saved successfully.` });
      fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save timetable', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const teachingPeriods = periods.filter(p => !p.is_break);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5 text-primary" />
            Timetable Manager
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CLASS_SECTIONS.map(cat => (
                  <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={saveTimetable} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No teachers registered yet. Register teachers with category "Teacher" first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border border-border bg-muted p-2 text-left text-xs font-semibold min-w-[80px]">Period</th>
                  {DAYS.map((day, i) => (
                    <th key={day} className="border border-border bg-muted p-2 text-center text-xs font-semibold min-w-[130px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map(period => (
                  <tr key={period.period_number}>
                    <td className={`border border-border p-2 ${period.is_break ? 'bg-amber-500/10' : ''}`}>
                      <div className="text-xs font-medium">{period.label || `Period ${period.period_number}`}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {period.start_time?.slice(0, 5)} - {period.end_time?.slice(0, 5)}
                      </div>
                    </td>
                    {DAYS.map((_, dayIndex) => {
                      if (period.is_break) {
                        return (
                          <td key={dayIndex} className="border border-border p-2 bg-amber-500/10 text-center">
                            <span className="text-xs text-muted-foreground italic">Break</span>
                          </td>
                        );
                      }
                      const entry = getEntry(dayIndex + 1, period.period_number);
                      return (
                        <td key={dayIndex} className="border border-border p-1">
                          {entry ? (
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-[10px] flex-1 justify-center truncate">
                                {entry.teacher_name}
                              </Badge>
                              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                                onClick={() => removeSlot(dayIndex + 1, period.period_number)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <Select onValueChange={(val) => setTeacherForSlot(dayIndex + 1, period.period_number, val)}>
                              <SelectTrigger className="h-7 text-[10px] border-dashed">
                                <SelectValue placeholder="+ Assign" />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map(t => (
                                  <SelectItem key={t.record_id} value={t.record_id} className="text-xs">
                                    {t.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimetableManager;
