import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import type { GateEntry } from '@/pages/GateMode';

interface GateEntryFeedbackProps {
  entry: GateEntry;
  onDismiss: () => void;
}

const GateEntryFeedback = ({ entry, onDismiss }: GateEntryFeedbackProps) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isRecognized = entry.isRecognized;
  const isLate = entry.isLate;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'tween', duration: 0.3 }}
      className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
        isRecognized 
          ? isLate ? 'bg-yellow-500/20' : 'bg-green-500/20'
          : 'bg-destructive/20'
      }`}
    >
      <motion.div
        initial={{ y: 30 }}
        animate={{ y: 0 }}
        className="bg-card/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-2xl text-center max-w-[85vw] sm:max-w-sm pointer-events-auto mx-4"
      >
        {isRecognized ? (
          isLate ? (
            <Clock className="h-10 w-10 sm:h-16 sm:w-16 text-yellow-500 mx-auto mb-2 sm:mb-4" />
          ) : (
            <CheckCircle2 className="h-10 w-10 sm:h-16 sm:w-16 text-green-500 mx-auto mb-2 sm:mb-4" />
          )
        ) : (
          <AlertTriangle className="h-10 w-10 sm:h-16 sm:w-16 text-destructive mx-auto mb-2 sm:mb-4" />
        )}
        
        <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2 truncate">
          {isRecognized ? entry.studentName : 'Unknown Person'}
        </h2>
        
        <p className="text-muted-foreground text-sm sm:text-lg">
          {isRecognized 
            ? isLate ? '⏰ Late Entry' : '✅ Welcome!'
            : '⚠️ Not Registered'}
        </p>
        
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
          {entry.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          {isRecognized && ` • ${(entry.confidence * 100).toFixed(0)}% match`}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default GateEntryFeedback;
