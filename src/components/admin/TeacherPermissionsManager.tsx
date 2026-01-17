import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, User, GraduationCap, Eye, ClipboardCheck, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Category = 'A' | 'B' | 'C' | 'D';

interface Teacher {
  id: string;
  user_id?: string;
  name: string;
  employee_id: string;
  image_url: string;
}

interface Permission {
  id?: string;
  user_id: string;
  category: string;
  can_take_attendance: boolean;
  can_view_reports: boolean;
}

const CATEGORIES: Category[] = ['A', 'B', 'C', 'D'];

const TeacherPermissionsManager: React.FC = () => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<Permission[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchTeachersAndPermissions();
  }, []);

  const fetchTeachersAndPermissions = async () => {
    setIsLoading(true);
    try {
      // Fetch teachers from attendance_records
      const { data: teacherRecords, error: teachersError } = await supabase
        .from('attendance_records')
        .select('id, user_id, device_info, image_url')
        .eq('status', 'registered')
        .eq('category', 'Teacher');

      if (teachersError) throw teachersError;

      const processedTeachers: Teacher[] = (teacherRecords || [])
        .map(record => {
          const deviceInfo = record.device_info as any;
          const metadata = deviceInfo?.metadata || {};
          return {
            id: record.id,
            user_id: record.user_id || undefined,
            name: metadata.name || 'Unknown',
            employee_id: metadata.employee_id || 'N/A',
            image_url: record.image_url || metadata.firebase_image_url || '',
          };
        })
        .filter(t => t.name !== 'Unknown');

      setTeachers(processedTeachers);

      // Fetch existing permissions
      const { data: permData, error: permError } = await supabase
        .from('teacher_permissions')
        .select('*');

      if (permError && permError.code !== 'PGRST116') throw permError;

      setPermissions(permData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teachers and permissions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openPermissionEditor = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    
    // Get existing permissions for this teacher
    const existingPerms = permissions.filter(p => p.user_id === teacher.user_id);
    
    // Create permission objects for all categories
    const allPermissions: Permission[] = CATEGORIES.map(cat => {
      const existing = existingPerms.find(p => p.category === cat);
      return existing || {
        user_id: teacher.user_id || teacher.id,
        category: cat,
        can_take_attendance: false,
        can_view_reports: false,
      };
    });
    
    setEditingPermissions(allPermissions);
    setDialogOpen(true);
  };

  const togglePermission = (category: string, field: 'can_take_attendance' | 'can_view_reports') => {
    setEditingPermissions(prev => 
      prev.map(p => 
        p.category === category 
          ? { ...p, [field]: !p[field] }
          : p
      )
    );
  };

  const savePermissions = async () => {
    if (!selectedTeacher) return;
    
    setIsSaving(true);
    try {
      const userId = selectedTeacher.user_id || selectedTeacher.id;
      
      // Delete existing permissions for this teacher
      await supabase
        .from('teacher_permissions')
        .delete()
        .eq('user_id', userId);

      // Insert new permissions (only for categories with at least one permission enabled)
      const permissionsToInsert = editingPermissions.filter(
        p => p.can_take_attendance || p.can_view_reports
      ).map(p => ({
        user_id: userId,
        category: p.category,
        can_take_attendance: p.can_take_attendance,
        can_view_reports: p.can_view_reports,
      }));

      if (permissionsToInsert.length > 0) {
        const { error } = await supabase
          .from('teacher_permissions')
          .insert(permissionsToInsert);

        if (error) throw error;
      }

      toast({
        title: 'Permissions Saved',
        description: `Updated permissions for ${selectedTeacher.name}`,
      });

      await fetchTeachersAndPermissions();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to save permissions',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTeacherPermissionSummary = (teacher: Teacher) => {
    const teacherPerms = permissions.filter(p => p.user_id === (teacher.user_id || teacher.id));
    if (teacherPerms.length === 0) return 'No permissions assigned';
    
    const categories = teacherPerms.map(p => p.category).join(', ');
    return `Categories: ${categories}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Teacher Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Teacher Permissions Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teachers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No teachers registered yet</p>
            <p className="text-sm">Register teachers in the "Teacher" category to assign permissions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teachers.map(teacher => (
              <div 
                key={teacher.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={teacher.image_url?.startsWith('data:') 
                        ? teacher.image_url 
                        : teacher.image_url 
                          ? `https://zovwmlqnrsionbolcpng.supabase.co/storage/v1/object/public/face-images/${teacher.image_url}` 
                          : ''
                      } 
                      alt={teacher.name}
                    />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground">{getTeacherPermissionSummary(teacher)}</p>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" onClick={() => openPermissionEditor(teacher)}>
                  <Shield className="h-4 w-4 mr-1" />
                  Manage
                </Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Manage Permissions - {selectedTeacher?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Assign categories this teacher can manage:
              </p>
              
              <div className="space-y-3">
                {editingPermissions.map(perm => (
                  <div key={perm.category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Category {perm.category}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={perm.can_take_attendance}
                          onCheckedChange={() => togglePermission(perm.category, 'can_take_attendance')}
                        />
                        <ClipboardCheck className="h-4 w-4" />
                        <span className="text-xs">Attendance</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={perm.can_view_reports}
                          onCheckedChange={() => togglePermission(perm.category, 'can_view_reports')}
                        />
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">Reports</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={savePermissions} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save Permissions'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TeacherPermissionsManager;
