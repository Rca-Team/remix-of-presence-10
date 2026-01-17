// Offline Attendance Service - Records attendance locally and syncs when online
import { supabase } from '@/integrations/supabase/client';

interface OfflineRecord {
  id: string;
  user_id: string;
  status: 'present' | 'late' | 'absent';
  confidence: number;
  timestamp: string;
  device_info: any;
  synced: boolean;
}

const STORAGE_KEY = 'offline_attendance_records';
const PENDING_SYNC_KEY = 'pending_sync_count';

export class OfflineAttendanceService {
  private static instance: OfflineAttendanceService;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private listeners: Set<(status: { isOnline: boolean; pendingCount: number }) => void> = new Set();

  private constructor() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  static getInstance(): OfflineAttendanceService {
    if (!this.instance) {
      this.instance = new OfflineAttendanceService();
    }
    return this.instance;
  }

  private handleOnline() {
    this.isOnline = true;
    this.notifyListeners();
    this.syncPendingRecords();
  }

  private handleOffline() {
    this.isOnline = false;
    this.notifyListeners();
  }

  subscribe(callback: (status: { isOnline: boolean; pendingCount: number }) => void): () => void {
    this.listeners.add(callback);
    callback({ isOnline: this.isOnline, pendingCount: this.getPendingCount() });
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    const status = { isOnline: this.isOnline, pendingCount: this.getPendingCount() };
    this.listeners.forEach(cb => cb(status));
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  getPendingCount(): number {
    const records = this.getStoredRecords();
    return records.filter(r => !r.synced).length;
  }

  private getStoredRecords(): OfflineRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveRecords(records: OfflineRecord[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    localStorage.setItem(PENDING_SYNC_KEY, String(records.filter(r => !r.synced).length));
    this.notifyListeners();
  }

  async recordAttendance(
    userId: string,
    status: 'present' | 'late' | 'absent',
    confidence: number,
    deviceInfo?: any
  ): Promise<{ success: boolean; offline: boolean; record?: any }> {
    const record: OfflineRecord = {
      id: crypto.randomUUID(),
      user_id: userId,
      status,
      confidence,
      timestamp: new Date().toISOString(),
      device_info: deviceInfo || {},
      synced: false
    };

    // If online, try to sync immediately
    if (this.isOnline) {
      try {
        const result = await this.syncSingleRecord(record);
        if (result.success) {
          return { success: true, offline: false, record: result.data };
        }
      } catch (error) {
        console.log('Failed to sync immediately, storing offline:', error);
      }
    }

    // Store locally
    const records = this.getStoredRecords();
    records.push(record);
    this.saveRecords(records);

    return { success: true, offline: true, record };
  }

  private async syncSingleRecord(record: OfflineRecord): Promise<{ success: boolean; data?: any }> {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        user_id: record.user_id,
        timestamp: record.timestamp,
        status: record.status,
        confidence_score: record.confidence,
        device_info: {
          ...record.device_info,
          synced_from_offline: true,
          original_timestamp: record.timestamp
        }
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  }

  async syncPendingRecords(): Promise<{ synced: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    const records = this.getStoredRecords();
    const pending = records.filter(r => !r.synced);

    let synced = 0;
    let failed = 0;

    for (const record of pending) {
      try {
        await this.syncSingleRecord(record);
        record.synced = true;
        synced++;
      } catch (error) {
        console.error('Failed to sync record:', error);
        failed++;
      }
    }

    this.saveRecords(records);
    this.syncInProgress = false;

    // Clean up old synced records (keep for 7 days)
    this.cleanupOldRecords();

    return { synced, failed };
  }

  private cleanupOldRecords() {
    const records = this.getStoredRecords();
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    const filtered = records.filter(r => {
      if (!r.synced) return true; // Keep unsynced
      return new Date(r.timestamp).getTime() > cutoff;
    });

    if (filtered.length !== records.length) {
      this.saveRecords(filtered);
    }
  }

  getOfflineRecords(): OfflineRecord[] {
    return this.getStoredRecords();
  }

  clearSyncedRecords() {
    const records = this.getStoredRecords();
    const unsynced = records.filter(r => !r.synced);
    this.saveRecords(unsynced);
  }
}

export const offlineService = OfflineAttendanceService.getInstance();
