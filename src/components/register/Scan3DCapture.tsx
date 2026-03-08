import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFaceDescriptorFromImage, detectFaceInVideo } from '@/services/face-recognition/OptimizedRegistrationService';

interface Scan3DCaptureProps {
  onComplete: (averagedDescriptor: Float32Array, primaryImage: string) => void;
  isModelLoading: boolean;
}

const MIN_SAMPLES = 8;
const SCAN_DURATION_MS = 8000; // 8 seconds for full scan

const Scan3DCapture: React.FC<Scan3DCaptureProps> = ({ onComplete, isModelLoading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [samplesCollected, setSamplesCollected] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [primaryImage, setPrimaryImage] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [statusText, setStatusText] = useState('Position your face in the frame');

  const descriptorsRef = useRef<Float32Array[]>([]);
  const scanStartRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start camera
  useEffect(() => {
    let mounted = true;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        if (!mounted) { mediaStream.getTracks().forEach(t => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
          setCameraReady(true);
        }
        setStream(mediaStream);
      } catch { console.error('Camera access failed'); }
    };
    startCamera();
    return () => { mounted = false; stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  // Face detection loop (lightweight, runs before scan starts)
  useEffect(() => {
    if (!cameraReady || scanning || scanComplete || isModelLoading) return;
    const interval = setInterval(async () => {
      if (videoRef.current) {
        const detected = await detectFaceInVideo(videoRef.current);
        setFaceDetected(detected);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [cameraReady, scanning, scanComplete, isModelLoading]);

  // 3D scanning overlay animation
  useEffect(() => {
    if (!overlayCanvasRef.current || !cameraReady) return;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const draw = () => {
      if (!running) return;
      const w = canvas.width = canvas.clientWidth * 2;
      const h = canvas.height = canvas.clientHeight * 2;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const rx = w * 0.28;
      const ry = h * 0.38;
      const t = Date.now() / 1000;

      // Outer oval guide
      ctx.strokeStyle = scanning
        ? `hsla(${142 + progress * 1.2}, 80%, 55%, ${0.5 + Math.sin(t * 3) * 0.2})`
        : faceDetected
          ? 'hsla(142, 70%, 50%, 0.6)'
          : 'hsla(220, 50%, 60%, 0.4)';
      ctx.lineWidth = scanning ? 4 : 2;
      ctx.setLineDash(scanning ? [] : [8, 8]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (scanning) {
        // Rotating scan beam
        const angle = (progress / 100) * Math.PI * 2 - Math.PI / 2;
        const beamLen = Math.max(rx, ry) * 1.1;

        // Sweep glow
        const grad = ctx.createConicGradient(angle - 0.5, cx, cy);
        grad.addColorStop(0, 'hsla(170, 90%, 50%, 0)');
        grad.addColorStop(0.08, 'hsla(170, 90%, 50%, 0.15)');
        grad.addColorStop(0.12, 'hsla(170, 90%, 50%, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx + 20, ry + 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Scan line
        const lx = cx + Math.cos(angle) * rx;
        const ly = cy + Math.sin(angle) * ry;
        ctx.strokeStyle = 'hsla(170, 90%, 60%, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(lx, ly);
        ctx.stroke();

        // Scan dot
        ctx.fillStyle = 'hsla(170, 90%, 70%, 1)';
        ctx.beginPath();
        ctx.arc(lx, ly, 6, 0, Math.PI * 2);
        ctx.fill();

        // Progress arc
        ctx.strokeStyle = 'hsla(170, 90%, 55%, 0.8)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx + 12, ry + 12, 0, -Math.PI / 2, angle);
        ctx.stroke();

        // Sample dots on the ring
        descriptorsRef.current.forEach((_, i) => {
          const sAngle = (i / MIN_SAMPLES) * Math.PI * 2 - Math.PI / 2;
          const sx = cx + Math.cos(sAngle) * (rx + 12);
          const sy = cy + Math.sin(sAngle) * (ry + 12);
          ctx.fillStyle = 'hsla(142, 80%, 55%, 0.9)';
          ctx.beginPath();
          ctx.arc(sx, sy, 4, 0, Math.PI * 2);
          ctx.fill();
        });

        // Grid lines (3D effect)
        ctx.strokeStyle = 'hsla(170, 60%, 50%, 0.08)';
        ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
          const offset = i * (ry / 3.5);
          ctx.beginPath();
          ctx.moveTo(cx - rx, cy + offset);
          ctx.lineTo(cx + rx, cy + offset);
          ctx.stroke();
        }
        for (let i = -3; i <= 3; i++) {
          const offset = i * (rx / 3.5);
          ctx.beginPath();
          ctx.moveTo(cx + offset, cy - ry);
          ctx.lineTo(cx + offset, cy + ry);
          ctx.stroke();
        }
      } else if (!scanComplete) {
        // Pulsing corners when not scanning
        const cornerLen = 24;
        ctx.strokeStyle = faceDetected ? 'hsla(142, 70%, 50%, 0.8)' : 'hsla(220, 50%, 60%, 0.5)';
        ctx.lineWidth = 3;
        const corners = [
          [cx - rx, cy - ry], [cx + rx, cy - ry],
          [cx - rx, cy + ry], [cx + rx, cy + ry]
        ];
        corners.forEach(([x, y]) => {
          const dx = x < cx ? 1 : -1;
          const dy = y < cy ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(x + dx * cornerLen, y);
          ctx.lineTo(x, y);
          ctx.lineTo(x, y + dy * cornerLen);
          ctx.stroke();
        });
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [cameraReady, scanning, progress, faceDetected, scanComplete]);

  // Start 3D scan
  const startScan = useCallback(() => {
    if (!cameraReady || isModelLoading || !faceDetected) return;
    setScanning(true);
    setProgress(0);
    setSamplesCollected(0);
    descriptorsRef.current = [];
    scanStartRef.current = Date.now();
    setStatusText('Slowly turn your head in a circle...');

    // Capture primary image immediately
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setPrimaryImage(canvas.toDataURL('image/png'));
      }
    }

    // Sample descriptors every ~800ms during the scan
    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      const elapsed = Date.now() - scanStartRef.current;
      const p = Math.min((elapsed / SCAN_DURATION_MS) * 100, 100);
      setProgress(p);

      // Update guidance text
      if (p < 25) setStatusText('Look straight... now slowly turn left');
      else if (p < 50) setStatusText('Good! Keep turning... now look right');
      else if (p < 75) setStatusText('Great! Now tilt slightly up');
      else if (p < 95) setStatusText('Almost done... look straight again');
      else setStatusText('Processing your 3D face map...');

      try {
        const descriptor = await getFaceDescriptorFromImage(videoRef.current);
        if (descriptor) {
          descriptorsRef.current.push(descriptor);
          setSamplesCollected(descriptorsRef.current.length);
        }
      } catch {}

      // Scan complete
      if (elapsed >= SCAN_DURATION_MS) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        finishScan();
      }
    }, 800);
  }, [cameraReady, isModelLoading, faceDetected]);

  const finishScan = useCallback(() => {
    setScanning(false);
    const descriptors = descriptorsRef.current;

    if (descriptors.length < 3) {
      setStatusText('Not enough face data captured. Please try again.');
      setProgress(0);
      setSamplesCollected(0);
      return;
    }

    // Average all descriptors for robust 3D face representation
    const averaged = new Float32Array(descriptors[0].length);
    for (let i = 0; i < averaged.length; i++) {
      averaged[i] = descriptors.reduce((sum, d) => sum + d[i], 0) / descriptors.length;
    }

    setScanComplete(true);
    setStatusText(`3D scan complete! ${descriptors.length} samples captured.`);
    onComplete(averaged, primaryImage!);
  }, [onComplete, primaryImage]);

  const resetScan = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setScanComplete(false);
    setScanning(false);
    setProgress(0);
    setSamplesCollected(0);
    descriptorsRef.current = [];
    setPrimaryImage(null);
    setStatusText('Position your face in the frame');
  };

  // Cleanup
  useEffect(() => {
    return () => { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); };
  }, []);

  return (
    <div className="space-y-4">
      {/* Camera + 3D overlay */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* 3D scanning overlay */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Status text */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
          <AnimatePresence mode="wait">
            <motion.p
              key={statusText}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-center text-white font-medium text-sm"
            >
              {statusText}
            </motion.p>
          </AnimatePresence>
          {scanning && (
            <div className="mt-2 flex items-center justify-center gap-3">
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-green-400 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-white/70 tabular-nums w-16 text-right">
                {samplesCollected} samples
              </span>
            </div>
          )}
        </div>

        {/* Face detected indicator */}
        {!scanning && !scanComplete && cameraReady && (
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            faceDetected
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${faceDetected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            {faceDetected ? 'Face detected' : 'No face detected'}
          </div>
        )}

        {isModelLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading 3D face models...</p>
            </div>
          </div>
        )}

        {/* Scan complete overlay */}
        {scanComplete && primaryImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'tween', duration: 0.4 }}
              className="text-center"
            >
              <div className="relative inline-block mb-3">
                <img
                  src={primaryImage}
                  alt="Scanned"
                  className="w-28 h-28 rounded-full object-cover border-3 border-green-400 shadow-lg shadow-green-500/30"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </motion.div>
              </div>
              <p className="text-green-400 font-bold text-lg">3D Scan Complete</p>
              <p className="text-white/60 text-xs">{samplesCollected} depth samples averaged</p>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Action button */}
      {!scanComplete ? (
        <Button
          onClick={startScan}
          disabled={!cameraReady || isModelLoading || scanning || !faceDetected}
          className="w-full h-12 text-base bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg"
        >
          {scanning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Scanning 3D Face Map... {Math.round(progress)}%
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 mr-2" />
              {faceDetected ? 'Start 3D Face Scan' : 'Position face to start'}
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={resetScan}
          variant="outline"
          className="w-full h-11"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Rescan
        </Button>
      )}
    </div>
  );
};

export default Scan3DCapture;
