
import { supabase } from '@/integrations/supabase/client';
import { SetDatesFunction, AttendanceRecord } from './types';

// Type guard to check if an object is a record with metadata
function hasMetadata(obj: any): obj is { metadata: any } {
  return obj && typeof obj === 'object' && 'metadata' in obj;
}

// Type guard to check if an object has a name property
function hasName(obj: any): obj is { name: string } {
  return obj && typeof obj === 'object' && 'name' in obj;
}

// Extract name from device_info
function extractName(deviceInfo: any): string {
  let name = '';
  try {
    if (deviceInfo && typeof deviceInfo === 'object' && !Array.isArray(deviceInfo)) {
      if (hasMetadata(deviceInfo) && deviceInfo.metadata && hasName(deviceInfo.metadata)) {
        name = deviceInfo.metadata.name;
      }
      if (!name && hasName(deviceInfo)) {
        name = deviceInfo.name;
      }
    }
  } catch (e) {
    console.error('Error extracting name from device_info:', e);
  }
  return name;
}

// Normalize status to consistent lowercase values
function normalizeStatus(status: string | null): string {
  if (!status) return 'unknown';
  const s = status.toLowerCase().trim();
  if (s === 'unauthorized' || s.includes('present')) return 'present';
  if (s.includes('late')) return 'late';
  if (s.includes('absent')) return 'absent';
  return s;
}

// Normalize date to midnight for consistent comparison
function toMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Fetch attendance records from Supabase - determines present/late days
export const fetchAttendanceRecords = async (
  faceId: string,
  setAttendanceDays: SetDatesFunction,
  setLateAttendanceDays: SetDatesFunction
) => {
  try {
    console.log('Fetching attendance records for face ID:', faceId);
    
    // Fetch records where id or user_id equals faceId
    const [{ data: recordsById }, { data: recordsByUserId }] = await Promise.all([
      supabase.from('attendance_records').select('id, timestamp, status, device_info').eq('id', faceId),
      supabase.from('attendance_records').select('id, timestamp, status, device_info').eq('user_id', faceId)
    ]);
    
    // Deduplicate
    const seen = new Set<string>();
    const allRecords = [...(recordsById || []), ...(recordsByUserId || [])].filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    
    if (allRecords.length === 0) {
      console.log('No records found for face ID:', faceId);
      setAttendanceDays([]);
      setLateAttendanceDays([]);
      return;
    }
    
    console.log('Total records found:', allRecords.length);
    
    // Track unique days by status - use dateKey to avoid duplicates
    const presentDaysMap = new Map<string, Date>();
    const lateDaysMap = new Map<string, Date>();
    
    for (const record of allRecords) {
      if (!record.timestamp) continue;
      
      // Skip registration records
      const deviceInfo = record.device_info as any;
      if (deviceInfo?.registration) continue;
      
      const status = normalizeStatus(record.status);
      if (status !== 'present' && status !== 'late') continue;
      
      const date = toMidnight(new Date(record.timestamp));
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      // Present takes priority over late for same day
      if (status === 'present') {
        presentDaysMap.set(dateKey, date);
        lateDaysMap.delete(dateKey); // Remove from late if already there
      } else if (status === 'late' && !presentDaysMap.has(dateKey)) {
        lateDaysMap.set(dateKey, date);
      }
    }
    
    const presentDays = Array.from(presentDaysMap.values());
    const lateDays = Array.from(lateDaysMap.values());
    
    console.log('Present days:', presentDays.length, 'Late days:', lateDays.length);
    
    setAttendanceDays(presentDays);
    setLateAttendanceDays(lateDays);
  } catch (error) {
    console.error('Error in fetchAttendanceRecords:', error);
    throw error;
  }
};

// Fetch daily attendance for a specific date - returns only the earliest record for selected user
export const fetchDailyAttendance = async (
  faceId: string, 
  date: Date,
  setDailyAttendance: (records: AttendanceRecord[]) => void
) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const timestampStart = startOfDay.toISOString();
    const timestampEnd = endOfDay.toISOString();
    
    // Fetch records for the selected user
    const [{ data: recordsById }, { data: recordsByUserId }] = await Promise.all([
      supabase.from('attendance_records')
        .select('id, timestamp, status, device_info, user_id, image_url')
        .eq('id', faceId)
        .gte('timestamp', timestampStart).lte('timestamp', timestampEnd)
        .order('timestamp', { ascending: true }),
      supabase.from('attendance_records')
        .select('id, timestamp, status, device_info, user_id, image_url')
        .eq('user_id', faceId)
        .gte('timestamp', timestampStart).lte('timestamp', timestampEnd)
        .order('timestamp', { ascending: true })
    ]);
    
    // Deduplicate
    const allRecordsMap = new Map();
    [...(recordsById || []), ...(recordsByUserId || [])].forEach(r => allRecordsMap.set(r.id, r));
    let allRecords = Array.from(allRecordsMap.values());
    
    // Filter out registration records
    allRecords = allRecords.filter(r => {
      const di = r.device_info as any;
      return !di?.registration;
    });
    
    if (allRecords.length > 0) {
      const normalizedRecords = allRecords.map(record => {
        let name = extractName(record.device_info);
        
        return {
          id: record.id,
          timestamp: record.timestamp,
          status: normalizeStatus(record.status),
          name: name || 'Student',
          image_url: record.image_url
        };
      });
      
      // Sort by timestamp ascending - return earliest record
      normalizedRecords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      setDailyAttendance([normalizedRecords[0]]);
    } else {
      setDailyAttendance([]);
    }
  } catch (error) {
    console.error('Error in fetchDailyAttendance:', error);
    throw error;
  }
};
