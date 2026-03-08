
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <ExistingUserContactPopup />
      <div className="space-y-4">
        {/* Status Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl border transition-all",
              statusFilter === 'present'
                ? "bg-green-500/15 border-green-500/40 ring-1 ring-green-500/30"
                : "bg-card hover:bg-muted/50 border-border"
            )}
          >
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <div className="text-left">
              <p className="text-lg font-bold">{statusCounts.present}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Present</p>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'late' ? 'all' : 'late')}
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl border transition-all",
              statusFilter === 'late'
                ? "bg-orange-500/15 border-orange-500/40 ring-1 ring-orange-500/30"
                : "bg-card hover:bg-muted/50 border-border"
            )}
          >
            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <div className="text-left">
              <p className="text-lg font-bold">{statusCounts.late}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Late</p>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl border transition-all",
              statusFilter === 'absent'
                ? "bg-red-500/15 border-red-500/40 ring-1 ring-red-500/30"
                : "bg-card hover:bg-muted/50 border-border"
            )}
          >
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <div className="text-left">
              <p className="text-lg font-bold">{statusCounts.absent}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Absent</p>
            </div>
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or department..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                <SelectItem value="A">Section A</SelectItem>
                <SelectItem value="B">Section B</SelectItem>
                <SelectItem value="C">Section C</SelectItem>
                <SelectItem value="D">Section D</SelectItem>
              </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                  <SelectItem key={grade} value={String(grade)}>Class {grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  {sortDir === 'asc' ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />}
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs">Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toggleSort('name')} className={cn(sortField === 'name' && 'bg-muted')}>
                  Name {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('status')} className={cn(sortField === 'status' && 'bg-muted')}>
                  Today's Status {sortField === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('attendance')} className={cn(sortField === 'attendance' && 'bg-muted')}>
                  Total Attendance {sortField === 'attendance' && (sortDir === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('lastSeen')} className={cn(sortField === 'lastSeen' && 'bg-muted')}>
                  Last Seen {sortField === 'lastSeen' && (sortDir === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          
            <Button 
              variant="ghost" 
              size="sm"
              className="h-9"
              onClick={() => {
                setSelectedFaceId(null);
                setSectionFilter('all');
                setClassFilter('all');
                setStatusFilter('all');
                setSortField('name');
                setSortDir('asc');
                setSearchTerm('');
              }}
              disabled={!selectedFaceId && sectionFilter === 'all' && classFilter === 'all' && statusFilter === 'all' && sortField === 'name' && !searchTerm}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Active filters indicator */}
        {(statusFilter !== 'all' || sectionFilter !== 'all' || classFilter !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setStatusFilter('all')}>
                {statusFilter} ×
              </Badge>
            )}
            {sectionFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setSectionFilter('all')}>
                Section {sectionFilter} ×
              </Badge>
            )}
            {classFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setClassFilter('all')}>
                Class {classFilter} ×
              </Badge>
            )}
            <span className="text-xs text-muted-foreground ml-1">
              — {filteredAndSortedFaces.length} of {faces.length} students
            </span>
          </div>
        )}

      {filteredAndSortedFaces.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <User className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-medium">No students found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || nameFilter !== 'all' ? 'Try adjusting your search or filters' : 'Register new faces to see them here'}
            </p>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedFaces.map((face) => (
            <Card 
              key={face.id} 
              className={cn(
                "overflow-hidden transition-all cursor-pointer hover:shadow-md",
                selectedFaceId === face.id && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedFaceId(face.id === selectedFaceId ? null : face.id)}
            >
              <CardContent className="p-0">
                 <div className="relative">
                   <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                     {face.image_url ? (
                       <img 
                         src={face.image_url.startsWith('data:') 
                           ? face.image_url 
                           : `https://zovwmlqnrsionbolcpng.supabase.co/storage/v1/object/public/face-images/${face.image_url}`
                         } 
                         alt={face.name} 
                         className="object-cover w-full h-full"
                         onError={(e) => {
                           (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(face.name)}&background=random&size=200`;
                         }}
                       />
                     ) : (
                       <div className="flex items-center justify-center w-full h-full">
                         <User className="h-24 w-24 text-muted-foreground/40" />
                       </div>
                     )}
                   </div>
                  {/* Status badge on image */}
                  <div className="absolute top-2 left-2">
                    {getStatusBadge(face.employee_id)}
                  </div>
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFace(face.id);
                        }}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                   <div className="p-4 space-y-2">
                   <div className="flex justify-between items-start">
                     <h3 className="font-medium truncate">{face.name}</h3>
                     <Avatar className="ml-2 h-8 w-8 shrink-0 border-2 border-border">
                       <AvatarImage 
                         src={face.image_url?.startsWith('data:') 
                           ? face.image_url 
                           : `https://zovwmlqnrsionbolcpng.supabase.co/storage/v1/object/public/face-images/${face.image_url}`
                         } 
                         alt={face.name}
                       />
                       <AvatarFallback>
                         <User className="h-4 w-4" />
                       </AvatarFallback>
                     </Avatar>
                   </div>
                   <p className="text-sm text-muted-foreground">{face.department}</p>
                    <div className="flex items-center justify-between pt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{face.total_attendance} {face.total_attendance === 1 ? 'day' : 'days'}</span>
                      </div>
                     <div className="flex items-center gap-1">
                       <Calendar className="h-4 w-4" />
                       <span>Last: {
                         face.last_attendance === 'Never' 
                           ? 'Never' 
                           : new Date(face.last_attendance!).toLocaleDateString()
                       }</span>
                     </div>
                   </div>
                    <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                      <NotificationService 
                        studentId={face.user_id} 
                        studentName={face.name}
                        attendanceStatus="present"
                     />
                   </div>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left font-medium">Photo</th>
                  <th className="py-3 px-4 text-left font-medium cursor-pointer hover:text-primary" onClick={() => toggleSort('name')}>
                    Name {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-4 text-left font-medium">ID</th>
                  <th className="py-3 px-4 text-left font-medium">Department</th>
                  <th className="py-3 px-4 text-center font-medium cursor-pointer hover:text-primary" onClick={() => toggleSort('status')}>
                    Today {sortField === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-4 text-center font-medium cursor-pointer hover:text-primary" onClick={() => toggleSort('attendance')}>
                    Attendance {sortField === 'attendance' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="py-3 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedFaces.map((face) => (
                  <tr 
                    key={face.id} 
                    className={cn(
                      "border-b hover:bg-muted/50 cursor-pointer",
                      selectedFaceId === face.id && 'bg-muted/50'
                    )}
                    onClick={() => setSelectedFaceId(face.id === selectedFaceId ? null : face.id)}
                  >
                     <td className="py-3 px-4">
                       <Avatar className="h-10 w-10">
                         <AvatarImage 
                           src={face.image_url?.startsWith('data:') 
                             ? face.image_url 
                             : `https://zovwmlqnrsionbolcpng.supabase.co/storage/v1/object/public/face-images/${face.image_url}`
                           } 
                           alt={face.name}
                         />
                         <AvatarFallback>
                           <User className="h-5 w-5" />
                         </AvatarFallback>
                       </Avatar>
                     </td>
                    <td className="py-3 px-4 font-medium">{face.name}</td>
                    <td className="py-3 px-4">{face.employee_id}</td>
                    <td className="py-3 px-4">{face.department}</td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(face.employee_id)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={face.total_attendance > 0 ? "default" : "outline"}>
                        {face.total_attendance}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                       <div className="flex items-center gap-1 justify-end">
                          <NotificationService 
                            studentId={face.user_id} 
                            studentName={face.name}
                            attendanceStatus="present"
                         />
                         <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFace(face.id);
                          }}>
                            Delete
                          </DropdownMenuItem>
                         </DropdownMenuContent>
                         </DropdownMenu>
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default AdminFacesList;
