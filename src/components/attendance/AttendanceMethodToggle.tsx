import React from 'react';
import { motion } from 'framer-motion';
import { Scan, QrCode } from 'lucide-react';

interface AttendanceMethodToggleProps {
  method: 'face' | 'qr';
  onChange: (method: 'face' | 'qr') => void;
}

const AttendanceMethodToggle: React.FC<AttendanceMethodToggleProps> = ({ method, onChange }) => {
  return (
    <div className="flex items-center justify-center mb-4">
      <div className="flex p-1 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-cyan-500/20">
        <motion.button
          onClick={() => onChange('face')}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            method === 'face' 
              ? 'text-white' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          {method === 'face' && (
            <motion.div
              layoutId="activeMethod"
              className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            <Scan className="w-4 h-4" />
            Face Recognition
          </span>
        </motion.button>

        <motion.button
          onClick={() => onChange('qr')}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            method === 'qr' 
              ? 'text-white' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          {method === 'qr' && (
            <motion.div
              layoutId="activeMethod"
              className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            QR Code
          </span>
        </motion.button>
      </div>
    </div>
  );
};

export default AttendanceMethodToggle;