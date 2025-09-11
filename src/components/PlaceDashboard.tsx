import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Building, LogOut, Camera, Badge, Home, MessageCircle, Check, MapPin, Loader, Clock, Trash2, Upload, Globe } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useWatch } from 'react-hook-form';
import { AuthInfo, MassagePlaceProfile, OpeningHours } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Logo } from './Logo';
import { placeServiceKeys, languageKeys } from '../data/services';
import { supabase } from '../supabaseClient';
import { mapSupabasePlaceToProfile } from '../data/data-mappers';
import { getWhatsAppUrl, getCurrentLocation } from '../utils/location';
import { generateTimeOptions } from '../utils/time';

type ProfileForm = Omit<MassagePlaceProfile, 'id' | 'rating' | 'reviewCount' | 'distance' | 'status' | 'location' | 'accountNumber' | 'login_code' | 'pricing' | 'isOpen'> & {
  city: string;
  lat: number;
  lng: number;
  pricing60: number;
  pricing90: number;
  pricing120: number;
  openingHours: OpeningHours;
};

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

interface PlaceDashboardProps {
  authInfo: AuthInfo;
  onLogout: () => void;
  onProfileUpdate: () => void;
}

export const PlaceDashboard: React.FC<PlaceDashboardProps> = ({ authInfo, onLogout, onProfileUpdate }) => {
  const { code } = useParams<{ code: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [placeProfile, setPlaceProfile] = useState<MassagePlaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatsAppTested, setWhatsAppTested] = useState(false);
  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { register, handleSubmit, reset, setValue, control } = useForm<ProfileForm>();
  const phoneValue = useWatch({ control, name: 'phone' });

  const timeOptions = generateTimeOptions();

  const fetchProfile = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('places').select('*').eq('login_code', code).single();
      if (error) throw error;
      
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
        openingHours: profile.openingHours || {
          monday: { open: null, close: null }, tuesday: { open: null, close: null }, wednesday: { open: null, close: null },
          thursday: { open: null, close: null }, friday: { open: null, close: null }, saturday: { open: null, close: null }, sunday: { open: null, close: null },
        }
      });
    } catch (error) {
      console.error('Error fetching place profile:', error);
    } finally {
      setLoading(false);
    }
  }, [code, reset]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !placeProfile) return;
    const file = event.target.files[0];
    const fileName = `${placeProfile.id}/${Date.now()}`;
    const { data, error } = await supabase.storage.from('profile-images').upload(fileName, file);
    if (error) { console.error('Error uploading image:', error); return; }
    const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(data.path);
    const { error: updateError } = await supabase.from('places').update({ profile_image_url: publicUrl }).eq('id', placeProfile.id);
    if (!updateError) fetchProfile();
  };

  const handleGalleryImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !placeProfile) return;
    setIsUploading(true);
    
    const files = Array.from(event.target.files);
    const existingUrls = placeProfile.galleryImageUrls || [];
    const availableSlots = 5 - existingUrls.length;

    if (files.length > availableSlots) {
        alert(`You can only upload ${availableSlots} more images.`);
        setIsUploading(false);
        return;
    }

    const newUrls: string[] = [];

    for (const file of files) {
        const fileName = `${placeProfile.id}/gallery/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.from('profile-images').upload(fileName, file);
        if (error) {
            console.error('Error uploading gallery image:', error);
            continue;
        }
        const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(data.path);
        newUrls.push(publicUrl);
    }
    
    const allUrls = [...existingUrls, ...newUrls];
    
    const { error: updateError } = await supabase.from('places').update({ gallery_image_urls: allUrls }).eq('id', placeProfile.id);
    
    if (!updateError) {
        await fetchProfile();
    }
    setIsUploading(false);
  };

  const handleGalleryImageDelete = async (urlToDelete: string) => {
      if (!placeProfile) return;
      
      const updatedUrls = placeProfile.galleryImageUrls.filter(url => url !== urlToDelete);
      
      const { error: updateError } = await supabase.from('places').update({ gallery_image_urls: updatedUrls }).eq('id', placeProfile.id);
      
      if (!updateError) {
          const path = urlToDelete.split('/profile-images/')[1];
          if (path) {
              await supabase.storage.from('profile-images').remove([path]);
          }
          await fetchProfile();
      }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleTestWhatsApp = () => {
    if (phoneValue) {
      window.open(getWhatsAppUrl(`+62${phoneValue}`), '_blank');
      setWhatsAppTested(true);
    }
  };

  const handleConfirmLocation = async () => {
    setIsConfirmingLocation(true);
    setLocationError(null);
    try {
      const position = await getCurrentLocation();
      setValue('lat', Number(position.coords.latitude.toFixed(6)));
      setValue('lng', Number(position.coords.longitude.toFixed(6)));
    } catch (err: any) {
      let errorMessage = t('locationModal.error');
      if (err.code) {
        switch (err.code) {
          case 1: errorMessage = t('locationModal.errors.permissionDenied'); break;
          case 2: errorMessage = t('locationModal.errors.positionUnavailable'); break;
          case 3: errorMessage = t('locationModal.errors.timeout'); break;
        }
      }
      setLocationError(errorMessage);
    } finally {
      setIsConfirmingLocation(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    if (!placeProfile) return;
    const { error } = await supabase.from('places').update({
      name: data.name, phone: data.phone, address: data.address, city: data.city,
      lat: data.lat, lng: data.lng,
      services: data.services,
      languages: data.languages,
      opening_hours: data.openingHours,
      pricing_session_60: data.pricing60,
      pricing_session_90: data.pricing90,
      pricing_session_120: data.pricing120,
    }).eq('id', placeProfile.id);
    if (!error) {
      onProfileUpdate();
      navigate('/home');
    } else {
      console.error("Error updating profile:", error);
    }
  };
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;
  if (!placeProfile) return <div className="min-h-screen flex items-center justify-center">Could not load profile.</div>;

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
              <button onClick={onLogout} className="flex-shrink-0 p-2 text-gray-700 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" title={t('header.logout')}>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-3"><Building className="h-7 w-7 text-primary-600" /><span>{t('placeDashboard.businessProfile')}</span></h2>
                <p className="text-gray-600 mb-8">{t('placeDashboard.profileInfo')}</p>
              </div>
               {placeProfile.accountNumber && (
                <div className="flex items-center gap-2 bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1.5 rounded-lg">
                  <Badge className="h-4 w-4" />
                  <span>{placeProfile.accountNumber}</span>
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img src={placeProfile.profileImageUrl || 'https://via.placeholder.com/150'} alt="Profile" className="w-28 h-28 rounded-full object-cover shadow-md" />
                  <input type="file" ref={fileInputRef} onChange={handleProfileImageUpload} accept="image/*" className="hidden" />
                  <button type="button" onClick={handleUploadClick} className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full hover:bg-primary-600 shadow-sm" title={t('placeDashboard.uploadPhotoTitle')}><Camera className="h-4 w-4" /></button>
                </div>
                <div><h4 className="text-md font-semibold text-gray-900">{t('placeDashboard.profilePhoto')}</h4><p className="text-sm text-gray-600">{t('placeDashboard.updatePhoto')}</p></div>
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-2">Gallery Images</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4">
                  {(placeProfile.galleryImageUrls || []).map(url => (
                    <div key={url} className="relative group">
                      <img src={url} alt="Gallery item" className="w-full h-24 object-cover rounded-lg" />
                      <button 
                        type="button" 
                        onClick={() => handleGalleryImageDelete(url)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center justify-center w-full px-4 py-6 bg-gray-50 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-100">
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">Add up to 5 images</p>
                  </div>
                  <input type="file" multiple onChange={handleGalleryImageUpload} accept="image/*" className="hidden" />
                </label>
                {isUploading && <p className="text-sm text-gray-500 mt-2 flex items-center gap-2"><Loader className="h-4 w-4 animate-spin" /> Uploading images...</p>}
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
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('placeDashboard.address')}</label><input type="text" {...register('address')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('placeDashboard.city')}</label><input type="text" {...register('city')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500"/>
                    {t('placeDashboard.locationCoordinates')}
                  </h4>
                  <button 
                    type="button" 
                    onClick={handleConfirmLocation} 
                    disabled={isConfirmingLocation}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {isConfirmingLocation ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    <span>{isConfirmingLocation ? t('locationModal.gettingLocation') : t('placeDashboard.confirmLocation')}</span>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-3">{t('placeDashboard.confirmLocationInfo')}</p>
                {locationError && <p className="text-red-500 text-xs mb-3">{locationError}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('placeDashboard.latitude')}</label>
                    <input type="number" step="any" {...register('lat', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('placeDashboard.longitude')}</label>
                    <input type="number" step="any" {...register('lng', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" readOnly />
                  </div>
                </div>
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

              <div className="flex justify-end pt-4 border-t border-gray-200"><button type="submit" className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium">{t('placeDashboard.updateProfile')}</button></div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
