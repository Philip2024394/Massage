import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '../utils/location';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  
  const salesNumber = import.meta.env.VITE_SALES_WHATSAPP_NUMBER || '+6281392000050';
  const message = "Hi, I would like to join the 2Go Massage Directory. Can You provide Details With Payment Link. Thank You.";
  const whatsAppUrl = getWhatsAppUrl(salesNumber, message);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo layout="horizontal" className="h-12 w-auto mx-auto" />
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Activate Your Account
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Contact our sales team to activate your 1-month subscription.
          </p>

          <div className="p-6 rounded-lg border-2 border-primary-500 bg-primary-50 mb-6">
            <h3 className="text-lg font-bold text-gray-800">1 Month Subscription</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">
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
            <span>Contact Sales to Activate</span>
          </a>
          <p className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
            <MessageCircle className="h-3 w-3" /> Pay via WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
};
