import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { Mail, Key, Loader, Eye, EyeOff, Home } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors }, control } = useForm();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const emailValue = useWatch({ control, name: 'email' });
  const isAdminLogin = emailValue === import.meta.env.VITE_ADMIN_CODE;

  const onSubmit = async (data: any) => {
    setLoading(true);
    setAuthError(null);
    const { error } = await login({ email: data.email, password: data.password });
    if (error) {
      setAuthError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/home" className="text-gray-700 hover:text-primary-600 p-2 rounded-full" title="Back to Home">
              <Home className="h-6 w-6" />
            </Link>
            <Link to="/">
              <Logo layout="horizontal" className="h-10 w-auto" />
            </Link>
            <div className="w-10"></div> {/* Spacer */}
          </div>
        </div>
      </header>
      <main className="flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
              {t('loginPage.title')}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {authError && (
                <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{authError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('loginPage.emailLabel')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    {...register('email', { required: t('loginPage.emailRequired') })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    placeholder={t('loginPage.emailPlaceholder')}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
              </div>

              <div className={`transition-opacity duration-300 ${isAdminLogin ? 'opacity-50' : 'opacity-100'}`}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('loginPage.passwordLabel')}</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: !isAdminLogin ? t('loginPage.passwordRequired') : false })}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    placeholder={t('loginPage.passwordPlaceholder')}
                    disabled={isAdminLogin}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500" disabled={isAdminLogin}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
              </div>
              
              {isAdminLogin && (
                <div className="text-center text-sm text-primary-600 bg-primary-50 p-3 rounded-lg">
                  {t('loginPage.adminDetected')}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader className="animate-spin h-5 w-5" /> {t('loginPage.signingInButton')}</> : t('loginPage.signInButton')}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link to="/register" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                {t('loginPage.noAccount')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
