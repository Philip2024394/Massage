import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Clock, CheckCircle, Circle, Globe, Home, Loader, Search, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { TherapistProfile } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../supabaseClient';
import { mapSupabaseTherapistToProfile } from '../data/data-mappers';
import { Logo } from '../components/Logo';
import { getWhatsAppUrl } from '../utils/location';

export const TherapistProfilePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { t } = useTranslation();
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTherapistData = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('therapists')
        .select('*')
        .eq('login_code', code.toUpperCase())
        .single();
      
      if (error) throw error;
      if (data) setTherapist(mapSupabaseTherapistToProfile(data));
    } catch (error) {
      console.error('Error fetching therapist profile:', error);
      setTherapist(null);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchTherapistData();
  }, [fetchTherapistData]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="h-8 w-8 animate-spin" /></div>;
  }

  if (!therapist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Profile Not Found</h2>
        <p className="text-gray-600 mb-6">The code you entered does not match any therapist profile.</p>
        <Link to="/" className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
          Back to Sign In
        </Link>
      </div>
    );
  }

  const displayStatus = therapist.isOnline 
    ? { text: t('therapistCard.online'), icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500 text-white' }
    : { text: t('therapistCard.offline'), icon: <Circle className="h-4 w-4" />, color: 'bg-gray-500 text-white' };

  const formatPrice = (price: number) => `Rp${(price / 1000).toFixed(0)}K`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-gray-700 hover:text-primary-600 p-2 rounded-full" title="Back to Home">
              <Home className="h-6 w-6" />
            </Link>
            <Logo layout="horizontal" className="h-10 w-auto" />
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative">
            <img loading="lazy" src={therapist.profileImageUrl || 'https://via.placeholder.com/400x400'} alt={therapist.name} className="w-full h-80 object-cover" />
            <div className="absolute top-4 left-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${displayStatus.color}`}>{displayStatus.icon}<span>{displayStatus.text}</span></div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{therapist.name}</h3>
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="font-semibold text-gray-900">{therapist.rating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({therapist.reviewCount})</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-600 mb-4"><MapPin className="h-4 w-4" /><span className="text-sm">{therapist.location.city}</span></div>

            <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1"><Clock className="h-4 w-4" /><span>{t('therapistCard.experience', { experience: therapist.experience })}</span></div><span>•</span>
              <div className="flex items-center space-x-1.5"><Globe className="h-4 w-4" /><span>{therapist.languages.join(', ')}</span></div>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">{t('therapistCard.specialties')}</h4>
              <div className="flex flex-wrap gap-2">{therapist.specialties.map(key => <span key={key} className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{t(key)}</span>)}</div>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">{t('therapistCard.services')}</h4>
              <div className="flex flex-wrap gap-2">{therapist.massageTypes.map(key => <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{t(key)}</span>)}</div>
            </div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">{t('therapistCard.pricing')}</h4>
                <Link to="/package-details" className="flex items-center space-x-1.5 text-sm text-primary-600 hover:text-primary-700 hover:underline"><Search className="h-4 w-4" /><span>{t('therapistCard.packageDetails')}</span></Link>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-3"><div className="text-lg font-bold text-primary-600">{formatPrice(therapist.pricing.session60)}</div><div className="text-xs text-gray-600">{t('therapistCard.session_60')}</div></div>
                <div className="bg-gray-50 rounded-lg p-3"><div className="text-lg font-bold text-primary-600">{formatPrice(therapist.pricing.session90)}</div><div className="text-xs text-gray-600">{t('therapistCard.session_90')}</div></div>
                <div className="bg-gray-50 rounded-lg p-3"><div className="text-lg font-bold text-primary-600">{formatPrice(therapist.pricing.session120)}</div><div className="text-xs text-gray-600">{t('therapistCard.session_120')}</div></div>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-6">{therapist.bio}</p>
            <button onClick={() => window.open(getWhatsAppUrl(therapist.phone, `Hi ${therapist.name}`), '_blank')} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"><MessageCircle className="h-5 w-5" /><span>{t('therapistCard.contact')}</span></button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
