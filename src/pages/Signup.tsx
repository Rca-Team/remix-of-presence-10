import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import Logo from '@/components/Logo';
import { Lock, Mail, User, ShieldCheck, ArrowLeft, Scan, BookOpen, Shield, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate('/attendance');
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/attendance');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Password mismatch", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { emailRedirectTo: `${window.location.origin}/`, data: { name: formData.name } }
      });
      if (error) throw error;
      toast({ title: "Account created!", description: "Check your email to verify your account" });
      navigate('/login');
    } catch (error: any) {
      toast({ title: "Signup failed", description: error.message || "Failed to create account", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 -left-20 w-60 sm:w-96 h-60 sm:h-96 bg-ios-purple/20 rounded-full blur-[80px]" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.1, 0.2] }} transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 -right-20 w-60 sm:w-96 h-60 sm:h-96 bg-ios-blue/20 rounded-full blur-[80px]" />
      </div>

      {/* Left Panel (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="max-w-md space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Logo size="lg" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-3xl font-bold">
            Join Smart School Platform
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-muted-foreground text-lg">
            Set up your school with AI-powered attendance, timetable automation, gate security & parent notifications.
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

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] space-y-4 sm:space-y-5">
          
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="lg:hidden"><Logo size="sm" /></div>
            <div className="w-16" />
          </div>

          <div className="text-center lg:text-left space-y-1.5">
            <h1 className="text-3xl font-bold">Create account</h1>
            <p className="text-base text-muted-foreground">
              Get started with Presence Smart School
            </p>
          </div>

          <Card className="p-5 sm:p-7 space-y-4 sm:space-y-5 bg-card/80 backdrop-blur-xl border-border/50 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  Full Name
                </Label>
                <Input id="name" name="name" type="text" placeholder="Your name" value={formData.name}
                  onChange={handleInputChange} className="h-12 text-base" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Email
                </Label>
                <Input id="email" name="email" type="email" placeholder="name@school.com" value={formData.email}
                  onChange={handleInputChange} className="h-11 sm:h-12 text-sm sm:text-base" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Password
                </Label>
                <PasswordInput id="password" name="password" placeholder="••••••••" value={formData.password}
                  onChange={handleInputChange} className="h-11 sm:h-12 text-sm sm:text-base" required />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Confirm Password
                </Label>
                <PasswordInput id="confirmPassword" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword}
                  onChange={handleInputChange} className="h-11 sm:h-12 text-sm sm:text-base" required />
              </div>

              <Button type="submit" variant="ios" className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <><span className="h-4 w-4 mr-2 rounded-full border-2 border-white border-r-transparent animate-spin" />Creating...</>
                ) : "Create Account"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-card text-muted-foreground">or</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full h-11 sm:h-12 text-sm" onClick={handleGoogleSignUp}>
              <svg className="mr-2 h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
