import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { TherapistCard } from './TherapistCard';
import { useTranslation } from '../hooks/useTranslation';
import { TherapistProfile } from '../types';

interface SwipeableCardsProps {
  therapists: TherapistProfile[];
  onWhatsAppClick: (phone: string, name: string) => void;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.8,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.8,
  }),
};

export const SwipeableCards: React.FC<SwipeableCardsProps> = ({ 
  therapists, 
  onWhatsAppClick 
}) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslation();

  const currentIndex = page % therapists.length;

  const handleInteraction = useCallback(() => {
    setShowSwipeHint(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setShowSwipeHint(true), 60000);
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem('hasSeenSwipeHint')) {
      const initialHintTimer = setTimeout(() => {
        setShowSwipeHint(true);
        sessionStorage.setItem('hasSeenSwipeHint', 'true');
      }, 1500);
      return () => clearTimeout(initialHintTimer);
    }
  }, []);

  useEffect(() => {
    handleInteraction();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [page, handleInteraction]);

  const paginate = (newDirection: number) => {
    handleInteraction();
    if ((newDirection > 0 && page === therapists.length - 1) || (newDirection < 0 && page === 0)) return;
    setPage([page + newDirection, newDirection]);
  };

  const handleDragEnd = (e: any, { offset, velocity }: PanInfo) => {
    handleInteraction();
    const swipeThreshold = 50;
    const swipePower = Math.abs(offset.x) * velocity.x;

    if (swipePower < -swipeThreshold) paginate(1);
    else if (swipePower > swipeThreshold) paginate(-1);
  };

  if (therapists.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 w-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('swipeable.noTherapists')}</h3>
          <p className="text-gray-600">{t('swipeable.adjustFilters')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <span className="text-sm text-gray-600">
          {t('swipeable.counter', { currentIndex: page + 1, totalCount: therapists.length })}
        </span>
      </div>
      
      <div className="relative h-[850px] flex items-center justify-center">
        {showSwipeHint && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="flex flex-col items-center gap-2">
              <motion.div animate={{ x: [-30, 30, -30] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} className="p-4 bg-black/60 backdrop-blur-sm rounded-full shadow-lg">
                <Hand className="w-10 h-10 text-white" style={{ transform: 'rotate(-25deg)' }} />
              </motion.div>
              <span className="text-white font-semibold text-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{t('swipeable.animatedHint')}</span>
            </motion.div>
          </motion.div>
        )}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page} custom={direction} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={1} onDragEnd={handleDragEnd}
            className="absolute w-full"
          >
            <TherapistCard therapist={therapists[currentIndex]} onWhatsAppClick={onWhatsAppClick} />
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="flex justify-center items-center mt-10 w-full space-x-8">
        <button onClick={() => paginate(-1)} disabled={page === 0} className={`p-4 rounded-full transition-colors shadow-md ${page === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary-500 text-white hover:bg-primary-600'}`}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button onClick={() => paginate(1)} disabled={page === therapists.length - 1} className={`p-4 rounded-full transition-colors shadow-md ${page === therapists.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary-500 text-white hover:bg-primary-600'}`}>
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
