import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
import ClassSectionReport from '@/components/admin/ClassSectionReport';
import SubstitutionReport from '@/components/admin/SubstitutionReport';
import EmergencyAlertPanel from '@/components/admin/EmergencyAlertPanel';
import PDFBulkRegistration from '@/components/admin/PDFBulkRegistration';
import NotificationLog from '@/components/admin/NotificationLog';
import AdminInbox from '@/components/admin/AdminInbox';
import AdminTutorial from '@/components/admin/AdminTutorial';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  User, Calendar, Clock, UserPlus, FolderKanban, School,
  LayoutDashboard, Settings, FileText, Bell, Users, BarChart3,
  Shield, Activity, TrendingUp, ChevronRight, Send, UserCog,
  CreditCard, Image, Download, RefreshCw, MessageSquareText, Mail, Siren } from
'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  group: string;
  badge?: string;
  count?: number;
}

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
  const [availableFaces, setAvailableFaces] = useState<{id: string;name: string;employee_id: string;}[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [stats, setStats] = useState({
    totalFaces: 0,
    todayAttendance: 0,
    presentToday: 0,
    lateToday: 0
  });

  useEffect(() => {
    if (!isRoleLoading && !activeTab) {
      setActiveTab(isTeacher && !isAdminOrPrincipal ? 'teacher' : 'dashboard');
    }
  }, [isRoleLoading, isTeacher, isAdminOrPrincipal, activeTab]);

  const fetchData = async () => {
    if (!isAdminOrPrincipal) return;
    try {
      const { data: faceData } = await supabase.
      from('attendance_records').
      select('id, user_id, device_info').
      eq('status', 'registered');

      if (faceData && faceData.length > 0) {
        const uniqueFaces = faceData.reduce((acc: {id: string;name: string;employee_id: string;}[], record) => {
          try {
            const deviceInfo = record.device_info as any;
            const name = deviceInfo?.metadata?.name || 'Unknown';
            const employee_id = deviceInfo?.metadata?.employee_id || 'N/A';
            if (name === 'Unknown' || name === 'User') return acc;
            const userId = record.user_id || record.id;
            if (!acc.some((face) => face.id === userId)) acc.push({ id: userId, name, employee_id });
            return acc;
          } catch {return acc;}
        }, []);
        setAvailableFaces(uniqueFaces);
        setStats((prev) => ({ ...prev, totalFaces: uniqueFaces.length }));
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: todayData } = await supabase.
      from('attendance_records').
      select('user_id, status, device_info').
      gte('timestamp', `${today}T00:00:00`).
      lte('timestamp', `${today}T23:59:59`).
      neq('status', 'registered');

      if (todayData) {
        const uniquePresent = new Set<string>();
        const uniqueLate = new Set<string>();
        const uniqueTotal = new Set<string>();
        todayData.forEach((record) => {
          const userId = record.user_id || (record.device_info as any)?.metadata?.employee_id;
          if (userId) {
            const uid = String(userId);
            uniqueTotal.add(uid);
            if (record.status === 'present') {
              uniquePresent.add(uid);
              uniqueLate.delete(uid); // present overrides late
            } else if (record.status === 'late' && !uniquePresent.has(uid)) {
              uniqueLate.add(uid);
            }
          }
        });
        setStats((prev) => ({
          ...prev,
          todayAttendance: uniqueTotal.size,
          presentToday: uniquePresent.size,
          lateToday: uniqueLate.size
        }));
      }

      const { count } = await supabase.
      from('notifications').
      select('*', { count: 'exact', head: true }).
      eq('read', false);
      setNotificationCount(count || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.
    channel('admin-dashboard').
    on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
      setAttendanceUpdated(true);
      haptic('medium');
      setTimeout(() => fetchData(), 500);
    }).
    on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchData()).
    subscribe();
    return () => {supabase.removeChannel(channel);};
  }, [isAdminOrPrincipal]);

  useEffect(() => {
    if (attendanceUpdated) {
      const timer = setTimeout(() => setAttendanceUpdated(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [attendanceUpdated]);

  const handleTabChange = (tab: string) => {
    haptic('selection');
    setActiveTab(tab);
  };

  const handleRefresh = async () => {
    await fetchData();
    toast({ title: "Refreshed", description: "Data updated." });
  };

  if (isRoleLoading) {
    return (
      <PageTransition>
        <PageLayout className="min-h-screen bg-background">
          <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </PageLayout>
      </PageTransition>);

  }

  if (isTeacher && !isAdminOrPrincipal) {
    return (
      <PageTransition>
        <PageLayout className="min-h-screen bg-background">
          <TeacherDashboard />
        </PageLayout>
      </PageTransition>);

  }

  const navItems: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', group: 'Overview' },
  { id: 'sections', icon: FolderKanban, label: 'Class', group: 'Overview' },
  { id: 'students', icon: Users, label: 'Students', group: 'Overview', badge: attendanceUpdated ? 'new' : undefined },
  { id: 'calendar', icon: Calendar, label: 'Calendar', group: 'Overview' },
  { id: 'register', icon: UserPlus, label: 'Register', group: 'Registration' },
  { id: 'bulk', icon: Users, label: 'Bulk Register', group: 'Registration' },
  { id: 'idcard', icon: Image, label: 'ID Extract', group: 'Registration' },
  { id: 'pdf', icon: FileText, label: 'PDF Import', group: 'Registration' },
  { id: 'idcards', icon: CreditCard, label: 'ID Cards', group: 'Registration' },
  { id: 'reports', icon: BarChart3, label: 'Reports', group: 'Management' },
  { id: 'access', icon: UserCog, label: 'Access', group: 'Management' },
  { id: 'notifications', icon: Bell, label: 'Notifications', group: 'Management', count: notificationCount },
  { id: 'notif-log', icon: MessageSquareText, label: 'Delivery Log', group: 'Management' },
  { id: 'inbox', icon: Mail, label: 'Inbox', group: 'Management' },
  { id: 'emergency', icon: Siren, label: 'Emergency', group: 'Management' },
  { id: 'settings', icon: Settings, label: 'Settings', group: 'Management' }];


  const groups = ['Overview', 'Registration', 'Management'];

  const statsCards = [
  { label: 'Registered', value: stats.totalFaces, icon: Users, color: 'text-primary' },
  { label: 'Present', value: stats.presentToday, icon: TrendingUp, color: 'text-green-600 dark:text-green-400' },
  { label: 'Late', value: stats.lateToday, icon: Clock, color: 'text-orange-600 dark:text-orange-400' }];


  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <PrincipalDashboard />;
      case 'sections':
        return <CategoryBasedView />;
      case 'students':
        return (
          <AdminFacesList
            viewMode={viewMode}
            selectedFaceId={selectedFaceId}
            nameFilter={nameFilter}
            setSelectedFaceId={(id) => {
              haptic('selection');
              setSelectedFaceId(id);
              if (id) setActiveTab('calendar');
            }} />);


      case 'calendar':
        return <AttendanceCalendar selectedFaceId={selectedFaceId} />;
      case 'register':
        return (
          <QuickRegistrationForm onSuccess={() => {
            haptic('success');
            setAttendanceUpdated(true);
          }} />);

      case 'bulk':
        return <CombinedBulkRegistration />;
      case 'idcard':
        return <BatchIDCardExtractor />;
      case 'pdf':
        return <PDFBulkRegistration />;
      case 'idcards':
        return <StudentIDCardGenerator />;
      case 'reports':
        return (
          <div className="space-y-6">
            <ClassSectionReport />
            <AttendanceReportGenerator />
          </div>
        );
      case 'access':
        return <UserAccessManager />;
      case 'notifications':
        return <AdminNotificationSender availableFaces={availableFaces} />;
      case 'notif-log':
        return <NotificationLog />;
      case 'inbox':
        return <AdminInbox />;
      case 'emergency':
        return <EmergencyAlertPanel />;
      case 'settings':
        return (
          <div className="space-y-6">
            <AttendanceCutoffSetting />
            <AutoNotificationScheduler />
          </div>);

      default:
        return <PrincipalDashboard />;
    }
  };

  // Mobile bottom nav
  const mobileQuickNav = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { id: 'sections', icon: FolderKanban, label: 'Class' },
  { id: 'students', icon: Users, label: 'Students' },
  { id: 'register', icon: UserPlus, label: 'Register' },
  { id: 'reports', icon: BarChart3, label: 'Reports' }];


  const mobileQuickIds = mobileQuickNav.map((n) => n.id);
  const moreNavItems = navItems.filter((n) => !mobileQuickIds.includes(n.id));

  return (
    <PageTransition>
      <PageLayout className="min-h-screen bg-background">
        <div className="flex h-[calc(100dvh-4rem)]">
          {/* Desktop Sidebar */}
          {!isMobile &&
          <aside className={cn(
            "border-r border-border bg-card flex flex-col transition-all duration-200",
            sidebarCollapsed ? "w-16" : "w-56"
          )}>
              <div className="p-3 border-b border-border flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-primary-foreground" />
                </div>
                {!sidebarCollapsed &&
              <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">Admin</p>
                    <p className="text-[10px] text-muted-foreground">Management</p>
                  </div>
              }
              </div>

              <ScrollArea className="flex-1 py-2">
                {groups.map((group) =>
              <div key={group} className="mb-1">
                    {!sidebarCollapsed &&
                <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {group}
                      </p>
                }
                    {navItems.filter((n) => n.group === group).map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      data-nav-id={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                        isActive ?
                        "bg-primary/10 text-primary border-r-2 border-primary font-medium" :
                        "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}>
                      
                          <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-primary")} />
                          {!sidebarCollapsed &&
                      <>
                              <span className="truncate flex-1 text-left">{item.label}</span>
                              {item.badge &&
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        }
                              {item.count !== undefined && item.count > 0 &&
                        <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5 min-w-[14px]">
                          {item.count}
                        </Badge>
                        }
                            </>
                      }
                        </button>);

                })}
                  </div>
              )}
              </ScrollArea>

              <div className="p-2 border-t border-border space-y-1">
                <div className="flex items-center justify-between px-2">
                  <ThemeToggle />
                  <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                  
                    <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", sidebarCollapsed && "rotate-180")} />
                  </Button>
                </div>
                {!sidebarCollapsed &&
              <div className="flex gap-1">
                    <AttendanceExport />
                    <BulkNotificationService availableFaces={availableFaces} />
                  </div>
              }
              </div>
            </aside>
          }

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Bar - Compact on mobile */}
            <div className="border-b border-border bg-card px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-semibold truncate">
                    {navItems.find((n) => n.id === activeTab)?.label || 'Dashboard'}
                  </h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block truncate">
                    {activeTab === 'dashboard' && 'Overview of attendance and registered students'}
                    {activeTab === 'register' && 'Register new student with multi-angle face scan'}
                    {activeTab === 'students' && 'View and manage all registered students'}
                    {activeTab === 'reports' && 'Generate and export attendance reports'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <AdminTutorial onNavigate={handleTabChange} />
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={handleRefresh}>
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                {isMobile && <ThemeToggle />}
              </div>
            </div>

            {/* Stats Bar - Scrollable on mobile */}
            <div className="border-b border-border bg-card/50 px-3 sm:px-4 py-1.5 sm:py-2">
              <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
                {statsCards.map((stat, i) =>
                <div key={i} className="flex items-center gap-1.5 sm:gap-2 py-0.5 sm:py-1 min-w-fit">
                    <stat.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", stat.color)} />
                    <span className="text-base sm:text-lg font-bold">{stat.value}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <PullToRefresh onRefresh={handleRefresh} enabled={isMobile} className="flex-1 overflow-auto">
              <div className="p-3 sm:p-4 md:p-6 pb-28 sm:pb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}>
                    
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </PullToRefresh>
          </main>
        </div>

        {/* Mobile Bottom Navigation - Improved */}
        {isMobile &&
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-2xl border-t border-border z-50 pb-safe">
            <div className="flex justify-around py-1">
              {mobileQuickNav.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  data-nav-id={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0 flex-1",
                    "active:scale-90",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                  
                    <item.icon className={cn("w-[18px] h-[18px] sm:w-5 sm:h-5", isActive && "text-primary")} />
                    <span className="text-[9px] sm:text-[10px] font-medium leading-tight">{item.label}</span>
                    {isActive && (
                      <motion.div layoutId="admin-mobile-dot" className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                    )}
                  </button>);

            })}

              {/* More button with sheet */}
              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-0 flex-1",
                    "active:scale-90",
                    moreNavItems.some((n) => n.id === activeTab) ? "text-primary" : "text-muted-foreground"
                  )}>
                  
                    <Settings className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                    <span className="text-[9px] sm:text-[10px] font-medium leading-tight">More</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[24px] pb-safe max-h-[75vh] bg-card/95 backdrop-blur-2xl border-0">
                  <div className="pt-1 pb-4">
                    <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
                    <h3 className="text-sm font-semibold text-foreground mb-3 px-1">All Features</h3>
                    <ScrollArea className="max-h-[55vh]">
                      {groups.map((group) =>
                    <div key={group} className="mb-4">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">{group}</p>
                          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                            {navItems.filter((n) => n.group === group).map((item) => {
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              data-nav-id={item.id}
                              onClick={() => {handleTabChange(item.id);setMoreOpen(false);}}
                              className={cn(
                                "flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl transition-colors relative",
                                "active:scale-95",
                                isActive ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                              )}>
                              
                                  <item.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", isActive && "text-primary")} />
                                  <span className="text-[9px] sm:text-[10px] font-medium leading-tight text-center">{item.label}</span>
                                  {item.count !== undefined && item.count > 0 &&
                              <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 text-[7px] px-0.5 py-0 h-3 min-w-[12px]">
                                      {item.count}
                                    </Badge>
                              }
                                </button>);

                        })}
                          </div>
                        </div>
                    )}
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        }
      </PageLayout>
    </PageTransition>);

};

export default Admin;