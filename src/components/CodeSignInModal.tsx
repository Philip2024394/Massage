import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Key, UserPlus, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';

interface CodeSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, code: string) => Promise<string | void>;
}

export const CodeSignInModal: React.FC<CodeSignInModalProps> = ({ isOpen, onClose, onLogin }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string; code: string; }>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (data: { email: string; code: string; }) => {
    setLoading(true);
    setError('');

    const loginError = await onLogin(data.email, data.code);

    if (loginError) {
      setError(loginError);
      setLoading(false);
    } else {
      onClose();
    }
  };

  const handleCreateAccount = () => {
    onClose();
    navigate('/register');
  };
  
  const handleClose = () => {
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
                <h3 className="text-lg font-semibold text-gray-900">Account Access</h3>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
              <p className="text-sm text-gray-600 mb-6">Log in with your email and code, or create a new account.</p>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-800 mb-3">Log In</h4>
                <form onSubmit={handleSubmit(handleSignIn)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email or Admin Code</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        {...register('email', { required: 'Email or admin code is required.' })}
                        placeholder="your@email.com or ADMIN1"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 mt-1 text-xs">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Your 6-Character Code</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        {...register('code')}
                        placeholder="Enter Code (if not admin)"
                        className="w-full pl-10 pr-4 py-2.5 text-center font-medium tracking-widest bg-white border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-500"
                        maxLength={6}
                        autoCapitalize="characters"
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-center mt-3 text-sm font-medium">{error}</p>}
                  
                  <button type="submit" disabled={loading} className="w-full mt-2 bg-primary-500 text-white py-2.5 px-4 rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50">
                      {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>
              </div>

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-2 text-sm text-gray-500">OR</span></div>
              </div>

              <button onClick={handleCreateAccount} className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium">
                <UserPlus className="h-5 w-5 text-primary-600" />
                Create New Account
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
