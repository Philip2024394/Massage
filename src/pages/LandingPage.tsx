import React from 'react';
import { motion } from 'framer-motion';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-cover bg-center overflow-hidden relative"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=80')" }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div className="relative z-10 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight" style={{ textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>
            Welcome to 2Go Massage
          </h1>
          <p className="mt-4 text-lg text-white/80" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            {t('landingPage.selectLanguage')}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="relative w-full"
        >
          <LanguageSelector />
        </motion.div>
      </div>
    </div>
  );
};
