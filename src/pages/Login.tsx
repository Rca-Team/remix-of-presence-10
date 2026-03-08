import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import Logo from '@/components/Logo';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Lock, Mail, ArrowLeft, Scan, BookOpen, Shield, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate('/attendance');
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/attendance');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Welcome back!", description: "Signed in to Presence Smart School" });
      navigate('/attendance');
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message || "Invalid email or password", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/attendance` },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 -left-20 w-60 sm:w-96 h-60 sm:h-96 bg-ios-blue/20 rounded-full blur-[80px]" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.1, 0.2] }} transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 -right-20 w-60 sm:w-96 h-60 sm:h-96 bg-ios-purple/20 rounded-full blur-[80px]" />
        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 12, repeat: Infinity, delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 sm:w-96 h-60 sm:h-96 bg-ios-green/10 rounded-full blur-[80px]" />
      </div>

      {/* Left Panel - Feature showcase (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="max-w-md space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Logo size="lg" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-3xl font-bold">
            Complete School Automation Platform
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-muted-foreground text-lg">
            AI-powered face recognition, timetable management, gate security & parent communication.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-3">
            {[
              { icon: Scan, label: "Face Attendance", color: "text-ios-blue" },
              { icon: BookOpen, label: "Smart Timetable", color: "text-ios-green" },
              { icon: Shield, label: "Gate Security", color: "text-ios-red" },
              { icon: Bell, label: "Parent Alerts", color: "text-ios-orange" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-card/60 border border-border/50 backdrop-blur-sm">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] space-y-5 sm:space-y-6">
          
          {/* Back + Logo (mobile) */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="lg:hidden">
              <Logo size="sm" />
            </div>
            <div className="w-16" /> {/* spacer */}
          </div>

          {/* Header */}
          <div className="text-center lg:text-left space-y-1.5">
            <h1 className="text-3xl sm:text-3xl font-bold">Welcome back</h1>
            <p className="text-base sm:text-base text-muted-foreground">
              Sign in to your Smart School dashboard
            </p>
          </div>

          {/* Form Card */}
          <Card className="p-5 sm:p-7 space-y-5 bg-card/80 backdrop-blur-xl border-border/50 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Email
                </Label>
                <Input id="email" type="email" placeholder="name@school.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base" required />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    Password
                  </Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot?
                  </Link>
                </div>
                <PasswordInput id="password" placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base" required />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me
                </label>
              </div>

              <Button type="submit" variant="ios" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <><span className="h-4 w-4 mr-2 rounded-full border-2 border-white border-r-transparent animate-spin" />Signing in...</>
                ) : "Sign In"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-card text-muted-foreground">or</span>
              </div>
            </div>

            {/* Google */}
            <Button type="button" variant="outline" className="w-full h-11 sm:h-12 text-sm" onClick={handleGoogleSignIn}>
              <svg className="mr-2 h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </Card>

          {/* Bottom link */}
          <p className="text-center text-sm text-muted-foreground">
            New to Presence?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
