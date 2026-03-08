import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, BarChart2, UserPlus, Clock, User, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const navItems = [
  { path: '/', icon: Home, label: 'Home', color: 'ios-blue' },
  { path: '/register', icon: UserPlus, label: 'Register', color: 'ios-green' },
  { path: '/attendance', icon: Clock, label: 'Attend', color: 'ios-purple' },
  { path: '/profile', icon: User, label: 'Profile', color: 'ios-pink' }
];

const MobileNavBar: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { trigger } = useHapticFeedback();

  if (!isMobile) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/80 backdrop-blur-2xl",
        "border-t border-white/20 dark:border-white/10",
        "safe-area-bottom shadow-2xl",
        "md:hidden"
      )}
      style={{
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.1), 0 -2px 10px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="flex items-center justify-around px-3 py-2">
        {navItems.map((item, index) => {
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => trigger('light')}
              className={cn(
                "relative flex flex-col items-center justify-center",
                "min-w-[70px] min-h-[60px] rounded-2xl",
                "transition-colors duration-300"
              )}
            >
              <AnimatePresence mode="wait">
                {active && (
                  <motion.div
                    layoutId="navIndicator"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={cn(
                      "absolute inset-1 rounded-2xl",
                      `bg-${item.color}/15`
                    )}
                    style={{
                      background: `linear-gradient(145deg, hsl(var(--${item.color}) / 0.2), hsl(var(--${item.color}) / 0.05))`,
                      boxShadow: `0 4px 15px hsl(var(--${item.color}) / 0.2)`
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </AnimatePresence>
              
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 400 }}
                whileTap={{ scale: 0.75 }}
                className="relative z-10 flex flex-col items-center gap-1"
              >
                <motion.div
                  animate={active ? { 
                    scale: [1, 1.2, 1],
                    rotate: [0, -5, 5, 0]
                  } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <item.icon 
                    className={cn(
                      "w-6 h-6 transition-all duration-300",
                      active 
                        ? `text-${item.color}` 
                        : "text-muted-foreground"
                    )}
                    style={active ? { color: `hsl(var(--${item.color}))` } : {}}
                  />
                </motion.div>
                <motion.span 
                  className={cn(
                    "text-[11px] font-semibold transition-colors duration-300",
                    active ? `text-${item.color}` : "text-muted-foreground"
                  )}
                  style={active ? { color: `hsl(var(--${item.color}))` } : {}}
                >
                  {item.label}
                </motion.span>
                
                {/* Active dot indicator */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -bottom-1 w-1.5 h-1.5 rounded-full"
                      style={{ background: `hsl(var(--${item.color}))` }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileNavBar;