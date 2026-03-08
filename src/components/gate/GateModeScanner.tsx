import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Eye, Loader2, Scan, Zap, ShieldCheck, ShieldAlert, SwitchCamera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GateEntry } from '@/pages/GateMode';
import { loadModels, areModelsLoaded } from '@/services/face-recognition/ModelService';
import { recognizeFace, recordAttendance } from '@/services/face-recognition/RecognitionService';
import * as faceapi from 'face-api.js';
import { v4 as uuidv4 } from 'uuid';

interface GateModeScannerProps {
  onFaceDetected: (entry: GateEntry) => void;
  isActive: boolean;
}

interface LiveConfidence {
  name: string;
  confidence: number;
  recognized: boolean;
  timestamp: number;
}

const GateModeScanner = ({ onFaceDetected, isActive }: GateModeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [facesInFrame, setFacesInFrame] = useState(0);
  const [liveMatches, setLiveMatches] = useState<LiveConfidence[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const processingRef = useRef(false);
  const cooldownRef = useRef<Map<string, number>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });
  const attendanceMarkedRef = useRef<Set<string>>(new Set());
  // Store per-face labels for canvas overlay
  const faceLabelsRef = useRef<Map<string, { name: string; confidence: number; recognized: boolean }>>(new Map());

  // Clear stale live matches
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setLiveMatches(prev => prev.filter(m => now - m.timestamp < 5000));
    }, 1000);
    return () => clearInterval(cleanup);
  }, []);

  // Start camera
  useEffect(() => {
    if (!isActive) return;
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: { ideal: facingMode },
            frameRate: { ideal: 30 }
          }
        }).catch(() =>
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
  }, [isActive, facingMode]);

  // Continuous detection loop
  const detectLoop = useCallback(async () => {
    if (processingRef.current || !videoRef.current || videoRef.current.paused) return;
    processingRef.current = true;

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.4
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

      // Draw overlays with confidence
      if (canvasRef.current && videoRef.current) {
        const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
        const resized = faceapi.resizeResults(detections, dims);
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          resized.forEach((d, idx) => {
            const box = d.detection.box;
            const descriptorKey = Array.from(detections[idx].descriptor.slice(0, 8)).map(v => v.toFixed(2)).join(',');
            const label = faceLabelsRef.current.get(descriptorKey);
            
            // Color based on recognition status
            const isRecognized = label?.recognized ?? false;
            const color = isRecognized ? '#22c55e' : '#ef4444';
            const colorAlpha = isRecognized ? '#22c55e80' : '#ef444480';
            
            // Draw rounded box
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
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
            ctx.strokeStyle = colorAlpha;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(box.x, scanY);
            ctx.lineTo(box.x + box.width, scanY);
            ctx.stroke();

            // Draw confidence label above the box
            if (label) {
              const confPercent = Math.round(label.confidence * 100);
              const labelText = label.recognized 
                ? `${label.name} · ${confPercent}%` 
                : `Unknown · ${Math.round(d.detection.score * 100)}%`;
              
              ctx.font = 'bold 14px system-ui, sans-serif';
              const textWidth = ctx.measureText(labelText).width;
              const labelX = box.x;
              const labelY = box.y - 8;

              // Background pill
              ctx.fillStyle = isRecognized ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)';
              const pillPad = 6;
              const pillH = 22;
              ctx.beginPath();
              ctx.roundRect(labelX - pillPad, labelY - pillH + 2, textWidth + pillPad * 2, pillH, 6);
              ctx.fill();

              // Text
              ctx.fillStyle = '#ffffff';
              ctx.fillText(labelText, labelX, labelY - 4);
            } else {
              // Show detection score even before recognition
              const scoreText = `Detecting... ${Math.round(d.detection.score * 100)}%`;
              ctx.font = '12px system-ui, sans-serif';
              const textWidth = ctx.measureText(scoreText).width;
              ctx.fillStyle = 'rgba(100,116,139,0.8)';
              ctx.beginPath();
              ctx.roundRect(box.x - 4, box.y - 24, textWidth + 8, 20, 4);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.fillText(scoreText, box.x, box.y - 10);
            }
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
          const confidence = result?.confidence || detection.detection.score;

          // Store label for canvas overlay
          faceLabelsRef.current.set(descriptorKey, {
            name: studentName,
            confidence,
            recognized: isRecognized
          });

          // Update live confidence HUD
          setLiveMatches(prev => {
            const filtered = prev.filter(m => m.name !== studentName || now - m.timestamp > 3000);
            return [...filtered, { name: studentName, confidence, recognized: isRecognized, timestamp: now }].slice(-5);
          });

          const entry: GateEntry = {
            id: uuidv4(),
            studentName,
            studentId,
            time: new Date(),
            isRecognized,
            confidence,
          };

          // Auto-mark attendance for recognized students (once per session)
          if (isRecognized && studentId && !attendanceMarkedRef.current.has(studentId)) {
            attendanceMarkedRef.current.add(studentId);
            try {
              await recordAttendance(studentId, 'present', detection.detection.score);
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

  // Detection interval
  useEffect(() => {
    if (!isActive || isLoading) return;
    intervalRef.current = setInterval(detectLoop, 200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, isLoading, detectLoop]);

  // Clean up old cooldowns & labels
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      cooldownRef.current.forEach((time, key) => {
        if (now - time > 30000) {
          cooldownRef.current.delete(key);
          faceLabelsRef.current.delete(key);
        }
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
    <div className="relative h-full w-full bg-black touch-manipulation">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur">
          <div className="text-center px-4">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mx-auto mb-3 sm:mb-4" />
            <p className="text-foreground font-medium text-sm sm:text-base">Loading face detection models...</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* Status bar */}
      {!isLoading && (
        <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-card/80 backdrop-blur rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-medium text-foreground">Live</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {facesInFrame > 0 && (
              <div className="bg-primary/80 backdrop-blur rounded-full px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1">
                <Scan className="h-3 w-3 text-primary-foreground" />
                <span className="text-[10px] sm:text-xs font-bold text-primary-foreground">{facesInFrame}</span>
              </div>
            )}
            <div className="bg-card/80 backdrop-blur rounded-full px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="text-[10px] sm:text-xs font-medium text-foreground">{fps} FPS</span>
            </div>
          </div>
        </div>
      )}

      {/* Live confidence HUD */}
      <AnimatePresence>
        {liveMatches.length > 0 && !isLoading && (
          <div className="absolute bottom-14 sm:bottom-4 left-2 right-2 sm:left-3 sm:right-auto sm:max-w-xs space-y-1.5 z-10">
            {liveMatches.slice(-3).map((match, i) => (
              <motion.div
                key={`${match.name}-${match.timestamp}`}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl border shadow-lg ${
                  match.recognized 
                    ? 'bg-emerald-500/20 border-emerald-500/40' 
                    : 'bg-rose-500/20 border-rose-500/40'
                }`}
              >
                {match.recognized 
                  ? <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" /> 
                  : <ShieldAlert className="h-4 w-4 text-rose-400 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{match.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Confidence bar */}
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(match.confidence * 100)}%` }}
                        className={`h-full rounded-full ${
                          match.recognized ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${
                      match.recognized ? 'text-emerald-300' : 'text-rose-300'
                    }`}>
                      {Math.round(match.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GateModeScanner;
