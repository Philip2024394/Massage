import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { Loader } from 'lucide-react';

export const LoadingScreen: React.FC = () => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
  >
    <Logo layout="vertical" className="h-40 w-auto" />
    <div className="mt-8 flex items-center space-x-2 text-gray-500">
      <Loader className="h-5 w-5 animate-spin" />
      <span>Loading Experience...</span>
    </div>
  </motion.div>
);
