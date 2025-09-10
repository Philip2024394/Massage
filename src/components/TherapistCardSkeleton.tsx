import React from 'react';
import { motion } from 'framer-motion';

export const TherapistCardSkeleton: React.FC = () => (
  <motion.div
    className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse"
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="relative">
      <div className="w-full h-80 bg-gray-200" />
      <div className="absolute top-4 left-4">
        <div className="h-7 w-24 bg-gray-300 rounded-full" />
      </div>
    </div>
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-6 w-40 bg-gray-300 rounded mb-2" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-8 w-28 bg-gray-200 rounded-lg" />
      </div>
      <div className="flex items-center space-x-4 mb-4">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="mb-4">
        <div className="h-4 w-20 bg-gray-300 rounded mb-2" />
        <div className="flex flex-wrap gap-2">
          <div className="h-5 w-24 bg-gray-200 rounded-full" />
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
          <div className="h-5 w-28 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="mb-6">
        <div className="h-4 w-20 bg-gray-300 rounded mb-2" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-gray-100 rounded-lg" />
          <div className="h-16 bg-gray-100 rounded-lg" />
          <div className="h-16 bg-gray-100 rounded-lg" />
        </div>
      </div>
      <div className="space-y-2 mb-6">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="h-12 bg-gray-300 rounded-xl" />
    </div>
  </motion.div>
);
