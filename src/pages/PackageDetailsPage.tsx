import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShieldCheck, Droplet, Shirt } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { Logo } from '../components/Logo';

export const PackageDetailsPage: React.FC = () => {
  const { t } = useTranslation();

  const DetailSection: React.FC<{ icon: React.ReactNode; title: string; content: string }> = ({ icon, title, content }) => (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 mt-1 text-primary-500">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1 whitespace-nowrap">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{content}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/home" className="text-gray-700 hover:text-primary-600 p-2 rounded-full" title={t('packageDetailsPage.backToHome')}>
              <Home className="h-6 w-6" />
            </Link>
            <Logo layout="horizontal" className="h-10 w-auto" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 max-w-md">{t('packageDetailsPage.mainTitle')}</h1>
          <p className="text-sm text-gray-500 mb-8">{t('packageDetailsPage.subtitle')}</p>
          
          <div className="space-y-10">
            <DetailSection 
              icon={<Droplet className="h-6 w-6" />}
              title={t('packageDetailsPage.materialsTitle')}
              content={t('packageDetailsPage.materialsContent')}
            />
            <DetailSection 
              icon={<Shirt className="h-6 w-6" />}
              title={t('packageDetailsPage.standardTitle')}
              content={t('packageDetailsPage.standardContent')}
            />
            <DetailSection 
              icon={<ShieldCheck className="h-6 w-6" />}
              title={t('packageDetailsPage.rightsTitle')}
              content={t('packageDetailsPage.rightsContent')}
            />
             <DetailSection 
              icon={<ShieldCheck className="h-6 w-6" />}
              title={t('packageDetailsPage.safetyTitle')}
              content={t('packageDetailsPage.safetyContent')}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
