import React, { useState } from 'react';
import { X, Key, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CodeSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (code: string) => Promise<string | void>;
}

export const CodeSignInModal: React.FC<CodeSignInModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    setError('');

    const loginError = await onLogin(code);

    if (loginError) {
      setError(loginError);
      setLoading(false);
    } else {
      onClose();
      setCode('');
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setCode('');
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-sm w-full">
            <div className="bg-white px-6 pt-6 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Account Sign In</h3>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
              <p className="text-sm text-gray-600 mb-6">Enter your unique 6-character code to access your dashboard.</p>
              <form onSubmit={handleSignIn}>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="ABC123"
                    className="w-full pl-12 pr-4 py-3 text-center text-lg font-semibold tracking-widest bg-gray-50 border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    maxLength={6}
                    autoCapitalize="characters"
                  />
                  {loading && <Loader className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 animate-spin" />}
                </div>
                {error && <p className="text-red-500 text-center mt-3 text-sm font-medium">{error}</p>}
                 <button type="submit" disabled={loading || code.length < 6} className="w-full mt-6 bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50">
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
