import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { 
  Home, 
  BarChart, 
  UserPlus, 
  Clock, 
  Menu, 
  User, 
  ShieldCheck, 
  Sun, 
  Moon, 
  UserCircle, 
  GraduationCap,
  LogOut,
  X,
  Scan,
  Settings,
  ChevronRight
} from 'lucide-react';
import Logo from './Logo';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/integrations/supabase/safeClient';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

const MobileSidebar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const { isAdminOrPrincipal, isTeacher } = useUserRole();
  const { toast } = useToast();
  
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setOpen(false);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const navigation = useMemo(() => {
    const items = [
      { name: 'Home', path: '/', icon: Home },
      { name: 'Gate', path: '/dashboard', icon: BarChart, requiresAuth: true },
      { name: 'Profile', path: '/profile', icon: User, requiresAuth: true },
      { name: 'Register', path: '/register', icon: UserPlus },
      { name: 'Attendance', path: '/attendance', icon: Clock, requiresAuth: true },
      { name: isTeacher && !isAdminOrPrincipal ? 'Teacher' : 'Admin', path: '/admin', icon: isTeacher && !isAdminOrPrincipal ? GraduationCap : ShieldCheck, show: isAdminOrPrincipal || isTeacher },
    ];
    return items.filter(item => item.show !== false);
  }, [isAdminOrPrincipal, isTeacher]);
  
  if (!isMobile) return null;
  
  const isActive = (path: string) => location.pathname === path;
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const displayName = profile?.display_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Button 
              size="icon" 
              className="relative h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300"
            >
              <Menu className="h-6 w-6 text-white" />
              {/* Pulse effect */}
              <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
            </Button>
          </motion.div>
        </SheetTrigger>
        
        <SheetContent 
          side="bottom" 
          className="rounded-t-3xl max-h-[90vh] p-0 border-t-0 bg-gradient-to-b from-background to-muted/30"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
          </div>

          <div className="flex flex-col h-full max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Scan className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <Logo className="text-lg" />
                    <p className="text-xs text-muted-foreground">Smart Attendance</p>
                  </div>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleTheme}
                  className="relative w-12 h-12 rounded-xl bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={theme}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      {theme === 'dark' ? (
                        <Moon className="h-5 w-5 text-blue-400" />
                      ) : (
                        <Sun className="h-5 w-5 text-yellow-500" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>

            {/* User Card (if logged in) */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/20"
              >
                <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-12 w-12 rounded-full object-cover border-2 border-blue-500/30"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                      <UserCircle className="h-7 w-7 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              </motion.div>
            )}
            
            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="space-y-2">
                {navigation.map((item, index) => (
                  <motion.li 
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center py-3.5 px-4 rounded-xl transition-all duration-300",
                        isActive(item.path)
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-colors",
                        isActive(item.path) 
                          ? "bg-white/20" 
                          : "bg-muted"
                      )}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{item.name}</span>
                      {isActive(item.path) && (
                        <motion.div 
                          layoutId="activeIndicator"
                          className="ml-auto w-2 h-2 rounded-full bg-white"
                        />
                      )}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>
            
            {/* Bottom Actions */}
            <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm space-y-3">
              {user ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="w-full justify-start h-12 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <Link to="/login" className="block">
                    <Button variant="outline" className="w-full justify-start h-12">
                      <User className="h-5 w-5 mr-3" />
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" className="block">
                    <Button className="w-full justify-start h-12 bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25">
                      <UserPlus className="h-5 w-5 mr-3" />
                      Get Started
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileSidebar;
