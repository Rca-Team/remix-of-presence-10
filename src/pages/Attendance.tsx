import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import PageLayout from '@/components/layouts/PageLayout';
import PageTransition from '@/components/PageTransition';
import MultipleAttendanceCapture from '@/components/attendance/MultipleAttendanceCapture';
import AttendanceInstructions from '@/components/attendance/AttendanceInstructions';
import AttendanceToday from '@/components/attendance/AttendanceToday';
import AttendanceStats from '@/components/attendance/AttendanceStats';
import AttendanceGallery from '@/components/attendance/AttendanceGallery';
import FuturisticFaceScanner from '@/components/attendance/FuturisticFaceScanner';
import QRCodeScanner from '@/components/attendance/QRCodeScanner';
import LiveAttendanceFeed from '@/components/attendance/LiveAttendanceFeed';
import QuickStatsPanel from '@/components/attendance/QuickStatsPanel';
import VoiceCommands from '@/components/attendance/VoiceCommands';
import AttendanceMethodToggle from '@/components/attendance/AttendanceMethodToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Users, BarChart3, Info, Grid3x3, Scan, Sparkles, Zap, Activity, Brain, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

const Attendance = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [attendanceMethod, setAttendanceMethod] = useState<'face' | 'qr'>('face');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const tabConfig = [
    { value: 'single', label: 'AI Scanner', shortLabel: 'Scan', icon: Scan, badge: 'Pro' },
    { value: 'multiple', label: 'Multi-Face', shortLabel: 'Multi', icon: Users },
    { value: 'gallery', label: 'Gallery', shortLabel: 'Gallery', icon: Grid3x3 },
    { value: 'stats', label: 'Analytics', shortLabel: 'Stats', icon: BarChart3 },
    { value: 'help', label: 'Help', shortLabel: 'Help', icon: Info },
  ];

  const handleVoiceCommand = (command: string) => {
    const tabMap: Record<string, string> = {
      'scan': 'single',
      'stats': 'stats',
      'gallery': 'gallery',
      'help': 'help'
    };
    if (tabMap[command]) {
      setActiveTab(tabMap[command]);
    }
  };


  return (
    <PageTransition>
      <PageLayout className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Cyber Grid */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
          
          {/* Floating Orbs */}
          <motion.div
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              y: [0, 30, 0],
              opacity: [0.15, 0.3, 0.15]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-purple-500/15 to-pink-500/15 rounded-full blur-3xl"
          />
          
          {/* Scanning Lines */}
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="relative mobile-container py-6 sm:py-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 sm:mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-4 h-4 text-cyan-400" />
                </motion.div>
                <span className="text-sm font-medium text-cyan-400">Neural Recognition Active</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Smart Attendance
                </span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-xl mx-auto">
                Advanced biometric & QR attendance system with real-time AI processing
              </p>
              
              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-4 sm:mt-6"
              >
                {[
                  { icon: Zap, text: '<0.5s Scan', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
                  { icon: Sparkles, text: '99.7% Accuracy', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/30' },
                  { icon: Activity, text: 'Live Processing', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border ${item.bg}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <item.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${item.color}`} />
                    <span className={`text-xs sm:text-sm font-medium ${item.color}`}>{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Quick Stats Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <QuickStatsPanel />
            </motion.div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1 p-1.5 mb-4 sm:mb-6 bg-slate-900/70 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-lg">
                  {tabConfig.map((tab) => (
                    <TabsTrigger 
                      key={tab.value}
                      value={tab.value} 
                      className="relative flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-slate-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 transition-all duration-300"
                    >
                      <tab.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.shortLabel}</span>
                      {tab.badge && (
                        <Badge className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0 bg-gradient-to-r from-purple-500 to-pink-500 border-0 hidden sm:flex">
                          {tab.badge}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </motion.div>

              <AnimatePresence mode="wait">
                <TabsContent value="single" className="space-y-4 sm:space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
                  >
                    <div className="lg:col-span-2 order-2 lg:order-1">
                      <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-xl shadow-cyan-500/5 overflow-hidden">
                        {/* Method Toggle */}
                        <div className="p-3 sm:p-4 border-b border-cyan-500/20">
                          <AttendanceMethodToggle 
                            method={attendanceMethod} 
                            onChange={setAttendanceMethod} 
                          />
                        </div>

                        <div className={`p-3 sm:p-4 border-b border-cyan-500/20 ${
                          attendanceMethod === 'face' 
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600' 
                            : 'bg-gradient-to-r from-purple-600 to-pink-600'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center">
                              {attendanceMethod === 'face' ? (
                                <Scan className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              ) : (
                                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-sm sm:text-base">
                                {attendanceMethod === 'face' ? 'Biometric Scanner' : 'QR Code Scanner'}
                              </h3>
                              <p className="text-xs sm:text-sm text-white/80">
                                {attendanceMethod === 'face' 
                                  ? 'Position your face in the frame' 
                                  : 'Scan your ID card QR code'}
                              </p>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                              <span className="text-xs text-green-300">Online</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 sm:p-6">
                          <AnimatePresence mode="wait">
                            {attendanceMethod === 'face' ? (
                              <motion.div
                                key="face"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                              >
                                <FuturisticFaceScanner />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="qr"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                              >
                                <QRCodeScanner />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Voice Commands */}
                      <div className="mt-4">
                        <VoiceCommands onCommand={handleVoiceCommand} />
                      </div>

                    </div>
                    
                    <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-xl overflow-hidden h-80"
                      >
                        <div className="p-3 border-b border-cyan-500/20 bg-gradient-to-r from-green-600 to-emerald-600">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-white" />
                            <span className="text-sm font-semibold text-white">Live Feed</span>
                          </div>
                        </div>
                        <div className="p-3 h-[calc(100%-48px)]">
                          <LiveAttendanceFeed />
                        </div>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-xl overflow-hidden"
                      >
                        <AttendanceToday />
                      </motion.div>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="multiple" className="space-y-4 sm:space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-xl overflow-hidden">
                      <div className="p-3 sm:p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-600 to-pink-600">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-sm sm:text-base">Multi-Face Detection</h3>
                            <p className="text-xs sm:text-sm text-purple-100">Capture multiple faces at once</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 md:p-6">
                        <MultipleAttendanceCapture />
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="gallery" className="space-y-4 sm:space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-xl overflow-hidden">
                      <div className="p-3 sm:p-4 border-b border-cyan-500/20 bg-gradient-to-r from-blue-600 to-cyan-600">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-sm sm:text-base">Attendance Gallery</h3>
                            <p className="text-xs sm:text-sm text-blue-100">View all captured attendance records</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 md:p-6">
                        <AttendanceGallery />
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="stats" className="space-y-4 sm:space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
                  >
                    <div className="lg:col-span-2 order-2 lg:order-1">
                      <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-green-500/20 shadow-xl overflow-hidden">
                        <div className="p-3 sm:p-4 border-b border-green-500/20 bg-gradient-to-r from-green-600 to-emerald-600">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-sm sm:text-base">Analytics Dashboard</h3>
                              <p className="text-xs sm:text-sm text-green-100">Detailed insights and metrics</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 sm:p-4 md:p-6">
                          <AttendanceStats />
                        </div>
                      </div>
                    </div>
                    
                    <div className="order-1 lg:order-2">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-xl overflow-hidden"
                      >
                        <AttendanceToday />
                      </motion.div>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="help" className="space-y-4 sm:space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-orange-500/20 shadow-xl overflow-hidden">
                      <div className="p-3 sm:p-4 border-b border-orange-500/20 bg-gradient-to-r from-orange-600 to-red-600">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-sm sm:text-base">System Guide</h3>
                            <p className="text-xs sm:text-sm text-orange-100">Learn how to use the system</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 md:p-6">
                        <AttendanceInstructions />
                      </div>
                    </div>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </div>
      </PageLayout>
    </PageTransition>
  );
};

export default Attendance;