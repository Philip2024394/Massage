import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Phone, Home, Loader, ArrowLeft, Clock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { MassagePlaceProfile } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../supabaseClient';
import { mapSupabasePlaceToProfile } from '../data/data-mappers';
import { getWhatsAppUrl } from '../utils/location';
import { getTodaysHours } from '../utils/time';

export const PlaceProfilePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { t } = useTranslation();
  const [place, setPlace] = useState<MassagePlaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>('');

  const fetchPlaceData = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('login_code', code.toUpperCase())
        .single();
      
      if (error) throw error;
      if (data) {
        const mappedPlace = mapSupabasePlaceToProfile(data);
        setPlace(mappedPlace);
        setMainImage(mappedPlace.profileImageUrl || (mappedPlace.galleryImageUrls.length > 0 ? mappedPlace.galleryImageUrls[0] : ''));
      }
    } catch (error) {
      console.error('Error fetching place profile:', error);
      setPlace(null);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchPlaceData();
  }, [fetchPlaceData]);

  const formatPrice = (price: number) => `Rp${(price / 1000).toFixed(0)}K`;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="h-8 w-8 animate-spin" /></div>;
  }

  if (!place) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Profile Not Found</h2>
        <p className="text-gray-600 mb-6">The code you entered does not match any place profile.</p>
        <Link to="/" className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
          Back to Sign In
        </Link>
      </div>
    );
  }

  const todaysHours = getTodaysHours(place.openingHours, t);
  
  const allImages = [place.profileImageUrl, ...(place.galleryImageUrls || [])].filter(Boolean);
  const uniqueImages = [...new Set(allImages)];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/home" className="flex items-center space-x-2 text-gray-600 hover:text-primary-600">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">{t('placeDetailsPage.backToBrowse')}</span>
            </Link>
             <Link to="/home" className="text-gray-700 hover:text-primary-600 p-2 rounded-full" title="Back to Home">
              <Home className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 mb-8"
        >
          <div className="relative mb-4">
            <img src={mainImage || 'https://via.placeholder.com/800x500'} alt={place.name} className="w-full h-64 sm:h-80 object-cover rounded-lg shadow-md transition-all duration-300" />
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/50 text-white px-3 py-1.5 rounded-full">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="font-bold text-lg">{place.rating.toFixed(1)}</span>
              <span className="text-sm opacity-80">({place.reviewCount})</span>
            </div>
          </div>
          
          {uniqueImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mb-6">
              {uniqueImages.slice(0, 5).map((url, index) => (
                <img 
                  key={index} 
                  src={url} 
                  alt={`Gallery thumbnail ${index + 1}`} 
                  onClick={() => setMainImage(url)} 
                  className={`w-full h-16 sm:h-20 object-cover rounded-md cursor-pointer border-2 transition-all ${mainImage === url ? 'border-primary-500 scale-105' : 'border-transparent hover:border-gray-300'}`} 
                />
              ))}
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{place.name}</h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-6">
              <div className="flex-grow">
                <div className="flex items-center space-x-2 mt-2 text-gray-600">
                  <MapPin className="h-4 w-4" /> <span>{place.address}, {place.city}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                  <button onClick={() => window.open(getWhatsAppUrl(place.phone, `Hi, I'm interested in your services at ${place.name}.`), '_blank')} className="flex items-center space-x-2 text-green-600 hover:underline">
                      <Phone className="h-4 w-4" /> <span>{t('placeDetailsPage.contact')}</span>
                  </button>
                   <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{todaysHours}</span>
                    </div>
                </div>
              </div>
          </div>

          {place.languages.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('placeDetailsPage.languages')}</h3>
                <div className="flex flex-wrap gap-2">
                    {place.languages.map((lang) => (
                        <span key={lang} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">{lang}</span>
                    ))}
                </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('placeDetailsPage.services')}</h3>
              <div className="flex flex-wrap gap-2">
                  {place.services.map((serviceKey) => (
                      <span key={serviceKey} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">{t(serviceKey)}</span>
                  ))}
              </div>
          </div>
           <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('therapistCard.pricing')}</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-3"><div className="text-lg font-bold text-primary-600">{formatPrice(place.pricing.session60)}</div><div className="text-xs text-gray-600">{t('therapistCard.session_60')}</div></div>
                <div className="bg-gray-50 rounded-lg p-3"><div className="text-lg font-bold text-primary-600">{formatPrice(place.pricing.session90)}</div><div className="text-xs text-gray-600">{t('therapistCard.session_90')}</div></div>
                <div className="bg-gray-50 rounded-lg p-3"><div className="text-lg font-bold text-primary-600">{formatPrice(place.pricing.session120)}</div><div className="text-xs text-gray-600">{t('therapistCard.session_120')}</div></div>
              </div>
            </div>
        </motion.div>
      </main>
    </div>
  );
};
