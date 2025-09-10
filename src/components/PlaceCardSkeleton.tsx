import React from 'react';
import { motion } from 'framer-motion';

export const PlaceCardSkeleton: React.FC = () => (
  <motion.div
    className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col animate-pulse"
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="w-full h-48 bg-gray-200" />
    <div className="p-5 flex flex-col flex-grow">
      <div className="h-6 w-3/4 bg-gray-300 rounded mb-2" />
      <div className="h-4 w-full bg-gray-200 rounded mb-3" />
      <div className="h-6 w-1/2 bg-gray-200 rounded mb-4" />
      <div className="flex-grow mb-4">
        <div className="h-3 w-1/4 bg-gray-300 rounded mb-2" />
        <div className="flex flex-wrap gap-1.5">
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
          <div className="h-5 w-24 bg-gray-200 rounded-full" />
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-3">
        <div className="h-10 w-full bg-gray-300 rounded-lg" />
        <div className="h-10 w-full bg-gray-200 rounded-lg" />
      </div>
    </div>
  </motion.div>
);
