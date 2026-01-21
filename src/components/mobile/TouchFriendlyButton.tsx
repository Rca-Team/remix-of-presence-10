import React, { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface TouchFriendlyButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  haptic?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children?: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const TouchFriendlyButton = forwardRef<HTMLButtonElement, TouchFriendlyButtonProps>(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  haptic = true,
  icon,
  iconPosition = 'left',
  onClick,
  disabled,
  type = 'button',
}, ref) => {
  const { trigger } = useHapticFeedback();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (haptic && !disabled) {
      trigger('light');
    }
    onClick?.(e);
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 active:shadow-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'bg-transparent hover:bg-muted text-foreground',
    destructive: 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25'
  };

  const sizeClasses = {
    sm: 'min-h-[44px] min-w-[44px] px-4 py-2 text-sm rounded-lg gap-2',
    md: 'min-h-[48px] min-w-[48px] px-5 py-2.5 text-base rounded-xl gap-2.5',
    lg: 'min-h-[56px] min-w-[56px] px-6 py-3 text-lg rounded-xl gap-3',
    xl: 'min-h-[64px] min-w-[64px] px-8 py-4 text-xl rounded-2xl gap-4'
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center font-medium transition-all duration-200',
        'touch-manipulation select-none',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </motion.button>
  );
});

TouchFriendlyButton.displayName = 'TouchFriendlyButton';

export default TouchFriendlyButton;
