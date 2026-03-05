import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, X, Settings, Volume2, VolumeX, Maximize, Minimize,
  Users, Clock, AlertTriangle, CheckCircle2, Wifi, WifiOff,
  DoorOpen, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import GateModeScanner from '@/components/gate/GateModeScanner';
import GateEntryFeedback from '@/components/gate/GateEntryFeedback';
import GateStatsOverlay from '@/components/gate/GateStatsOverlay';
import StrangerAlert from '@/components/gate/StrangerAlert';
import LateEntryForm from '@/components/gate/LateEntryForm';
import GateModeSetup from '@/components/gate/GateModeSetup';
import { useNavigate } from 'react-router-dom';

export interface GateEntry {
  id: string;
  studentName: string;
  studentId: string | null;
  time: Date;
  isRecognized: boolean;
  confidence: number;
  photoUrl?: string;
  isLate?: boolean;
}

const GateMode = () => {
  const navigate = useNavigate();
  const [isSetup, setIsSetup] = useState(true);
  const [gateName, setGateName] = useState('Main Gate');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [entries, setEntries] = useState<GateEntry[]>([]);
  const [lastEntry, setLastEntry] = useState<GateEntry | null>(null);
  const [showStrangerAlert, setShowStrangerAlert] = useState(false);
  const [strangerPhoto, setStrangerPhoto] = useState<string | undefined>();
  const [showLateForm, setShowLateForm] = useState(false);
  const [lateStudent, setLateStudent] = useState<GateEntry | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [totalStudents, setTotalStudents] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Track online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch total students count
  useEffect(() => {
    const fetchTotal = async () => {
      const { count } = await supabase
        .from('face_descriptors')
        .select('user_id', { count: 'exact', head: true });
      if (count) setTotalStudents(count);
    };
    fetchTotal();
  }, []);

  // Wake Lock to prevent screen sleep
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    };
    if (!isSetup) requestWakeLock();
    return () => { wakeLock?.release(); };
  }, [isSetup]);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const playSound = useCallback((type: 'success' | 'warning' | 'alert') => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.3;
      
      if (type === 'success') {
        osc.frequency.value = 880;
        osc.type = 'sine';
      } else if (type === 'warning') {
        osc.frequency.value = 440;
        osc.type = 'triangle';
      } else {
        osc.frequency.value = 330;
        osc.type = 'sawtooth';
      }
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [soundEnabled]);

  const startSession = useCallback(async (selectedGate: string) => {
    setGateName(selectedGate);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('gate_sessions')
        .insert({
          gate_name: selectedGate,
          started_by: user?.id,
          device_info: { userAgent: navigator.userAgent, screen: `${screen.width}x${screen.height}` }
        })
        .select('id')
        .single();
      
      if (error) throw error;
      setSessionId(data.id);
      setIsSetup(false);
      toast.success(`Gate Mode started at ${selectedGate}`);
    } catch (err) {
      toast.error('Failed to start gate session');
    }
  }, []);

  const handleFaceDetected = useCallback((entry: GateEntry) => {
    setEntries(prev => [entry, ...prev]);
    setLastEntry(entry);

    if (entry.isRecognized) {
      playSound('success');
      // Check if late
      const now = new Date();
      const cutoffHour = 9; // TODO: fetch from settings
      if (now.getHours() >= cutoffHour) {
        entry.isLate = true;
        setLateStudent(entry);
        setShowLateForm(true);
      }
      // Record gate entry in DB
      supabase.from('gate_entries').insert({
        student_id: entry.studentId,
        gate_session_id: sessionId,
        entry_type: 'entry',
        is_recognized: true,
        confidence: entry.confidence,
        gate_name: gateName,
        student_name: entry.studentName
      }).then();
    } else {
      playSound('alert');
      setStrangerPhoto(entry.photoUrl);
      setShowStrangerAlert(true);
      // Record unknown entry
      supabase.from('gate_entries').insert({
        gate_session_id: sessionId,
        entry_type: 'entry',
        is_recognized: false,
        confidence: entry.confidence,
        gate_name: gateName,
        photo_url: entry.photoUrl,
        student_name: 'Unknown'
      }).then();
    }
  }, [sessionId, gateName, playSound]);

  const endSession = useCallback(async () => {
    if (sessionId) {
      const recognized = entries.filter(e => e.isRecognized).length;
      const unknown = entries.filter(e => !e.isRecognized).length;
      await supabase.from('gate_sessions').update({
        ended_at: new Date().toISOString(),
        total_entries: recognized,
        unknown_entries: unknown
      }).eq('id', sessionId);
    }
    navigate('/dashboard');
  }, [sessionId, entries, navigate]);

  if (isSetup) {
    return <GateModeSetup onStart={startSession} onCancel={() => navigate('/dashboard')} />;
  }

  const recognizedCount = entries.filter(e => e.isRecognized).length;
  const unknownCount = entries.filter(e => !e.isRecognized).length;
  const uniqueStudents = new Set(entries.filter(e => e.studentId).map(e => e.studentId)).size;

  return (
    <div ref={containerRef} className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3">
          <DoorOpen className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-foreground">{gateName}</span>
          <Badge variant="outline" className="text-xs">
            {isOnline ? <Wifi className="h-3 w-3 mr-1 text-green-500" /> : <WifiOff className="h-3 w-3 mr-1 text-destructive" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          <Button variant="destructive" size="sm" onClick={endSession}>
            <X className="h-4 w-4 mr-1" /> End Session
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex relative">
        {/* Camera feed - takes 70% */}
        <div className="flex-[7] relative">
          <GateModeScanner onFaceDetected={handleFaceDetected} isActive={!isSetup} />
          
          {/* Entry feedback overlay */}
          <AnimatePresence>
            {lastEntry && (
              <GateEntryFeedback 
                entry={lastEntry} 
                onDismiss={() => setLastEntry(null)} 
              />
            )}
          </AnimatePresence>
        </div>

        {/* Stats sidebar - takes 30% */}
        <div className="flex-[3] border-l border-border">
          <GateStatsOverlay
            totalEntries={recognizedCount}
            totalStudents={totalStudents}
            uniqueStudents={uniqueStudents}
            unknownCount={unknownCount}
            recentEntries={entries.slice(0, 20)}
          />
        </div>
      </div>

      {/* Stranger Alert */}
      <AnimatePresence>
        {showStrangerAlert && (
          <StrangerAlert 
            photoUrl={strangerPhoto}
            gateName={gateName}
            onDismiss={() => setShowStrangerAlert(false)}
          />
        )}
      </AnimatePresence>

      {/* Late Entry Form */}
      <AnimatePresence>
        {showLateForm && lateStudent && (
          <LateEntryForm
            student={lateStudent}
            onSubmit={async (reason, detail) => {
              await supabase.from('late_entries').insert({
                student_id: lateStudent.studentId,
                student_name: lateStudent.studentName,
                reason,
                reason_detail: detail,
              });
              setShowLateForm(false);
              setLateStudent(null);
              toast.success('Late entry recorded');
            }}
            onDismiss={() => { setShowLateForm(false); setLateStudent(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GateMode;
