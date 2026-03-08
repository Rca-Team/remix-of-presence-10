import React from 'react';
import { cn } from '@/lib/utils';
import presenceLogo from '@/assets/presence-logo.png';

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
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14'
  };

  return (
    <div className={cn("font-semibold tracking-tight flex items-center gap-2", sizeClasses[size], className)}>
      <img 
        src={presenceLogo} 
        alt="Presence Logo" 
        className={cn(iconSizes[size], "object-contain")}
      />
      <div className="flex flex-col leading-none">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan via-primary to-violet font-bold tracking-wide">
          PRESENCE
        </span>
        <span className="text-[10px] text-muted-foreground tracking-[0.15em] font-normal uppercase mt-0.5">
          Smart Attendance
        </span>
      </div>
    </div>
  );
};

export default Logo;
