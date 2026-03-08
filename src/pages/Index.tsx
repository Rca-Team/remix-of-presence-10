import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layouts/PageLayout';
import PageTransition from '@/components/PageTransition';
import { 
  Sparkles, Shield, Zap, Users, CheckCircle2, ArrowRight, Scan, Clock, 
  BarChart3, Smartphone, GraduationCap, Bell, BookOpen, Bus, MapPin,
  Camera, FileText, AlertTriangle, UserCheck, CalendarDays, Award,
  MessageSquare, Fingerprint, DoorOpen, ClipboardList, Brain, Heart,
  Building2, Globe, Lock, Layers, ChevronRight, Star
} from 'lucide-react';

const Index = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const featureCategories = [
    {
      category: "AI-Powered Attendance",
      icon: Scan,
      gradient: "from-ios-blue to-ios-purple",
      features: [
        { icon: Camera, title: "Face Recognition", desc: "Millisecond facial detection with 99.9% accuracy using deep neural networks" },
        { icon: Users, title: "Multi-Face Scanning", desc: "Recognize multiple students simultaneously in classroom or assembly mode" },
        { icon: DoorOpen, title: "Gate Mode", desc: "Kiosk-style continuous scanning at school entrances with stranger detection" },
        { icon: Clock, title: "Auto Cutoff Alerts", desc: "Automatic absence notifications to parents & teachers after daily cutoff time" },
      ]
    },
    {
      category: "Timetable & Teachers",
      icon: BookOpen,
      gradient: "from-ios-green to-ios-mint",
      features: [
        { icon: CalendarDays, title: "Smart Timetable", desc: "8-period daily timetable management for Mon-Sat with subject assignments" },
        { icon: UserCheck, title: "Auto Substitution", desc: "AI detects absent teachers and auto-assigns substitutes from free periods" },
        { icon: ClipboardList, title: "Teacher Permissions", desc: "Granular class-section access control for teachers to mark attendance" },
        { icon: FileText, title: "Substitution Reports", desc: "Printable daily reports with complete substitute teacher assignments" },
      ]
    },
    {
      category: "Student Management",
      icon: GraduationCap,
      gradient: "from-ios-purple to-violet",
      features: [
        { icon: Layers, title: "Class 6-12 Structure", desc: "Organized by classes & sections (A-D) with category-based filtering" },
        { icon: Fingerprint, title: "Bulk Registration", desc: "Register 1000+ students via PDF imports, ID card scanning, or batch photos" },
        { icon: Award, title: "Gamification", desc: "Badges, points, and class leaderboards to reward consistent attendance" },
        { icon: Heart, title: "Wellness Scores", desc: "Track student wellbeing through attendance, punctuality & emotion metrics" },
      ]
    },
    {
      category: "Safety & Security",
      icon: Shield,
      gradient: "from-ios-red to-ios-orange",
      features: [
        { icon: AlertTriangle, title: "Emergency Alerts", desc: "Instant lockdown, fire & earthquake alerts with sirens across all devices" },
        { icon: UserCheck, title: "Visitor Management", desc: "Face recognition & QR badge system for visitor check-in/check-out" },
        { icon: MapPin, title: "Zone Monitoring", desc: "Track student movement across campus zones with restricted area alerts" },
        { icon: Lock, title: "Stranger Detection", desc: "Real-time alerts when unregistered faces are detected at school gates" },
      ]
    },
    {
      category: "Parent & Communication",
      icon: MessageSquare,
      gradient: "from-ios-orange to-ios-yellow",
      features: [
        { icon: Bell, title: "Smart Notifications", desc: "AI-personalized alerts via SMS, WhatsApp & email to parents" },
        { icon: Globe, title: "Parent Portal", desc: "Dedicated portal for parents to view attendance, reports & announcements" },
        { icon: FileText, title: "Digital Circulars", desc: "School-to-parent communication with acknowledgment tracking" },
        { icon: Bus, title: "Bus Tracking", desc: "Monitor student boarding & alighting with parent notifications" },
      ]
    },
    {
      category: "Analytics & Reports",
      icon: BarChart3,
      gradient: "from-ios-mint to-ios-blue",
      features: [
        { icon: Brain, title: "AI Insights", desc: "Predictive absence analysis with risk levels and intervention suggestions" },
        { icon: BarChart3, title: "Advanced Reports", desc: "Class-wise, student-wise & trend reports with PDF export" },
        { icon: Building2, title: "Principal Dashboard", desc: "Real-time school-wide monitoring with live activity feeds" },
        { icon: CalendarDays, title: "Holiday Calendar", desc: "Indian academic calendar with state-wise holidays and half-days" },
      ]
    },
  ];

  const stats = [
    { value: "99.9%", label: "Face Accuracy" },
    { value: "<1s", label: "Recognition Speed" },
    { value: "1000+", label: "Bulk Registration" },
    { value: "24/7", label: "Smart Monitoring" }
  ];

  return (
    <PageTransition>
      <PageLayout className="overflow-hidden has-bottom-nav md:pb-0">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.35, 0.2] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-48 sm:w-64 md:w-[500px] h-48 sm:h-64 md:h-[500px] bg-ios-blue/30 rounded-full blur-[80px]" />
          <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.25, 0.15, 0.25] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-40 sm:w-60 md:w-[400px] h-40 sm:h-60 md:h-[400px] bg-ios-purple/30 rounded-full blur-[80px]" />
          <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/2 left-0 w-32 sm:w-48 md:w-[350px] h-32 sm:h-48 md:h-[350px] bg-ios-pink/25 rounded-full blur-[80px]" />
          <motion.div animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute top-1/4 right-0 w-40 sm:w-56 md:w-[380px] h-40 sm:h-56 md:h-[380px] bg-ios-green/25 rounded-full blur-[80px]" />
        </div>

        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-[calc(100vh-8rem)] sm:min-h-[90vh] flex items-center py-6 sm:py-8 md:py-16">
          <motion.div className="w-full" initial="hidden" animate="visible" variants={containerVariants}>
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">
              <div className="space-y-4 sm:space-y-6 md:space-y-8 text-center lg:text-left">
                <motion.div variants={itemVariants} className="flex justify-center lg:justify-start">
                  <span className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-ios-blue/15 to-ios-purple/15 border border-ios-blue/30 text-xs sm:text-sm font-semibold text-ios-blue backdrop-blur-xl shadow-lg shadow-ios-blue/10">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse-subtle" />
                    Complete School Automation
                  </span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  <span className="block">Your School,</span>
                  <span className="block text-gradient-ios bg-clip-text text-transparent bg-gradient-to-r from-ios-blue via-ios-purple to-ios-pink">
                    Fully Automated
                  </span>
                </motion.h1>

                <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed px-4 sm:px-0">
                  From face-recognition attendance to timetable management, gate security, parent communication, and AI analytics — everything your school needs in one platform.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start px-4 sm:px-0">
                  <Link to="/signup" className="w-full sm:w-auto">
                    <Button variant="ios" size="lg" className="group w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base touch-target">
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/parent" className="w-full sm:w-auto">
                    <Button variant="ios-green" size="lg" className="group w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base touch-target">
                      <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Parent Portal
                    </Button>
                  </Link>
                  <Link to="/login" className="w-full sm:w-auto">
                    <Button size="lg" variant="ios-glass" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base touch-target">
                      Sign In
                    </Button>
                  </Link>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 pt-2 sm:pt-4 px-4 sm:px-0">
                  {["AI Powered", "Real-time Alerts", "Parent Portal", "100% Secure"].map((badge, i) => (
                    <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      {badge}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Hero Visual */}
              <motion.div variants={itemVariants} className="relative hidden sm:block">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-primary/30 to-accent/30 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-gradient-to-br from-background via-background to-muted border border-primary/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-accent rounded-t-2xl sm:rounded-t-3xl" />
                    
                    {/* Module Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { icon: Scan, label: "Attendance", color: "text-ios-blue" },
                        { icon: BookOpen, label: "Timetable", color: "text-ios-green" },
                        { icon: Shield, label: "Security", color: "text-ios-red" },
                        { icon: Bell, label: "Alerts", color: "text-ios-orange" },
                        { icon: BarChart3, label: "Analytics", color: "text-ios-purple" },
                        { icon: Bus, label: "Transport", color: "text-ios-mint" },
                      ].map((mod, i) => (
                        <motion.div 
                          key={i}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm"
                        >
                          <mod.icon className={`w-6 h-6 ${mod.color}`} />
                          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">{mod.label}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Live Status */}
                    <div className="text-center space-y-2">
                      <motion.div 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium"
                      >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        All Systems Active
                      </motion.div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        6 modules running • Real-time sync
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ===== STATS ===== */}
        <section className="py-8 sm:py-12 md:py-20">
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants}>
            {stats.map((stat, i) => {
              const colors = ['ios-blue', 'ios-green', 'ios-purple', 'ios-pink'];
              const color = colors[i % colors.length];
              return (
                <motion.div key={i} variants={itemVariants} whileHover={{ scale: 1.05, y: -5 }}
                  className={`relative group text-center p-5 sm:p-6 md:p-8 rounded-3xl bg-card/80 backdrop-blur-xl border border-${color}/20 hover:border-${color}/50 shadow-lg hover:shadow-2xl touch-target overflow-hidden`}
                  style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-${color}/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                  <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                    className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-ios-blue via-ios-purple to-ios-pink">
                    {stat.value}
                  </motion.div>
                  <div className="relative mt-2 sm:mt-3 text-sm sm:text-base font-medium text-muted-foreground">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ===== ALL FEATURES BY CATEGORY ===== */}
        {featureCategories.map((cat, catIdx) => (
          <section key={catIdx} className="py-12 md:py-20">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={containerVariants}>
              {/* Category Header */}
              <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8 md:mb-12">
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${cat.gradient} shadow-xl`}>
                  <cat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">{cat.category}</h2>
                </div>
              </motion.div>

              {/* Feature Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {cat.features.map((feature, i) => (
                  <motion.div key={i} variants={itemVariants} whileHover={{ y: -8, scale: 1.02 }}
                    className="group relative p-5 md:p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 hover:border-primary/30 shadow-lg hover:shadow-2xl overflow-hidden"
                    style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cat.gradient} rounded-t-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className={`absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br ${cat.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700`} />
                    
                    <div className={`relative inline-flex p-3 rounded-xl bg-gradient-to-br ${cat.gradient} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <h3 className="relative text-base font-bold mb-2">{feature.title}</h3>
                    <p className="relative text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${cat.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>
        ))}

        {/* ===== WHY PRESENCE ===== */}
        <section className="py-12 md:py-24">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants}>
            <motion.div variants={itemVariants} className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-ios-green/15 to-ios-mint/15 border border-ios-green/30 text-ios-green text-sm font-semibold mb-6 shadow-lg">
                <Star className="w-4 h-4" />
                Why Choose Presence
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">One Platform, Complete Automation</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Replace 10+ separate tools with one intelligent system that connects every aspect of school operations.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: "Instant Setup", desc: "Register students in bulk, configure timetable, and go live in under an hour", gradient: "from-ios-yellow to-ios-orange" },
                { icon: Brain, title: "AI-First Design", desc: "From face recognition to absence prediction — AI automates the heavy lifting", gradient: "from-ios-purple to-violet" },
                { icon: Smartphone, title: "Works Everywhere", desc: "PWA that works on any device — phones, tablets, kiosks, even offline", gradient: "from-ios-blue to-ios-mint" },
              ].map((item, i) => (
                <motion.div key={i} variants={itemVariants} whileHover={{ y: -5 }}
                  className="relative p-8 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg text-center"
                >
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.gradient} mb-5 shadow-xl`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ===== CTA ===== */}
        <section className="py-12 md:py-24">
          <motion.div className="relative overflow-hidden rounded-3xl bg-gradient-aurora p-8 md:p-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '32px 32px'
              }} />
            </div>
            <div className="relative text-center max-w-3xl mx-auto">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                <GraduationCap className="w-4 h-4" />
                Smart School Platform
              </motion.div>
              <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Automate Your School?
              </motion.h2>
              <motion.p variants={itemVariants} className="text-lg text-white/80 mb-8">
                Join schools already using Presence for complete automation — attendance, timetable, security, communication & more. No credit card required.
              </motion.p>
              <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="h-14 px-8 text-base bg-background text-foreground hover:bg-background/90 shadow-lg">
                    Get Started — It's Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Contact Us
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </PageLayout>
    </PageTransition>
  );
};

export default Index;
