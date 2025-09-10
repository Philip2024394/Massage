import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Star, MapPin, Clock, MessageCircle, CheckCircle, Circle, Globe, Loader, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TherapistProfile } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../supabaseClient';
import { mapSupabaseTherapistToProfile } from '../data/data-mappers';
import { TherapistCardSkeleton } from './TherapistCardSkeleton';

interface LazyTherapistCardProps {
  therapistId: string;
  onWhatsAppClick: (phone: string, name: string) => void;
}

const TherapistCardContent: React.FC<{ therapist: TherapistProfile; onWhatsAppClick: (phone: string, name: string) => void; }> = ({ therapist, onWhatsAppClick }) => {
  const { t } = useTranslation();

  const displayStatus = useMemo(() => {
    if (therapist.isOnline) return { text: t('therapistCard.online'), icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500 text-white' };
    return { text: t('therapistCard.offline'), icon: <Circle className="h-4 w-4" />, color: 'bg-gray-500 text-white' };
  }, [therapist.isOnline, t]);

  const formatPrice = (price: number) => `Rp${(price / 1000).toFixed(0)}K`;

  return (
    <motion.div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="relative">
        <img loading="lazy" src={therapist.profileImageUrl || 'https://via.placeholder.com/400x400'} alt={therapist.name} className="w-full h-80 object-cover" />
        <div className="absolute top-4 left-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${displayStatus.color}`}>{displayStatus.icon}<span>{displayStatus.text}</span></div>
        </div>
        {therapist.distance && <div className="absolute top-4 right-4"><div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm font-medium">{t('therapistCard.kmAway', { distance: therapist.distance })}</div></div>}
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{therapist.name}</h3>
            <div className="flex items-center space-x-2 text-gray-600"><MapPin className="h-4 w-4" /><span className="text-sm">{therapist.location.city}</span></div>
          </div>
          <Link to={`/therapist/${therapist.id}/reviews`} className="flex items-center space-x-1 hover:bg-yellow-50 p-2 rounded-lg transition-colors" title={t('therapistCard.viewReviews')}>
            <Star className="h-5 w-5 text-yellow-500 fill-current" /><span className="font-semibold text-gray-900">{therapist.rating.toFixed(1)}</span><span className="text-gray-500 text-sm">{t('therapistCard.reviews', { reviewCount: therapist.reviewCount })}</span>
          </Link>
        </div>
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
          <div className="flex flex-wrap gap-2">
            {therapist.massageTypes.slice(0, 3).map(key => <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{t(key)}</span>)}
            {therapist.massageTypes.length > 3 && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{t('therapistCard.more', { count: therapist.massageTypes.length - 3 })}</span>}
          </div>
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
        <p className="text-gray-700 text-sm mb-6 line-clamp-3">{therapist.bio}</p>
        <button onClick={() => onWhatsAppClick(therapist.phone, therapist.name)} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"><MessageCircle className="h-5 w-5" /><span>{t('therapistCard.contact')}</span></button>
      </div>
    </motion.div>
  );
};

export const TherapistCard: React.FC<LazyTherapistCardProps> = ({ therapistId, onWhatsAppClick }) => {
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTherapistData = useCallback(async () => {
    if (!therapistId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('therapists').select('*').eq('id', therapistId).single();
      if (error) throw error;
      if (data) setTherapist(mapSupabaseTherapistToProfile(data));
    } catch (error) {
      console.error('Error fetching therapist profile:', error);
    } finally {
      setLoading(false);
    }
  }, [therapistId]);

  useEffect(() => {
    fetchTherapistData();
  }, [fetchTherapistData]);

  if (loading) return <TherapistCardSkeleton />;
  if (!therapist) return null; // Or some error component

  return <TherapistCardContent therapist={therapist} onWhatsAppClick={onWhatsAppClick} />;
};
