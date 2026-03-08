import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, FolderKanban, Users, Calendar, UserPlus, Image,
  FileText, CreditCard, BarChart3, UserCog, Bell, MessageSquareText,
  Mail, Siren, Settings, X, ChevronRight, ChevronLeft, Sparkles,
  HelpCircle, Rocket, MapPin, MoreHorizontal,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TutorialStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  mobileLocation: 'bottom-nav' | 'more-menu';
  desktopGroup: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Your command center — live attendance stats, real-time activity feeds, and AI-powered insights.',
    color: 'hsl(var(--primary))',
    mobileLocation: 'bottom-nav',
    desktopGroup: 'Overview',
  },
  {
    id: 'sections',
    icon: FolderKanban,
    title: 'Class & Timetable Management',
    description: 'Manage classes, assign teachers, set up period-wise timetables (8 periods Mon–Sat), and auto-assign substitutes when teachers are absent.',
    color: '#8b5cf6',
    mobileLocation: 'bottom-nav',
    desktopGroup: 'Overview',
  },
  {
    id: 'students',
    icon: Users,
    title: 'Student Directory',
    description: 'Browse all registered students with photos, names, and IDs. Click any student to view their attendance calendar.',
    color: '#06b6d4',
    mobileLocation: 'bottom-nav',
    desktopGroup: 'Overview',
  },
  {
    id: 'calendar',
    icon: Calendar,
    title: 'Attendance Calendar',
    description: 'Visual monthly calendar showing daily attendance (present, late, absent) for any selected student.',
    color: '#10b981',
    mobileLocation: 'more-menu',
    desktopGroup: 'Overview',
  },
  {
    id: 'register',
    icon: UserPlus,
    title: 'Quick Registration',
    description: 'Register new students using a multi-angle face scan. Captures 5 angles for maximum accuracy.',
    color: '#f59e0b',
    mobileLocation: 'bottom-nav',
    desktopGroup: 'Registration',
  },
  {
    id: 'bulk',
    icon: Users,
    title: 'Bulk Registration',
    description: 'Register multiple students at once using class photos or batch image uploads.',
    color: '#ec4899',
    mobileLocation: 'more-menu',
    desktopGroup: 'Registration',
  },
  {
    id: 'idcard',
    icon: Image,
    title: 'ID Card Extraction',
    description: 'Upload ID card images — AI extracts face photos, names, and ID numbers automatically.',
    color: '#14b8a6',
    mobileLocation: 'more-menu',
    desktopGroup: 'Registration',
  },
  {
    id: 'pdf',
    icon: FileText,
    title: 'PDF Import',
    description: 'Import student data from PDF documents like admission lists or school records.',
    color: '#f97316',
    mobileLocation: 'more-menu',
    desktopGroup: 'Registration',
  },
  {
    id: 'idcards',
    icon: CreditCard,
    title: 'ID Card Generator',
    description: 'Generate professional student ID cards with photos, QR codes, and school branding.',
    color: '#6366f1',
    mobileLocation: 'more-menu',
    desktopGroup: 'Registration',
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Generate class-wise attendance reports with charts and export to print-ready PDFs.',
    color: '#22c55e',
    mobileLocation: 'bottom-nav',
    desktopGroup: 'Management',
  },
  {
    id: 'access',
    icon: UserCog,
    title: 'User Access & Roles',
    description: 'Manage roles (Admin, Principal, Teacher). Grant teachers permission for specific classes.',
    color: '#ef4444',
    mobileLocation: 'more-menu',
    desktopGroup: 'Management',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Send targeted notifications to parents via email, WhatsApp, and SMS with AI auto-fill.',
    color: '#a855f7',
    mobileLocation: 'more-menu',
    desktopGroup: 'Management',
  },
  {
    id: 'notif-log',
    icon: MessageSquareText,
    title: 'Delivery Log',
    description: 'Track all sent notifications — see delivery status for every WhatsApp, email, and SMS.',
    color: '#0ea5e9',
    mobileLocation: 'more-menu',
    desktopGroup: 'Management',
  },
  {
    id: 'inbox',
    icon: Mail,
    title: 'Admin Inbox',
    description: 'View emails sent to the school. All incoming messages captured with real-time updates.',
    color: '#64748b',
    mobileLocation: 'more-menu',
    desktopGroup: 'Management',
  },
  {
    id: 'emergency',
    icon: Siren,
    title: 'Emergency Alerts',
    description: 'Broadcast emergency alerts (fire, lockdown, earthquake) to ALL devices. Triggers alarms even when app is closed.',
    color: '#dc2626',
    mobileLocation: 'more-menu',
    desktopGroup: 'Management',
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings',
    description: 'Configure attendance cutoff time, auto-notification schedules, and absence alert triggers.',
    color: '#78716c',
    mobileLocation: 'more-menu',
    desktopGroup: 'Management',
  },
];

const STORAGE_KEY = 'admin-tutorial-completed';

interface AdminTutorialProps {
  onNavigate: (tabId: string) => void;
}

const AdminTutorial: React.FC<AdminTutorialProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const isMobile = useIsMobile();
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setTimeout(() => setIsOpen(true), 1500);
    }
  }, []);

  // Find and highlight the target nav element
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;
    const step = TUTORIAL_STEPS[currentStep];
    const el = document.querySelector(`[data-nav-id="${step.id}"]`);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [updateTargetPosition]);

  // Navigate to the tab when step changes
  useEffect(() => {
    if (isOpen) {
      const step = TUTORIAL_STEPS[currentStep];
      onNavigate(step.id);
      // Re-check position after navigation settles
      setTimeout(updateTargetPosition, 100);
    }
  }, [isOpen, currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentStep(0);
    setDirection(1);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); handleNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
      else if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleNext, handlePrev, handleClose]);

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    if (isMobile) {
      // On mobile, tooltip goes above the bottom nav
      return {
        bottom: `${window.innerHeight - targetRect.top + 16}px`,
        left: '50%',
        transform: 'translateX(-50%)',
      };
    } else {
      // On desktop, tooltip goes to the right of sidebar
      return {
        top: `${Math.min(targetRect.top, window.innerHeight - 340)}px`,
        left: `${targetRect.right + 16}px`,
      };
    }
  };

  // Arrow pointing direction
  const getArrowStyle = (): React.CSSProperties => {
    if (!targetRect) return { display: 'none' };

    if (isMobile) {
      // Arrow points down toward the bottom nav item
      return {
        position: 'absolute' as const,
        bottom: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: `8px solid ${step.color}`,
      };
    } else {
      // Arrow points left toward sidebar
      return {
        position: 'absolute' as const,
        top: '24px',
        left: '-8px',
        width: 0,
        height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderRight: `8px solid ${step.color}`,
      };
    }
  };

  return (
    <>
      {/* Restart Tutorial Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 relative group"
        onClick={handleRestart}
        title="Admin Tutorial"
      >
        <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
      </Button>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Semi-transparent backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-background/60 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Highlight ring around target element */}
            {targetRect && (
              <motion.div
                ref={highlightRef}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed z-[95] pointer-events-none rounded-xl"
                style={{
                  top: targetRect.top - 4,
                  left: targetRect.left - 4,
                  width: targetRect.width + 8,
                  height: targetRect.height + 8,
                  boxShadow: `0 0 0 3px ${step.color}, 0 0 20px ${step.color}80, 0 0 40px ${step.color}40`,
                  transition: 'top 0.3s, left 0.3s, width 0.3s, height 0.3s',
                }}
              >
                {/* Pulsing ring */}
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  animate={{
                    boxShadow: [
                      `0 0 0 0px ${step.color}60`,
                      `0 0 0 10px ${step.color}00`,
                    ],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              </motion.div>
            )}

            {/* "Cut out" the target element so it's visible */}
            {targetRect && (
              <div
                className="fixed z-[92] bg-transparent pointer-events-none"
                style={{
                  top: targetRect.top - 2,
                  left: targetRect.left - 2,
                  width: targetRect.width + 4,
                  height: targetRect.height + 4,
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0)',
                }}
              />
            )}

            {/* Tooltip card with arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed z-[100] w-[min(360px,90vw)]"
              style={getTooltipPosition()}
            >
              <div className="relative">
                {/* Arrow */}
                <div style={getArrowStyle()} />

                {/* Card */}
                <div
                  className="rounded-2xl border-2 bg-card shadow-2xl overflow-hidden"
                  style={{ borderColor: step.color }}
                >
                  {/* Progress bar */}
                  <div className="h-1 bg-muted">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: step.color }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-4 pt-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {currentStep + 1} / {TUTORIAL_STEPS.length}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground px-2" onClick={handleClose}>
                      Skip <X className="w-3 h-3 ml-1" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="px-4 pt-3 pb-3">
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={currentStep}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -40 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Icon + Title */}
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${step.color}20` }}
                          >
                            <step.icon className="w-5 h-5" style={{ color: step.color }} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                            {/* Location hint */}
                            <LocationHint step={step} isMobile={isMobile} />
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Step dots - compact */}
                  <div className="flex justify-center gap-1 pb-2">
                    {TUTORIAL_STEPS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setDirection(i > currentStep ? 1 : -1); setCurrentStep(i); }}
                        className="p-0.5"
                      >
                        <motion.div
                          className="rounded-full"
                          animate={{
                            width: i === currentStep ? 16 : 5,
                            height: 5,
                            backgroundColor: i === currentStep ? step.color : 'hsl(var(--muted-foreground) / 0.25)',
                          }}
                          transition={{ duration: 0.25 }}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentStep === 0}
                      onClick={handlePrev}
                      className="h-8"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="h-8 flex-1 text-white"
                      style={{ background: step.color }}
                    >
                      {currentStep === TUTORIAL_STEPS.length - 1 ? (
                        <><Rocket className="w-4 h-4 mr-1" /> Got it!</>
                      ) : (
                        <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/** Small badge showing WHERE the feature lives */
const LocationHint: React.FC<{ step: TutorialStep; isMobile: boolean }> = ({ step, isMobile }) => {
  if (isMobile) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <MapPin className="w-3 h-3" />
        {step.mobileLocation === 'bottom-nav' ? (
          <>Bottom navigation bar</>
        ) : (
          <>Tap <MoreHorizontal className="w-3 h-3 inline mx-0.5" /> <strong>More</strong> in bottom bar</>
        )}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <MapPin className="w-3 h-3" />
      Left sidebar → {step.desktopGroup}
    </span>
  );
};

export default AdminTutorial;
