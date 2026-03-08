import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Eye, Loader2, Scan, Zap } from 'lucide-react';
import type { GateEntry } from '@/pages/GateMode';
import { loadModels, areModelsLoaded } from '@/services/face-recognition/ModelService';
import { recognizeFace, recordAttendance } from '@/services/face-recognition/RecognitionService';
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
  const [fps, setFps] = useState(0);
  const [facesInFrame, setFacesInFrame] = useState(0);
  const processingRef = useRef(false);
  const cooldownRef = useRef<Map<string, number>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });
  const attendanceMarkedRef = useRef<Set<string>>(new Set());

  // Start camera with optimal settings for gate use
  useEffect(() => {
    if (!isActive) return;
    let mounted = true;

    const startCamera = async () => {
      try {
        // Prefer rear camera for gate mode (tablet on a stand)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: { ideal: 'environment' },
            frameRate: { ideal: 30 }
          }
        }).catch(() =>
          // Fallback to any camera
          navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
          })
        );

        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (!areModelsLoaded()) await loadModels();
        if (mounted) setIsLoading(false);
      } catch (err) {
        if (mounted) {
          setCameraError('Camera access denied. Please allow camera permissions.');
          setIsLoading(false);
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [isActive]);

  // Continuous detection loop with attendance marking
  const detectLoop = useCallback(async () => {
    if (processingRef.current || !videoRef.current || videoRef.current.paused) return;
    processingRef.current = true;

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      setFacesInFrame(detections.length);

      // FPS counter
      fpsCounterRef.current.frames++;
      const now = Date.now();
      if (now - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.frames);
        fpsCounterRef.current = { frames: 0, lastTime: now };
      }

      // Draw overlays with names
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
            ctx.beginPath();
            // Rounded corners
            const r = 8;
            ctx.moveTo(box.x + r, box.y);
            ctx.lineTo(box.x + box.width - r, box.y);
            ctx.arcTo(box.x + box.width, box.y, box.x + box.width, box.y + r, r);
            ctx.lineTo(box.x + box.width, box.y + box.height - r);
            ctx.arcTo(box.x + box.width, box.y + box.height, box.x + box.width - r, box.y + box.height, r);
            ctx.lineTo(box.x + r, box.y + box.height);
            ctx.arcTo(box.x, box.y + box.height, box.x, box.y + box.height - r, r);
            ctx.lineTo(box.x, box.y + r);
            ctx.arcTo(box.x, box.y, box.x + r, box.y, r);
            ctx.stroke();

            // Scanning animation line
            const scanY = box.y + (box.height * ((now % 2000) / 2000));
            ctx.strokeStyle = '#22c55e80';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(box.x, scanY);
            ctx.lineTo(box.x + box.width, scanY);
            ctx.stroke();
          });
        }
      }

      // Process each detected face
      for (const detection of detections) {
        const descriptorKey = Array.from(detection.descriptor.slice(0, 8)).map(v => v.toFixed(2)).join(',');

        // Cooldown: don't re-process same face within 15s
        const lastSeen = cooldownRef.current.get(descriptorKey);
        if (lastSeen && now - lastSeen < 15000) continue;
        cooldownRef.current.set(descriptorKey, now);

        try {
          const result = await recognizeFace(detection.descriptor);
          const isRecognized = result?.recognized || false;
          const studentName = isRecognized && result?.employee ? result.employee.name : 'Unknown Person';
          const studentId = isRecognized && result?.employee ? result.employee.id : null;

          const entry: GateEntry = {
            id: uuidv4(),
            studentName,
            studentId,
            time: new Date(),
            isRecognized,
            confidence: result?.confidence || detection.detection.score,
          };

          // Auto-mark attendance for recognized students (once per day)
          if (isRecognized && studentId && !attendanceMarkedRef.current.has(studentId)) {
            attendanceMarkedRef.current.add(studentId);
            try {
              await recordAttendance(studentId, detection.descriptor, detection.detection.score);
            } catch (err) {
              console.error('Failed to record attendance:', err);
            }
          }

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
    } catch (err) {
      console.error('Detection error:', err);
    }

    processingRef.current = false;
  }, [onFaceDetected]);

  // Detection interval - adaptive FPS
  useEffect(() => {
    if (!isActive || isLoading) return;
    // Run detection every 200ms (~5 detection FPS)
    intervalRef.current = setInterval(detectLoop, 200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, isLoading, detectLoop]);

  // Clean up old cooldowns every 30s
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      cooldownRef.current.forEach((time, key) => {
        if (now - time > 30000) cooldownRef.current.delete(key);
      });
    }, 30000);
    return () => clearInterval(cleanup);
  }, []);

  if (cameraError) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center p-8">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-destructive font-medium">{cameraError}</p>
          <p className="text-sm text-muted-foreground mt-2">Gate mode requires camera access to scan faces</p>
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
            <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* Status bar */}
      {!isLoading && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur rounded-full px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-foreground">Live Scanning</span>
          </div>
          <div className="flex items-center gap-2">
            {facesInFrame > 0 && (
              <div className="bg-primary/80 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-1.5">
                <Scan className="h-3 w-3 text-primary-foreground" />
                <span className="text-xs font-bold text-primary-foreground">{facesInFrame} face{facesInFrame > 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="bg-card/80 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-medium text-foreground">{fps} FPS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GateModeScanner;
