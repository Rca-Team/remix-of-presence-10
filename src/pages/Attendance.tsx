import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import PageLayout from '@/components/layouts/PageLayout';
import PageTransition from '@/components/PageTransition';
import MultipleAttendanceCapture from '@/components/attendance/MultipleAttendanceCapture';
import AttendanceInstructions from '@/components/attendance/AttendanceInstructions';
import AttendanceStats from '@/components/attendance/AttendanceStats';
import AttendanceGallery from '@/components/attendance/AttendanceGallery';
import FuturisticFaceScanner from '@/components/attendance/FuturisticFaceScanner';
import QRCodeScanner from '@/components/attendance/QRCodeScanner';
import LiveAttendanceFeed from '@/components/attendance/LiveAttendanceFeed';
import QuickStatsPanel from '@/components/attendance/QuickStatsPanel';
import VoiceCommands from '@/components/attendance/VoiceCommands';
import AttendanceMethodToggle from '@/components/attendance/AttendanceMethodToggle';
import { Camera, Users, BarChart3, Info, Grid3x3, Scan, Sparkles, Zap, Activity, QrCode } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Attendance = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [attendanceMethod, setAttendanceMethod] = useState<'face' | 'qr'>('face');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const tabConfig = [
    { value: 'single', label: 'AI Scanner', shortLabel: 'Scan', icon: Scan },
    { value: 'multiple', label: 'Multi-Face', shortLabel: 'Multi', icon: Users },
    { value: 'gallery', label: 'Gallery', shortLabel: 'Gallery', icon: Grid3x3 },
    { value: 'stats', label: 'Analytics', shortLabel: 'Stats', icon: BarChart3 },
    { value: 'help', label: 'Help', shortLabel: 'Help', icon: Info },
  ];

  const handleVoiceCommand = (command: string) => {
    const tabMap: Record<string, string> = {
      'scan': 'single', 'stats': 'stats', 'gallery': 'gallery', 'help': 'help'
    };
    if (tabMap[command]) setActiveTab(tabMap[command]);
  };

  return (
    <PageTransition>
      <PageLayout className="min-h-screen bg-background">
        {/* Soft animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.12, 0.25, 0.12] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-20 -right-20 w-72 sm:w-[28rem] h-72 sm:h-[28rem] rounded-full blur-[100px]"
            style={{ background: 'hsl(var(--ios-blue) / 0.2)' }}
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -bottom-20 -left-20 w-72 sm:w-[28rem] h-72 sm:h-[28rem] rounded-full blur-[100px]"
            style={{ background: 'hsl(var(--ios-purple) / 0.15)' }}
          />
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.08, 0.16, 0.08] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 sm:w-96 h-60 sm:h-96 rounded-full blur-[100px]"
            style={{ background: 'hsl(var(--ios-green) / 0.1)' }}
          />
        </div>

        <div className="relative px-3 sm:px-4 md:px-6 py-5 sm:py-8 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-5 sm:mb-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3 sm:mb-4"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'hsl(var(--ios-green))' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'hsl(var(--ios-green))' }} />
              </span>
              <span className="text-xs sm:text-sm font-medium text-primary">Recognition Active</span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 text-foreground">
              Smart Attendance
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
              AI-powered face recognition & QR code attendance
            </p>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-3 sm:mt-5"
            >
              {[
                { icon: Zap, text: '<0.5s', color: '--ios-orange' },
                { icon: Sparkles, text: '99.7%', color: '--ios-blue' },
                { icon: Activity, text: 'Live', color: '--ios-green' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon className="w-3.5 h-3.5" style={{ color: `hsl(var(${item.color}))` }} />
                  <span className="text-xs font-semibold" style={{ color: `hsl(var(${item.color}))` }}>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-5 sm:mb-6"
          >
            <QuickStatsPanel />
          </motion.div>

          {/* Tab Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-4 sm:mb-6"
          >
            <div className="flex gap-1 p-1 bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
              {tabConfig.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`relative flex items-center justify-center gap-1.5 sm:gap-2 flex-1 min-w-0 px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeAttendanceTab"
                        className="absolute inset-0 bg-primary rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.shortLabel}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'single' && (
              <motion.div
                key="single"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5"
              >
                {/* Scanner */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-lg overflow-hidden">
                    {/* Method Toggle */}
                    <div className="p-3 sm:p-4 border-b border-border/50">
                      <AttendanceMethodToggle method={attendanceMethod} onChange={setAttendanceMethod} />
                    </div>

                    {/* Scanner Header */}
                    <div
                      className="p-3 sm:p-4 flex items-center gap-3"
                      style={{
                        background: attendanceMethod === 'face'
                          ? 'linear-gradient(135deg, hsl(var(--ios-blue)), hsl(var(--primary)))'
                          : 'linear-gradient(135deg, hsl(var(--ios-purple)), hsl(var(--ios-pink)))',
                      }}
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        {attendanceMethod === 'face' ? (
                          <Scan className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        ) : (
                          <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm sm:text-base">
                          {attendanceMethod === 'face' ? 'Biometric Scanner' : 'QR Code Scanner'}
                        </h3>
                        <p className="text-xs sm:text-sm text-white/70">
                          {attendanceMethod === 'face' ? 'Position your face in frame' : 'Scan your ID card QR code'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'hsl(var(--ios-green))' }} />
                          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'hsl(var(--ios-green))' }} />
                        </span>
                        <span className="text-xs text-white/80">Live</span>
                      </div>
                    </div>

                    {/* Scanner Body */}
                    <div className="p-3 sm:p-5">
                      <AnimatePresence mode="wait">
                        {attendanceMethod === 'face' ? (
                          <motion.div key="face" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <FuturisticFaceScanner />
                          </motion.div>
                        ) : (
                          <motion.div key="qr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <QRCodeScanner />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Voice Commands */}
                  <VoiceCommands
                    onCommand={handleVoiceCommand}
                    onStartScan={() => toast({ title: 'Starting Scan', description: 'Voice command activated face scanning' })}
                    onStopScan={() => toast({ title: 'Scan Stopped', description: 'Voice command stopped the scanner' })}
                    onConfirmAttendance={() => toast({ title: 'Attendance Confirmed', description: 'Voice command confirmed attendance' })}
                  />
                </div>

                {/* Live Feed Sidebar */}
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-lg overflow-hidden"
                    style={{ height: isMobile ? '320px' : 'calc(100vh - 520px)', minHeight: '300px', maxHeight: '520px' }}
                  >
                    <div
                      className="p-3 flex items-center gap-2"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--ios-green)), hsl(var(--emerald)))' }}
                    >
                      <Activity className="w-4 h-4 text-white" />
                      <span className="text-sm font-semibold text-white">Live Feed</span>
                      <span className="relative flex h-2 w-2 ml-auto">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                    </div>
                    <div className="p-3 h-[calc(100%-44px)] overflow-auto">
                      <LiveAttendanceFeed />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === 'multiple' && (
              <motion.div key="multiple" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-lg overflow-hidden">
                  <div className="p-3 sm:p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, hsl(var(--ios-purple)), hsl(var(--ios-pink)))' }}>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm sm:text-base">Multi-Face Detection</h3>
                      <p className="text-xs sm:text-sm text-white/70">Capture multiple faces at once</p>
                    </div>
                  </div>
                  <div className="p-3 sm:p-5">
                    <MultipleAttendanceCapture />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'gallery' && (
              <motion.div key="gallery" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-lg overflow-hidden">
                  <div className="p-3 sm:p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, hsl(var(--ios-blue)), hsl(var(--cyan)))' }}>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm sm:text-base">Attendance Gallery</h3>
                      <p className="text-xs sm:text-sm text-white/70">View all captured records</p>
                    </div>
                  </div>
                  <div className="p-3 sm:p-5">
                    <AttendanceGallery />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5"
              >
                <div className="lg:col-span-2">
                  <div className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-lg overflow-hidden">
                    <div className="p-3 sm:p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, hsl(var(--ios-green)), hsl(var(--emerald)))' }}>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm sm:text-base">Analytics Dashboard</h3>
                        <p className="text-xs sm:text-sm text-white/70">Insights and metrics</p>
                      </div>
                    </div>
                    <div className="p-3 sm:p-5">
                      <AttendanceStats />
                    </div>
                  </div>
                </div>
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-lg overflow-hidden h-80"
                  >
                    <div className="p-3 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, hsl(var(--ios-green)), hsl(var(--emerald)))' }}>
                      <Activity className="w-4 h-4 text-white" />
                      <span className="text-sm font-semibold text-white">Live Feed</span>
                    </div>
                    <div className="p-3 h-[calc(100%-44px)]">
                      <LiveAttendanceFeed />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === 'help' && (
              <motion.div key="help" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-lg overflow-hidden">
                  <div className="p-3 sm:p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, hsl(var(--ios-orange)), hsl(var(--ios-red)))' }}>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm sm:text-base">System Guide</h3>
                      <p className="text-xs sm:text-sm text-white/70">Learn how to use the system</p>
                    </div>
                  </div>
                  <div className="p-3 sm:p-5">
                    <AttendanceInstructions />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageLayout>
    </PageTransition>
  );
};

export default Attendance;
