import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="bg-black/30 backdrop-blur-sm p-1 rounded-full flex items-center text-sm">
      <motion.button
        onClick={() => setLanguage('id')}
        className={`relative px-4 py-1.5 rounded-full transition-colors duration-300 ${
          language === 'id' ? 'text-gray-900' : 'text-white/80 hover:bg-white/10'
        }`}
      >
        {language === 'id' && (
          <motion.div
            layoutId="language-pill"
            className="absolute inset-0 bg-white rounded-full"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10 font-semibold">{t('landingPage.indonesian')}</span>
      </motion.button>
      <motion.button
        onClick={() => setLanguage('en')}
        className={`relative px-4 py-1.5 rounded-full transition-colors duration-300 ${
          language === 'en' ? 'text-gray-900' : 'text-white/80 hover:bg-white/10'
        }`}
      >
        {language === 'en' && (
          <motion.div
            layoutId="language-pill"
            className="absolute inset-0 bg-white rounded-full"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10 font-semibold">{t('landingPage.english')}</span>
      </motion.button>
    </div>
  );
};
