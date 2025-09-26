import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { MessageCircle, Info } from 'lucide-react';
import { getWhatsAppUrl } from '../utils/location';
import { useTranslation } from '../hooks/useTranslation';

export const RequestActivationPage: React.FC = () => {
  const { t } = useTranslation();
  const salesNumber = import.meta.env.VITE_SALES_WHATSAPP_NUMBER || '+6281392000050';
  const message = "Hi, I would like to activate my account on the 2Go Massage Directory. Can you provide payment details?";
  const whatsAppUrl = getWhatsAppUrl(salesNumber, message);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo layout="horizontal" className="h-12 w-auto mx-auto" />
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Info className="h-8 w-8 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              {t('activation.accountPending')}
            </h2>
          </div>
          <p className="text-gray-600 text-center mb-8">
            {t('activation.submittedMessage')}
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800">{t('activation.subscriptionTitle')}</h3>
            <p className="text-4xl font-extrabold text-gray-900 mt-2">
              Rp150.000
            </p>
          </div>

          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-bold text-lg flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{t('activation.paymentWhatsAppButton')}</span>
          </a>
          <p className="text-xs text-gray-500 mt-4 text-center">
            {t('activation.adminActivationNote')}
          </p>
        </div>
        <div className="mt-6 text-center">
          <Link to="/dashboard" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            {t('activation.backToDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
};
