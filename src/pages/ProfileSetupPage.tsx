import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '../supabaseClient';
import { Logo } from '../components/Logo';
import { User, Building } from 'lucide-react';
import { CitySelector } from '../components/CitySelector';
import { TagInput } from '../components/TagInput';

interface ProfileSetupForm {
  name: string;
  phone: string;
  city: string;
  serviceAreas: string[];
}

export const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileSetupForm>({
    defaultValues: { name: '', phone: '', city: '', serviceAreas: [] }
  });

  const { code, type } = location.state || {};

  useEffect(() => {
    if (!code || !type) {
      navigate('/');
    }
  }, [code, type, navigate]);

  const onSubmit = async (formData: ProfileSetupForm) => {
    const tableName = type === 'therapist' ? 'therapists' : 'places';
    const accountNumber = `${type.toUpperCase().substring(0, 3)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { error } = await supabase
      .from(tableName as 'therapists' | 'places')
      .insert({
        login_code: code,
        account_number: accountNumber,
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        service_areas: formData.serviceAreas,
        status: 'pending',
      });

    if (error) {
      console.error('Error creating profile:', error);
      alert(`Error: ${error.message}`);
    } else {
      navigate(`/${type}-dashboard/${code}`);
    }
  };

  if (!code || !type) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo layout="horizontal" className="h-12 w-auto mx-auto" />
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-600 text-center mb-6">
            It looks like your profile isn't set up yet. Let's get some basic information.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-primary-50 border border-primary-200 text-primary-700 font-medium">
              {type === 'therapist' ? <User className="h-5 w-5" /> : <Building className="h-5 w-5" />}
              <span>Creating a {type} profile for code: <strong>{code}</strong></span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === 'therapist' ? 'Full Name' : 'Business Name'}
              </label>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'This field is required' }}
                render={({ field }) => <input {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Number
              </label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+62</span>
                <Controller
                  name="phone"
                  control={control}
                  rules={{ required: 'Phone number is required' }}
                  render={({ field }) => <input {...field} type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-r-lg" placeholder="8123456789" />}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary City
              </label>
              <Controller
                name="city"
                control={control}
                rules={{ required: 'City is required' }}
                render={({ field }) => <CitySelector {...field} />}
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surrounding Service Areas (Optional)
              </label>
              <Controller
                name="serviceAreas"
                control={control}
                render={({ field }) => (
                  <TagInput 
                    {...field} 
                    placeholder="e.g., Kuta, Seminyak..." 
                  />
                )}
              />
              <p className="text-xs text-gray-500 mt-1">List other areas you serve. Type an area and press Enter.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
