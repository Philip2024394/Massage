import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ArrowLeft, MessageSquarePlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { TherapistProfile, Review } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { SubmitReviewModal } from '../components/SubmitReviewModal';
import { ReviewFormData } from '../App';

interface ReviewsPageProps {
  therapists: TherapistProfile[];
  reviews: Review[];
  onReviewSubmit: (therapistId: string, formData: ReviewFormData) => void;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ therapists, reviews, onReviewSubmit }) => {
  const { therapistId } = useParams<{ therapistId: string }>();
  const { t } = useTranslation();
  const [showReviewModal, setShowReviewModal] = useState(false);

  const therapist = useMemo(() => therapists.find(t => t.id === therapistId), [therapists, therapistId]);
  const approvedReviews = useMemo(() => reviews.filter(r => r.therapistId === therapistId && r.status === 'approved'), [reviews, therapistId]);

  const averageRating = useMemo(() => {
    if (approvedReviews.length === 0) return 0;
    const total = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / approvedReviews.length).toFixed(1);
  }, [approvedReviews]);

  if (!therapist) {
    return <div className="p-8 text-center">{t('reviewsPage.therapistNotFound')}</div>;
  }
  
  const handleFormSubmit = (formData: ReviewFormData) => {
    onReviewSubmit(therapist.id, formData);
    setShowReviewModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/home" className="flex items-center space-x-2 text-gray-600 hover:text-primary-600">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">{t('reviewsPage.backToBrowse')}</span>
            </Link>
            <button onClick={() => setShowReviewModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
              <MessageSquarePlus className="h-5 w-5" />
              <span>{t('reviewsPage.writeReview')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 mb-8 flex items-center space-x-6">
            <img src={therapist.profileImageUrl || 'https://via.placeholder.com/150'} alt={therapist.name} className="w-24 h-24 rounded-full object-cover shadow-md" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">{therapist.name}</h1>
              <div className="flex items-center space-x-2 mt-2">
                <Star className="h-6 w-6 text-yellow-500 fill-current" />
                <span className="text-2xl font-bold text-gray-800">{averageRating}</span>
                <span className="text-gray-600 mt-1">{t('therapistCard.reviews', { reviewCount: approvedReviews.length })}</span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('reviewsPage.customerReviews')}</h2>
          
          <div className="space-y-6">
            {approvedReviews.length > 0 ? (
              approvedReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">{review.customerName}</h4>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-bold text-gray-800">{review.rating}.0</span>
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    </div>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-4">{new Date(review.createdAt).toLocaleDateString()}</p>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">{t('reviewsPage.noReviewsYet')}</h3>
                <p className="text-gray-600 mt-2">{t('reviewsPage.beTheFirst')}</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <SubmitReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleFormSubmit}
        therapistName={therapist.name}
      />
    </div>
  );
};
