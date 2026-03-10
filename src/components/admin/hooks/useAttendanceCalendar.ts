import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchSelectedFace, 
  fetchAttendanceRecords, 
  fetchDailyAttendance,
  generateWorkingDays,
  isDateInArray,
  FaceInfo
} from '../utils/attendanceUtils';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  timestamp: string;
  status: string;
  name?: string;
  image_url?: string;
}

// Normalize status consistently
function normalizeStatus(status: string | null): string {
  if (!status) return 'unknown';
  const s = status.toLowerCase().trim();
  if (s === 'unauthorized' || s.includes('present')) return 'present';
  if (s.includes('late')) return 'late';
  if (s.includes('absent')) return 'absent';
  return s;
}

function toMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const useAttendanceCalendar = (selectedFaceId: string | null) => {
  const { toast } = useToast();
  
  const [attendanceDays, setAttendanceDays] = useState<Date[]>([]);
  const [lateAttendanceDays, setLateAttendanceDays] = useState<Date[]>([]);
  const [absentDays, setAbsentDays] = useState<Date[]>([]);
  const [selectedFace, setSelectedFace] = useState<FaceInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const [dailyAttendance, setDailyAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord[]>>({});
  
  const currentDate = new Date();
  const [workingDays, setWorkingDays] = useState<Date[]>([]);

  // Compute absent days from working days minus present/late days
  useEffect(() => {
    if (workingDays.length === 0) return;
    
    const today = toMidnight(new Date());
    const absent = workingDays.filter(workDay => {
      const d = toMidnight(workDay);
      if (d > today) return false;
      return !isDateInArray(d, attendanceDays) && !isDateInArray(d, lateAttendanceDays);
    });
    
    setAbsentDays(absent);
  }, [workingDays, attendanceDays, lateAttendanceDays]);

  // Load data when face changes
  useEffect(() => {
    let channel: any = null;

    if (selectedFaceId) {
      // Reset state
      setAttendanceDays([]);
      setLateAttendanceDays([]);
      setAbsentDays([]);
      setAttendanceRecords({});
      
      fetchFaceDetails(selectedFaceId);
      loadAttendanceRecords(selectedFaceId);
      setWorkingDays(generateWorkingDays(currentDate.getFullYear(), currentDate.getMonth()));

      // Realtime subscription
      channel = supabase
        .channel(`attendance-calendar-${selectedFaceId}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'attendance_records' }, 
          () => {
            loadAttendanceRecords(selectedFaceId);
            if (selectedDate) {
              loadDailyAttendance(selectedFaceId, selectedDate);
            }
          }
        )
        .subscribe();
    } else {
      setSelectedFace(null);
      setAttendanceDays([]);
      setLateAttendanceDays([]);
      setAbsentDays([]);
      setAttendanceRecords({});
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [selectedFaceId]);

  // Load daily attendance when date changes
  useEffect(() => {
    if (selectedFaceId && selectedDate) {
      loadDailyAttendance(selectedFaceId, selectedDate);
    } else {
      setDailyAttendance([]);
    }
  }, [selectedFaceId, selectedDate]);

  const fetchFaceDetails = async (faceId: string) => {
    try {
      const faceInfo = await fetchSelectedFace(faceId);
      setSelectedFace(faceInfo);
    } catch (error) {
      console.error('Error fetching face details:', error);
    }
  };

  const loadAttendanceRecords = async (faceId: string) => {
    try {
      setLoading(true);
      await fetchAttendanceRecords(faceId, setAttendanceDays, setLateAttendanceDays);
      
      // Also build the records-by-date map for tooltips
      const { data: records } = await supabase
        .from('attendance_records')
        .select('id, timestamp, status, device_info, image_url')
        .or(`user_id.eq.${faceId},id.eq.${faceId}`)
        .order('timestamp', { ascending: true });
        
      if (records && records.length > 0) {
        const recordsByDate: Record<string, AttendanceRecord[]> = {};
        
        for (const record of records) {
          // Skip registration records
          const deviceInfo = record.device_info as any;
          if (deviceInfo?.registration) continue;
          
          const status = normalizeStatus(record.status);
          if (status !== 'present' && status !== 'late') continue;
          
          let name = '';
          if (deviceInfo?.metadata?.name) name = deviceInfo.metadata.name;
          else if (deviceInfo?.name) name = deviceInfo.name;
          
          const dateKey = format(new Date(record.timestamp), 'yyyy-MM-dd');
          
          // Keep only earliest record per day
          if (!recordsByDate[dateKey]) {
            recordsByDate[dateKey] = [{
              id: record.id,
              timestamp: record.timestamp,
              status,
              name: name || selectedFace?.name || 'Student',
              image_url: record.image_url
            }];
          } else {
            const existingTime = new Date(recordsByDate[dateKey][0].timestamp).getTime();
            const currentTime = new Date(record.timestamp).getTime();
            if (currentTime < existingTime) {
              recordsByDate[dateKey] = [{
                id: record.id,
                timestamp: record.timestamp,
                status,
                name: name || selectedFace?.name || 'Student',
                image_url: record.image_url
              }];
            }
          }
        }
        
        setAttendanceRecords(recordsByDate);
      }
    } catch (error) {
      console.error('Error loading attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyAttendance = async (faceId: string, date: Date) => {
    try {
      await fetchDailyAttendance(faceId, date, (records) => {
        // Enhance with name from selected face if missing
        const enhanced = records.map(r => ({
          ...r,
          name: r.name && r.name !== 'Student' ? r.name : selectedFace?.name || 'Student'
        }));
        setDailyAttendance(enhanced);
      });
    } catch (error) {
      console.error('Error loading daily attendance:', error);
    }
  };

  return {
    attendanceDays,
    lateAttendanceDays,
    absentDays,
    selectedFace,
    selectedDate,
    setSelectedDate,
    loading,
    dailyAttendance,
    workingDays,
    isDateInArray,
    attendanceRecords,
    selectedFaceId
  };
};
