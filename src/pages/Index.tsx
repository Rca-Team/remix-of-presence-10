import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layouts/PageLayout';
import PageTransition from '@/components/PageTransition';
import { Sparkles, Shield, Zap, Users, CheckCircle2, ArrowRight, Scan, Clock, BarChart3, Smartphone, GraduationCap, Bell } from 'lucide-react';
const Index = () => {
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0
    }
  };
  const features = [{
    icon: Scan,
    title: "AI Face Recognition",
    description: "Advanced neural networks detect and verify faces in milliseconds",
    gradient: "from-blue-500 to-blue-600"
  }, {
    icon: Clock,
    title: "Real-time Tracking",
    description: "Instant attendance updates with live dashboard monitoring",
    gradient: "from-cyan-500 to-blue-500"
  }, {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Deep insights with AI-powered attendance pattern analysis",
    gradient: "from-blue-600 to-indigo-600"
  }, {
    icon: Bell,
    title: "Auto Notifications",
    description: "Instant alerts to parents when students check in or out",
    gradient: "from-sky-500 to-blue-500"
  }, {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption protects all biometric data",
    gradient: "from-indigo-500 to-blue-600"
  }, {
    icon: Smartphone,
    title: "Mobile First",
    description: "Works seamlessly on any device, anywhere, anytime",
    gradient: "from-blue-500 to-cyan-500"
  }];
  const stats = [{
    value: "99.9%",
    label: "Accuracy Rate"
  }, {
    value: "<1s",
    label: "Recognition Speed"
  }, {
    value: "500+",
    label: "Schools Trust Us"
  }, {
    value: "1M+",
    label: "Faces Registered"
  }];
  return <PageTransition>
      <PageLayout className="overflow-hidden">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <motion.div animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2]
        }} transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }} className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full blur-3xl" />
          <motion.div animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.2, 0.3]
        }} transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }} className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-500/10 rounded-full blur-3xl" />
          <motion.div animate={{
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.25, 0.15]
        }} transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }} className="absolute top-1/2 left-0 w-64 h-64 bg-gradient-to-br from-sky-500/15 to-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center py-8 md:py-16">
          <motion.div className="w-full" initial="hidden" animate="visible" variants={containerVariants}>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left Content */}
              <div className="space-y-6 md:space-y-8">
                <motion.div variants={itemVariants}>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 text-sm font-medium text-blue-600 dark:text-blue-400">
                    <Sparkles className="w-4 h-4" />
                    AI-Powered Attendance System
                  </span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="block">Attendance</span>
                  <span className="block bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    Reimagined
                  </span>
                </motion.h1>

                <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                  Transform your attendance management with cutting-edge facial recognition technology. Fast, accurate, and secure.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                  <Link to="/register">
                    <Button size="lg" className="group h-14 px-8 text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300">
                      Register Now   
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-base border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                      View Demo
                    </Button>
                  </Link>
                </motion.div>

                {/* Trust Badges */}
                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-6 pt-4">
                  {["GDPR Compliant", "SOC 2 Certified", "256-bit Encryption"].map((badge, i) => {})}
                </motion.div>
              </div>

              {/* Right Content - 3D Card */}
              <motion.div variants={itemVariants} className="relative">
                <div className="relative group">
                  {/* Glow Effect */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 via-blue-400/30 to-cyan-500/30 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Main Card */}
                  <div className="relative bg-gradient-to-br from-background via-background to-muted border border-blue-200/50 dark:border-blue-800/50 rounded-3xl p-8 shadow-2xl">
                    {/* Top Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-t-3xl" />
                    
                    {/* Face Scan Animation */}
                    <div className="relative aspect-square max-w-sm mx-auto mb-6">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
                      
                      {/* Scanning Lines */}
                      <motion.div animate={{
                      y: [0, 200, 0]
                    }} transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }} className="absolute inset-x-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                      <div className="absolute inset-4 rounded-xl border-2 border-dashed border-blue-500/30" />
                      <div className="absolute inset-8 rounded-lg border border-blue-400/40" />
                      
                      {/* Center Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div animate={{
                        scale: [1, 1.1, 1]
                      }} transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }} className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-50" />
                          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 flex items-center justify-center backdrop-blur-sm">
                            <Scan className="w-12 h-12 md:w-16 md:h-16 text-blue-500" />
                          </div>
                        </motion.div>
                      </div>

                      {/* Corner Markers */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-blue-500 rounded-tl-lg" />
                      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-blue-500 rounded-tr-lg" />
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-500 rounded-bl-lg" />
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-500 rounded-br-lg" />
                    </div>

                    {/* Status */}
                    <div className="text-center space-y-2">
                      <motion.div animate={{
                      opacity: [0.5, 1, 0.5]
                    }} transition={{
                      duration: 2,
                      repeat: Infinity
                    }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Ready to Scan
                      </motion.div>
                      <p className="text-sm text-muted-foreground">
                        Position face within the frame
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="py-12 md:py-20">
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8" initial="hidden" whileInView="visible" viewport={{
          once: true
        }} variants={containerVariants}>
            {stats.map((stat, i) => <motion.div key={i} variants={itemVariants} className="relative group text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-100 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300">
                <motion.div initial={{
              scale: 0
            }} whileInView={{
              scale: 1
            }} transition={{
              delay: i * 0.1,
              type: "spring"
            }} className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  {stat.value}
                </motion.div>
                <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>)}
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-24">
          <motion.div className="text-center mb-12 md:mb-16" initial="hidden" whileInView="visible" viewport={{
          once: true
        }} variants={containerVariants}>
            <motion.span variants={itemVariants} className="inline-block px-4 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
              Powerful Features
            </motion.span>
            <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Everything You Need
            </motion.h2>
            <motion.p variants={itemVariants} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete attendance solution designed for modern educational institutions
            </motion.p>
          </motion.div>

          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{
          once: true
        }} variants={containerVariants}>
            {features.map((feature, i) => <motion.div key={i} variants={itemVariants} whileHover={{
            y: -5
          }} className="group relative p-6 md:p-8 rounded-2xl bg-card border border-blue-100 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500">
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500" />
                
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>)}
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-24">
          <motion.div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-8 md:p-16" initial="hidden" whileInView="visible" viewport={{
          once: true
        }} variants={containerVariants}>
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
                  <Button size="lg" className="h-14 px-8 text-base bg-white text-blue-600 hover:bg-white/90 shadow-lg">
                    Register Now — It's Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base border-2 border-white/30 text-white hover:bg-white/10">
                    Contact Sales
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </PageLayout>
    </PageTransition>;
};
export default Index;