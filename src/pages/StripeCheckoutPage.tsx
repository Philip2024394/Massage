import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader, ShieldCheck } from 'lucide-react';

export const StripeCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { entityId, entityType, loginCode } = location.state || {};
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!entityId || !entityType || !loginCode) {
      navigate('/register');
    }
  }, [entityId, entityType, loginCode, navigate]);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const { data, error: functionError } = await supabase.functions.invoke('activate-account', {
        body: { entityId, entityType },
      });

      if (functionError) throw new Error(functionError.message);
      if (data.error) throw new Error(data.error);

      navigate('/activation-success', { state: { loginCode } });

    } catch (err: any) {
      setError(err.message || 'An error occurred during activation.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">Stripe Checkout</h2>
        <p className="text-gray-600 text-center mb-6">This is a simulation of the Stripe payment process.</p>
        
        <div className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-700">2Go Massage - 1 Month</span>
            <span className="font-bold text-gray-800">Rp150.000</span>
          </div>
          <div className="border-t pt-4 flex justify-between items-center">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="font-bold text-xl text-gray-900">Rp150.000</span>
          </div>
        </div>

        {error && <p className="text-red-500 text-center text-sm my-4">{error}</p>}

        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader className="animate-spin h-5 w-5" />
              Processing Payment...
            </>
          ) : (
            'Pay Now'
          )}
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Secure Payment Simulation
        </p>
      </div>
    </div>
  );
};
