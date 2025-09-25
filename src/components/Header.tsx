import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { LayoutDashboard, LogOut, Download, User, Shield, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { InstallPromptModal } from './InstallPromptModal';
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';

const AdminLoginPopover: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    // The password field is removed, so we pass a dummy value which will be ignored.
    const { error: authError } = await login({ email: data.code, password: '' });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      onLogin();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4"
    >
      <h3 className="font-semibold text-gray-800 mb-4">Admin Sign In</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div>
          <label className="text-xs font-medium text-gray-600">Admin Code</label>
          <input 
            type="text" 
            {...register('code', { required: 'Admin code is required' })} 
            className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          />
          {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message as string}</p>}
        </div>
        <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded-md text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader className="animate-spin h-4 w-4" /> : 'Sign In'}
        </button>
      </form>
    </motion.div>
  );
};

export const Header: React.FC = () => {
  const { role, signOut } = useAuth();
  const [isInstallModalOpen, setInstallModalOpen] = useState(false);
  const [isAdminLoginOpen, setAdminLoginOpen] = useState(false);
  const navigate = useNavigate();
  const adminLoginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminLoginRef.current && !adminLoginRef.current.contains(event.target as Node)) {
        setAdminLoginOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/home">
              <Logo layout="horizontal" className="h-10 w-auto" />
            </Link>
            <div className="flex items-center space-x-2">
              <button onClick={() => setInstallModalOpen(true)} className="p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100 transition-colors" title="Install App">
                <Download className="h-5 w-5" />
              </button>
              {role ? (
                <>
                  <button onClick={() => navigate('/dashboard')} className="p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100 transition-colors" title="Go to Dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                  </button>
                  <button onClick={signOut} className="p-2 text-gray-600 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors" title="Logout">
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="relative" ref={adminLoginRef}>
                    <button onClick={() => setAdminLoginOpen(prev => !prev)} className="p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100 transition-colors" title="Admin Sign In">
                      <Shield className="h-5 w-5" />
                    </button>
                    <AnimatePresence>
                      {isAdminLoginOpen && <AdminLoginPopover onLogin={() => setAdminLoginOpen(false)} />}
                    </AnimatePresence>
                  </div>
                  <button onClick={() => navigate('/login')} className="flex items-center justify-center h-9 w-9 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors shadow-sm" title="Sign In / Register">
                    <User className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />
    </>
  );
};
