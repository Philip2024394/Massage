import React from 'react';
import { motion } from 'framer-motion';

const smokeVariants = {
  initial: {
    y: 0,
    opacity: 0,
    scale: 0.5,
  },
  animate: {
    y: -100,
    opacity: [0, 0.5, 0.5, 0],
    scale: [0.5, 1, 1.2],
    x: [0, -10, 10, -5, 5, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export const IncenseAnimation: React.FC = () => {
  return (
    <div className="relative w-64 h-24 pointer-events-none flex items-center justify-center">
      <div className="relative w-full h-full">
        {/* Smoke Puffs originating from the right side */}
        <motion.div
          variants={smokeVariants}
          initial="initial"
          animate="animate"
          className="absolute top-1/2 right-0 w-3 h-3 bg-white/40 rounded-full filter blur-sm"
        />
        <motion.div
          variants={smokeVariants}
          initial="initial"
          animate="animate"
          transition={{ ...smokeVariants.animate.transition, delay: 2.5 }}
          className="absolute top-1/2 right-0 w-4 h-4 bg-white/30 rounded-full filter blur-md"
        />
        <motion.div
          variants={smokeVariants}
          initial="initial"
          animate="animate"
          transition={{ ...smokeVariants.animate.transition, delay: 5 }}
          className="absolute top-1/2 right-0 w-2 h-2 bg-white/50 rounded-full filter blur-sm"
        />

        {/* Incense Stick */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 bg-gradient-to-r from-yellow-900/10 via-yellow-800 to-black rounded-full shadow-inner">
          {/* Glowing Tip */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full filter blur-[2px] shadow-[0_0_5px_#ff0000]">
            <motion.div 
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full bg-orange-400 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
