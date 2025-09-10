import React, { useRef, useEffect, useState, useCallback } from 'react';
import { User, LogOut, Camera, Badge, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { User as UserType, TherapistProfile } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Logo } from './Logo';
import { massageTypeKeys, specialtyKeys } from '../data/services';
import { supabase } from '../supabaseClient';
import { mapSupabaseTherapistToProfile } from '../data/data-mappers';

type ProfileForm = Omit<TherapistProfile, 'id' | 'rating' | 'reviewCount' | 'distance' | 'status' | 'location' | 'accountNumber'> & {
  city: string;
  pricing60: number;
  pricing90: number;
  pricing120: number;
};

interface TherapistDashboardProps {
  user: UserType;
  onLogout: () => void;
  onProfileUpdate: () => void;
}

export const TherapistDashboard: React.FC<TherapistDashboardProps> = ({ user, onLogout, onProfileUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [therapistProfile, setTherapistProfile] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { register, handleSubmit, reset, setValue } = useForm<ProfileForm>();

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('therapists').select('*').eq('id', user.id).single();
      if (error) throw error;
      
      const profile = mapSupabaseTherapistToProfile(data);
      setTherapistProfile(profile);
      reset({
        name: profile.name,
        bio: profile.bio,
        experience: profile.experience,
        phone: profile.phone,
        city: profile.location.city,
        pricing60: profile.pricing.session60,
        pricing90: profile.pricing.session90,
        pricing120: profile.pricing.session120,
        massageTypes: profile.massageTypes,
        specialties: profile.specialties,
        isOnline: profile.isOnline,
        profileImageUrl: profile.profileImageUrl,
        languages: profile.languages,
        certifications: profile.certifications,
      });
    } catch (error) {
      console.error('Error fetching therapist profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user, reset]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !therapistProfile) return;
    const file = event.target.files[0];
    const fileName = `${user.id}/${Date.now()}`;
    const { data, error } = await supabase.storage.from('profile-images').upload(fileName, file);
    if (error) {
      console.error('Error uploading image:', error);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(data.path);
    const { error: updateError } = await supabase.from('therapists').update({ profile_image_url: publicUrl }).eq('id', user.id);
    if (!updateError) fetchProfile();
  };

  const handleToggleStatus = async () => {
    if (!therapistProfile) return;
    const newStatus = !therapistProfile.isOnline;
    const { error } = await supabase.from('therapists').update({ is_online: newStatus }).eq('id', user.id);
    if (!error) {
      setTherapistProfile(prev => prev ? { ...prev, isOnline: newStatus } : null);
      setValue('isOnline', newStatus);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const onSubmit = async (data: ProfileForm) => {
    const { error } = await supabase.from('therapists').update({
      name: data.name,
      bio: data.bio,
      experience: data.experience,
      phone: data.phone,
      city: data.city,
      pricing_session_60: data.pricing60,
      pricing_session_90: data.pricing90,
      pricing_session_120: data.pricing120,
      massage_types: data.massageTypes,
      specialties: data.specialties,
    }).eq('id', user.id);
    if (!error) {
      onProfileUpdate();
      navigate('/home');
    } else {
      console.error("Error updating profile:", error);
    }
  };
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Profile...</div>;
  if (!therapistProfile) return <div className="min-h-screen flex items-center justify-center">Could not load profile.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Logo layout="horizontal" className="h-10 w-auto" />
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/home" title="View Home Page" className="p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100 transition-colors">
                <Home className="h-5 w-5" />
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">{t('therapistDashboard.status')}</span>
                <button onClick={handleToggleStatus} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${therapistProfile.isOnline ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {therapistProfile.isOnline ? t('therapistDashboard.online') : t('therapistDashboard.offline')}
                </button>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block">{therapistProfile.name}</span>
              <button onClick={onLogout} className="p-2 text-gray-700 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" title={t('header.logout')}>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-3"><User className="h-7 w-7 text-primary-600" /><span>{t('therapistDashboard.profileManagement')}</span></h2>
                <p className="text-gray-600 mb-8">{t('therapistDashboard.profileInfo')}</p>
              </div>
              {therapistProfile.accountNumber && (
                <div className="flex items-center gap-2 bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1.5 rounded-lg">
                  <Badge className="h-4 w-4" />
                  <span>{therapistProfile.accountNumber}</span>
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img src={therapistProfile.profileImageUrl || 'https://via.placeholder.com/150'} alt="Profile" className="w-28 h-28 rounded-full object-cover shadow-md" />
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  <button type="button" onClick={handleUploadClick} className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full hover:bg-primary-600 shadow-sm" title={t('therapistDashboard.uploadPhotoTitle')}><Camera className="h-4 w-4" /></button>
                </div>
                <div><h4 className="text-md font-semibold text-gray-900">{t('therapistDashboard.profilePhoto')}</h4><p className="text-sm text-gray-600">{t('therapistDashboard.updatePhoto')}</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.fullName')}</label><input type="text" {...register('name')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.experience')}</label><input type="number" {...register('experience')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.phone')}</label><input type="tel" {...register('phone')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.city')}</label><input type="text" {...register('city')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
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
               <input type="hidden" {...register('isOnline')} />
              <div className="flex justify-end pt-4 border-t border-gray-200"><button type="submit" className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium">{t('therapistDashboard.updateProfile')}</button></div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
