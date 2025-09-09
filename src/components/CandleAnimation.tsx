import React from 'react';
import { motion } from 'framer-motion';

const flameVariants = {
  flicker: {
    opacity: [0.8, 1, 0.7, 1, 0.9],
    scale: [1, 1.05, 0.95, 1.02, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    },
  },
};

const glowVariants = {
  flicker: {
    opacity: [0.5, 0.7, 0.6, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    },
  },
};

export const CandleAnimation: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`relative w-12 h-20 ${className}`}>
      {/* Candle Body */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-16 bg-gradient-to-t from-yellow-50/70 to-white/90 rounded-t-md shadow-inner" />
      
      {/* Wick */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-gray-800" />

      {/* Glow */}
      <motion.div
        variants={glowVariants}
        animate="flicker"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-400 rounded-full filter blur-2xl"
      />

      {/* Flame */}
      <motion.div
        variants={flameVariants}
        animate="flicker"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-gradient-to-b from-yellow-300 to-orange-500 rounded-full"
        style={{ clipPath: 'ellipse(50% 60% at 50% 100%)' }}
      />
    </div>
  );
};
