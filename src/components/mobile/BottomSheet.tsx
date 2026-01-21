import React, { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showHandle?: boolean;
  snapPoints?: number[];
  initialSnap?: number;
  className?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  showHandle = true,
  snapPoints = [0.5, 0.9],
  initialSnap = 0,
  className
}) => {
  const controls = useDragControls();
  const [currentSnap, setCurrentSnap] = React.useState(initialSnap);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity > 500 || offset > 200) {
      onClose();
    } else if (velocity < -500 && currentSnap < snapPoints.length - 1) {
      setCurrentSnap(currentSnap + 1);
    } else if (velocity > 200 && currentSnap > 0) {
      setCurrentSnap(currentSnap - 1);
    }
  };

  const sheetHeight = `${snapPoints[currentSnap] * 100}vh`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0, height: sheetHeight }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-background rounded-t-3xl shadow-2xl",
              "flex flex-col",
              "touch-pan-y",
              className
            )}
          >
            {/* Handle */}
            {showHandle && (
              <div 
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => controls.start(e)}
              >
                <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
              </div>
            )}

            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  {title && <h2 className="text-lg font-semibold">{title}</h2>}
                  {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
