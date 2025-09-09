import React, { useState } from 'react';
import { LogOut, Shield, Users, MessageSquare, Edit, Trash2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { User as UserType, TherapistProfile, Review } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Logo } from './Logo';

const ToggleSwitch: React.FC<{ isOn: boolean; onToggle: (isOn: boolean) => void; }> = ({ isOn, onToggle }) => (
  <button onClick={() => onToggle(!isOn)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isOn ? 'bg-primary-600' : 'bg-gray-300'}`}>
    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

interface AdminDashboardProps {
  user: UserType;
  therapists: TherapistProfile[];
  reviews: Review[];
  onLogout: () => void;
  onUpdateTherapistStatus: (therapistId: string, newStatus: 'active' | 'pending' | 'blocked') => void;
  onUpdateReview: (reviewId: string, updates: Partial<Review>) => void;
  onDeleteReview: (reviewId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, therapists, reviews, onLogout, onUpdateTherapistStatus, onUpdateReview, onDeleteReview }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'therapists' | 'reviews'>('therapists');
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const getStatusBadge = (status: 'active' | 'pending' | 'blocked') => { /* ... */ };
  const getReviewStatusBadge = (status: 'approved' | 'pending' | 'rejected') => { /* ... */ };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReview) {
      onUpdateReview(editingReview.id, { comment: editingReview.comment, rating: editingReview.rating });
      setEditingReview(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Logo className="h-12 w-auto" />
              <span className="text-gray-500">•</span>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-600" />
                <span>{t('adminDashboard.title')}</span>
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
              <button onClick={onLogout} className="p-2 text-gray-700 hover:text-red-600" title={t('header.logout')}><LogOut className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('therapists')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'therapists' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              <Users className="h-5 w-5" /><span>{t('adminDashboard.manageTherapists')}</span>
            </button>
            <button onClick={() => setActiveTab('reviews')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === 'reviews' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              <MessageSquare className="h-5 w-5" /><span>{t('adminDashboard.manageReviews')}</span>
            </button>
          </nav>
        </div>
        {activeTab === 'therapists' && <TherapistsTable therapists={therapists} onUpdateTherapistStatus={onUpdateTherapistStatus} t={t} />}
        {activeTab === 'reviews' && <ReviewsTable reviews={reviews} therapists={therapists} onUpdateReview={onUpdateReview} onDeleteReview={onDeleteReview} editingReview={editingReview} setEditingReview={setEditingReview} handleSaveReview={handleSaveReview} t={t} />}
      </main>
    </div>
  );
};

// Extracted sub-components for clarity
const TherapistsTable = ({ therapists, onUpdateTherapistStatus, t }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.therapist')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.whatsappNumber')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.rating')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {therapists.map((therapist: TherapistProfile) => (
              <tr key={therapist.id}>
                <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex-shrink-0 h-10 w-10"><img className="h-10 w-10 rounded-full object-cover" src={therapist.profileImage} alt={therapist.name} /></div><div className="ml-4"><div className="text-sm font-medium text-gray-900">{therapist.name}</div><div className="text-sm text-gray-500">{therapist.location.city}</div></div></div></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{therapist.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${therapist.status === 'active' ? 'bg-green-100 text-green-800' : therapist.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{t(`adminDashboard.${therapist.status}`)}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{therapist.rating}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {therapist.status === 'pending' ? (
                    <button onClick={() => onUpdateTherapistStatus(therapist.id, 'active')} className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200"><Check className="h-4 w-4" /><span>{t('adminDashboard.approve')}</span></button>
                  ) : (
                    <div className="flex items-center space-x-2"><ToggleSwitch isOn={therapist.status === 'active'} onToggle={(isOn) => onUpdateTherapistStatus(therapist.id, isOn ? 'active' : 'blocked')} /><span className="text-xs text-gray-600">{t('adminDashboard.visibility')}</span></div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </motion.div>
);

const ReviewsTable = ({ reviews, therapists, onUpdateReview, onDeleteReview, editingReview, setEditingReview, handleSaveReview, t }: any) => {
  const getTherapistName = (therapistId: string) => therapists.find((t: TherapistProfile) => t.id === therapistId)?.name || 'Unknown';
  return (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.reviewDetails')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.reviewContent')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.status')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reviews.map((review: Review) => (
              <tr key={review.id} className={review.status === 'pending' ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap align-top"><div className="text-sm font-medium text-gray-900">{review.customerName}</div><div className="text-sm text-gray-500">{review.customerWhatsApp}</div><div className="text-sm text-gray-500 mt-1">For: {getTherapistName(review.therapistId)}</div></td>
                <td className="px-6 py-4 align-top">
                  {editingReview?.id === review.id ? (
                    <form onSubmit={handleSaveReview}>
                      <input type="number" min="1" max="5" value={editingReview.rating} onChange={(e) => setEditingReview({ ...editingReview, rating: parseInt(e.target.value) })} className="w-20 mb-2 p-1 border rounded" />
                      <textarea value={editingReview.comment} onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })} className="w-full p-2 border rounded" rows={4}></textarea>
                      <button type="submit" className="mt-2 px-2 py-1 bg-primary-500 text-white text-xs rounded">Save</button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center space-x-1"><span>{'⭐'.repeat(review.rating)}</span><span className="text-gray-400">{'⭐'.repeat(5 - review.rating)}</span></div>
                      <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                    </>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap align-top"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${review.status === 'approved' ? 'bg-green-100 text-green-800' : review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{t(`adminDashboard.reviewStatus.${review.status}`)}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium align-top">
                  <div className="flex flex-col space-y-2">
                    {review.status === 'pending' && <button onClick={() => onUpdateReview(review.id, { status: 'approved' })} className="flex items-center space-x-2 px-2 py-1 rounded text-xs bg-green-100 text-green-700 hover:bg-green-200"><Check className="h-4 w-4" /><span>{t('adminDashboard.approve')}</span></button>}
                    <button onClick={() => setEditingReview(review)} className="flex items-center space-x-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"><Edit className="h-4 w-4" /><span>{t('adminDashboard.edit')}</span></button>
                    <button onClick={() => onDeleteReview(review.id)} className="flex items-center space-x-2 px-2 py-1 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200"><Trash2 className="h-4 w-4" /><span>{t('adminDashboard.delete')}</span></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </motion.div>
)};
