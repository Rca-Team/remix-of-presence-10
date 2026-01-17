import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, CheckCircle, User, Upload, Crop } from 'lucide-react';
import { registerFace } from '@/services/face-recognition/RegistrationService';
import { 
  loadRegistrationModels, 
  areRegistrationModelsLoaded,
  getFaceDescriptorFromBlob,
  detectFaceInVideo 
} from '@/services/face-recognition/OptimizedRegistrationService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ImageCropper from './ImageCropper';

type Category = 'A' | 'B' | 'C' | 'D' | 'Teacher';

interface QuickRegistrationFormProps {
  onSuccess?: () => void;
  prefillData?: {
    name?: string;
    employee_id?: string;
    department?: string;
    position?: string;
    category?: Category;
    imageBlob?: Blob;
  };
}

const QuickRegistrationForm: React.FC<QuickRegistrationFormProps> = ({ onSuccess, prefillData }) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectionRef = useRef<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: prefillData?.name || '',
    employee_id: prefillData?.employee_id || '',
    department: prefillData?.department || '',
    position: prefillData?.position || '',
    category: prefillData?.category || 'A' as Category
  });
  
  const [capturedImage, setCapturedImage] = useState<Blob | null>(prefillData?.imageBlob || null);
  const [showCropper, setShowCropper] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsReady, setModelsReady] = useState(areRegistrationModelsLoaded());
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Load models on mount - using optimized singleton loader
  useEffect(() => {
    const loadModels = async () => {
      if (areRegistrationModelsLoaded()) {
        setModelsReady(true);
        return;
      }
      
      setIsLoadingModels(true);
      try {
        await loadRegistrationModels();
        setModelsReady(true);
        console.log('Quick registration models loaded');
      } catch (err) {
        console.error('Error loading models:', err);
        toast({
          title: 'Model Loading Failed',
          description: 'Face detection may not work properly',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingModels(false);
      }
    };
    loadModels();
    
    return () => {
      stopCamera();
      if (faceDetectionRef.current) {
        cancelAnimationFrame(faceDetectionRef.current);
      }
    };
  }, [toast]);

  // Handle prefill data
  useEffect(() => {
    if (prefillData) {
      setFormData({
        name: prefillData.name || '',
        employee_id: prefillData.employee_id || '',
        department: prefillData.department || '',
        position: prefillData.position || '',
        category: prefillData.category || 'A'
      });
      if (prefillData.imageBlob) {
        setCapturedImage(prefillData.imageBlob);
        setCapturedImageUrl(URL.createObjectURL(prefillData.imageBlob));
      }
    }
  }, [prefillData]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        
        // Start face detection loop
        detectFaceLoop();
      }
    } catch (err) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setFaceDetected(false);
  };

  const detectFaceLoop = useCallback(async () => {
    if (!videoRef.current || !modelsReady) return;
    
    const detect = async () => {
      if (!videoRef.current || !streamRef.current?.active) return;
      
      try {
        const detected = await detectFaceInVideo(videoRef.current);
        setFaceDetected(detected);
      } catch (err) {
        // Silent error for performance
      }
      
      if (streamRef.current?.active) {
        faceDetectionRef.current = requestAnimationFrame(detect);
      }
    };
    
    detect();
  }, [modelsReady]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Mirror the image for selfie camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedImage(blob);
        setCapturedImageUrl(URL.createObjectURL(blob));
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedImage(file);
      setCapturedImageUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!capturedImage) {
      toast({ title: "Error", description: "Please capture or upload a photo", variant: "destructive" });
      return;
    }
    
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Please enter a name", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      let descriptor: Float32Array | undefined;
      
      // Use optimized face descriptor extraction
      if (modelsReady && capturedImage) {
        toast({ title: "Processing", description: "Analyzing face...", });
        
        const result = await getFaceDescriptorFromBlob(capturedImage);
        
        if (result) {
          descriptor = result;
          console.log('Face descriptor extracted successfully');
        } else {
          toast({ 
            title: "Warning", 
            description: "No face detected in the image. Try a clearer photo.", 
            variant: "destructive" 
          });
          setIsProcessing(false);
          return;
        }
      } else if (!modelsReady) {
        // Try to load models if not ready
        await loadRegistrationModels();
        if (capturedImage) {
          const result = await getFaceDescriptorFromBlob(capturedImage);
          descriptor = result || undefined;
        }
      }
      
      await registerFace(
        capturedImage,
        formData.name,
        formData.employee_id || `STU-${Date.now()}`,
        formData.department || 'General',
        formData.position || 'Student',
        undefined,
        descriptor,
        undefined,
        formData.category
      );
      
      toast({
        title: "Registration Successful",
        description: `${formData.name} has been registered`,
      });
      
      // Reset form
      setFormData({ name: '', employee_id: '', department: '', position: '', category: 'A' });
      setCapturedImage(null);
      setCapturedImageUrl('');
      
      onSuccess?.();
    } catch (err) {
      console.error('Registration error:', err);
      toast({
        title: "Registration Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Quick Registration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Capture Section */}
          <div className="space-y-2">
            <Label>Photo</Label>
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden max-w-sm">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className={`absolute inset-0 border-4 rounded-lg transition-colors ${faceDetected ? 'border-green-500' : 'border-yellow-500'}`} />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                    <Button
                      type="button"
                      onClick={capturePhoto}
                      disabled={!faceDetected}
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {faceDetected ? 'Capture' : 'Position Face'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={stopCamera}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : capturedImageUrl ? (
                <div className="relative group">
                  <img 
                    src={capturedImageUrl} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowCropper(true)}
                    >
                      <Crop className="h-3 w-3 mr-1" />
                      Adjust
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setCapturedImage(null);
                        setCapturedImageUrl('');
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setCapturedImage(null);
                        setCapturedImageUrl('');
                        startCamera();
                      }}
                    >
                      <Camera className="h-3 w-3 mr-1" />
                      Retake
                    </Button>
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-3 w-3 mr-1" />
                          Replace
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
                  <Button type="button" onClick={startCamera} variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Open Camera
                  </Button>
                  <span className="text-sm text-muted-foreground">or</span>
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </span>
                    </Button>
                  </label>
                </div>
              )}
              
              {/* Image Cropper */}
              {capturedImageUrl && (
                <ImageCropper
                  imageSrc={capturedImageUrl}
                  open={showCropper}
                  onCropComplete={(croppedBlob) => {
                    setCapturedImage(croppedBlob);
                    setCapturedImageUrl(URL.createObjectURL(croppedBlob));
                    setShowCropper(false);
                  }}
                  onCancel={() => setShowCropper(false)}
                />
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Form Fields - Compact Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="employee_id">Student ID</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                placeholder="Auto-generated"
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="category">Section *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: Category) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Section A</SelectItem>
                  <SelectItem value="B">Section B</SelectItem>
                  <SelectItem value="C">Section C</SelectItem>
                  <SelectItem value="D">Section D</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isProcessing || !capturedImage}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Register Face
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuickRegistrationForm;
