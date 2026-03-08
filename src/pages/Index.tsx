import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layouts/PageLayout';
import PageTransition from '@/components/PageTransition';
import { 
  Sparkles, 
  Shield, 
  Zap, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Scan, 
  Clock, 
  BarChart3, 
  Smartphone, 
  GraduationCap, 
  Bell 
} from 'lucide-react';

const Index = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const features = [
    {
      icon: Scan,
      title: "AI Face Recognition",
      description: "Advanced neural networks detect and verify faces in milliseconds",
      gradient: "from-ios-blue to-ios-purple",
      glow: "glow-ios-blue"
    },
    {
      icon: Clock,
      title: "Real-time Tracking",
      description: "Instant attendance updates with live dashboard monitoring",
      gradient: "from-ios-green to-ios-mint",
      glow: "glow-ios-green"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Deep insights with AI-powered attendance pattern analysis",
      gradient: "from-ios-purple to-violet",
      glow: "glow-ios-purple"
    },
    {
      icon: Bell,
      title: "Auto Notifications",
      description: "Instant alerts to parents when students check in or out",
      gradient: "from-ios-orange to-ios-yellow",
      glow: "glow-ios-orange"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade encryption protects all biometric data",
      gradient: "from-indigo to-ios-purple",
      glow: "glow-violet"
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Works seamlessly on any device, anywhere, anytime",
      gradient: "from-ios-mint to-ios-blue",
      glow: "glow-cyan"
    }
  ];

  const stats = [
    { value: "99.9%", label: "Accuracy Rate" },
    { value: "<1s", label: "Recognition Speed" },
    { value: "500+", label: "Schools Trust Us" },
    { value: "1M+", label: "Faces Registered" }
  ];

  return (
    <PageTransition>
      <PageLayout className="overflow-hidden has-bottom-nav md:pb-0">
        {/* Animated Background Elements - iOS-inspired vibrant orbs */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-48 sm:w-64 md:w-[500px] h-48 sm:h-64 md:h-[500px] bg-ios-blue/30 rounded-full blur-[80px]" 
          />
          <motion.div 
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.25, 0.15, 0.25] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-40 sm:w-60 md:w-[400px] h-40 sm:h-60 md:h-[400px] bg-ios-purple/30 rounded-full blur-[80px]" 
          />
          <motion.div 
            animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/2 left-0 w-32 sm:w-48 md:w-[350px] h-32 sm:h-48 md:h-[350px] bg-ios-pink/25 rounded-full blur-[80px]" 
          />
          <motion.div 
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute top-1/4 right-0 w-40 sm:w-56 md:w-[380px] h-40 sm:h-56 md:h-[380px] bg-ios-green/25 rounded-full blur-[80px]" 
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-0 left-1/2 w-64 md:w-[450px] h-64 md:h-[450px] bg-ios-orange/20 rounded-full blur-[100px]" 
          />
        </div>

        {/* Hero Section - Mobile-first optimized */}
        <section className="relative min-h-[calc(100vh-8rem)] sm:min-h-[90vh] flex items-center py-6 sm:py-8 md:py-16">
          <motion.div 
            className="w-full" 
            initial="hidden" 
            animate="visible" 
            variants={containerVariants}
          >
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">
              {/* Left Content - Mobile optimized */}
              <div className="space-y-4 sm:space-y-6 md:space-y-8 text-center lg:text-left">
                <motion.div variants={itemVariants} className="flex justify-center lg:justify-start">
                  <span className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-ios-blue/15 to-ios-purple/15 border border-ios-blue/30 text-xs sm:text-sm font-semibold text-ios-blue backdrop-blur-xl shadow-lg shadow-ios-blue/10">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse-subtle" />
                    AI-Powered Attendance
                  </span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  <span className="block">Attendance</span>
                  <span className="block text-gradient-ios bg-clip-text text-transparent bg-gradient-to-r from-ios-blue via-ios-purple to-ios-pink">
                    Reimagined
                  </span>
                </motion.h1>

                <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed px-4 sm:px-0">
                  Transform your attendance management with cutting-edge facial recognition technology. Fast, accurate, and secure.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start px-4 sm:px-0">
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button variant="ios" size="lg" className="group w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base touch-target">
                      Register Now   
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/parent-portal" className="w-full sm:w-auto">
                    <Button variant="ios-green" size="lg" className="group w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base touch-target">
                      <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Parent Portal
                    </Button>
                  </Link>
                  <Link to="/dashboard" className="w-full sm:w-auto">
                    <Button size="lg" variant="ios-glass" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base touch-target">
                      View Demo
                    </Button>
                  </Link>
                </motion.div>

                {/* Trust Badges - Responsive */}
                <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 pt-2 sm:pt-4 px-4 sm:px-0">
                  {["GDPR Compliant", "SOC 2", "256-bit Encryption"].map((badge, i) => (
                    <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      {badge}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right Content - 3D Card - Hidden on small mobile, visible on larger screens */}
              <motion.div variants={itemVariants} className="relative hidden sm:block">
                <div className="relative group">
                  {/* Glow Effect */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-primary/30 to-accent/30 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Main Card */}
                  <div className="relative bg-gradient-to-br from-background via-background to-muted border border-primary/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
                    {/* Top Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-accent rounded-t-2xl sm:rounded-t-3xl" />
                    
                    {/* Face Scan Animation */}
                    <div className="relative aspect-square max-w-[200px] sm:max-w-xs md:max-w-sm mx-auto mb-4 sm:mb-6">
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10" />
                      
                      {/* Scanning Lines */}
                      <motion.div 
                        animate={{ y: [0, 200, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                      />
                      <div className="absolute inset-4 rounded-lg sm:rounded-xl border-2 border-dashed border-primary/30" />
                      <div className="absolute inset-6 sm:inset-8 rounded-lg border border-primary/40" />
                      
                      {/* Center Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div 
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50" />
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
                            <Scan className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 text-primary" />
                          </div>
                        </motion.div>
                      </div>

                      {/* Corner Markers */}
                      <div className="absolute top-4 left-4 w-6 h-6 sm:w-8 sm:h-8 border-l-2 border-t-2 border-primary rounded-tl-lg" />
                      <div className="absolute top-4 right-4 w-6 h-6 sm:w-8 sm:h-8 border-r-2 border-t-2 border-primary rounded-tr-lg" />
                      <div className="absolute bottom-4 left-4 w-6 h-6 sm:w-8 sm:h-8 border-l-2 border-b-2 border-accent rounded-bl-lg" />
                      <div className="absolute bottom-4 right-4 w-6 h-6 sm:w-8 sm:h-8 border-r-2 border-b-2 border-accent rounded-br-lg" />
                    </div>

                    {/* Status */}
                    <div className="text-center space-y-2">
                      <motion.div 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium"
                      >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Ready to Scan
                      </motion.div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Position face within the frame
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Stats Section - Mobile optimized */}
        <section className="py-8 sm:py-12 md:py-20">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8" 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }} 
            variants={containerVariants}
          >
            {stats.map((stat, i) => {
              const colors = ['ios-blue', 'ios-green', 'ios-purple', 'ios-pink'];
              const color = colors[i % colors.length];
              return (
                <motion.div 
                  key={i} 
                  variants={itemVariants} 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`relative group text-center p-5 sm:p-6 md:p-8 rounded-3xl bg-card/80 backdrop-blur-xl border border-${color}/20 hover:border-${color}/50 shadow-lg hover:shadow-2xl touch-target overflow-hidden`}
                  style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  {/* Gradient glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-${color}/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${color}/30 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
                  
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                    className="relative text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-ios-blue via-ios-purple to-ios-pink"
                  >
                    {stat.value}
                  </motion.div>
                  <div className="relative mt-2 sm:mt-3 text-sm sm:text-base font-medium text-muted-foreground">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-24">
          <motion.div 
            className="text-center mb-12 md:mb-16" 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }} 
            variants={containerVariants}
          >
            <motion.span variants={itemVariants} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-ios-purple/15 to-ios-pink/15 border border-ios-purple/30 text-ios-purple text-sm font-semibold mb-6 shadow-lg shadow-ios-purple/10">
              <Zap className="w-4 h-4" />
              Powerful Features
            </motion.span>
            <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-muted-foreground">
              Everything You Need
            </motion.h2>
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete attendance solution designed for modern educational institutions
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }} 
            variants={containerVariants}
          >
            {features.map((feature, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants} 
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative p-6 md:p-8 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/50 hover:border-ios-blue/30 shadow-lg hover:shadow-2xl overflow-hidden"
                style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                {/* Multi-color top accent */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${feature.gradient} rounded-t-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Background glow */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700`} />
                
                <div className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-5 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="relative text-xl font-bold mb-3">{feature.title}</h3>
                <p className="relative text-muted-foreground leading-relaxed">{feature.description}</p>
                
                {/* Bottom gradient line on hover */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-24">
          <motion.div 
            className="relative overflow-hidden rounded-3xl bg-gradient-aurora p-8 md:p-16" 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }} 
            variants={containerVariants}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '32px 32px'
              }} />
            </div>

            <div className="relative text-center max-w-3xl mx-auto">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                <GraduationCap className="w-4 h-4" />
                Join 500+ Schools
              </motion.div>
              
              <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Transform Your School?
              </motion.h2>
              
              <motion.p variants={itemVariants} className="text-lg text-white/80 mb-8">
                Start using Presence today and experience the future of attendance management. 
                No credit card required.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="h-14 px-8 text-base bg-background text-foreground hover:bg-background/90 shadow-lg">
                    Register Now — It's Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Contact Sales
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
