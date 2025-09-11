import React from 'react';
import { Star, MapPin, MessageCircle, Search, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MassagePlaceProfile } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { getTodaysHours } from '../utils/time';

interface PlaceCardProps {
  place: MassagePlaceProfile;
  onWhatsAppClick: (phone: string, name: string) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, onWhatsAppClick }) => {
  const { t } = useTranslation();

  const displayStatus = place.isOpen
    ? { text: t('placeCard.open'), color: 'bg-green-500 text-white' }
    : { text: t('placeCard.closed'), color: 'bg-gray-500 text-white' };

  const formatPrice = (price: number) => `Rp${(price / 1000).toFixed(0)}K`;
  
  const todaysHours = getTodaysHours(place.openingHours, t);

  return (
    <motion.div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="relative">
        <img loading="lazy" src={place.profileImageUrl || 'https://via.placeholder.com/400x300'} alt={place.name} className="w-full h-48 object-cover" />
        <div className="absolute top-3 left-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${displayStatus.color}`}>{displayStatus.text}</div>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{place.name}</h3>
        <div className="flex items-center space-x-2 text-gray-600 text-sm mb-3"><MapPin className="h-4 w-4 flex-shrink-0" /><span className="truncate">{place.address}, {place.city}</span></div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-4">
            <div className="flex items-center space-x-1"><Star className="h-4 w-4 text-yellow-500 fill-current" /><span className="font-semibold text-gray-800">{place.rating.toFixed(1)}</span><span className="text-gray-500">({place.reviewCount})</span></div>
            {place.distance && <div className="flex items-center space-x-1 text-gray-600"><MapPin className="h-4 w-4" /><span>{t('placeCard.kmAway', { distance: place.distance })}</span></div>}
        </div>
        
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Clock className="h-4 w-4" />
            <span>{todaysHours}</span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('placeCard.services')}</h4>
          <div className="flex flex-wrap gap-1.5">
            {place.services.slice(0, 4).map(key => <span key={key} className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{t(key)}</span>)}
            {place.services.length > 4 && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{t('placeCard.more', { count: place.services.length - 4 })}</span>}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('therapistCard.pricing')}</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 rounded-lg p-2"><div className="text-md font-bold text-primary-600">{formatPrice(place.pricing.session60)}</div><div className="text-xs text-gray-600">{t('therapistCard.session_60')}</div></div>
            <div className="bg-gray-50 rounded-lg p-2"><div className="text-md font-bold text-primary-600">{formatPrice(place.pricing.session90)}</div><div className="text-xs text-gray-600">{t('therapistCard.session_90')}</div></div>
            <div className="bg-gray-50 rounded-lg p-2"><div className="text-md font-bold text-primary-600">{formatPrice(place.pricing.session120)}</div><div className="text-xs text-gray-600">{t('therapistCard.session_120')}</div></div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-3">
          <button onClick={() => onWhatsAppClick(place.phone, place.name)} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"><MessageCircle className="h-5 w-5" /><span>{t('placeCard.contact')}</span></button>
          <Link to={`/place-profiles/${place.login_code}`} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"><Search className="h-5 w-5" /><span>{t('placeCard.viewDetails')}</span></Link>
        </div>
      </div>
    </motion.div>
  );
};
