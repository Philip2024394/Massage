import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { User, Building, Loader, Eye, EyeOff, CheckCircle, Home } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountType, setAccountType] = useState<'therapist' | 'place'>('therapist');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const password = watch('password');

  const onSubmit = async (data: any) => {
    setLoading(true);
    setAuthError(null);
    const { error } = await signUp({ 
      email: data.email, 
      password: data.password, 
      name: data.name, 
      accountType 
    });
    if (error) {
      setAuthError(error.message);
      setLoading(false);
    } else {
      setLoading(false);
      setFormSubmitted(true);
    }
  };

  if (formSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <CheckCircle className="h-16 w-16 text-primary-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">Please check your email to verify your account. After verification, you can sign in.</p>
            <Link to="/login" className="w-full inline-block bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
              Create an Account
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {authError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{authError}</p>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
                <div className="flex items-center bg-gray-100 rounded-full p-1">
                  <button type="button" onClick={() => setAccountType('therapist')} className={`w-1/2 flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${accountType === 'therapist' ? 'bg-primary-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
                    <User className="h-4 w-4" /> Therapist
                  </button>
                  <button type="button" onClick={() => setAccountType('place')} className={`w-1/2 flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${accountType === 'place' ? 'bg-primary-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
                    <Building className="h-4 w-4" /> Massage Place
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{accountType === 'therapist' ? 'Your Full Name' : 'Business Name'}</label>
                <input type="text" {...register('name', { required: 'Name is required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })} className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} {...register('confirmPassword', { required: 'Please confirm your password', validate: value => value === password || 'Passwords do not match' })} className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message as string}</p>}
              </div>

              <button type="submit" disabled={loading} className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader className="animate-spin h-5 w-5" /> Signing Up...</> : 'Sign Up'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Already have an account? Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
