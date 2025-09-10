import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ArrowLeft, MessageSquarePlus, MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { MassagePlaceProfile, Review } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { SubmitReviewModal, ReviewFormData } from '../components/SubmitReviewModal';
import { supabase } from '../supabaseClient';
import { mapSupabasePlaceToProfile, mapSupabaseReviewToAppReview } from '../data/data-mappers';
import { getWhatsAppUrl } from '../utils/location';

export const PlaceDetailsPage: React.FC = () => {
  const { placeId } = useParams<{ placeId: string }>();
  const { t } = useTranslation();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [place, setPlace] = useState<MassagePlaceProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    try {
      const [placeRes, reviewsRes] = await Promise.all([
        supabase.from('places').select('*').eq('id', placeId).single(),
        supabase.from('reviews').select('*').eq('target_id', placeId).eq('status', 'approved')
      ]);
      if (placeRes.error) throw placeRes.error;
      if (reviewsRes.error) throw reviewsRes.error;

      setPlace(mapSupabasePlaceToProfile(placeRes.data));
      setReviews(reviewsRes.data.map(mapSupabaseReviewToAppReview));
    } catch (error) {
      console.error("Error fetching place details:", error);
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);
  
  const handleReviewSubmit = async (formData: ReviewFormData) => {
    if (!place) return;
    await supabase.from('reviews').insert({
      target_id: place.id,
      target_type: 'place',
      customer_name: formData.customerName,
      customer_whatsapp: `+62${formData.customerWhatsApp}`,
      rating: formData.rating,
      comment: formData.comment,
      status: 'pending',
    });
    setShowReviewModal(false);
    // You could show a success message here
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!place) return <div className="p-8 text-center">{t('placeDetailsPage.placeNotFound')}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/home" className="flex items-center space-x-2 text-gray-600 hover:text-primary-600">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">{t('placeDetailsPage.backToBrowse')}</span>
            </Link>
            <button onClick={() => setShowReviewModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
              <MessageSquarePlus className="h-5 w-5" />
              <span>{t('placeDetailsPage.writeReview')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-6">
                <img src={place.profileImageUrl || 'https://via.placeholder.com/150'} alt={place.name} className="w-full sm:w-32 h-48 sm:h-32 rounded-lg object-cover shadow-md mb-4 sm:mb-0" />
                <div className="flex-grow">
                  <h1 className="text-2xl font-bold text-gray-900">{place.name}</h1>
                  <div className="flex items-center space-x-2 mt-2 text-gray-600">
                    <MapPin className="h-4 w-4" /> <span>{place.address}, {place.city}</span>
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="text-xl font-bold text-gray-800">{averageRating}</span>
                      <span className="text-gray-600 mt-1 text-sm">{t('placeCard.reviews', { reviewCount: reviews.length })}</span>
                    </div>
                    <button onClick={() => window.open(getWhatsAppUrl(place.phone, `Hi, I'm interested in your services at ${place.name}.`), '_blank')} className="flex items-center space-x-2 text-green-600 hover:underline">
                        <Phone className="h-4 w-4" /> <span>{t('placeDetailsPage.contact')}</span>
                    </button>
                  </div>
                </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('placeDetailsPage.services')}</h3>
                <div className="flex flex-wrap gap-2">
                    {place.services.map((serviceKey) => (
                        <span key={serviceKey} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">{t(serviceKey)}</span>
                    ))}
                </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('placeDetailsPage.customerReviews')}</h2>
          
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <motion.div key={review.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">{review.customerName}</h4>
                    <div className="flex items-center space-x-1"><span className="text-sm font-bold text-gray-800">{review.rating}.0</span><Star className="h-4 w-4 text-yellow-500 fill-current" /></div>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-4">{new Date(review.createdAt).toLocaleDateString()}</p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">{t('placeDetailsPage.noReviewsYet')}</h3>
                <p className="text-gray-600 mt-2">{t('placeDetailsPage.beTheFirst')}</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <SubmitReviewModal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} onSubmit={handleReviewSubmit} therapistName={place.name} />
    </div>
  );
};
