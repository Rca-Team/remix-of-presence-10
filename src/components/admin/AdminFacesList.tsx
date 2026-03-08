
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, UserCheck, UserX, Calendar, MoreVertical, Phone, Filter, ArrowUpDown, Clock, CheckCircle2, XCircle, SortAsc, SortDesc, Trash2, BellRing, X } from 'lucide-react';
import NotificationService from './NotificationService';
import ExistingUserContactPopup from './ExistingUserContactPopup';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AdminFacesListProps {
  viewMode: 'grid' | 'list';
  selectedFaceId: string | null;
  nameFilter: string;
  setSelectedFaceId: (id: string | null) => void;
}

interface RegisteredFace {
  id: string;
  user_id?: string;
  name: string;
  employee_id: string;
  department: string;
  image_url: string;
  position?: string;
  total_attendance: number;
  last_attendance?: string;
}

type TodayStatus = 'present' | 'late' | 'absent';
type StatusFilter = 'all' | 'present' | 'late' | 'absent';
type SortField = 'name' | 'status' | 'attendance' | 'lastSeen';
type SortDir = 'asc' | 'desc';

const AdminFacesList: React.FC<AdminFacesListProps> = ({ 
  viewMode, 
  selectedFaceId,
  nameFilter,
  setSelectedFaceId
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [faces, setFaces] = useState<RegisteredFace[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({});
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [todayStatuses, setTodayStatuses] = useState<Record<string, { status: TodayStatus; time?: string }>>({});

  const extractSection = (department: string): string => {
    if (!department) return '';
    const match = department.match(/Section\s*([A-D])/i);
    return match ? match[1].toUpperCase() : '';
  };

  const extractClass = (department: string): string => {
    if (!department) return '';
    const match = department.match(/(?:Class|Grade)\s*(\d+)/i);
    return match ? match[1] : '';
  };

  // Fetch today's attendance statuses
  const fetchTodayStatuses = useCallback(async (faceList: RegisteredFace[]) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData } = await supabase
        .from('attendance_records')
        .select('user_id, status, timestamp, device_info')
        .in('status', ['present', 'late'])
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);

      const statusMap: Record<string, { status: TodayStatus; time?: string }> = {};

      // Initialize all as absent
      faceList.forEach(face => {
        statusMap[face.employee_id] = { status: 'absent' };
      });

      (todayData || []).forEach(record => {
        const empId = (record.device_info as any)?.metadata?.employee_id ||
                      (record.device_info as any)?.employee_id;
        if (empId) {
          const time = format(new Date(record.timestamp), 'hh:mm a');
          // present overrides late
          if (record.status === 'present') {
            statusMap[empId] = { status: 'present', time };
          } else if (record.status === 'late' && statusMap[empId]?.status !== 'present') {
            statusMap[empId] = { status: 'late', time };
          }
        }
      });

      setTodayStatuses(statusMap);
    } catch (error) {
      console.error('Error fetching today statuses:', error);
    }
  }, []);

  const filteredAndSortedFaces = useMemo(() => {
    let result = faces.filter(face => {
      if (nameFilter !== 'all' && face.id !== nameFilter) return false;

      if (sectionFilter !== 'all') {
        if (extractSection(face.department) !== sectionFilter) return false;
      }

      if (classFilter !== 'all') {
        if (extractClass(face.department) !== classFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const faceStatus = todayStatuses[face.employee_id]?.status || 'absent';
        if (faceStatus !== statusFilter) return false;
      }

      const searchLower = searchTerm.toLowerCase();
      return (
        face.name?.toLowerCase().includes(searchLower) ||
        face.employee_id?.toLowerCase().includes(searchLower) ||
        face.department?.toLowerCase().includes(searchLower)
      );
    });

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status': {
          const order = { present: 0, late: 1, absent: 2 };
          const sa = todayStatuses[a.employee_id]?.status || 'absent';
          const sb = todayStatuses[b.employee_id]?.status || 'absent';
          cmp = order[sa] - order[sb];
          break;
        }
        case 'attendance':
          cmp = a.total_attendance - b.total_attendance;
          break;
        case 'lastSeen': {
          const da = a.last_attendance ? new Date(a.last_attendance).getTime() : 0;
          const db = b.last_attendance ? new Date(b.last_attendance).getTime() : 0;
          cmp = da - db;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [faces, nameFilter, searchTerm, sectionFilter, classFilter, statusFilter, sortField, sortDir, todayStatuses]);

  // Stats counts
  const statusCounts = useMemo(() => {
    const counts = { present: 0, late: 0, absent: 0 };
    faces.forEach(face => {
      const s = todayStatuses[face.employee_id]?.status || 'absent';
      counts[s]++;
    });
    return counts;
  }, [faces, todayStatuses]);

  const fetchRegisteredFaces = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: registrationRecords, error } = await supabase
        .from('attendance_records')
        .select('id, user_id, device_info, timestamp, image_url')
        .eq('status', 'registered')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      if (registrationRecords) {
        const processedFaces = registrationRecords
          .map(record => {
            try {
              const deviceInfo = record.device_info as any;
              const metadata = deviceInfo?.metadata || {};
              return {
                id: record.id,
                user_id: (record as any).user_id,
                name: metadata.name || 'Unknown',
                employee_id: metadata.employee_id || 'N/A',
                department: metadata.department || 'N/A',
                position: metadata.position || 'Student',
                image_url: (record as any).image_url || metadata.firebase_image_url || metadata.image || '',
                total_attendance: 0,
                last_attendance: record.timestamp || 'Never'
              } as RegisteredFace;
            } catch {
              return null;
            }
          })
          .filter((face): face is RegisteredFace => 
            face !== null && 
            face.name !== 'Unknown' && 
            face.name !== 'User' && 
            !face.name.toLowerCase().includes('unknown')
          );

        setFaces(processedFaces);
        fetchTodayStatuses(processedFaces);
        
        if (selectedFaceId && !processedFaces.some(face => face.id === selectedFaceId)) {
          setSelectedFaceId(null);
        }

        const uniqueEmployeeIds = [...new Set(processedFaces.map(face => face.employee_id))];
        Promise.all(
          uniqueEmployeeIds.map(employeeId => fetchAttendanceCount(employeeId))
        ).catch(error => {
          console.error('Error fetching attendance counts:', error);
        });
      }
    } catch (error) {
      console.error('Error fetching registered faces:', error);
      toast({
        title: "Error",
        description: "Failed to load registered faces",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, selectedFaceId, setSelectedFaceId, fetchTodayStatuses]);

  useEffect(() => {
    fetchRegisteredFaces();

    let updateTimeout: NodeJS.Timeout;
    
    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance_records' }, 
        () => {
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => {
            fetchRegisteredFaces();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(updateTimeout);
      supabase.removeChannel(attendanceChannel);
    };
  }, [nameFilter, fetchRegisteredFaces]);

  const fetchAttendanceCount = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('timestamp')
        .eq('status', 'present')
        .contains('device_info', { employee_id: employeeId });

      if (error) throw error;

      const uniqueDays = new Set(
        (data || []).map(record => new Date(record.timestamp).toLocaleDateString())
      );
      
      const attendanceCount = uniqueDays.size;

      setAttendanceCounts(prev => ({ ...prev, [employeeId]: attendanceCount }));
      setFaces(prev => prev.map(face => 
        face.employee_id === employeeId ? { ...face, total_attendance: attendanceCount } : face
      ));
    } catch (error) {
      console.error(`Error fetching attendance count for ${employeeId}:`, error);
    }
  };

  const handleDeleteFace = async (id: string) => {
    if (!confirm("Are you sure you want to delete this registered face?")) return;
    
    try {
      const { error } = await supabase.from('attendance_records').delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: "Success", description: "Face data deleted successfully" });
      if (id === selectedFaceId) setSelectedFaceId(null);
      await fetchRegisteredFaces();
    } catch (error) {
      console.error('Error deleting face:', error);
      toast({ title: "Error", description: "Failed to delete face data", variant: "destructive" });
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const getStatusBadge = (employeeId: string) => {
    const info = todayStatuses[employeeId];
    const status = info?.status || 'absent';
    
    switch (status) {
      case 'present':
        return (
          <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Present
            {info?.time && <span className="text-[10px] opacity-75 ml-0.5">{info.time}</span>}
          </Badge>
        );
      case 'late':
        return (
          <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30 gap-1">
            <Clock className="w-3 h-3" />
            Late
            {info?.time && <span className="text-[10px] opacity-75 ml-0.5">{info.time}</span>}
          </Badge>
        );
      case 'absent':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 gap-1">
            <XCircle className="w-3 h-3" />
            Absent
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
        <Skeleton className="h-10 rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const totalStudents = faces.length;
  const attendanceRate = totalStudents > 0 
    ? Math.round(((statusCounts.present + statusCounts.late) / totalStudents) * 100)
    : 0;

  const hasActiveFilters = statusFilter !== 'all' || sectionFilter !== 'all' || classFilter !== 'all' || searchTerm.trim() !== '';

  return (
    <>
      <ExistingUserContactPopup />
      <div className="space-y-4">

        {/* ── Status Pills ── */}
        <div className="flex gap-2">
          {([
            { key: 'present' as StatusFilter, count: statusCounts.present, icon: CheckCircle2, label: 'Present', activeClass: 'bg-green-500/15 border-green-500/40 text-green-700 dark:text-green-400', dotClass: 'bg-green-500' },
            { key: 'late' as StatusFilter, count: statusCounts.late, icon: Clock, label: 'Late', activeClass: 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400', dotClass: 'bg-amber-500' },
            { key: 'absent' as StatusFilter, count: statusCounts.absent, icon: XCircle, label: 'Absent', activeClass: 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-400', dotClass: 'bg-red-500' },
          ]).map(item => (
            <motion.button
              key={item.key}
              whileTap={{ scale: 0.96 }}
              onClick={() => setStatusFilter(statusFilter === item.key ? 'all' : item.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-2xl border-2 transition-all duration-200 font-medium",
                statusFilter === item.key
                  ? item.activeClass
                  : "bg-card border-border hover:border-muted-foreground/20 text-foreground"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", item.dotClass)} />
              <span className="text-xl font-bold tabular-nums">{item.count}</span>
              <span className="text-xs opacity-70 hidden sm:inline">{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* ── Attendance rate bar ── */}
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${attendanceRate}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <span className="absolute right-0 -top-5 text-[10px] font-medium text-muted-foreground">
            {attendanceRate}% attendance
          </span>
        </div>

        {/* ── Search + Compact Filters ── */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-9 h-10 rounded-xl bg-muted/40 border-0 focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs rounded-lg border-dashed">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {['A','B','C','D'].map(s => (
                  <SelectItem key={s} value={s}>Section {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs rounded-lg border-dashed">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                  <SelectItem key={g} value={String(g)}>Class {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 text-xs rounded-lg border-dashed">
                  <ArrowUpDown className="w-3 h-3" />
                  {sortField === 'name' ? 'Name' : sortField === 'status' ? 'Status' : sortField === 'attendance' ? 'Days' : 'Recent'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {([
                  { field: 'name' as SortField, label: 'Name' },
                  { field: 'status' as SortField, label: 'Status' },
                  { field: 'attendance' as SortField, label: 'Attendance' },
                  { field: 'lastSeen' as SortField, label: 'Last Seen' },
                ] as const).map(opt => (
                  <DropdownMenuItem key={opt.field} onClick={() => toggleSort(opt.field)} className={cn("text-xs", sortField === opt.field && "bg-accent")}>
                    {opt.label} {sortField === opt.field && (sortDir === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 ml-auto shrink-0"
                onClick={() => {
                  setSelectedFaceId(null);
                  setSectionFilter('all');
                  setClassFilter('all');
                  setStatusFilter('all');
                  setSortField('name');
                  setSortDir('asc');
                  setSearchTerm('');
                }}
              >
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* ── Active filters chips ── */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-1.5 flex-wrap"
            >
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">Showing</span>
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer rounded-full px-2 py-0.5" onClick={() => setStatusFilter('all')}>
                  {statusFilter} ×
                </Badge>
              )}
              {sectionFilter !== 'all' && (
                <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer rounded-full px-2 py-0.5" onClick={() => setSectionFilter('all')}>
                  Sec {sectionFilter} ×
                </Badge>
              )}
              {classFilter !== 'all' && (
                <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer rounded-full px-2 py-0.5" onClick={() => setClassFilter('all')}>
                  Class {classFilter} ×
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">
                {filteredAndSortedFaces.length}/{faces.length}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Student List ── */}
        {filteredAndSortedFaces.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-dashed">
              <CardContent className="py-12 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <UserX className="h-7 w-7 text-muted-foreground/60" />
                </div>
                <h3 className="font-semibold">No students found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  {hasActiveFilters ? 'Try adjusting your filters or search term' : 'Register new faces to see them here'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={() => { setStatusFilter('all'); setSectionFilter('all'); setClassFilter('all'); setSearchTerm(''); }}>
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {filteredAndSortedFaces.map((face, i) => {
                const statusInfo = todayStatuses[face.employee_id];
                const status = statusInfo?.status || 'absent';
                const statusColor = status === 'present' ? 'border-l-green-500' : status === 'late' ? 'border-l-amber-500' : 'border-l-red-400';

                return (
                  <motion.div
                    key={face.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card
                      className={cn(
                        "overflow-hidden cursor-pointer transition-all hover:shadow-md border-l-4",
                        statusColor,
                        selectedFaceId === face.id && 'ring-2 ring-primary shadow-lg'
                      )}
                      onClick={() => setSelectedFaceId(face.id === selectedFaceId ? null : face.id)}
                    >
                      <CardContent className="p-0">
                        <div className="flex gap-3 p-3">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <Avatar className="h-14 w-14 rounded-xl border-2 border-border">
                              <AvatarImage
                                src={face.image_url?.startsWith('data:')
                                  ? face.image_url
                                  : `https://zovwmlqnrsionbolcpng.supabase.co/storage/v1/object/public/face-images/${face.image_url}`
                                }
                                alt={face.name}
                                className="object-cover"
                              />
                              <AvatarFallback className="rounded-xl text-lg font-bold bg-muted">
                                {face.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {/* Status dot */}
                            <span className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background",
                              status === 'present' ? 'bg-green-500' : status === 'late' ? 'bg-amber-500' : 'bg-red-400'
                            )} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm truncate">{face.name}</h3>
                                <p className="text-[11px] text-muted-foreground">{face.department} · {face.employee_id}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem className="text-xs text-destructive gap-2" onClick={(e) => { e.stopPropagation(); handleDeleteFace(face.id); }}>
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-3 text-[11px]">
                              {getStatusBadge(face.employee_id)}
                              <span className="text-muted-foreground tabular-nums flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {face.total_attendance}d
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom action bar */}
                        <div className="border-t border-border/50 px-3 py-2 flex items-center justify-between bg-muted/30" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-muted-foreground">
                            Last: {face.last_attendance === 'Never' ? 'Never' : new Date(face.last_attendance!).toLocaleDateString()}
                          </span>
                          <NotificationService
                            studentId={face.user_id}
                            studentName={face.name}
                            attendanceStatus="present"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* ── Table View ── */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="py-2.5 px-3 text-left font-medium text-xs text-muted-foreground w-12"></th>
                    <th className="py-2.5 px-3 text-left font-medium text-xs text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('name')}>
                      Student {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-2.5 px-3 text-center font-medium text-xs text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('status')}>
                      Status {sortField === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-2.5 px-3 text-center font-medium text-xs text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('attendance')}>
                      Days {sortField === 'attendance' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-2.5 px-3 text-right font-medium text-xs text-muted-foreground w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedFaces.map((face) => {
                    const status = todayStatuses[face.employee_id]?.status || 'absent';
                    return (
                      <tr
                        key={face.id}
                        className={cn(
                          "border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors",
                          selectedFaceId === face.id && 'bg-primary/5'
                        )}
                        onClick={() => setSelectedFaceId(face.id === selectedFaceId ? null : face.id)}
                      >
                        <td className="py-2.5 px-3">
                          <div className="relative">
                            <Avatar className="h-9 w-9 rounded-lg">
                              <AvatarImage
                                src={face.image_url?.startsWith('data:')
                                  ? face.image_url
                                  : `https://zovwmlqnrsionbolcpng.supabase.co/storage/v1/object/public/face-images/${face.image_url}`
                                }
                                alt={face.name}
                              />
                              <AvatarFallback className="rounded-lg text-xs">{face.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                              status === 'present' ? 'bg-green-500' : status === 'late' ? 'bg-amber-500' : 'bg-red-400'
                            )} />
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-sm">{face.name}</p>
                          <p className="text-[10px] text-muted-foreground">{face.department} · {face.employee_id}</p>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {getStatusBadge(face.employee_id)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-sm font-semibold tabular-nums">{face.total_attendance}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 justify-end">
                            <NotificationService
                              studentId={face.user_id}
                              studentName={face.name}
                              attendanceStatus="present"
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem className="text-xs text-destructive gap-2" onClick={(e) => { e.stopPropagation(); handleDeleteFace(face.id); }}>
                                  <Trash2 className="w-3 h-3" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

export default AdminFacesList;
