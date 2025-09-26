import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Logo } from '../components/Logo';
import { Loader, Key, MessageCircle } from 'lucide-react';
import { getWhatsAppUrl } from '../utils/location';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { entityId, entityType, loginCode } = location.state || {};
  
  const [activationCode, setActivationCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!entityId || !entityType || !loginCode) {
    navigate('/register');
    return null;
  }

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

      navigate('/activation-success', { state: { loginCode } });

    } catch (err: any) {
      setError(err.message || 'An error occurred. Please check the code and try again.');
      setIsProcessing(false);
    }
  };

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
            Choose a method to activate your 1-month subscription.
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
            <span>2Go Payments</span>
          </a>
          <p className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
            <MessageCircle className="h-3 w-3" /> Pay via WhatsApp
          </p>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-2 text-sm text-gray-500">OR</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Have an activation code?</label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="Enter code..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button onClick={handleCodeActivation} disabled={isProcessing} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50">
                {isProcessing ? <Loader className="animate-spin h-5 w-5" /> : 'Apply'}
              </button>
            </div>
            {error && <p className="text-red-500 text-center text-sm mt-3">{error}</p>}
          </div>

        </div>
      </div>
    </div>
  );
};
