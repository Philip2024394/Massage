import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '../supabaseClient';
import { Logo } from '../components/Logo';
import { User, Building, Loader } from 'lucide-react';
import { CitySelector } from '../components/CitySelector';
import { TagInput } from '../components/TagInput';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  city: string;
  serviceAreas: string[];
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    defaultValues: { name: '', email: '', phone: '', city: '', serviceAreas: [] }
  });
  const [accountType, setAccountType] = useState<'therapist' | 'place'>('therapist');
  const [formError, setFormError] = useState('');

  const onSubmit = async (formData: RegisterForm) => {
    setFormError('');
    try {
      const { data, error } = await supabase.functions.invoke('create-new-user', {
        body: {
          type: accountType,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          service_areas: formData.serviceAreas,
        },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      navigate('/pay', { state: { entityId: data.id, entityType: data.type, loginCode: data.login_code } });

    } catch (err: any) {
      console.error('Error creating new user:', err);
      setFormError(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo layout="horizontal" className="h-12 w-auto mx-auto" />
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Create a New Account
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Join our platform to connect with new clients.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {accountType === 'therapist' ? 'Your Full Name' : 'Business Name'}
              </label>
              <Controller name="name" control={control} rules={{ required: 'This field is required' }} render={({ field }) => <input {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <Controller name="email" control={control} rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' } }} render={({ field }) => <input {...field} type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+62</span>
                <Controller name="phone" control={control} rules={{ required: 'Phone number is required', pattern: { value: /^\d{9,13}$/, message: 'Please enter a valid phone number (9-13 digits).' } }} render={({ field }) => <input {...field} type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-r-lg" placeholder="8123456789" />} />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary City</label>
              <Controller name="city" control={control} rules={{ required: 'City is required' }} render={({ field }) => <CitySelector {...field} />} />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Surrounding Service Areas (Optional)</label>
              <Controller name="serviceAreas" control={control} render={({ field }) => <TagInput {...field} placeholder="e.g., Kuta, Seminyak..." />} />
              <p className="text-xs text-gray-500 mt-1">List other areas you serve. Type an area and press Enter.</p>
            </div>

            {formError && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{formError}</p>}

            <button type="submit" disabled={isSubmitting} className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader className="animate-spin h-5 w-5" /> Creating Account...</> : 'Continue to Activation'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => navigate('/')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
