import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FaceInfo } from './utils/attendanceUtils';
import NotificationService from './NotificationService';
import { User, CheckCircle2, Clock, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StudentInfoCardProps {
  selectedFace: FaceInfo | null;
  attendanceDays: Date[];
  lateAttendanceDays: Date[];
  reportControls?: React.ReactNode;
}

const StudentInfoCard: React.FC<StudentInfoCardProps> = ({ 
  selectedFace, 
  attendanceDays, 
  lateAttendanceDays,
  reportControls
}) => {
  const totalDays = attendanceDays.length + lateAttendanceDays.length;
  const attendanceRate = totalDays > 0 ? Math.round((attendanceDays.length / totalDays) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Avatar className="h-14 w-14 rounded-xl border-2 border-border shrink-0">
              <AvatarImage 
                src={selectedFace?.image_url && selectedFace.image_url.startsWith('data:') 
                  ? selectedFace.image_url 
                  : selectedFace?.image_url
                    ? `https://zovwmlqnrsionbolcpng.supabase.co/storage/v1/object/public/face-images/${selectedFace.image_url}`
                    : undefined
                } 
                alt={selectedFace?.name || 'Student'}
                className="object-cover"
              />
              <AvatarFallback className="rounded-xl text-lg font-bold">
                {selectedFace?.name?.charAt(0) || <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-bold text-lg truncate">{selectedFace?.name || 'Student'}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {selectedFace?.employee_id || 'N/A'}
                </Badge>
                <span className="text-xs text-muted-foreground">{selectedFace?.department || ''}</span>
                {selectedFace?.position && selectedFace.position !== 'Student' && (
                  <Badge variant="outline" className="text-[10px]">{selectedFace.position}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats Chips */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <StatChip icon={CheckCircle2} value={attendanceDays.length} label="Present" className="text-green-600 dark:text-green-400 bg-green-500/10" />
            <StatChip icon={Clock} value={lateAttendanceDays.length} label="Late" className="text-amber-600 dark:text-amber-400 bg-amber-500/10" />
            {totalDays > 0 && (
              <StatChip icon={TrendingUp} value={`${attendanceRate}%`} label="Rate" className="text-primary bg-primary/10" />
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="border-t border-border/50 bg-muted/30 px-4 py-2.5 flex items-center justify-between gap-2">
          <div onClick={(e) => e.stopPropagation()}>
            <NotificationService 
              studentId={selectedFace?.user_id}
              studentName={selectedFace?.name}
              attendanceStatus="present"
            />
          </div>
          {reportControls}
        </div>
      </CardContent>
    </Card>
  );
};

const StatChip: React.FC<{ icon: React.ElementType; value: number | string; label: string; className?: string }> = ({ icon: Icon, value, label, className }) => (
  <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium", className)}>
    <Icon className="w-3.5 h-3.5" />
    <span className="font-bold tabular-nums">{value}</span>
    <span className="opacity-70 hidden sm:inline">{label}</span>
  </div>
);

export default StudentInfoCard;
