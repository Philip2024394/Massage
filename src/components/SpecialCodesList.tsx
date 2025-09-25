import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Loader, CheckCircle, Clock, Copy, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SpecialCode {
  code: string;
  last_used_at: string | null;
}

const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE;

export const SpecialCodesList: React.FC = () => {
  const [codes, setCodes] = useState<SpecialCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('admin-get-codes', {
        body: { adminCode: ADMIN_CODE },
      });

      if (functionError) {
        const errorBody = await (functionError.context as any).json();
        throw new Error(errorBody.error || functionError.message);
      }
      
      setCodes(data);
    } catch (err: any) {
      console.error("Error fetching special codes:", err);
      setError(err.message || 'Failed to load activation codes. Ensure you are logged in as an admin and the function is deployed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const getStatus = (lastUsed: string | null) => {
    if (!lastUsed) {
      return { text: 'Ready', color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" />, isReady: true };
    }
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    if (new Date(lastUsed) > threeDaysAgo) {
      const availableDate = new Date(lastUsed);
      availableDate.setDate(availableDate.getDate() + 3);
      return { text: 'On Cooldown', color: 'text-orange-600', icon: <Clock className="h-4 w-4" />, isReady: false, availableDate: availableDate.toLocaleDateString() };
    }
    return { text: 'Ready', color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" />, isReady: true };
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Codes</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Special Activation Codes</h3>
      <p className="text-sm text-gray-600 mb-6">These are reusable 1-month activation codes. Each code has a 3-day cooldown period after use. Click a code to copy it.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {codes.map(c => {
          const status = getStatus(c.last_used_at);
          const isCopied = copiedCode === c.code;
          return (
            <div 
              key={c.code}
              onClick={() => copyToClipboard(c.code)}
              className={`relative p-4 border-2 rounded-lg text-center cursor-pointer transition-all group ${
                status.isReady 
                ? 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300' 
                : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
              } ${isCopied ? '!border-blue-500 ring-2 ring-blue-500' : ''}`}
              title={status.isReady ? 'Click to copy' : `On cooldown. Available on ${status.availableDate}`}
            >
              <p className={`font-mono font-bold text-lg tracking-wider ${
                status.isReady ? 'text-gray-800' : 'text-gray-500'
              }`}>{c.code}</p>
              <div className={`mt-2 flex items-center justify-center gap-1.5 text-xs font-medium ${status.color}`}>
                {status.icon}
                <span>{status.text}</span>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isCopied ? <CheckCircle className="h-4 w-4 text-blue-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
