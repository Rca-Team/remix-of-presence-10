import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Category = 'A' | 'B' | 'C' | 'D' | 'Teacher';

const CATEGORIES: Category[] = ['A', 'B', 'C', 'D', 'Teacher'];

const AttendanceExport: React.FC = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([...CATEGORIES]);
  const [isExporting, setIsExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleCategory = (category: Category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const exportToCSV = async () => {
    if (selectedCategories.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one category',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      // Fetch all registered users
      const { data: users, error: usersError } = await supabase
        .from('attendance_records')
        .select('id, user_id, device_info, category')
        .eq('status', 'registered')
        .in('category', selectedCategories);

      if (usersError) throw usersError;

      // Fetch attendance records in date range
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .in('status', ['present', 'late'])
        .gte('timestamp', `${startDate}T00:00:00`)
        .lte('timestamp', `${endDate}T23:59:59`);

      if (attendanceError) throw attendanceError;

      // Get working days in range
      const workingDays = eachDayOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate),
      }).filter(day => !isWeekend(day));

      // Build attendance map
      const attendanceMap: Record<string, Set<string>> = {};
      (attendanceRecords || []).forEach(record => {
        const empId = (record.device_info as any)?.employee_id || (record.device_info as any)?.metadata?.employee_id;
        if (empId) {
          if (!attendanceMap[empId]) attendanceMap[empId] = new Set();
          attendanceMap[empId].add(format(new Date(record.timestamp), 'yyyy-MM-dd'));
        }
      });

      // Build CSV data
      const headers = [
        'S.No',
        'Name',
        'ID',
        'Category',
        'Department',
        ...workingDays.map(day => format(day, 'dd-MMM')),
        'Total Present',
        'Total Absent',
        'Attendance %'
      ];

      const rows = (users || []).map((user, idx) => {
        const deviceInfo = user.device_info as any;
        const metadata = deviceInfo?.metadata || {};
        const name = metadata.name || 'Unknown';
        const empId = metadata.employee_id || 'N/A';
        const dept = metadata.department || 'N/A';
        const category = user.category || 'A';

        const userAttendance = attendanceMap[empId] || new Set();
        
        const dailyStatus = workingDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          return userAttendance.has(dateStr) ? 'P' : 'A';
        });

        const presentCount = dailyStatus.filter(s => s === 'P').length;
        const absentCount = dailyStatus.filter(s => s === 'A').length;
        const percentage = workingDays.length > 0 
          ? Math.round((presentCount / workingDays.length) * 100) 
          : 0;

        return [
          idx + 1,
          name,
          empId,
          category,
          dept,
          ...dailyStatus,
          presentCount,
          absentCount,
          `${percentage}%`
        ];
      });

      // Generate CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_${startDate}_to_${endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Complete',
        description: `Exported ${rows.length} records to CSV`,
      });

      setDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export attendance data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Export Attendance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Attendance to CSV
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Select Categories</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(category => (
                <label
                  key={category}
                  className="flex items-center gap-2 cursor-pointer p-2 border rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setSelectedCategories([...CATEGORIES])}
              variant="outline"
              size="sm"
            >
              Select All
            </Button>
            <Button
              onClick={() => setSelectedCategories([])}
              variant="outline"
              size="sm"
            >
              Clear All
            </Button>
          </div>

          <Button
            onClick={exportToCSV}
            disabled={isExporting || selectedCategories.length === 0}
            className="w-full"
          >
            {isExporting ? 'Exporting...' : 'Download CSV'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceExport;
