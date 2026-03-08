import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BarChart2, UserPlus, Clock, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/dashboard', icon: BarChart2, label: 'Gate' },
  { path: '/register', icon: UserPlus, label: 'Register' },
  { path: '/attendance', icon: Clock, label: 'Attend' },
  { path: '/profile', icon: User, label: 'Profile' }
];

const MobileNavBar: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { trigger } = useHapticFeedback();

  if (!isMobile) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-xl",
        "border-t border-border/50",
        "safe-area-bottom",
        "md:hidden"
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => trigger('light')}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "min-w-[64px] min-h-[56px] rounded-xl",
                "transition-all duration-200",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="relative z-10 flex flex-col items-center gap-1"
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-transform",
                  active && "scale-110"
                )} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileNavBar;
