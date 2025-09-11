import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { EnglishFlag } from './flags/EnglishFlag';
import { IndonesianFlag } from './flags/IndonesianFlag';

export const LanguageSelector: React.FC = () => {
  const { setLanguage, t } = useTranslation();
  const navigate = useNavigate();

  const handleLanguageSelect = (lang: 'en' | 'id') => {
    setLanguage(lang);
    navigate('/home');
  };

  return (
    <div className="flex justify-center items-center gap-8">
      <motion.div
        whileHover={{ scale: 1.1, y: -5, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleLanguageSelect('en')}
        className="cursor-pointer group flex flex-col items-center gap-3"
      >
        <EnglishFlag className="w-16 h-16" />
        <span className="font-semibold text-lg text-white opacity-80 group-hover:opacity-100 transition-opacity">{t('landingPage.english')}</span>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.1, y: -5, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleLanguageSelect('id')}
        className="cursor-pointer group flex flex-col items-center gap-3"
      >
        <IndonesianFlag className="w-16 h-16" />
        <span className="font-semibold text-lg text-white opacity-80 group-hover:opacity-100 transition-opacity">{t('landingPage.indonesian')}</span>
      </motion.div>
    </div>
  );
};
