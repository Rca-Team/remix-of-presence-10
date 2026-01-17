import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface GradientCardProps {
  title?: string;
  value?: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  gradient?: 'cyan' | 'purple' | 'green' | 'orange' | 'pink' | 'blue';
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const gradientMap = {
  cyan: 'from-cyan-500 to-cyan-600',
  purple: 'from-purple-500 to-purple-600',
  green: 'from-green-500 to-emerald-600',
  orange: 'from-orange-500 to-red-600',
  pink: 'from-pink-500 to-rose-600',
  blue: 'from-blue-500 to-blue-600',
};

const borderMap = {
  cyan: 'border-cyan-500/30',
  purple: 'border-purple-500/30',
  green: 'border-green-500/30',
  orange: 'border-orange-500/30',
  pink: 'border-pink-500/30',
  blue: 'border-blue-500/30',
};

const glowMap = {
  cyan: 'shadow-cyan-500/25',
  purple: 'shadow-purple-500/25',
  green: 'shadow-green-500/25',
  orange: 'shadow-orange-500/25',
  pink: 'shadow-pink-500/25',
  blue: 'shadow-blue-500/25',
};

export const GradientCard: React.FC<GradientCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient = 'blue',
  trend,
  className,
  onClick,
  children
}) => {
  // If children are provided, render as a simple gradient container
  if (children) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-gradient-to-br shadow-lg transition-all duration-300 hover:shadow-xl',
          gradientMap[gradient],
          glowMap[gradient],
          className
        )}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  // Original card layout with title/value
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card p-6 transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-xl cursor-pointer',
        borderMap[gradient],
        `hover:${glowMap[gradient]}`,
        className
      )}
      onClick={onClick}
    >
      {/* Background gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-10',
        gradientMap[gradient]
      )} />
      
      {/* Animated glow orb */}
      <div className={cn(
        'absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-30 transition-opacity group-hover:opacity-60',
        gradient === 'cyan' && 'bg-cyan-400',
        gradient === 'purple' && 'bg-purple-400',
        gradient === 'green' && 'bg-green-400',
        gradient === 'orange' && 'bg-orange-400',
        gradient === 'pink' && 'bg-pink-400',
        gradient === 'blue' && 'bg-blue-400',
      )} />
      
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            {title && <p className="text-sm font-medium text-muted-foreground">{title}</p>}
            {value !== undefined && <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>}
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                'mt-2 flex items-center gap-1 text-xs font-medium',
                trend.positive ? 'text-green-500' : 'text-red-500'
              )}>
                <span>{trend.positive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground">vs last week</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn(
              'rounded-lg bg-background/50 p-3 backdrop-blur-sm',
              gradient === 'cyan' && 'text-cyan-400',
              gradient === 'purple' && 'text-purple-400',
              gradient === 'green' && 'text-green-400',
              gradient === 'orange' && 'text-orange-400',
              gradient === 'pink' && 'text-pink-400',
              gradient === 'blue' && 'text-blue-400',
            )}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
