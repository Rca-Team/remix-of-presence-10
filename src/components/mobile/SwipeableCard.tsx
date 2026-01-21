import React, { ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  leftColor?: string;
  rightColor?: string;
  className?: string;
  swipeThreshold?: number;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  leftColor = 'bg-destructive',
  rightColor = 'bg-success',
  className,
  swipeThreshold = 100
}) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const leftIconScale = useTransform(x, [0, -swipeThreshold], [0.5, 1.2]);
  const rightIconScale = useTransform(x, [0, swipeThreshold], [0.5, 1.2]);
  const leftOpacity = useTransform(x, [0, -50], [0, 1]);
  const rightOpacity = useTransform(x, [0, 50], [0, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -swipeThreshold || velocity < -500) {
      onSwipeLeft?.();
    } else if (offset > swipeThreshold || velocity > 500) {
      onSwipeRight?.();
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Left action background */}
      <motion.div
        style={{ opacity: leftOpacity }}
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end px-6",
          leftColor
        )}
      >
        <motion.div style={{ scale: leftIconScale }}>
          {leftAction || <X className="w-6 h-6 text-white" />}
        </motion.div>
      </motion.div>

      {/* Right action background */}
      <motion.div
        style={{ opacity: rightOpacity }}
        className={cn(
          "absolute inset-y-0 left-0 flex items-center justify-start px-6",
          rightColor
        )}
      >
        <motion.div style={{ scale: rightIconScale }}>
          {rightAction || <Check className="w-6 h-6 text-white" />}
        </motion.div>
      </motion.div>

      {/* Main content */}
      <motion.div
        style={{ x, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-card touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeableCard;
