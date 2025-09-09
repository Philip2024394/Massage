import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { Logo } from '../components/Logo';

export const TermsPage: React.FC = () => {
  const { t } = useTranslation();

  const TermSection: React.FC<{ title: string; content: string }> = ({ title, content }) => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 leading-relaxed">{content}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/home" className="text-gray-700 hover:text-primary-600 p-2 rounded-full" title="Back to Home">
              <Home className="h-6 w-6" />
            </Link>
            <Logo layout="horizontal" className="h-10 w-auto" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('termsPage.title')}</h1>
          <p className="text-sm text-gray-500 mb-8">{t('termsPage.lastUpdated')}</p>
          
          <div className="space-y-8">
            <TermSection title={t('termsPage.introductionTitle')} content={t('termsPage.introductionContent')} />
            <TermSection title={t('termsPage.serviceDescriptionTitle')} content={t('termsPage.serviceDescriptionContent')} />
            <TermSection title={t('termsPage.userResponsibilitiesTitle')} content={t('termsPage.userResponsibilitiesContent')} />
            <TermSection title={t('termsPage.therapistResponsibilitiesTitle')} content={t('termsPage.therapistResponsibilitiesContent')} />
            <TermSection title={t('termsPage.disclaimerTitle')} content={t('termsPage.disclaimerContent')} />
            <TermSection title={t('termsPage.changesToTermsTitle')} content={t('termsPage.changesToTermsContent')} />
          </div>
        </div>
      </main>
    </div>
  );
};
