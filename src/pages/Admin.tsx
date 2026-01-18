import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '@/components/layouts/PageLayout';
import PageTransition from '@/components/PageTransition';
import AdminFacesList from '@/components/admin/AdminFacesList';
import AttendanceCalendar from '@/components/admin/AttendanceCalendar';
import AttendanceCutoffSetting from '@/components/admin/AttendanceCutoffSetting';
import AutoNotificationScheduler from '@/components/admin/AutoNotificationScheduler';
import BulkNotificationService from '@/components/admin/BulkNotificationService';
import QuickRegistrationForm from '@/components/admin/QuickRegistrationForm';
import CombinedBulkRegistration from '@/components/admin/CombinedBulkRegistration';
import CategoryBasedView from '@/components/admin/CategoryBasedView';
import PrincipalDashboard from '@/components/admin/PrincipalDashboard';
import TeacherDashboard from '@/components/admin/TeacherDashboard';
import AttendanceExport from '@/components/admin/AttendanceExport';
import AdminNotificationSender from '@/components/admin/AdminNotificationSender';
import UserAccessManager from '@/components/admin/UserAccessManager';
import BatchIDCardExtractor from '@/components/admin/BatchIDCardExtractor';
import StudentIDCardGenerator from '@/components/admin/StudentIDCardGenerator';
import AttendanceReportGenerator from '@/components/admin/AttendanceReportGenerator';
import PDFBulkRegistration from '@/components/admin/PDFBulkRegistration';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AnimatedNotificationBadge } from '@/components/ui/animated-notification-badge';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { 
  User, Calendar, Filter, Clock, UserPlus, FolderKanban, School, 
  GraduationCap, Menu, LayoutDashboard, Settings, Image, FileText,
  Bell, Users, BarChart3, Sparkles, Shield, Activity, TrendingUp,
  ChevronRight, Download, Send, Zap, Globe, UserCog, CreditCard
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Admin = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { trigger: haptic } = useHapticFeedback();
  const { role, isLoading: isRoleLoading, isAdminOrPrincipal, isTeacher } = useUserRole();
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('');
  const [attendanceUpdated, setAttendanceUpdated] = useState(false);
  const [nameFilter, setNameFilter] = useState<string>('all');
  const [availableFaces, setAvailableFaces] = useState<{id: string, name: string, employee_id: string}[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [stats, setStats] = useState({
    totalFaces: 0,
    todayAttendance: 0,
    presentToday: 0,
    lateToday: 0,
  });

  // Set default tab based on role
  useEffect(() => {
    if (!isRoleLoading && !activeTab) {
      if (isTeacher && !isAdminOrPrincipal) {
        setActiveTab('teacher');
      } else {
        setActiveTab('principal');
      }
    }
  }, [isRoleLoading, isTeacher, isAdminOrPrincipal, activeTab]);

  const fetchData = async () => {
    if (!isAdminOrPrincipal) return;
    
    try {
      // Fetch face names
      const { data: faceData, error: faceError } = await supabase
        .from('attendance_records')
        .select('id, user_id, device_info')
        .eq('status', 'registered');
        
      if (!faceError && faceData && faceData.length > 0) {
        const uniqueFaces = faceData.reduce((acc: {id: string, name: string, employee_id: string}[], record) => {
          try {
            const deviceInfo = record.device_info as any;
            const name = deviceInfo?.metadata?.name || 'Unknown';
            const employee_id = deviceInfo?.metadata?.employee_id || 'N/A';
            
            if (name === 'Unknown' || name === 'User' || name.toLowerCase().includes('unknown')) {
              return acc;
            }
            
            const userId = record.user_id || record.id;
            
            if (!acc.some(face => face.id === userId)) {
              acc.push({ id: userId, name, employee_id });
            }
            
            return acc;
          } catch (e) {
            console.error('Error processing record:', e);
            return acc;
          }
        }, []);
        
        setAvailableFaces(uniqueFaces);
        setStats(prev => ({ ...prev, totalFaces: uniqueFaces.length }));
      }

      // Fetch today's attendance - count UNIQUE users only
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData } = await supabase
        .from('attendance_records')
        .select('user_id, status, device_info')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
        .neq('status', 'registered');

      if (todayData) {
        // Get unique users based on user_id or employee_id
        const uniquePresent = new Set<string>();
        const uniqueLate = new Set<string>();
        const uniqueTotal = new Set<string>();
        
        todayData.forEach(record => {
          const userId = record.user_id || (record.device_info as any)?.metadata?.employee_id || record.device_info;
          if (userId) {
            uniqueTotal.add(String(userId));
            if (record.status === 'present') {
              uniquePresent.add(String(userId));
            } else if (record.status === 'late') {
              uniqueLate.add(String(userId));
            }
          }
        });
        
        setStats(prev => ({
          ...prev,
          todayAttendance: uniqueTotal.size,
          presentToday: uniquePresent.size,
          lateToday: uniqueLate.size,
        }));
      }

      // Fetch unread notifications
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);

      setNotificationCount(count || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up real-time channel
    const adminChannel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance_records' },
        (payload) => {
          setAttendanceUpdated(true);
          haptic('medium');
          
          if (payload.eventType === 'DELETE' && payload.old && payload.old.id === selectedFaceId) {
            setSelectedFaceId(null);
            toast({
              title: "Face Deleted",
              description: "The selected face has been deleted.",
              variant: "default",
            });
          } else if (payload.eventType === 'INSERT') {
            setNotificationCount(prev => prev + 1);
            toast({
              title: "New Registration",
              description: "A new face has been registered.",
              variant: "default",
            });
          }
          
          setTimeout(() => fetchData(), 500);
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(adminChannel);
    };
  }, [selectedFaceId, isAdminOrPrincipal]);

  useEffect(() => {
    if (attendanceUpdated) {
      const timer = setTimeout(() => setAttendanceUpdated(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [attendanceUpdated]);

  const handleTabChange = (tab: string) => {
    haptic('selection');
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleRefresh = async () => {
    await fetchData();
    toast({
      title: "Refreshed",
      description: "Data has been updated.",
    });
  };

  // Loading state
  if (isRoleLoading) {
    return (
      <PageTransition>
        <PageLayout className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/50 dark:to-indigo-950">
          <div className="space-y-4 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </PageLayout>
      </PageTransition>
    );
  }

  // Teacher-only view
  if (isTeacher && !isAdminOrPrincipal) {
    return (
      <PageTransition>
        <PageLayout className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/50 dark:to-indigo-950">
          <TeacherDashboard />
        </PageLayout>
      </PageTransition>
    );
  }

  // Mobile navigation items
  const mobileNavItems = [
    { id: 'principal', icon: School, label: 'Dashboard', color: 'from-blue-500 to-blue-600' },
    { id: 'categories', icon: FolderKanban, label: 'Sections', color: 'from-purple-500 to-pink-500' },
    { id: 'faces', icon: User, label: 'All Faces', color: 'from-green-500 to-emerald-500', badge: attendanceUpdated },
    { id: 'calendar', icon: Calendar, label: 'Calendar', color: 'from-orange-500 to-red-500' },
    { id: 'register', icon: UserPlus, label: 'Quick Register', color: 'from-cyan-500 to-blue-500' },
    { id: 'bulk', icon: Users, label: 'Bulk Register', color: 'from-indigo-500 to-purple-500' },
    { id: 'idcard', icon: CreditCard, label: 'ID Card Extract', color: 'from-pink-500 to-rose-500' },
    { id: 'pdf', icon: FileText, label: 'PDF Extract', color: 'from-amber-500 to-orange-500' },
    { id: 'idcards', icon: CreditCard, label: 'ID Cards', color: 'from-teal-500 to-cyan-500' },
    { id: 'reports', icon: BarChart3, label: 'Reports', color: 'from-emerald-500 to-green-500' },
    { id: 'access', icon: UserCog, label: 'Manage Access', color: 'from-violet-500 to-purple-500' },
    { id: 'notifications', icon: Bell, label: 'Notifications', color: 'from-yellow-500 to-orange-500', count: notificationCount },
    { id: 'settings', icon: Settings, label: 'Settings', color: 'from-slate-500 to-slate-600' },
  ];

  const statsCards = [
    { label: 'Total Registered', value: stats.totalFaces, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Today\'s Attendance', value: stats.todayAttendance, icon: Activity, color: 'from-green-500 to-emerald-500' },
    { label: 'Present Today', value: stats.presentToday, icon: TrendingUp, color: 'from-cyan-500 to-blue-500' },
    { label: 'Late Today', value: stats.lateToday, icon: Clock, color: 'from-orange-500 to-red-500' },
  ];

  // Full admin/principal view
  return (
    <PageTransition>
      <PageLayout className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/50 dark:to-indigo-950">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-400/15 to-blue-400/15 rounded-full blur-3xl"
          />
        </div>

        <PullToRefresh onRefresh={handleRefresh} enabled={isMobile} className="relative">
          <div className="relative mobile-container py-4 sm:py-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start justify-between mb-6"
            >
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-3">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Admin Panel</span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    Admin Dashboard
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage attendance, users, and notifications
                </p>
              </div>
              
              {/* Mobile menu button */}
              {isMobile && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25 flex items-center justify-center"
                    >
                      <AnimatedNotificationBadge count={notificationCount} position="top-right">
                        <Menu className="w-5 h-5 text-white" />
                      </AnimatedNotificationBadge>
                    </motion.button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-blue-100 dark:border-blue-900">
                    <div className="p-4 border-b border-blue-100 dark:border-blue-900 bg-gradient-to-r from-blue-600 to-blue-500">
                      <h2 className="font-bold text-white text-lg">Navigation</h2>
                      <p className="text-blue-100 text-sm">Quick access to all features</p>
                    </div>
                    <div className="py-2">
                      {mobileNavItems.map((item, i) => (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleTabChange(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${
                            activeTab === item.id 
                              ? 'bg-blue-50 dark:bg-blue-950/50 border-l-4 border-blue-500' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                            <item.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium block">{item.label}</span>
                            {item.badge && (
                              <span className="text-xs text-blue-500">New updates</span>
                            )}
                          </div>
                          {item.count !== undefined && item.count > 0 && (
                            <Badge className="bg-red-500 text-white">{item.count}</Badge>
                          )}
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </motion.button>
                      ))}
                    </div>
                    <div className="p-4 border-t border-blue-100 dark:border-blue-900 space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">Theme</span>
                        <ThemeToggle />
                      </div>
                      <AttendanceExport />
                      <BulkNotificationService availableFaces={availableFaces} />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              
              {/* Desktop controls */}
              {!isMobile && (
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <Select value={nameFilter} onValueChange={setNameFilter}>
                    <SelectTrigger className="w-[180px] bg-white/70 dark:bg-slate-800/70 backdrop-blur border-blue-100 dark:border-blue-900">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by name" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Registered Faces</SelectItem>
                      {availableFaces.map((face) => (
                        <SelectItem key={face.id} value={face.id}>
                          {face.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <AnimatedNotificationBadge count={notificationCount}>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleTabChange('notifications')}
                      className="bg-white/70 dark:bg-slate-800/70 backdrop-blur border-blue-100 dark:border-blue-900"
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                  </AnimatedNotificationBadge>
                  
                  <BulkNotificationService availableFaces={availableFaces} />
                  <AttendanceExport />
                  <Button 
                    variant="outline" 
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur border-blue-100 dark:border-blue-900"
                  >
                    {viewMode === 'grid' ? 'List View' : 'Grid View'}
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Quick Stats - Desktop */}
            {!isMobile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-4 gap-4 mb-6"
              >
                {statsCards.map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}
                  >
                    <stat.icon className="w-6 h-6 text-white/90 mb-2" />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/70">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Desktop tabs */}
              {!isMobile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <TabsList className="mb-6 flex-wrap gap-1 p-1.5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-blue-100 dark:border-blue-900/50 rounded-xl shadow-lg">
                    <TabsTrigger value="principal" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg">
                      <School className="h-4 w-4" />
                      <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg">
                      <FolderKanban className="h-4 w-4" />
                      <span>Sections</span>
                    </TabsTrigger>
                    <TabsTrigger value="faces" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg">
                      <User className="h-4 w-4" />
                      <span>All Faces</span>
                      {attendanceUpdated && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg">
                      <Calendar className="h-4 w-4" />
                      <span>Calendar</span>
                    </TabsTrigger>
                    <TabsTrigger value="register" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg">
                      <UserPlus className="h-4 w-4" />
                      <span>Register</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg">
                      <AnimatedNotificationBadge count={notificationCount} variant="dot">
                        <Bell className="h-4 w-4" />
                      </AnimatedNotificationBadge>
                      <span>Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </TabsTrigger>
                  </TabsList>
                </motion.div>
              )}

              {/* Mobile filter bar */}
              {isMobile && activeTab === 'faces' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <Select value={nameFilter} onValueChange={setNameFilter}>
                    <SelectTrigger className="w-full bg-white/70 dark:bg-slate-800/70 backdrop-blur border-blue-100 dark:border-blue-900">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by name" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Registered Faces</SelectItem>
                      {availableFaces.map((face) => (
                        <SelectItem key={face.id} value={face.id}>
                          {face.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
              
              <AnimatePresence mode="wait">
                <TabsContent value="principal" className="space-y-4 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {/* Mobile Stats */}
                    {isMobile && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {statsCards.map((stat, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
                          >
                            <stat.icon className="w-5 h-5 text-white/90 mb-1" />
                            <p className="text-xl font-bold text-white">{stat.value}</p>
                            <p className="text-[10px] text-white/70">{stat.label}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    <PrincipalDashboard />
                  </motion.div>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <CategoryBasedView />
                  </motion.div>
                </TabsContent>

                <TabsContent value="faces" className="space-y-4 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <AdminFacesList 
                      viewMode={isMobile ? 'grid' : viewMode} 
                      selectedFaceId={selectedFaceId}
                      nameFilter={nameFilter}
                      setSelectedFaceId={(id) => {
                        haptic('selection');
                        setSelectedFaceId(id);
                        if (id) {
                          setActiveTab('calendar');
                        }
                      }} 
                    />
                  </motion.div>
                </TabsContent>

                <TabsContent value="calendar" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <AttendanceCalendar selectedFaceId={selectedFaceId} />
                  </motion.div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-blue-100 dark:border-blue-900/50 shadow-xl overflow-hidden">
                      <CardHeader className="pb-4 border-b border-blue-100 dark:border-blue-900/50 bg-gradient-to-r from-blue-600 to-blue-500">
                        <CardTitle className="flex items-center gap-3 text-white">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Send className="w-5 h-5" />
                          </div>
                          Send Notifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <AdminNotificationSender availableFaces={availableFaces} />
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4 sm:space-y-6"
                  >
                    <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-blue-100 dark:border-blue-900/50 shadow-xl overflow-hidden">
                      <CardHeader className="pb-4 border-b border-blue-100 dark:border-blue-900/50 bg-gradient-to-r from-orange-500 to-red-500">
                        <CardTitle className="flex items-center gap-3 text-white">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                          </div>
                          Attendance Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <AttendanceCutoffSetting />
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-blue-100 dark:border-blue-900/50 shadow-xl overflow-hidden">
                      <CardHeader className="pb-4 border-b border-blue-100 dark:border-blue-900/50 bg-gradient-to-r from-purple-500 to-pink-500">
                        <CardTitle className="flex items-center gap-3 text-white">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Bell className="w-5 h-5" />
                          </div>
                          Auto Notifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <AutoNotificationScheduler />
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="register" className="space-y-4 sm:space-y-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-blue-100 dark:border-blue-900/50 shadow-xl overflow-hidden">
                      <CardHeader className="pb-4 border-b border-blue-100 dark:border-blue-900/50 bg-gradient-to-r from-green-500 to-emerald-500">
                        <CardTitle className="flex items-center gap-3 text-white">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <UserPlus className="w-5 h-5" />
                          </div>
                          Quick Registration
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <QuickRegistrationForm onSuccess={() => {
                          haptic('success');
                          setAttendanceUpdated(true);
                        }} />
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="bulk" className="space-y-4 sm:space-y-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-blue-100 dark:border-blue-900/50 shadow-xl overflow-hidden">
                      <CardHeader className="pb-4 border-b border-blue-100 dark:border-blue-900/50 bg-gradient-to-r from-cyan-500 to-blue-500">
                        <CardTitle className="flex items-center gap-3 text-white">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Users className="w-5 h-5" />
                          </div>
                          Bulk Registration
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <CombinedBulkRegistration />
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="idcard" className="space-y-4 sm:space-y-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <BatchIDCardExtractor />
                  </motion.div>
                </TabsContent>

                <TabsContent value="pdf" className="space-y-4 sm:space-y-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <PDFBulkRegistration />
                  </motion.div>
                </TabsContent>

                <TabsContent value="idcards" className="space-y-4 sm:space-y-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <StudentIDCardGenerator />
                  </motion.div>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4 sm:space-y-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <AttendanceReportGenerator />
                  </motion.div>
                </TabsContent>

                <TabsContent value="access" className="space-y-4 sm:space-y-6 mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <UserAccessManager />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </div>
        </PullToRefresh>
      </PageLayout>
    </PageTransition>
  );
};

export default Admin;
