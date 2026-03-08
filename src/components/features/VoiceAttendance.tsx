import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, CheckCircle2, XCircle, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RecognizedStudent {
  id: string;
  name: string;
  status: 'present' | 'late' | 'absent';
  confidence: number;
  timestamp: string;
}

export default function VoiceAttendance() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [students, setStudents] = useState<RecognizedStudent[]>([]);
  const [registeredNames, setRegisteredNames] = useState<{ id: string; name: string }[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Load registered students
  useEffect(() => {
    const loadStudents = async () => {
      const { data } = await supabase
        .from('face_descriptors')
        .select('user_id, label');
      if (data) {
        const names = data
          .filter(d => d.label)
          .map(d => ({ id: d.user_id, name: d.label! }));
        // Deduplicate
        const unique = Array.from(new Map(names.map(n => [n.id, n])).values());
        setRegisteredNames(unique);
      }
    };
    loadStudents();
  }, []);

  const findMatch = useCallback((spoken: string): { id: string; name: string } | null => {
    const lower = spoken.toLowerCase().trim();
    // Try exact match first, then partial
    for (const student of registeredNames) {
      if (student.name.toLowerCase() === lower) return student;
    }
    for (const student of registeredNames) {
      const nameParts = student.name.toLowerCase().split(' ');
      if (nameParts.some(part => part === lower || lower.includes(part))) return student;
    }
    return null;
  }, [registeredNames]);

  const markAttendance = useCallback(async (student: { id: string; name: string }, status: 'present' | 'late') => {
    // Check if already marked today
    const today = new Date().toISOString().split('T')[0];
    const existing = students.find(s => s.id === student.id);
    if (existing) {
      speak(`${student.name} already marked ${existing.status}`);
      return;
    }

    try {
      const { error } = await supabase.from('attendance_records').insert({
        user_id: student.id,
        status,
        timestamp: new Date().toISOString(),
        device_info: { method: 'voice_attendance' } as any,
      });

      if (error) throw error;

      const record: RecognizedStudent = {
        id: student.id,
        name: student.name,
        status,
        confidence: 1,
        timestamp: new Date().toISOString(),
      };

      setStudents(prev => [record, ...prev]);
      speak(`${student.name}, ${status}`);

      toast({
        title: `✅ ${student.name}`,
        description: `Marked ${status} via voice`,
      });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to record attendance', variant: 'destructive' });
    }
  }, [students, toast]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const processTranscript = useCallback((text: string) => {
    setCurrentCommand(text);
    const lower = text.toLowerCase().trim();

    // Check for status keywords
    let status: 'present' | 'late' = 'present';
    if (lower.includes('late')) status = 'late';

    // Remove status keywords to get the name
    const cleanName = lower
      .replace(/\b(present|late|mark|attendance|here|is)\b/g, '')
      .trim();

    if (cleanName.length > 1) {
      const match = findMatch(cleanName);
      if (match) {
        markAttendance(match, status);
      } else {
        setCurrentCommand(`❓ "${cleanName}" not found`);
      }
    }
  }, [findMatch, markAttendance]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Not Supported', description: 'Speech recognition not available in this browser', variant: 'destructive' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }

      setTranscript(interimTranscript || finalTranscript);
      if (finalTranscript) processTranscript(finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      if (event.error !== 'no-speech') {
        toast({ title: 'Voice Error', description: event.error, variant: 'destructive' });
      }
    };

    recognition.onend = () => {
      if (isListening) recognition.start(); // Auto-restart
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    speak('Voice attendance started. Say student names to mark present.');
  }, [isListening, processTranscript, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    speak(`Voice attendance stopped. ${students.length} students marked.`);
  }, [students.length]);

  const statusIcon = (s: string) => {
    if (s === 'present') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (s === 'late') return <AlertCircle className="h-4 w-4 text-amber-500" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-primary/20">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            Voice-Powered Attendance
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Say student names to mark attendance hands-free
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {/* Mic Button */}
          <motion.div className="relative">
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
            <Button
              size="lg"
              onClick={isListening ? stopListening : startListening}
              className={`h-24 w-24 rounded-full relative z-10 ${
                isListening
                  ? 'bg-destructive hover:bg-destructive/90'
                  : 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500'
              }`}
            >
              {isListening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
            </Button>
          </motion.div>

          {/* Live Transcript */}
          <AnimatePresence mode="wait">
            {(transcript || currentCommand) && (
              <motion.div
                key={currentCommand || transcript}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                {transcript && (
                  <p className="text-lg font-medium text-foreground">
                    🎙️ "{transcript}"
                  </p>
                )}
                {currentCommand && (
                  <p className="text-sm text-muted-foreground mt-1">{currentCommand}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="flex gap-4">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" /> {registeredNames.length} registered
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {students.length} marked
            </Badge>
          </div>

          {/* Instructions */}
          {!isListening && students.length === 0 && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-4 w-full max-w-sm">
              <p className="font-medium mb-2">How to use:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Tap the mic to start listening</li>
                <li>Say a student's name → marked <strong>present</strong></li>
                <li>Say "<strong>late</strong> [name]" → marked <strong>late</strong></li>
                <li>Tap mic again to stop</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marked Students List */}
      {students.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendance Log ({students.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {students.map((s, i) => (
                  <motion.div
                    key={s.id + s.timestamp}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40"
                  >
                    <div className="flex items-center gap-3">
                      {statusIcon(s.status)}
                      <span className="font-medium text-sm text-foreground">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.status === 'present' ? 'default' : 'secondary'} className="text-xs">
                        {s.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
