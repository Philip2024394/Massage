import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { User as UserType, TherapistProfile } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Logo } from './Logo';
import { massageTypeKeys, specialtyKeys } from '../data/services';
import { supabase } from '../supabaseClient';

interface TherapistDashboardProps {
  user: UserType;
  onLogout: () => void;
}

interface ProfileForm {
  name: string;
  bio: string;
  experience: number;
  phone: string;
  city: string;
  pricing60: number;
  pricing90: number;
  pricing120: number;
  massageTypes: string[];
  specialties: string[];
  isOnline: boolean;
}

export const TherapistDashboard: React.FC<TherapistDashboardProps> = ({ user, onLogout }) => {
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  
  const { register, handleSubmit, reset, setValue } = useForm<ProfileForm>();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('therapists')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        const formattedProfile: TherapistProfile = {
          id: data.id, name: data.name ?? '', email: data.email ?? '', profileImageUrl: data.profile_image_url ?? '',
          rating: data.rating, reviewCount: data.review_count, specialties: data.specialties ?? [], bio: data.bio ?? '',
          experience: data.experience ?? 0, isOnline: data.is_online, status: data.status,
          location: { lat: data.lat ?? 0, lng: data.lng ?? 0, city: data.city ?? '' },
          pricing: { session60: data.pricing_session_60 ?? 0, session90: data.pricing_session_90 ?? 0, session120: data.pricing_session_120 ?? 0 },
          massageTypes: data.massage_types ?? [], phone: data.phone ?? '', languages: data.languages ?? [],
          certifications: data.certifications ?? [], therapistNumber: data.therapist_number ?? ''
        };
        setProfile(formattedProfile);
        reset({
          name: formattedProfile.name, bio: formattedProfile.bio, experience: formattedProfile.experience, phone: formattedProfile.phone,
          city: formattedProfile.location.city, pricing60: formattedProfile.pricing.session60, pricing90: formattedProfile.pricing.session90,
          pricing120: formattedProfile.pricing.session120, massageTypes: formattedProfile.massageTypes, specialties: formattedProfile.specialties,
          isOnline: formattedProfile.isOnline
        });
      }
      if (error) console.error("Error fetching profile", error);
      setLoading(false);
    };
    fetchProfile();
  }, [user.id, reset]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !profile) return;
    const file = event.target.files[0];
    const filePath = `${user.id}/${Date.now()}`;
    const { error: uploadError } = await supabase.storage.from('profile-images').upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return;
    }

    const { data } = supabase.storage.from('profile-images').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase.from('therapists').update({ profile_image_url: publicUrl }).eq('id', user.id);
    if (!updateError) { setProfile({ ...profile, profileImageUrl: publicUrl }); }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const onSubmit = async (data: ProfileForm) => {
    const { error } = await supabase.from('therapists').update({
      name: data.name, bio: data.bio, experience: data.experience, phone: data.phone, city: data.city,
      pricing_session_60: data.pricing60, pricing_session_90: data.pricing90, pricing_session_120: data.pricing120,
      massage_types: data.massageTypes, specialties: data.specialties, is_online: data.isOnline
    }).eq('id', user.id);
    if (error) { console.error("Error updating profile", error); }
    else { alert(t('therapistDashboard.updateSuccess')); }
  };

  const handleStatusToggle = async () => {
    if (!profile) return;
    const newStatus = !profile.isOnline;
    const { error } = await supabase.from('therapists').update({ is_online: newStatus }).eq('id', user.id);
    if (!error) { setProfile({ ...profile, isOnline: newStatus }); setValue('isOnline', newStatus); }
  };
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center">Could not load profile.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4"><Logo className="h-12 w-auto" /></div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">{t('therapistDashboard.status')}</span>
                <button onClick={handleStatusToggle} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${profile.isOnline ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {profile.isOnline ? t('therapistDashboard.online') : t('therapistDashboard.offline')}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{profile.name}</span>
                <button onClick={onLogout} className="p-2 text-gray-700 hover:text-primary-600" title={t('header.logout')}><LogOut className="h-5 w-5" /></button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-3"><User className="h-7 w-7 text-primary-600" /><span>{t('therapistDashboard.profileManagement')}</span></h2>
            <p className="text-gray-600 mb-8">{t('therapistDashboard.profileInfo')}</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img src={profile.profileImageUrl || 'https://via.placeholder.com/150'} alt="Profile" className="w-28 h-28 rounded-full object-cover shadow-md" />
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
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.session60')}</label><input type="number" {...register('pricing60')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.session90')}</label><input type="number" {...register('pricing90')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('therapistDashboard.session120')}</label><input type="number" {...register('pricing120')} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
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
              <div className="flex justify-end pt-4 border-t border-gray-200"><button type="submit" className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium">{t('therapistDashboard.updateProfile')}</button></div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
