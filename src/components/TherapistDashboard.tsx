import React, { useRef, useEffect, useState, useCallback } from 'react';
import { User, LogOut, Camera, Home, MessageCircle, Check, MapPin, Loader, Globe, Copy, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { TherapistProfile } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Logo } from './Logo';
import { TagInput } from './TagInput';
import { massageTypeKeys, specialtyKeys, languageKeys } from '../data/services';
import { supabase } from '../supabaseClient';
import { mapSupabaseTherapistToProfile } from '../data/data-mappers';
import { getWhatsAppUrl, getCurrentLocation } from '../utils/location';
import { useAuth } from '../context/AuthContext';
import { LocationSearchInput, PlaceDetails } from './LocationSearchInput';

type ProfileForm = Omit<TherapistProfile, 'id' | 'rating' | 'reviewCount' | 'distance' | 'status' | 'location' | 'accountNumber' | 'login_code' | 'email'> & {
  address: string;
  city: string;
  lat: number;
  lng: number;
  pricing60: number;
  pricing90: number;
  pricing120: number;
  serviceAreas: string[];
};

export const TherapistDashboard: React.FC = () => {
  const { profile: authProfile, signOut } = useAuth();
  const therapistAuthProfile = authProfile as TherapistProfile;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [therapistProfile, setTherapistProfile] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [whatsAppTested, setWhatsAppTested] = useState(false);
  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, setValue, control, watch } = useForm<ProfileForm>();
  const phoneValue = useWatch({ control, name: 'phone' });
  const addressValue = watch('address');
  const cityValue = watch('city');

  const fetchProfile = useCallback(async () => {
    if (!therapistAuthProfile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('therapists').select('*').eq('id', therapistAuthProfile.id).single();

      if (error || !data) {
        console.error('Error fetching therapist profile:', error);
        signOut();
        navigate('/login');
        return;
      }
      
      const profile = mapSupabaseTherapistToProfile(data);
      setTherapistProfile(profile);
      reset({
        name: profile.name, bio: profile.bio, experience: profile.experience, phone: profile.phone,
        address: profile.location.address, city: profile.location.city, 
        lat: profile.location.lat, lng: profile.location.lng,
        pricing60: profile.pricing.session60, pricing90: profile.pricing.session90,
        pricing120: profile.pricing.session120, massageTypes: profile.massageTypes, specialties: profile.specialties,
        isOnline: profile.isOnline, profileImageUrl: profile.profileImageUrl, languages: profile.languages,
        certifications: profile.certifications,
        serviceAreas: profile.serviceAreas || [],
      });
    } catch (error) {
      console.error('Unhandled error in fetchProfile:', error);
      signOut();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [therapistAuthProfile?.id, reset, navigate, signOut]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !therapistProfile) return;
    
    const file = event.target.files[0];
    setIsUploading(true);

    const previewUrl = URL.createObjectURL(file);
    setTherapistProfile(prev => prev ? { ...prev, profileImageUrl: previewUrl } : null);

    try {
      const filePath = `${therapistProfile.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      if (!urlData) throw new Error("Could not get public URL for the uploaded image.");

      const { error: updateError } = await supabase
        .from('therapists')
        .update({ profile_image_url: urlData.publicUrl })
        .eq('id', therapistProfile.id);

      if (updateError) throw updateError;
      
      await fetchProfile();
    } catch (error: any) {
      console.error("Error handling image upload:", error);
      alert(`Image upload failed: ${error.message}. Please ensure storage policies are set.`);
      await fetchProfile(); // Re-fetch to revert to the old image
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleToggleStatus = async () => {
    if (!therapistProfile) return;
    const newStatus = !therapistProfile.isOnline;
    
    const { error } = await supabase
      .from('therapists')
      .update({ is_online: newStatus })
      .eq('id', therapistProfile.id);

    if (!error) {
      await fetchProfile();
    } else {
      console.error("Error updating status:", error);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleTestWhatsApp = () => {
    if (phoneValue) {
      window.open(getWhatsAppUrl(`+62${phoneValue}`), '_blank');
      setWhatsAppTested(true);
    }
  };

  const handlePlaceSelected = (place: PlaceDetails) => {
    setValue('address', place.address, { shouldValidate: true });
    setValue('city', place.city, { shouldValidate: true });
    setValue('lat', place.lat, { shouldValidate: true });
    setValue('lng', place.lng, { shouldValidate: true });
  };

  const handleGetCurrentLocation = async () => {
    setIsConfirmingLocation(true);
    setLocationError(null);
    try {
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;

      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: { lat: latitude, lng: longitude },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.status === 'OK' && data.results[0]) {
        const result = data.results[0];
        const cityComponent = result.address_components.find((c: any) => c.types.includes('administrative_area_level_2') || c.types.includes('administrative_area_level_1'));
        const city = cityComponent ? cityComponent.long_name.replace('Kota ', '').replace('Kabupaten ', '') : 'Unknown';
        
        handlePlaceSelected({ address: result.formatted_address, city, lat: latitude, lng: longitude });
      } else {
        throw new Error(data.error_message || 'Failed to reverse geocode.');
      }
    } catch (err: any) {
      let errorMessage = t('locationModal.error');
      if (err.code === 1) { // PERMISSION_DENIED
        if (window.self !== window.top) {
          errorMessage = "Location access denied. This is expected in the preview environment. Please use the manual address search instead.";
        } else {
          errorMessage = t('locationModal.errors.permissionDenied');
        }
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        errorMessage = t('locationModal.errors.positionUnavailable');
      } else if (err.code === 3) { // TIMEOUT
        errorMessage = t('locationModal.errors.timeout');
      }
      setLocationError(errorMessage);
    } finally {
      setIsConfirmingLocation(false);
    }
  };

  const copyProfileLinkToClipboard = () => {
    if (therapistProfile?.login_code) {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const link = `${siteUrl}/therapist-profiles/${therapistProfile.login_code}`;
      navigator.clipboard.writeText(link);
      alert(t('dashboard.linkCopied'));
    }
  };

  const isAccountActive = therapistProfile?.status === 'active' && new Date(therapistProfile.accountExpiry || 0) > new Date();

  const onSubmit = async (data: ProfileForm) => {
    if (!therapistProfile) return;
    
    const payload = {
      name: data.name,
      bio: data.bio,
      experience: data.experience,
      phone: data.phone,
      address: data.address,
      city: data.city,
      lat: data.lat,
      lng: data.lng,
      pricing_session_60: data.pricing60,
      pricing_session_90: data.pricing90,
      pricing_session_120: data.pricing120,
      massage_types: data.massageTypes,
      specialties: data.specialties,
      languages: data.languages,
      service_areas: data.serviceAreas,
      status: 'pending',
    };

    const { error } = await supabase
      .from('therapists')
      .update(payload)
      .eq('id', therapistProfile.id);

    if (!error) {
      await fetchProfile();
      if (!isAccountActive) {
        navigate('/request-activation');
      } else {
        alert(t('therapistDashboard.updateSuccess'));
      }
    } else {
      console.error("Error updating profile:", error);
      alert(`Profile update failed: ${error.message}`);
    }
  };
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">{t('therapistDashboard.loading')}</div>;
  if (!therapistProfile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Logo layout="horizontal" className="h-10 w-auto" />
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <Link to="/home" title="View Home Page" className="flex-shrink-0 p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100 transition-colors">
                <Home className="h-5 w-5" />
              </Link>
              <div className="flex-shrink-0 flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">{t('therapistDashboard.status')}</span>
                <button onClick={handleToggleStatus} disabled={!isAccountActive} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${therapistProfile.isOnline ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {therapistProfile.isOnline ? t('therapistDashboard.online') : t('therapistDashboard.offline')}
                </button>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block truncate min-w-0">{therapistProfile.name}</span>
              <button onClick={signOut} className="flex-shrink-0 p-2 text-gray-700 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" title={t('header.logout')}>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-3"><User className="h-7 w-7 text-primary-600" /><span>{t('therapistDashboard.profileManagement')}</span></h2>
                <p className="text-gray-600 mb-8">{t('therapistDashboard.profileInfo')}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isAccountActive && (
                  <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1.5 rounded-lg">
                    <Star className="h-4 w-4" />
                    <span>{t('therapistDashboard.premiumAccount')}</span>
                  </div>
                )}
                {therapistProfile.login_code && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg">
                    <Globe className="h-4 w-4" />
                    <span className="font-semibold">{t('dashboard.publicProfileLink')}</span>
                    <button type="button" onClick={copyProfileLinkToClipboard} title={t('dashboard.copyLink')} className="ml-2 hover:text-blue-900">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-8">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img src={therapistProfile.profileImageUrl || 'https://via.placeholder.com/150'} alt="Profile" className="w-28 h-28 rounded-full object-cover shadow-md" />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  <button type="button" onClick={handleUploadClick} disabled={isUploading} className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full hover:bg-primary-600 shadow-sm disabled:bg-gray-400">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div><h4 className="text-md font-semibold text-gray-900">{t('therapistDashboard.profilePhoto')}</h4><p className="text-sm text-gray-600">{t('therapistDashboard.updatePhoto')}</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.fullName')}</label><input type="text" {...register('name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.experience')}</label><input type="number" {...register('experience', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              </div>
              
              <div className="space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2"><MapPin className="h-5 w-5 text-gray-500"/>{t('therapistDashboard.location')}</h4>
                <p className="text-sm text-gray-600">{t('therapistDashboard.locationInfo')}</p>
                <div className="space-y-3">
                  <LocationSearchInput onPlaceSelected={handlePlaceSelected} />
                  <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{t('therapistDashboard.currentAddress')}</p>
                      <p className="text-sm text-gray-600 break-words">
                        {addressValue ? `${addressValue}${cityValue ? `, ${cityValue}` : ''}` : t('therapistDashboard.noAddressSet')}
                      </p>
                    </div>
                    <button type="button" onClick={handleGetCurrentLocation} disabled={isConfirmingLocation} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-wait">
                      {isConfirmingLocation ? <Loader className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                      <span>{isConfirmingLocation ? t('locationModal.gettingLocation') : t('therapistDashboard.getCurrentLocation')}</span>
                    </button>
                  </div>
                  {locationError && <p className="text-red-500 text-xs">{locationError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.alsoServing')}</label>
                <Controller name="serviceAreas" control={control} render={({ field }) => <TagInput {...field} placeholder="e.g., Kuta, Seminyak..." />} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.phone')}</label>
                <div className="flex items-center gap-2">
                  <div className="flex-grow flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+62</span>
                    <input type="tel" {...register('phone')} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 border focus:ring-primary-500 focus:border-primary-500" placeholder="8123456789" />
                  </div>
                  <button type="button" onClick={handleTestWhatsApp} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${whatsAppTested ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {whatsAppTested ? <Check className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                    {t('therapistDashboard.testWhatsApp')}
                  </button>
                </div>
              </div>
              
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.bio')}</label><textarea {...register('bio')} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder={t('therapistDashboard.bioPlaceholder')} /></div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('therapistDashboard.pricing')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.session60')}</label><input type="number" {...register('pricing60', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.session90')}</label><input type="number" {...register('pricing90', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.session120')}</label><input type="number" {...register('pricing120', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('therapistDashboard.services')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg">
                  {massageTypeKeys.map(key => (<label key={key} className="flex items-center space-x-2"><input type="checkbox" value={key} {...register('massageTypes')} className="rounded" /><span className="text-sm text-gray-700">{t(key)}</span></label>))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('therapistDashboard.specialties')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specialtyKeys.map(key => (<label key={key} className="flex items-center space-x-2"><input type="checkbox" value={key} {...register('specialties')} className="rounded" /><span className="text-sm text-gray-700">{t(key)}</span></label>))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Globe className="h-5 w-5 text-gray-500" />{t('placeDashboard.languages')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {languageKeys.map(key => (<label key={key} className="flex items-center space-x-2"><input type="checkbox" value={t(key)} {...register('languages')} className="rounded" /><span className="text-sm text-gray-700">{t(key)}</span></label>))}
                </div>
              </div>
               <input type="hidden" {...register('isOnline')} />
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button type="submit" className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium">
                  {isAccountActive ? t('therapistDashboard.updateProfile') : t('therapistDashboard.submitLive')}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
