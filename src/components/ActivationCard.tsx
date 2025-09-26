import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader, Key, AlertTriangle, MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '../utils/location';

interface ActivationCardProps {
  entityId: string;
  entityType: 'therapist' | 'place';
  loginCode: string;
  onActivated: () => void;
}

export const ActivationCard: React.FC<ActivationCardProps> = ({ entityId, entityType, loginCode, onActivated }) => {
  const [activationCode, setActivationCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const salesNumber = '+6281392000050';
  const message = "Hi, I would like to join the 2Go Massage Directory. Can You provide Details With Payment Link. Thank You.";
  const whatsAppUrl = getWhatsAppUrl(salesNumber, message);

  const handleCodeActivation = async () => {
    if (!activationCode) {
      setError('Please enter an activation code.');
      return;
    }
    setIsProcessing(true);
    setError('');

    try {
      const { data, error: functionError } = await supabase.functions.invoke('activate-account', {
        body: { entityId, entityType, activationCode },
      });

      if (functionError) throw new Error(functionError.message);
      if (data.error) throw new Error(data.error);

      alert('Account activated successfully!');
      onActivated();

    } catch (err: any) {
      setError(err.message || 'An error occurred. Please check the code and try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg shadow-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div className="ml-4 flex-grow">
          <h3 className="text-lg font-bold text-red-800">Account Inactive</h3>
          <p className="text-sm text-red-700 mt-1 mb-4">
            Your account is currently inactive or has expired. Please choose a method below to activate your 1-month subscription.
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
              <span>2Go Payments</span>
            </a>
            <p className="text-xs text-gray-500 mt-1 text-center flex items-center justify-center gap-1">
              <MessageCircle className="h-3 w-3" /> Pay via WhatsApp
            </p>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-gray-500">OR</span></div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Use activation code:</label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" value={activationCode} onChange={(e) => setActivationCode(e.target.value)} placeholder="Enter code..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg" />
                </div>
                <button onClick={handleCodeActivation} disabled={isProcessing} className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50">
                  {isProcessing ? <Loader className="animate-spin h-4 w-4" /> : 'Apply'}
                </button>
              </div>
              {error && <p className="text-red-500 text-center text-xs mt-2">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
