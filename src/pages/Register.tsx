import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Webcam } from '@/components/ui/webcam';
import { registerFace } from '@/services/FaceRecognitionService';
import { loadRegistrationModels, getFaceDescriptorFromImage } from '@/services/face-recognition/OptimizedRegistrationService';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import PageTransition from '@/components/PageTransition';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  GraduationCap,
  Camera,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Users,
  Scan
} from 'lucide-react';

const Register = () => {
  const { toast } = useToast();
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    employeeId: '',
    department: '',
    position: '',
    year: '',
    major: '',
    standing: '',
    startingYear: '',
  });
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [faceCaptured, setFaceCaptured] = useState(false);

  useEffect(() => {
    const initializeModels = async () => {
      try {
        setIsModelLoading(true);
        await loadRegistrationModels();
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading face recognition models:', error);
        toast({
          title: "Error Loading Models",
          description: "Failed to load face recognition models. Please refresh the page.",
          variant: "destructive",
        });
        setIsModelLoading(false);
      }
    };
    initializeModels();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCaptureImage = async (imageData: string) => {
    if (!webcamRef.current || isModelLoading) return;
    
    try {
      const descriptor = await getFaceDescriptorFromImage(webcamRef.current);
      
      if (!descriptor) {
        toast({
          title: "Face Detection Failed",
          description: "No face detected. Please ensure your face is clearly visible.",
          variant: "destructive",
        });
        return;
      }
      
      setFaceImage(imageData);
      setFaceDescriptor(descriptor);
      setFaceCaptured(true);
      
      toast({
        title: "Face Captured Successfully!",
        description: "Your face has been captured. You can now complete registration.",
      });
    } catch (error) {
      console.error('Error capturing face:', error);
      toast({
        title: "Capture Error",
        description: "An error occurred while capturing your face. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!faceDescriptor || !faceCaptured || !faceImage) {
      toast({
        title: "Missing Face Image",
        description: "Please capture your face before submitting",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const userId = uuidv4();
      const response = await fetch(faceImage);
      const imageBlob = await response.blob();
      
      const registrationData = await registerFace(
        imageBlob,
        formData.name,
        formData.employeeId,
        formData.department,
        formData.position || '',
        userId,
        faceDescriptor,
        {
          phone: formData.phone,
          parent_name: formData.parentName,
          parent_email: formData.parentEmail,
          parent_phone: formData.parentPhone
        }
      );
      
      if (registrationData) {
        toast({
          title: "Registration Successful! 🎉",
          description: "Your face has been registered for attendance tracking.",
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          parentName: '',
          parentEmail: '',
          parentPhone: '',
          employeeId: '',
          department: '',
          position: '',
          year: '',
          major: '',
          standing: '',
          startingYear: '',
        });
        setFaceImage(null);
        setFaceDescriptor(null);
        setFaceCaptured(false);
        setRegistrationStep(1);
      } else {
        throw new Error("Registration failed");
      }
    } catch (error) {
      console.error('Error registering face:', error);
      toast({
        title: "Registration Failed",
        description: "There was an error registering your face. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep1 = () => {
    if (formData.name && formData.email && formData.employeeId && formData.department && formData.parentName && formData.parentEmail && formData.parentPhone) {
      setRegistrationStep(2);
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
    }
  };

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Face Capture", icon: Camera }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }} />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-1/4 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" 
            />
            <motion.div 
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.1, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, delay: 1 }}
              className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl" 
            />
          </div>

          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            <Link to="/">
              <Logo className="text-white" />
            </Link>

            <div className="space-y-8">
              <div>
                <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                  Join the Future of<br />
                  <span className="text-cyan-200">Smart Attendance</span>
                </h1>
                <p className="mt-4 text-lg text-white/80 max-w-md">
                  Register once and experience seamless facial recognition attendance for your entire academic journey.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Sparkles, text: "AI-powered face recognition" },
                  { icon: Shield, text: "Bank-grade security & privacy" },
                  { icon: Users, text: "Trusted by 500+ institutions" }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="flex items-center gap-3 text-white/90"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span>{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <p className="text-white/60 text-sm">
              © 2024 Presence. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white dark:from-slate-950 dark:via-blue-950/30 dark:to-slate-900 overflow-y-auto">
          {/* Mobile Header */}
          <div className="lg:hidden p-4 border-b border-blue-100 dark:border-blue-900/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
            <div className="w-full max-w-lg mx-auto">
              {/* Header */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                  <Scan className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Face Registration</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold">Create your profile</h2>
                <p className="mt-2 text-muted-foreground">
                  Register to start using facial recognition attendance
                </p>
              </motion.div>

              {/* Progress Steps */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <div className="flex items-center justify-between relative">
                  {steps.map((step, i) => (
                    <React.Fragment key={step.number}>
                      <div className="flex flex-col items-center z-10">
                        <motion.div 
                          animate={{ 
                            scale: registrationStep >= step.number ? 1 : 0.9,
                            opacity: registrationStep >= step.number ? 1 : 0.5
                          }}
                          className={`
                            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                            ${registrationStep >= step.number 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30' 
                              : 'bg-muted text-muted-foreground'
                            }
                          `}
                        >
                          {registrationStep > step.number ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <step.icon className="w-5 h-5" />
                          )}
                        </motion.div>
                        <span className={`mt-2 text-sm font-medium ${
                          registrationStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {step.title}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className="flex-1 mx-4 relative">
                          <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted" />
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: registrationStep > 1 ? '100%' : '0%' }}
                            className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500"
                          />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {registrationStep === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* Personal Details */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-500" />
                              Full Name *
                            </Label>
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="John Doe"
                              className="h-12 bg-white/50 dark:bg-slate-800/50 border-blue-100 dark:border-blue-900 focus:border-blue-500 focus:ring-blue-500/20"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-blue-500" />
                              Email *
                            </Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="john@school.edu"
                              className="h-12 bg-white/50 dark:bg-slate-800/50 border-blue-100 dark:border-blue-900 focus:border-blue-500 focus:ring-blue-500/20"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="employeeId" className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-blue-500" />
                              Student/Employee ID *
                            </Label>
                            <Input
                              id="employeeId"
                              name="employeeId"
                              value={formData.employeeId}
                              onChange={handleInputChange}
                              placeholder="STU-12345"
                              className="h-12 bg-white/50 dark:bg-slate-800/50 border-blue-100 dark:border-blue-900 focus:border-blue-500 focus:ring-blue-500/20"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="department" className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-500" />
                              Department/Class *
                            </Label>
                            <Select value={formData.department} onValueChange={(value) => handleSelectChange('department', value)}>
                              <SelectTrigger className="h-12 bg-white/50 dark:bg-slate-800/50 border-blue-100 dark:border-blue-900">
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Class A</SelectItem>
                                <SelectItem value="B">Class B</SelectItem>
                                <SelectItem value="C">Class C</SelectItem>
                                <SelectItem value="D">Class D</SelectItem>
                                <SelectItem value="Teacher">Teacher</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-blue-100 dark:border-blue-900" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-3 bg-gradient-to-r from-slate-50 via-blue-50/30 to-white dark:from-slate-950 dark:via-blue-950/30 dark:to-slate-900 text-sm text-muted-foreground">Parent/Guardian Info</span>
                        </div>
                      </div>

                      {/* Parent Details */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="parentName">Parent Name *</Label>
                            <Input
                              id="parentName"
                              name="parentName"
                              value={formData.parentName}
                              onChange={handleInputChange}
                              placeholder="Parent's full name"
                              className="h-12 bg-white/50 dark:bg-slate-800/50 border-blue-100 dark:border-blue-900"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="parentEmail">Parent Email *</Label>
                            <Input
                              id="parentEmail"
                              name="parentEmail"
                              type="email"
                              value={formData.parentEmail}
                              onChange={handleInputChange}
                              placeholder="parent@email.com"
                              className="h-12 bg-white/50 dark:bg-slate-800/50 border-blue-100 dark:border-blue-900"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parentPhone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-blue-500" />
                            Parent Phone *
                          </Label>
                          <Input
                            id="parentPhone"
                            name="parentPhone"
                            type="tel"
                            value={formData.parentPhone}
                            onChange={handleInputChange}
                            placeholder="+1 (555) 123-4567"
                            className="h-12 bg-white/50 dark:bg-slate-800/50 border-blue-100 dark:border-blue-900"
                            required
                          />
                        </div>
                      </div>

                      {/* Next Button */}
                      <Button 
                        type="button" 
                        onClick={validateStep1}
                        className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/25"
                      >
                        Continue to Face Capture
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* Face Capture */}
                      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-500 p-1 shadow-xl shadow-blue-500/20">
                        <div className="bg-background rounded-xl overflow-hidden">
                          {/* Header */}
                          <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Camera className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">Face Scanner</h3>
                                <p className="text-sm text-blue-100">Position your face in frame</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            {faceCaptured && faceImage ? (
                              <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center space-y-4"
                              >
                                <div className="relative inline-block">
                                  <img 
                                    src={faceImage} 
                                    alt="Captured face" 
                                    className="w-48 h-48 rounded-full object-cover mx-auto border-4 border-blue-500 shadow-lg shadow-blue-500/30"
                                  />
                                  <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                                  >
                                    <CheckCircle2 className="w-7 h-7 text-white" />
                                  </motion.div>
                                </div>
                                <div>
                                  <p className="font-semibold text-lg text-green-600 dark:text-green-400">Face Captured Successfully!</p>
                                  <p className="text-sm text-muted-foreground">Ready to complete registration</p>
                                </div>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={() => { setFaceCaptured(false); setFaceImage(null); }}
                                  className="border-blue-200 dark:border-blue-800"
                                >
                                  <Camera className="w-4 h-4 mr-2" />
                                  Retake Photo
                                </Button>
                              </motion.div>
                            ) : (
                              <div className="space-y-4">
                                <Webcam
                                  ref={webcamRef}
                                  onCapture={handleCaptureImage}
                                  className="rounded-xl overflow-hidden"
                                />
                                {isModelLoading && (
                                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                                    <motion.div 
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                      className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"
                                    />
                                    <p className="text-sm text-blue-600 dark:text-blue-400">Loading face recognition models...</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setRegistrationStep(1)}
                          className="flex-1 h-12 border-blue-200 dark:border-blue-800"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={!faceCaptured || isSubmitting}
                          className="flex-1 h-12 text-base bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/25 disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                              />
                              Registering...
                            </>
                          ) : (
                            <>
                              Complete Registration
                              <CheckCircle2 className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* Login Link */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center text-sm text-muted-foreground"
              >
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                  Sign in
                </Link>
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;
