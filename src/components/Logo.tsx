import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className, size = 'md', animate = false }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const iconSizes = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-14 h-14'
  };

  return (
    <div className={cn("font-semibold tracking-tight flex items-center gap-2.5", sizeClasses[size], className)}>
      <div className={cn("relative rounded-xl overflow-hidden group", iconSizes[size])}>
        {/* Background with holographic gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600" />
        
        {/* Animated shine sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer bg-[length:200%_100%]" />
        
        {/* Hexagonal grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '8px 8px'
          }}
        />

        {/* Central icon - stylized "P" mark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 32 32" className="w-[60%] h-[60%]" fill="none">
            {/* Face scan corners */}
            <path d="M8 4h-4v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            <path d="M24 4h4v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            <path d="M8 28h-4v-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            <path d="M24 28h4v-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            {/* Human head */}
            <circle cx="16" cy="12" r="4.5" stroke="white" strokeWidth="1.5" fill="none" />
            {/* Body/shoulders */}
            <path d="M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7"/>
          </svg>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/40 rounded-tl-sm" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white/40 rounded-tr-sm" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white/40 rounded-bl-sm" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/40 rounded-br-sm" />
      </div>
      
      <div className="flex flex-col leading-none">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 font-bold tracking-wide">
          PRESENCE
        </span>
        <span className="text-[10px] text-muted-foreground tracking-[0.2em] font-normal uppercase mt-0.5">
          Smart School
        </span>
      </div>
    </div>
  );
};

export default Logo;
