import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Command
} from 'lucide-react';

interface VoiceCommandsProps {
  onCommand?: (command: string) => void;
}

const VoiceCommands: React.FC<VoiceCommandsProps> = ({ onCommand }) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  const startListening = () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Voice commands are not supported in your browser",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript.toLowerCase();
      setTranscript(text);

      if (event.results[current].isFinal) {
        processCommand(text);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processCommand = (text: string) => {
    const commands = [
      { trigger: ['scan', 'start scan', 'begin scan'], action: 'scan' },
      { trigger: ['take attendance', 'mark attendance'], action: 'scan' },
      { trigger: ['show stats', 'statistics', 'show statistics'], action: 'stats' },
      { trigger: ['show gallery', 'gallery', 'photos'], action: 'gallery' },
      { trigger: ['help', 'instructions', 'how to'], action: 'help' },
    ];

    for (const cmd of commands) {
      if (cmd.trigger.some(t => text.includes(t))) {
        onCommand?.(cmd.action);
        toast({
          title: "Command Recognized",
          description: `Executing: ${cmd.action}`,
        });
        return;
      }
    }

    toast({
      title: "Unknown Command",
      description: `Didn't recognize: "${text}"`,
      variant: "destructive"
    });
  };

  const commands = [
    { text: '"Start scan"', desc: 'Begin face scanning' },
    { text: '"Show stats"', desc: 'View statistics' },
    { text: '"Show gallery"', desc: 'View attendance photos' },
  ];

  if (!isSupported) return null;

  return (
    <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-900/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Command className="w-5 h-5 text-purple-500" />
          <span className="font-medium text-sm">Voice Commands</span>
          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">
            Beta
          </Badge>
        </div>

        <Button
          size="sm"
          variant={isListening ? "destructive" : "outline"}
          onClick={startListening}
          className="gap-2"
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              Stop
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Listen
            </>
          )}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Volume2 className="w-5 h-5 text-purple-500" />
              </motion.div>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-600">Listening...</p>
                {transcript && (
                  <p className="text-xs text-muted-foreground">{transcript}</p>
                )}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    className="w-1 h-4 bg-purple-500 rounded-full"
                    animate={{ scaleY: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        {commands.map((cmd, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 text-xs">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span className="font-medium">{cmd.text}</span>
            <span className="text-muted-foreground">- {cmd.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceCommands;
