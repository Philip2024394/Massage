import React, { useState } from 'react';
import { X, Users, Eye, EyeOff, Building, User, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useTranslation } from '../hooks/useTranslation';

export interface LoginForm { email: string; password: string; }
export interface RegisterForm { name: string; email: string; password: string; confirmPassword: string; phone: string; experience?: number; address?: string; city?: string; }

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (data: LoginForm) => Promise<string | void>;
  onRegister: (data: RegisterForm, accountType: 'therapist' | 'place') => Promise<string | void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onRegister }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [accountType, setAccountType] = useState<'therapist' | 'place'>('therapist');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { t } = useTranslation();
  
  const loginForm = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>();

  const handleLoginSubmit = async (data: LoginForm) => {
    setAuthError(null);
    const error = await onLogin(data);
    if (error) {
      setAuthError(error);
    } else {
      loginForm.reset();
      onClose();
    }
  };

  const handleRegisterSubmit = async (data: RegisterForm) => {
    setAuthError(null);
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', { type: 'manual', message: t('authModal.errors.passwordMismatch') });
      return;
    }
    
    const error = await onRegister(data, accountType);
    if (error) {
      setAuthError(error);
    } else {
      registerForm.reset();
      onClose();
    }
  };

  const switchView = (newView: 'login' | 'register') => {
    setView(newView);
    setAuthError(null);
    loginForm.reset();
    registerForm.reset();
  };

  const renderRegisterForm = () => (
    <>
      <div className="mb-4">
        <div className="flex items-center bg-gray-100 rounded-full p-1">
          <button onClick={() => setAccountType('therapist')} className={`w-1/2 flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${accountType === 'therapist' ? 'bg-primary-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            <User className="h-4 w-4" /> {t('authModal.therapist')}
          </button>
          <button onClick={() => setAccountType('place')} className={`w-1/2 flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${accountType === 'place' ? 'bg-primary-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            <Building className="h-4 w-4" /> {t('authModal.place')}
          </button>
        </div>
      </div>
      <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 mt-6">
        {authError && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{authError}</p>}
        <div><label className="block text-sm font-medium text-gray-700 mb-1">{accountType === 'therapist' ? t('authModal.fullNameLabel') : t('authModal.placeNameLabel')}</label><input type="text" {...registerForm.register('name', { required: t('authModal.errors.nameRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.emailLabel')}</label><input type="email" {...registerForm.register('email', { required: t('authModal.errors.emailRequired'), pattern: { value: /^\S+@\S+$/i, message: t('authModal.errors.emailFormat')} })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />{registerForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>}</div>
        
        {accountType === 'place' && (
          <>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.addressLabel')}</label><input type="text" {...registerForm.register('address', { required: 'Address is required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.cityLabel')}</label><input type="text" {...registerForm.register('city', { required: 'City is required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
          </>
        )}

        {accountType === 'therapist' && (
          <>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.experienceLabel')}</label><input type="number" {...registerForm.register('experience', { required: t('authModal.errors.experienceRequired'), valueAsNumber: true, min: { value: 0, message: t('authModal.errors.experienceMin') } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
          </>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.phoneLabel')}</label>
          <div className="flex items-center"><span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+62</span><input type="tel" {...registerForm.register('phone', { required: t('authModal.errors.phoneRequired'), pattern: { value: /^\d{9,13}$/, message: t('authModal.errors.phoneFormat') }})} className="w-full px-3 py-2 border border-gray-300 rounded-r-lg" /></div>
          {registerForm.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.phone.message}</p>}
        </div>

        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.passwordLabel')}</label><div className="relative"><input type={showRegPassword ? 'text' : 'password'} {...registerForm.register('password', { required: t('authModal.errors.passwordRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10" /><button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">{showRegPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.confirmPasswordLabel')}</label><div className="relative"><input type={showConfirmPassword ? 'text' : 'password'} {...registerForm.register('confirmPassword', { required: t('authModal.errors.confirmRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10" /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>{registerForm.formState.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.confirmPassword.message}</p>}</div>
        
        <button type="submit" disabled={registerForm.formState.isSubmitting} className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50">{t('authModal.registerButton')}</button>
        <div className="mt-6 text-center"><button type="button" onClick={() => switchView('login')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">{t('alreadyHaveAccount')}</button></div>
      </form>
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-md w-full mx-4">
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="flex items-center justify-end mb-2"><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button></div>
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-2 p-3 rounded-lg border-2 border-primary-500 bg-primary-50 text-primary-700">
                  <Users className="h-5 w-5" /><span className="font-medium">{t('authModal.accessTitle')}</span>
                </div>
              </div>
              {view === 'register' ? renderRegisterForm() : (
                <>
                  <h3 className="text-xl leading-6 font-semibold text-gray-900">{t('authModal.loginTitle')}</h3>
                  <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4 mt-6">
                    {authError && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{authError}</p>}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.emailOrAdminLabel')}</label>
                      <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Mail className="h-5 w-5 text-gray-400" /></div><input type="text" {...loginForm.register('email', { required: t('authModal.errors.emailRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg pl-10" placeholder={t('authModal.emailOrAdminPlaceholder')} /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.passwordLabel')}</label><div className="relative"><input type={showPassword ? 'text' : 'password'} {...loginForm.register('password', { required: t('authModal.errors.passwordRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
                    <button type="submit" disabled={loginForm.formState.isSubmitting} className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50">{t('authModal.loginButton')}</button>
                    <div className="mt-6 text-center"><button type="button" onClick={() => switchView('register')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">{t('needToRegister')}</button></div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
