import React, { useState, useEffect, useCallback } from 'react';
import { Star, MapPin, MessageCircle, CheckCircle, Circle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MassagePlaceProfile } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../supabaseClient';
import { mapSupabasePlaceToProfile } from '../data/data-mappers';
import { PlaceCardSkeleton } from './PlaceCardSkeleton';

interface LazyPlaceCardProps {
  placeId: string;
  onWhatsAppClick: (phone: string, name: string) => void;
}

const PlaceCardContent: React.FC<{ place: MassagePlaceProfile; onWhatsAppClick: (phone: string, name: string) => void; }> = ({ place, onWhatsAppClick }) => {
  const { t } = useTranslation();

  const displayStatus = place.isOnline 
    ? { text: t('placeCard.open'), icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-500 text-white' }
    : { text: t('placeCard.closed'), icon: <Circle className="h-4 w-4" />, color: 'bg-gray-500 text-white' };

  return (
    <motion.div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="relative">
        <img loading="lazy" src={place.profileImageUrl || 'https://via.placeholder.com/400x300'} alt={place.name} className="w-full h-48 object-cover" />
        <div className="absolute top-3 left-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${displayStatus.color}`}>{displayStatus.icon}<span>{displayStatus.text}</span></div>
        </div>
        {place.distance && <div className="absolute top-3 right-3"><div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm font-medium">{t('placeCard.kmAway', { distance: place.distance })}</div></div>}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{place.name}</h3>
        <div className="flex items-center space-x-2 text-gray-600 text-sm mb-3"><MapPin className="h-4 w-4 flex-shrink-0" /><span className="truncate">{place.address}, {place.city}</span></div>
        <div className="flex items-center space-x-4 mb-4"><div className="flex items-center space-x-1"><Star className="h-5 w-5 text-yellow-500 fill-current" /><span className="font-semibold text-gray-900">{place.rating.toFixed(1)}</span><span className="text-gray-500 text-sm">{t('placeCard.reviews', { reviewCount: place.reviewCount })}</span></div></div>
        <div className="mb-4 flex-grow">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('placeCard.services')}</h4>
          <div className="flex flex-wrap gap-1.5">
            {place.services.slice(0, 4).map(key => <span key={key} className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{t(key)}</span>)}
            {place.services.length > 4 && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{t('placeCard.more', { count: place.services.length - 4 })}</span>}
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-3">
          <button onClick={() => onWhatsAppClick(place.phone, place.name)} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"><MessageCircle className="h-5 w-5" /><span>{t('placeCard.contact')}</span></button>
          <Link to={`/place/${place.id}/details`} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"><Search className="h-5 w-5" /><span>{t('placeCard.viewDetails')}</span></Link>
        </div>
      </div>
    </motion.div>
  );
};

export const PlaceCard: React.FC<LazyPlaceCardProps> = ({ placeId, onWhatsAppClick }) => {
  const [place, setPlace] = useState<MassagePlaceProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlaceData = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('places').select('*').eq('id', placeId).single();
      if (error) throw error;
      if (data) setPlace(mapSupabasePlaceToProfile(data));
    } catch (error) {
      console.error('Error fetching place profile:', error);
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetchPlaceData();
  }, [fetchPlaceData]);

  if (loading) return <PlaceCardSkeleton />;
  if (!place) return null;

  return <PlaceCardContent place={place} onWhatsAppClick={onWhatsAppClick} />;
};
