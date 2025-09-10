import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useTranslation } from '../hooks/useTranslation';

export interface ReviewFormData {
  customerName: string;
  customerWhatsApp: string;
  rating: number;
  comment: string;
}

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReviewFormData) => void;
  therapistName: string;
}

const StarRatingInput: React.FC<{ value: number; onChange: (value: number) => void }> = ({ value, onChange }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button type="button" key={star} onClick={() => onChange(star)} className="focus:outline-none">
          <Star className={`h-8 w-8 transition-colors ${star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
};

export const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({ isOpen, onClose, onSubmit, therapistName }) => {
  const { t } = useTranslation();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ReviewFormData>({
    defaultValues: { rating: 0 }
  });
  const rating = watch('rating');

  const handleFormSubmit = (data: ReviewFormData) => {
    onSubmit(data);
    setFormSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    // Reset state after modal closes
    setTimeout(() => {
      setFormSubmitted(false);
      setValue('customerName', '');
      setValue('customerWhatsApp', '');
      setValue('rating', 0);
      setValue('comment', '');
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{formSubmitted ? t('submitReview.thankYou') : t('submitReview.title', { name: therapistName })}</h3>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              </div>
              {formSubmitted ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">{t('submitReview.submissionMessage')}</p>
                  <button onClick={handleClose} className="px-6 py-2 bg-primary-500 text-white rounded-lg">{t('submitReview.close')}</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('submitReview.ratingLabel')}</label>
                    <input type="hidden" {...register('rating', { required: true, min: 1 })} />
                    <StarRatingInput value={rating} onChange={(value) => setValue('rating', value, { shouldValidate: true })} />
                    {errors.rating && <p className="text-red-500 text-xs mt-1">{t('submitReview.errors.ratingRequired')}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('submitReview.nameLabel')}</label>
                    <input type="text" {...register('customerName', { required: t('submitReview.errors.nameRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder={t('submitReview.namePlaceholder')} />
                    {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('submitReview.whatsappLabel')}</label>
                    <div className="flex items-center">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+62</span>
                        <input type="tel" {...register('customerWhatsApp', { required: t('submitReview.errors.whatsappRequired') })} className="w-full px-3 py-2 border border-gray-300 rounded-r-lg" placeholder={t('submitReview.whatsappPlaceholder')} />
                    </div>
                    {errors.customerWhatsApp && <p className="text-red-500 text-xs mt-1">{errors.customerWhatsApp.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('submitReview.commentLabel')}</label>
                    <textarea {...register('comment', { required: t('submitReview.errors.commentRequired') })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder={t('submitReview.commentPlaceholder')} />
                    {errors.comment && <p className="text-red-500 text-xs mt-1">{errors.comment.message as string}</p>}
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 font-medium">{t('submitReview.submitButton')}</button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
