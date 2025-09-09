import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';
import { CandleAnimation } from '../components/CandleAnimation';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-cover bg-center overflow-hidden relative"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1920&q=80')" }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div className="relative z-10 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Logo className="mb-4" layout="vertical" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="relative mt-8"
        >
          <p className="text-white/90 font-light text-lg mb-6">{t('landingPage.selectLanguage')}</p>
          <LanguageSelector />
        </motion.div>
      </div>

      {/* Animated Candles for ambiance */}
      <CandleAnimation className="absolute bottom-4 left-4 hidden md:block" />
      <CandleAnimation className="absolute bottom-4 right-4 hidden md:block" />
    </div>
  );
};
