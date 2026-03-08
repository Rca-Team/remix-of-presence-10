import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Users, 
  User, 
  Shield, 
  GraduationCap,
  Search,
  Crown,
  ShieldCheck,
  UserCog,
  Check,
  X,
  Edit,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { CLASSES, SECTIONS, getCategoryLabel } from '@/constants/schoolConfig';

type Role = 'user' | 'moderator' | 'admin';

interface RegisteredUser {
  id: string;
  user_id: string | null;
  name: string;
  employee_id: string;
  category: string;
  image_url: string;
  role: Role;
  isTeacher: boolean;
  teacherCategories: string[];
}

const ALL_CLASS_SECTIONS = CLASSES.flatMap(cls => SECTIONS.map(sec => `${cls}-${sec}`));

const ROLE_CONFIG: Record<Role, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: 'Admin', icon: Crown, color: 'text-yellow-500 bg-yellow-500/10' },
  moderator: { label: 'Principal', icon: ShieldCheck, color: 'text-purple-500 bg-purple-500/10' },
  user: { label: 'User', icon: User, color: 'text-muted-foreground bg-muted' },
};

const UserAccessManager: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<RegisteredUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<Role>('user');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.employee_id.toLowerCase().includes(query)
      );
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter || (roleFilter === 'moderator' && u.isTeacher));
    }
    
    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch all registered users
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('id, user_id, device_info, image_url, category')
        .eq('status', 'registered');

      if (error) throw error;

      // Fetch user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));

      // Fetch teacher permissions
      const { data: permissions } = await supabase
        .from('teacher_permissions')
        .select('user_id, category');

      const teacherPermsMap = new Map<string, string[]>();
      (permissions || []).forEach(p => {
        if (!teacherPermsMap.has(p.user_id)) {
          teacherPermsMap.set(p.user_id, []);
        }
        teacherPermsMap.get(p.user_id)!.push(p.category);
      });

      const processedUsers: RegisteredUser[] = (records || [])
        .map(record => {
          const deviceInfo = record.device_info as any;
          const metadata = deviceInfo?.metadata || {};
          const userId = record.user_id || record.id;
          
          return {
            id: record.id,
            user_id: record.user_id,
            name: metadata.name || 'Unknown',
            employee_id: metadata.employee_id || 'N/A',
            category: record.category || 'A',
            image_url: record.image_url || metadata.firebase_image_url || '',
            role: (roleMap.get(userId) as Role) || 'user',
            isTeacher: record.category === 'Teacher' || teacherPermsMap.has(userId),
            teacherCategories: teacherPermsMap.get(userId) || [],
          };
        })
        .filter(u => u.name !== 'Unknown')
        .sort((a, b) => {
          // Admins first, then moderators, then teachers, then users
          const roleOrder: Record<string, number> = { admin: 0, moderator: 1, user: 2 };
          const aOrder = roleOrder[a.role] ?? 2;
          const bOrder = roleOrder[b.role] ?? 2;
          if (aOrder !== bOrder) return aOrder - bOrder;
          if (a.isTeacher && !b.isTeacher) return -1;
          if (!a.isTeacher && b.isTeacher) return 1;
          return a.name.localeCompare(b.name);
        });

      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (user: RegisteredUser) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setSelectedCategories(user.teacherCategories as Category[]);
    setDialogOpen(true);
  };

  const toggleCategory = (category: Category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    
    setIsSaving(true);
    try {
      const userId = selectedUser.user_id || selectedUser.id;

      // Update role in user_roles table
      if (selectedUser.user_id) {
        // Delete existing role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.user_id);

        // Insert new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser.user_id,
            role: newRole,
          });

        if (roleError) throw roleError;
      }

      // Handle teacher permissions
      if (newRole === 'moderator' || selectedCategories.length > 0) {
        // Delete existing teacher permissions
        await supabase
          .from('teacher_permissions')
          .delete()
          .eq('user_id', userId);

        // If promoting to teacher/moderator with categories
        if (selectedCategories.length > 0) {
          const permissionsToInsert = selectedCategories.map(cat => ({
            user_id: userId,
            category: cat,
            can_take_attendance: true,
            can_view_reports: true,
          }));

          const { error: permError } = await supabase
            .from('teacher_permissions')
            .insert(permissionsToInsert);

          if (permError) throw permError;
        }

        // Update category to Teacher if given permissions
        if (selectedCategories.length > 0) {
          await supabase
            .from('attendance_records')
            .update({ category: 'Teacher' })
            .eq('id', selectedUser.id);
        }
      } else {
        // Remove teacher permissions if not a teacher anymore
        await supabase
          .from('teacher_permissions')
          .delete()
          .eq('user_id', userId);
          
        // Revert category if was Teacher
        if (selectedUser.category === 'Teacher') {
          await supabase
            .from('attendance_records')
            .update({ category: 'A' })
            .eq('id', selectedUser.id);
        }
      }

      toast({
        title: 'Success',
        description: `${selectedUser.name}'s access has been updated`,
      });

      setDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user access',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            User Access Management
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            User Access Management
          </CardTitle>
          <CardDescription>
            View all registered users and manage their roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'all' | Role)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="moderator">Principals</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {users.length} Total Users
            </Badge>
            <Badge className={ROLE_CONFIG.admin.color}>
              <Crown className="h-3 w-3 mr-1" />
              {users.filter(u => u.role === 'admin').length} Admins
            </Badge>
            <Badge className={ROLE_CONFIG.moderator.color}>
              <ShieldCheck className="h-3 w-3 mr-1" />
              {users.filter(u => u.role === 'moderator').length} Principals
            </Badge>
            <Badge className="gap-1 bg-blue-500/10 text-blue-500">
              <GraduationCap className="h-3 w-3" />
              {users.filter(u => u.isTeacher).length} Teachers
            </Badge>
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              filteredUsers.map(user => {
                const RoleIcon = ROLE_CONFIG[user.role].icon;
                
                return (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={user.image_url?.startsWith('data:') 
                            ? user.image_url 
                            : user.image_url 
                              ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/face-images/${user.image_url}` 
                              : ''
                          } 
                          alt={user.name}
                        />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{user.name}</p>
                          <Badge variant="outline" className={ROLE_CONFIG[user.role].color}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {ROLE_CONFIG[user.role].label}
                          </Badge>
                          {user.isTeacher && user.role !== 'moderator' && (
                            <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-500">
                              <GraduationCap className="h-3 w-3" />
                              Teacher
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{user.employee_id}</span>
                          {user.teacherCategories.length > 0 && (
                            <span>• Categories: {user.teacherCategories.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Edit User Access
            </DialogTitle>
            <DialogDescription>
              Update {selectedUser?.name}'s role and permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={selectedUser?.image_url?.startsWith('data:') 
                    ? selectedUser?.image_url 
                    : selectedUser?.image_url 
                      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/face-images/${selectedUser?.image_url}` 
                      : ''
                  } 
                  alt={selectedUser?.name}
                />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedUser?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.employee_id}</p>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium">System Role:</p>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      User (Default)
                    </div>
                  </SelectItem>
                  <SelectItem value="moderator">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-purple-500" />
                      Principal
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Teacher Categories */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Teacher Permissions (Optional):</p>
              <p className="text-xs text-muted-foreground">
                Assign categories this user can manage as a teacher
              </p>
              {CATEGORIES.map(cat => (
                <label 
                  key={cat} 
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCategories.includes(cat) 
                      ? 'bg-primary/5 border-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    checked={selectedCategories.includes(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                  <span className="flex-1">Category {cat}</span>
                  {selectedCategories.includes(cat) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserAccessManager;
