import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Eye, Loader2 } from 'lucide-react';
import type { GateEntry } from '@/pages/GateMode';
import { loadModels, areModelsLoaded } from '@/services/face-recognition/ModelService';
import { recognizeFace } from '@/services/face-recognition/RecognitionService';
import * as faceapi from 'face-api.js';
import { v4 as uuidv4 } from 'uuid';

interface GateModeScannerProps {
  onFaceDetected: (entry: GateEntry) => void;
  isActive: boolean;
}

const GateModeScanner = ({ onFaceDetected, isActive }: GateModeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const processingRef = useRef(false);
  const lastDetectedRef = useRef<Set<string>>(new Set());
  const cooldownRef = useRef<Map<string, number>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start camera
  useEffect(() => {
    if (!isActive) return;
    
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        
        if (!areModelsLoaded()) await loadModels();
        setIsLoading(false);
      } catch (err) {
        setCameraError('Camera access denied. Please allow camera permissions.');
        setIsLoading(false);
      }
    };
    
    startCamera();
    
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [isActive]);

  // Continuous detection loop
  const detectLoop = useCallback(async () => {
    if (processingRef.current || !videoRef.current || videoRef.current.paused) return;
    processingRef.current = true;

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Draw overlays
      if (canvasRef.current && videoRef.current) {
        const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
        const resized = faceapi.resizeResults(detections, dims);
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          resized.forEach(d => {
            const box = d.detection.box;
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
          });
        }
      }

      const now = Date.now();
      for (const detection of detections) {
        const descriptorKey = Array.from(detection.descriptor.slice(0, 5)).map(v => v.toFixed(2)).join(',');
        
        // Cooldown: don't re-process same face within 10s
        const lastSeen = cooldownRef.current.get(descriptorKey);
        if (lastSeen && now - lastSeen < 10000) continue;
        cooldownRef.current.set(descriptorKey, now);

        // Try to recognize
        try {
          const result = await recognizeFace(detection.descriptor);
          const entry: GateEntry = {
            id: uuidv4(),
            studentName: result?.recognized && result.employee ? result.employee.name : 'Unknown Person',
            studentId: result?.recognized && result.employee ? result.employee.id : null,
            time: new Date(),
            isRecognized: result?.recognized || false,
            confidence: result?.confidence || detection.detection.score,
          };
          onFaceDetected(entry);
        } catch {
          onFaceDetected({
            id: uuidv4(),
            studentName: 'Unknown Person',
            studentId: null,
            time: new Date(),
            isRecognized: false,
            confidence: detection.detection.score,
          });
        }
      }
    } catch {}
    
    processingRef.current = false;
  }, [onFaceDetected]);

  // Start detection interval at ~5 FPS
  useEffect(() => {
    if (!isActive || isLoading) return;
    intervalRef.current = setInterval(detectLoop, 200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, isLoading, detectLoop]);

  if (cameraError) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center p-8">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-destructive font-medium">{cameraError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground font-medium">Loading face detection models...</p>
          </div>
        </div>
      )}
      
      {/* Scanning indicator */}
      {!isLoading && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-card/80 backdrop-blur rounded-full px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-foreground">Scanning at 5 FPS</span>
        </div>
      )}
    </div>
  );
};

export default GateModeScanner;
