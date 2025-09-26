import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Building, LogOut, Camera, Home, MessageCircle, Check, MapPin, Loader, Clock, Trash2, Upload, Globe, Copy, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { MassagePlaceProfile, OpeningHours } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Logo } from './Logo';
import { TagInput } from './TagInput';
import { placeServiceKeys, languageKeys } from '../data/services';
import { supabase } from '../supabaseClient';
import { mapSupabasePlaceToProfile } from '../data/data-mappers';
import { getWhatsAppUrl, getCurrentLocation } from '../utils/location';
import { generateTimeOptions } from '../utils/time';
import { useAuth } from '../context/AuthContext';
import { LocationSearchInput, PlaceDetails } from './LocationSearchInput';

type ProfileForm = Omit<MassagePlaceProfile, 'id' | 'rating' | 'reviewCount' | 'distance' | 'status' | 'location' | 'accountNumber' | 'login_code' | 'pricing' | 'isOpen' | 'email'> & {
  city: string;
  lat: number;
  lng: number;
  pricing60: number;
  pricing90: number;
  pricing120: number;
  openingHours: OpeningHours;
  serviceAreas: string[];
};

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export const PlaceDashboard: React.FC = () => {
  const { profile: authProfile, signOut } = useAuth();
  const placeAuthProfile = authProfile as MassagePlaceProfile;

  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [placeProfile, setPlaceProfile] = useState<MassagePlaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatsAppTested, setWhatsAppTested] = useState(false);
  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  
  const { register, handleSubmit, reset, setValue, control, watch } = useForm<ProfileForm>();
  const phoneValue = useWatch({ control, name: 'phone' });
  const addressValue = watch('address');
  const cityValue = watch('city');

  const timeOptions = generateTimeOptions();

  const fetchProfile = useCallback(async () => {
    if (!placeAuthProfile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('places').select('*').eq('id', placeAuthProfile.id).single();

      if (error || !data) {
        console.error('Error fetching place profile:', error);
        signOut();
        navigate('/login');
        return;
      }
      
      const profile = mapSupabasePlaceToProfile(data);
      setPlaceProfile(profile);
      reset({
        name: profile.name, phone: profile.phone, address: profile.address, city: profile.city,
        lat: profile.location.lat, lng: profile.location.lng,
        services: profile.services,
        languages: profile.languages,
        galleryImageUrls: profile.galleryImageUrls,
        pricing60: profile.pricing.session60,
        pricing90: profile.pricing.session90,
        pricing120: profile.pricing.session120,
        profileImageUrl: profile.profileImageUrl,
        serviceAreas: profile.serviceAreas || [],
        openingHours: profile.openingHours || {
          monday: { open: null, close: null }, tuesday: { open: null, close: null }, wednesday: { open: null, close: null },
          thursday: { open: null, close: null }, friday: { open: null, close: null }, saturday: { open: null, close: null }, sunday: { open: null, close: null },
        }
      });
    } catch (error) {
      console.error('Unhandled error in fetchProfile (place):', error);
      signOut();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [placeAuthProfile?.id, reset, navigate, signOut]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !placeProfile) return;
    const file = event.target.files[0];
    setIsUploading(true);

    const previewUrl = URL.createObjectURL(file);
    setPlaceProfile(prev => prev ? { ...prev, profileImageUrl: previewUrl } : null);

    try {
      const filePath = `${placeProfile.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      if (!urlData) throw new Error("Could not get public URL for the uploaded image.");

      const { error: updateError } = await supabase
        .from('places')
        .update({ profile_image_url: urlData.publicUrl })
        .eq('id', placeProfile.id);

      if (updateError) throw updateError;
      
      await fetchProfile();
    } catch (error: any) {
      console.error("Error handling profile image upload:", error);
      alert(`Image upload failed: ${error.message}.`);
      await fetchProfile();
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleGalleryImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !placeProfile) return;
    
    const files = Array.from(event.target.files);
    const existingUrls = placeProfile.galleryImageUrls || [];
    const availableSlots = 5 - existingUrls.length;

    if (files.length > availableSlots) {
        alert(t('placeDashboard.uploadLimit', { count: availableSlots }));
        return;
    }
    
    setIsGalleryUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const filePath = `${placeProfile.id}/gallery/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from('profile-images').upload(filePath, file);
        if (error) throw error;
        const { data } = supabase.storage.from('profile-images').getPublicUrl(filePath);
        return data.publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      const updatedUrls = [...existingUrls, ...newUrls];

      const { error: dbError } = await supabase
        .from('places')
        .update({ gallery_image_urls: updatedUrls })
        .eq('id', placeProfile.id);

      if (dbError) throw dbError;

      await fetchProfile();
    } catch (error: any) {
      console.error('Error uploading gallery images:', error);
      alert(`Gallery upload failed: ${error.message}.`);
      await fetchProfile();
    } finally {
      setIsGalleryUploading(false);
    }
  };

  const handleGalleryImageDelete = async (urlToDelete: string) => {
      if (!placeProfile) return;
      
      const fileName = urlToDelete.split('/').pop();
      if (!fileName) return;
      
      const filePath = `${placeProfile.id}/gallery/${fileName}`;

      const { error: deleteError } = await supabase.storage.from('profile-images').remove([filePath]);

      if (deleteError) {
        console.error("Error deleting file from storage:", deleteError);
        // Try to proceed with DB update even if storage delete fails
      }

      const updatedUrls = placeProfile.galleryImageUrls.filter(url => url !== urlToDelete);
      
      const { error: updateError } = await supabase
        .from('places')
        .update({ gallery_image_urls: updatedUrls })
        .eq('id', placeProfile.id);
      
      if (!updateError) await fetchProfile();
      else console.error("Error updating gallery after delete:", updateError);
  };

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
    if (placeProfile?.login_code) {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const link = `${siteUrl}/place-profiles/${placeProfile.login_code}`;
      navigator.clipboard.writeText(link);
      alert(t('dashboard.linkCopied'));
    }
  };

  const isAccountActive = placeProfile?.status === 'active' && new Date(placeProfile.accountExpiry || 0) > new Date();

  const onSubmit = async (data: ProfileForm) => {
    if (!placeProfile) return;
    
    const payload = {
      name: data.name, phone: data.phone, address: data.address, city: data.city,
      lat: data.lat, lng: data.lng,
      services: data.services,
      languages: data.languages,
      opening_hours: data.openingHours,
      pricing_session_60: data.pricing60,
      pricing_session_90: data.pricing90,
      pricing_session_120: data.pricing120,
      service_areas: data.serviceAreas,
      status: 'pending',
    };

    const { error } = await supabase
      .from('places')
      .update(payload)
      .eq('id', placeProfile.id);

    if (!error) {
      await fetchProfile();
      if (!isAccountActive) {
        navigate('/request-activation');
      } else {
        alert(t('placeDashboard.updateSuccess'));
      }
    } else {
      console.error("Error updating profile:", error);
      alert(`Profile update failed: ${error.message}`);
    }
  };
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">{t('placeDashboard.loading')}</div>;
  if (!placeProfile) return null;

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
              <div className={`flex-shrink-0 flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${placeProfile.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                <span>{placeProfile.isOpen ? t('placeDashboard.open') : t('placeDashboard.closed')}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block truncate min-w-0">{placeProfile.name}</span>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-3"><Building className="h-7 w-7 text-primary-600" /><span>{t('placeDashboard.businessProfile')}</span></h2>
                <p className="text-gray-600 mb-8">{t('placeDashboard.profileInfo')}</p>
              </div>
               <div className="flex flex-col items-end gap-2">
                {isAccountActive && (
                  <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1.5 rounded-lg">
                    <Star className="h-4 w-4" />
                    <span>{t('placeDashboard.premiumAccount')}</span>
                  </div>
                )}
                {placeProfile.login_code && (
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
                  <img src={placeProfile.profileImageUrl || 'https://via.placeholder.com/150'} alt="Profile" className="w-28 h-28 rounded-full object-cover shadow-md" />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                  <input type="file" ref={profileFileInputRef} onChange={handleProfileImageUpload} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => profileFileInputRef.current?.click()} disabled={isUploading} className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full hover:bg-primary-600 shadow-sm disabled:bg-gray-400" title={t('placeDashboard.uploadPhotoTitle')}>
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div><h4 className="text-md font-semibold text-gray-900">{t('placeDashboard.profilePhoto')}</h4><p className="text-sm text-gray-600">{t('placeDashboard.updatePhoto')}</p></div>
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-2">Gallery Images</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4">
                  {(placeProfile.galleryImageUrls || []).map(url => (
                    <div key={url} className="relative group">
                      <img src={url} alt="Gallery item" className="w-full h-24 object-cover rounded-lg" />
                      <button type="button" onClick={() => handleGalleryImageDelete(url)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Image"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center justify-center w-full px-4 py-6 bg-gray-50 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-100">
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">Add up to 5 images</p>
                  </div>
                  <input type="file" multiple ref={galleryFileInputRef} onChange={handleGalleryImageUpload} accept="image/*" className="hidden" />
                </label>
                {isGalleryUploading && <p className="text-sm text-gray-500 mt-2 flex items-center gap-2"><Loader className="h-4 w-4 animate-spin" /> {t('placeDashboard.uploadingImages')}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('placeDashboard.businessName')}</label><input type="text" {...register('name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('placeDashboard.phone')}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+62</span>
                      <input type="tel" {...register('phone')} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 border focus:ring-primary-500 focus:border-primary-500" placeholder="8123456789" />
                    </div>
                    <button type="button" onClick={handleTestWhatsApp} className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${whatsAppTested ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {whatsAppTested ? <Check className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                      {t('placeDashboard.testWhatsApp')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2"><MapPin className="h-5 w-5 text-gray-500"/>{t('placeDashboard.location')}</h4>
                <p className="text-sm text-gray-600">{t('placeDashboard.locationInfo')}</p>
                
                <div className="space-y-3">
                  <LocationSearchInput onPlaceSelected={handlePlaceSelected} />
                  <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{t('placeDashboard.currentAddress')}</p>
                      <p className="text-sm text-gray-600 break-words">
                        {addressValue ? `${addressValue}${cityValue ? `, ${cityValue}` : ''}` : t('placeDashboard.noAddressSet')}
                      </p>
                    </div>
                    <button type="button" onClick={handleGetCurrentLocation} disabled={isConfirmingLocation} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-wait">
                      {isConfirmingLocation ? <Loader className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                      <span>{isConfirmingLocation ? t('locationModal.gettingLocation') : t('placeDashboard.getCurrentLocation')}</span>
                    </button>
                  </div>
                  {locationError && <p className="text-red-500 text-xs">{locationError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('placeDashboard.alsoServing')}</label>
                <Controller name="serviceAreas" control={control} render={({ field }) => <TagInput {...field} placeholder="e.g., Kuta, Seminyak..." />} />
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-gray-500" />{t('placeDashboard.openingHours')}</h4>
                <div className="space-y-3">
                  {daysOfWeek.map(day => (
                    <div key={day} className="grid grid-cols-3 items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 capitalize">{t(`days.${day}`)}</label>
                      <select {...register(`openingHours.${day}.open`)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="">{t('placeDashboard.closed')}</option>
                        {timeOptions.map(time => <option key={`open-${time}`} value={time}>{time}</option>)}
                      </select>
                      <select {...register(`openingHours.${day}.close`)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="">{t('placeDashboard.closed')}</option>
                        {timeOptions.map(time => <option key={`close-${time}`} value={time}>{time}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('therapistDashboard.pricing')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.session60')}</label><input type="number" {...register('pricing60', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.session90')}</label><input type="number" {...register('pricing90', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.session120')}</label><input type="number" {...register('pricing120', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('placeDashboard.services')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg">
                  {placeServiceKeys.map(key => (<label key={key} className="flex items-center space-x-2"><input type="checkbox" value={key} {...register('services')} className="rounded" /><span className="text-sm text-gray-700">{t(key)}</span></label>))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Globe className="h-5 w-5 text-gray-500" />{t('placeDashboard.languages')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {languageKeys.map(key => (<label key={key} className="flex items-center space-x-2"><input type="checkbox" value={t(key)} {...register('languages')} className="rounded" /><span className="text-sm text-gray-700">{t(key)}</span></label>))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button type="submit" className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium">
                  {isAccountActive ? t('placeDashboard.updateProfile') : t('placeDashboard.submitLive')}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
