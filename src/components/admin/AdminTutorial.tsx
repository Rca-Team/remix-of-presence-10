import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, FolderKanban, Users, Calendar, UserPlus, Image,
  FileText, CreditCard, BarChart3, UserCog, Bell, MessageSquareText,
  Mail, Siren, Settings, X, ChevronRight, ChevronLeft, Sparkles,
  HelpCircle, Zap, Rocket,
} from 'lucide-react';

interface TutorialStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  glowColor: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Your command center — see live attendance stats, real-time activity feeds, today\'s present/late/absent counts, and AI-powered insights all in one glance.',
    color: 'hsl(var(--primary))',
    glowColor: 'hsl(var(--primary) / 0.3)',
  },
  {
    id: 'sections',
    icon: FolderKanban,
    title: 'Class & Section Management',
    description: 'View and manage all classes and sections. Assign class teachers and subject teachers, set up period-wise timetables, and auto-assign substitute teachers when someone is absent.',
    color: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.3)',
  },
  {
    id: 'students',
    icon: Users,
    title: 'Student Directory',
    description: 'Browse all registered students with their face photos, names, and IDs. Click any student to view their detailed attendance calendar and history.',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.3)',
  },
  {
    id: 'calendar',
    icon: Calendar,
    title: 'Attendance Calendar',
    description: 'A visual monthly calendar showing daily attendance status (present, late, absent) for any selected student. Track patterns and streaks at a glance.',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  {
    id: 'register',
    icon: UserPlus,
    title: 'Quick Registration',
    description: 'Register new students instantly using a multi-angle face scan. Captures 5 different angles for maximum recognition accuracy during attendance.',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.3)',
  },
  {
    id: 'bulk',
    icon: Users,
    title: 'Bulk Registration',
    description: 'Register multiple students at once using class photos or batch image uploads. The system detects and separates individual faces automatically.',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.3)',
  },
  {
    id: 'idcard',
    icon: Image,
    title: 'ID Card Extraction',
    description: 'Upload student ID card images and the AI will automatically extract the student\'s face photo, name, and ID number for quick registration.',
    color: '#14b8a6',
    glowColor: 'rgba(20, 184, 166, 0.3)',
  },
  {
    id: 'pdf',
    icon: FileText,
    title: 'PDF Import',
    description: 'Import student data from PDF documents like admission lists or school records. The system extracts names, IDs, and other details automatically.',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.3)',
  },
  {
    id: 'idcards',
    icon: CreditCard,
    title: 'ID Card Generator',
    description: 'Generate professional student ID cards with photos, QR codes, and school branding. Print-ready cards for all students in any class.',
    color: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.3)',
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Generate class-wise, section-wise, and individual attendance reports with visual charts, progress bars, and export to print-ready PDFs.',
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.3)',
  },
  {
    id: 'access',
    icon: UserCog,
    title: 'User Access & Roles',
    description: 'Manage user roles (Admin, Principal, Teacher). Grant teachers permission to take attendance for specific classes and view reports.',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.3)',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Send targeted notifications to parents via email, WhatsApp, and SMS. Use AI auto-fill to generate personalized messages for each student.',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.3)',
  },
  {
    id: 'notif-log',
    icon: MessageSquareText,
    title: 'Delivery Log',
    description: 'Track all sent notifications in real-time. See delivery status (sent, failed, pending) for every WhatsApp, email, and SMS message.',
    color: '#0ea5e9',
    glowColor: 'rgba(14, 165, 233, 0.3)',
  },
  {
    id: 'inbox',
    icon: Mail,
    title: 'Admin Inbox',
    description: 'View emails sent to the school\'s admission address. All incoming messages are captured and displayed here with real-time updates.',
    color: '#64748b',
    glowColor: 'rgba(100, 116, 139, 0.3)',
  },
  {
    id: 'emergency',
    icon: Siren,
    title: 'Emergency Alerts',
    description: 'Broadcast emergency alerts (fire, lockdown, earthquake, etc.) to ALL devices with the app installed. Triggers alarms even when the app is closed.',
    color: '#dc2626',
    glowColor: 'rgba(220, 38, 38, 0.3)',
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings',
    description: 'Configure attendance cutoff time, auto-notification schedules, and send absence alerts to parents and teachers after the cutoff period.',
    color: '#78716c',
    glowColor: 'rgba(120, 113, 108, 0.3)',
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

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setTimeout(() => setIsOpen(true), 1500);
    }
  }, []);

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

  const handleTryIt = useCallback(() => {
    const step = TUTORIAL_STEPS[currentStep];
    onNavigate(step.id);
    handleClose();
  }, [currentStep, onNavigate]);

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={handleClose}
            />

            {/* Animated grid background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, ${step.glowColor} 0%, transparent 50%)`,
                transition: 'background-image 0.5s ease',
              }} />
              {/* Scan lines */}
              <motion.div
                className="absolute left-0 right-0 h-px opacity-20"
                style={{ background: step.color }}
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-[90vw] max-w-lg mx-auto"
            >
              {/* Outer glow ring */}
              <div
                className="absolute -inset-1 rounded-2xl opacity-50 blur-lg transition-all duration-500"
                style={{ background: `linear-gradient(135deg, ${step.color}, transparent)` }}
              />

              <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-2xl">
                {/* Progress bar */}
                <div className="h-1 bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: step.color }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>

                {/* Header with step counter + skip */}
                <div className="flex items-center justify-between px-5 pt-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={handleClose}>
                    Skip Tutorial <X className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                {/* Content */}
                <div className="px-5 pt-4 pb-5">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={currentStep}
                      custom={direction}
                      initial={{ opacity: 0, x: direction * 60 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction * -60 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="space-y-4"
                    >
                      {/* Icon */}
                      <div className="flex justify-center">
                        <motion.div
                          className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                          style={{ background: `${step.color}15` }}
                          animate={{
                            boxShadow: [
                              `0 0 0 0px ${step.glowColor}`,
                              `0 0 0 12px transparent`,
                            ],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          {/* Orbiting particle */}
                          <motion.div
                            className="absolute w-2 h-2 rounded-full"
                            style={{ background: step.color }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                          >
                            <motion.div
                              className="absolute -top-8 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                              style={{ background: step.color, opacity: 0.6 }}
                            />
                          </motion.div>

                          <step.icon className="w-9 h-9" style={{ color: step.color }} />
                        </motion.div>
                      </div>

                      {/* Title */}
                      <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Step dots */}
                <div className="flex justify-center gap-1.5 pb-4">
                  {TUTORIAL_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setDirection(i > currentStep ? 1 : -1); setCurrentStep(i); }}
                      className="p-0.5"
                    >
                      <motion.div
                        className="rounded-full transition-colors"
                        animate={{
                          width: i === currentStep ? 20 : 6,
                          height: 6,
                          backgroundColor: i === currentStep ? step.color : 'hsl(var(--muted-foreground) / 0.3)',
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentStep === 0}
                    onClick={handlePrev}
                    className="h-9"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTryIt}
                    className="h-9 flex-1"
                    style={{ borderColor: step.color, color: step.color }}
                  >
                    <Zap className="w-3.5 h-3.5 mr-1" /> Try It Now
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="h-9 flex-1"
                    style={{ background: step.color }}
                  >
                    {currentStep === TUTORIAL_STEPS.length - 1 ? (
                      <><Rocket className="w-4 h-4 mr-1" /> Finish</>
                    ) : (
                      <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminTutorial;
