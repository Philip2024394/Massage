import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSelector } from '../components/LanguageSelector';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const title = t('landingPage.title');
  const titleParts = title.split(',').map(part => part.trim());

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-cover bg-center overflow-hidden relative"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=80')" }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="absolute top-6 z-20">
        <LanguageSelector />
      </div>
      
      <div className="relative z-10 text-center flex flex-col items-center text-white">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight" style={{ textShadow: '0 3px 6px rgba(0,0,0,0.4)' }}>
            {titleParts[0]}
            {titleParts.length > 1 && <><br />{titleParts[1]}</>}
          </h1>
          <p className="mt-6 text-lg md:text-xl max-w-xl mx-auto text-white/80" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {t('landingPage.subtitle')}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        >
          <Link 
            to="/home"
            className="mt-10 inline-block bg-primary-500 text-white font-bold py-4 px-12 rounded-full text-lg transition-all duration-300 ease-in-out hover:bg-primary-600 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            {t('landingPage.cta')}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
