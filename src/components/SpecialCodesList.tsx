import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Loader, CheckCircle, Clock, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

interface SpecialCode {
  code: string;
  last_used_at: string | null;
}

export const SpecialCodesList: React.FC = () => {
  const [codes, setCodes] = useState<SpecialCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('special_activation_codes')
        .select('code, last_used_at')
        .order('code', { ascending: true });
      
      if (error) throw error;
      setCodes(data);
    } catch (error) {
      console.error("Error fetching special codes:", error);
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
      return { text: 'On Cooldown', color: 'text-red-600', icon: <Clock className="h-4 w-4" />, isReady: false };
    }
    return { text: 'Ready', color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" />, isReady: true };
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Code "${code}" copied to clipboard!`);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Special Activation Codes</h3>
      <p className="text-sm text-gray-600 mb-6">These are reusable 1-month activation codes. Each code has a 3-day cooldown period after use.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {codes.map(c => {
          const status = getStatus(c.last_used_at);
          return (
            <div 
              key={c.code}
              onClick={() => copyToClipboard(c.code)}
              className={`relative p-4 border rounded-lg text-center cursor-pointer transition-colors group ${
                status.isReady 
                ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                : 'bg-red-50 border-red-200 hover:bg-red-100'
              }`}
              title={`Last used: ${c.last_used_at ? new Date(c.last_used_at).toLocaleString() : 'Never'}\nClick to copy`}
            >
              <p className={`font-mono font-bold text-lg tracking-wider ${
                status.isReady ? 'text-gray-800' : 'text-gray-500'
              }`}>{c.code}</p>
              <div className={`mt-2 flex items-center justify-center gap-1.5 text-xs font-medium ${status.color}`}>
                {status.icon}
                <span>{status.text}</span>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Copy className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
