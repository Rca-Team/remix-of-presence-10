import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Scan, Sparkles, Zap, Shield } from 'lucide-react';

interface SplashAnimationProps {
  onComplete?: () => void;
  duration?: number;
}

const SplashAnimation: React.FC<SplashAnimationProps> = ({
  onComplete,
  duration = 3500,
}) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, duration / 50);

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 600);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden"
        >
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.4, 0.2, 0.4],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"
            />
          </div>

          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />

          {/* Main content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center z-10"
          >
            {/* Glowing orb behind logo */}
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 60px 30px rgba(59, 130, 246, 0.3)',
                  '0 0 80px 40px rgba(59, 130, 246, 0.5)',
                  '0 0 60px 30px rgba(59, 130, 246, 0.3)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-40 h-40 rounded-full bg-blue-500/20 blur-2xl"
            />

            {/* Logo Icon with scanning effect */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: 360 }}
              transition={{ duration: 3, ease: "easeInOut" }}
              className="relative mb-8"
            >
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                {/* Outer ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400/30"
                />
                
                {/* Middle ring with gradient */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-3 rounded-full border-2 border-cyan-400/40"
                />

                {/* Inner glow circle */}
                <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/30">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Scan className="w-12 h-12 md:w-16 md:h-16 text-blue-400" />
                  </div>
                </div>

                {/* Orbiting dots */}
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ rotate: 360 }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "linear",
                      delay: i * 0.25 
                    }}
                    className="absolute inset-0"
                  >
                    <div 
                      className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                      style={{ 
                        top: '50%', 
                        left: '50%',
                        transform: `translate(-50%, -50%) translateX(${55 + i * 2}px)`,
                        boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                      }}
                    />
                  </motion.div>
                ))}

                {/* Sparkle decorations */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1.2, 1, 1.2], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute -bottom-1 -left-1"
                >
                  <Zap className="w-5 h-5 text-yellow-400" />
                </motion.div>
              </div>
            </motion.div>

            {/* App Name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  PRESENCE
                </span>
              </h1>
              <p className="text-blue-200/60 text-sm md:text-base tracking-widest font-light">
                SMART ATTENDANCE SYSTEM
              </p>
            </motion.div>

            {/* Feature badges */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-wrap justify-center gap-3 mb-8"
            >
              {[
                { icon: Scan, text: 'AI Recognition' },
                { icon: Shield, text: 'Secure' },
                { icon: Zap, text: 'Real-time' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs"
                >
                  <item.icon className="w-3 h-3" />
                  {item.text}
                </motion.div>
              ))}
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="w-64 md:w-80"
            >
              <div className="relative h-1.5 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-blue-500/10">
                {/* Shimmer effect */}
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                />
                
                {/* Progress fill */}
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </motion.div>
              </div>
              
              {/* Progress percentage */}
              <motion.div 
                className="mt-3 text-center"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {Math.round(progress)}%
                </span>
              </motion.div>
            </motion.div>

            {/* Loading text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-blue-300/50 text-xs tracking-wider"
            >
              {progress < 30 ? 'Initializing...' : 
               progress < 60 ? 'Loading models...' : 
               progress < 90 ? 'Almost ready...' : 
               'Welcome!'}
            </motion.p>
          </motion.div>

          {/* Scan line effect */}
          <motion.div
            initial={{ top: '0%' }}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashAnimation;
