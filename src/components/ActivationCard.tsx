import React from 'react';
import { AlertTriangle, MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '../utils/location';

export const ActivationCard: React.FC = () => {
  const salesNumber = import.meta.env.VITE_SALES_WHATSAPP_NUMBER || '+6281392000050';
  const message = "Hi, I would like to join the 2Go Massage Directory. Can You provide Details With Payment Link. Thank You.";
  const whatsAppUrl = getWhatsAppUrl(salesNumber, message);

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg shadow-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div className="ml-4 flex-grow">
          <h3 className="text-lg font-bold text-red-800">Account Inactive</h3>
          <p className="text-sm text-red-700 mt-1 mb-4">
            Your account is currently inactive or has expired. Please contact sales via WhatsApp to activate your 1-month subscription.
          </p>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="p-4 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 mb-4 text-center">
              <h4 className="text-md font-bold text-gray-800">1 Month Subscription</h4>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">Rp150.000</p>
            </div>
            
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 font-bold flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Contact Sales to Activate</span>
            </a>
            <p className="text-xs text-gray-500 mt-1 text-center flex items-center justify-center gap-1">
              <MessageCircle className="h-3 w-3" /> Pay via WhatsApp
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
