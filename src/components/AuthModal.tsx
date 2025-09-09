import React, { useState } from 'react';
import { X, Users, MessageCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from '../hooks/useTranslation';
import { getWhatsAppUrl } from '../utils/location';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<{ success: boolean, error?: AuthError }>;
  onRegister: (data: RegisterForm) => Promise<{ success: boolean, error?: AuthError }>;
}

interface LoginForm { email: string; password: string; }
export interface RegisterForm extends LoginForm { name: string; confirmPassword: string; phone: string; therapistNumber: string; experience: number; }

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onRegister }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [isWhatsAppVerified, setIsWhatsAppVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { t } = useTranslation();
  
  const loginForm = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>();
  const forgotPasswordForm = useForm<{ email: string }>();
  
  const watchedPhone = useWatch({ control: registerForm.control, name: 'phone' });

  const handleLoginSubmit = async (data: LoginForm) => {
    setAuthError(null);
    const { success, error } = await onLogin(data.email, data.password);
    if (!success) {
      setAuthError(error?.message || t('authModal.errors.invalidCredentials'));
    } else {
      loginForm.reset();
      onClose();
    }
  };

  const handleRegisterSubmit = async (data: RegisterForm) => {
    setAuthError(null);
    if (!isWhatsAppVerified) {
      setAuthError(t('authModal.errors.whatsappNotVerified'));
      return;
    }
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', { type: 'manual', message: t('authModal.errors.passwordMismatch') });
      return;
    }
    
    const registrationData = { ...data, phone: `+62${data.phone}` };
    const { success, error } = await onRegister(registrationData);

    if (success) {
      registerForm.reset();
      setVerificationAttempted(false);
      setIsWhatsAppVerified(false);
      onClose();
    } else {
      setAuthError(error?.message || "Registration failed.");
    }
  };
  
  const handlePasswordReset = async (data: { email: string }) => {
    setAuthError(null);
    setResetMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) {
      setAuthError(error.message);
    } else {
      setResetMessage(t('authModal.resetLinkSent'));
    }
  };

  const handleVerifyWhatsApp = () => {
    const phone = registerForm.getValues('phone');
    if (phone && !registerForm.formState.errors.phone) {
      const fullPhone = `+62${phone}`;
      const whatsappUrl = getWhatsAppUrl(fullPhone, `Hi, I'm verifying my number for 2Go Massage Hub.`);
      window.open(whatsappUrl, '_blank');
      setVerificationAttempted(true);
    }
  };

  const switchView = (newView: 'login' | 'register' | 'forgotPassword') => {
    setView(newView);
    setAuthError(null);
    setResetMessage(null);
    loginForm.reset();
    registerForm.reset();
    forgotPasswordForm.reset();
    setVerificationAttempted(false);
    setIsWhatsAppVerified(false);
  };

  const renderContent = () => {
    switch (view) {
      case 'forgotPassword':
        return (
          <form onSubmit={forgotPasswordForm.handleSubmit(handlePasswordReset)} className="space-y-4">
            <h3 className="text-xl leading-6 font-semibold text-gray-900 mb-4">{t('authModal.resetPasswordTitle')}</h3>
            {resetMessage && <p className="text-green-600 text-sm text-center bg-green-50 p-2 rounded-lg">{resetMessage}</p>}
            {authError && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{authError}</p>}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.emailLabel')}</label><input type="email" {...forgotPasswordForm.register('email', { required: t('authModal.errors.emailRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder={t('authModal.emailPlaceholder')} />{forgotPasswordForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{forgotPasswordForm.formState.errors.email.message}</p>}</div>
            <button type="submit" disabled={forgotPasswordForm.formState.isSubmitting} className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50">{t('authModal.sendResetLink')}</button>
            <div className="mt-6 text-center"><button type="button" onClick={() => switchView('login')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">{t('authModal.backToLogin')}</button></div>
          </form>
        );
      case 'register':
        return (
          <>
            <h3 className="text-xl leading-6 font-semibold text-gray-900">{t('authModal.therapistRegister')}</h3>
            <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 mt-6">
              {authError && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{authError}</p>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.fullNameLabel')}</label><input type="text" {...registerForm.register('name', { required: t('authModal.errors.nameRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder={t('authModal.fullNamePlaceholder')} />{registerForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.name.message}</p>}</div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.emailLabel')}</label><input type="email" {...registerForm.register('email', { required: t('authModal.errors.emailRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder={t('authModal.emailPlaceholder')} />{registerForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>}</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.phoneLabel')}</label>
                <div className="flex items-center"><span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+62</span><input type="tel" {...registerForm.register('phone', { required: t('authModal.errors.phoneRequired'), pattern: { value: /^\d{9,13}$/, message: t('authModal.errors.phoneFormat') }})} onChange={(e) => { registerForm.setValue('phone', e.target.value, { shouldValidate: true }); setVerificationAttempted(false); setIsWhatsAppVerified(false); setAuthError(null); }} className="w-full px-3 py-2 border border-gray-300 rounded-r-lg" placeholder={t('authModal.phonePlaceholder')} /></div>
                {registerForm.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.phone.message}</p>}
                <p className="text-xs text-gray-500 mt-1">{t('authModal.whatsappInfo')}</p>
              </div>
              <div className="mt-4">{!verificationAttempted ? (<button type="button" onClick={handleVerifyWhatsApp} disabled={!!registerForm.formState.errors.phone || !watchedPhone} className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"><MessageCircle className="h-5 w-5" /><span>{t('authModal.verifyOnWhatsApp')}</span></button>) : (<label className="flex items-center space-x-3 cursor-pointer p-3 bg-green-50 border border-green-200 rounded-lg"><input type="checkbox" checked={isWhatsAppVerified} onChange={(e) => { setIsWhatsAppVerified(e.target.checked); if(e.target.checked) setAuthError(null); }} className="h-5 w-5 rounded border-gray-300" /><span className="text-sm text-gray-800">{t('authModal.whatsappConfirmation')}</span>{isWhatsAppVerified && <CheckCircle className="h-5 w-5 text-green-600" />}</label>)}</div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.therapistNumberLabel')}</label><input type="text" {...registerForm.register('therapistNumber', { required: t('authModal.errors.therapistNumberRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder={t('authModal.therapistNumberPlaceholder')} />{registerForm.formState.errors.therapistNumber && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.therapistNumber.message}</p>}</div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.experienceLabel')}</label><input type="number" {...registerForm.register('experience', { required: t('authModal.errors.experienceRequired'), valueAsNumber: true, min: { value: 0, message: t('authModal.errors.experienceMin') } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder={t('authModal.experiencePlaceholder')} />{registerForm.formState.errors.experience && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.experience.message}</p>}</div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.passwordLabel')}</label><div className="relative"><input type={showRegPassword ? 'text' : 'password'} {...registerForm.register('password', { required: t('authModal.errors.passwordRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10" placeholder={t('authModal.passwordPlaceholder')} /><button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">{showRegPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>{registerForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>}</div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.confirmPasswordLabel')}</label><div className="relative"><input type={showConfirmPassword ? 'text' : 'password'} {...registerForm.register('confirmPassword', { required: t('authModal.errors.confirmRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10" placeholder={t('authModal.confirmPasswordPlaceholder')} /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>{registerForm.formState.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.confirmPassword.message}</p>}</div>
              <button type="submit" disabled={registerForm.formState.isSubmitting || !isWhatsAppVerified} className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50 disabled:bg-gray-400">{t('authModal.registerButton')}</button>
              <div className="mt-6 text-center"><button type="button" onClick={() => switchView('login')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">{t('alreadyHaveAccount')}</button></div>
            </form>
          </>
        );
      default: // login
        return (
          <>
            <h3 className="text-xl leading-6 font-semibold text-gray-900">{t('authModal.therapistLogin')}</h3>
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4 mt-6">
              {authError && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{authError}</p>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.emailLabel')}</label><input type="email" {...loginForm.register('email', { required: t('authModal.errors.emailRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder={t('authModal.emailPlaceholder')} />{loginForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>}</div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('authModal.passwordLabel')}</label><div className="relative"><input type={showPassword ? 'text' : 'password'} {...loginForm.register('password', { required: t('authModal.errors.passwordRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10" placeholder={t('authModal.passwordPlaceholder')} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>{loginForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>}</div>
              <div className="text-right"><button type="button" onClick={() => switchView('forgotPassword')} className="text-sm text-primary-600 hover:underline">{t('authModal.forgotPassword')}</button></div>
              <button type="submit" disabled={loginForm.formState.isSubmitting} className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50">{t('authModal.loginButton')}</button>
              <div className="mt-6 text-center"><button type="button" onClick={() => switchView('register')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">{t('needToRegister')}</button></div>
            </form>
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-md w-full mx-4">
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="flex items-center justify-end mb-2">
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-2 p-3 rounded-lg border-2 border-primary-500 bg-primary-50 text-primary-700">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">{t('authModal.accessTitle')}</span>
                </div>
              </div>
              {renderContent()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
