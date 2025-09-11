import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Shield, Users, MessageSquare, Check, X, Building, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TherapistProfile, MassagePlaceProfile, Review } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Logo } from './Logo';
import { supabase } from '../supabaseClient';
import { mapSupabaseTherapistToProfile, mapSupabasePlaceToProfile, mapSupabaseReviewToAppReview } from '../data/data-mappers';

const ToggleSwitch: React.FC<{ isOn: boolean; onToggle: (isOn: boolean) => void; }> = ({ isOn, onToggle }) => (
  <button onClick={() => onToggle(!isOn)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isOn ? 'bg-primary-600' : 'bg-gray-300'}`}>
    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'therapists' | 'places' | 'reviews'>('therapists');
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [places, setPlaces] = useState<MassagePlaceProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [therapistsRes, placesRes, reviewsRes] = await Promise.all([
        supabase.from('therapists').select('*'),
        supabase.from('places').select('*'),
        supabase.from('reviews').select('*').order('created_at', { ascending: false })
      ]);
      if (therapistsRes.error) throw therapistsRes.error;
      if (placesRes.error) throw placesRes.error;
      if (reviewsRes.error) throw reviewsRes.error;
      
      setTherapists(therapistsRes.data.map(mapSupabaseTherapistToProfile));
      setPlaces(placesRes.data.map(mapSupabasePlaceToProfile));
      setReviews(reviewsRes.data.map(mapSupabaseReviewToAppReview));
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateTherapistStatus = async (id: string, status: 'active' | 'pending' | 'blocked') => {
    const { error } = await supabase.from('therapists').update({ status }).eq('id', id);
    if (!error) fetchData();
  };
  
  const handleUpdatePlaceStatus = async (id: string, status: 'active' | 'pending' | 'blocked') => {
    const { error } = await supabase.from('places').update({ status }).eq('id', id);
    if (!error) fetchData();
  };

  const handleUpdateReview = async (id: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase.from('reviews').update({ status: newStatus }).eq('id', id);
    if (!error) fetchData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Admin Panel...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Logo layout="horizontal" className="h-10 w-auto" />
              <span className="text-gray-500">•</span>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-600" />
                <span>{t('adminDashboard.title')}</span>
              </h2>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/home" title="View Home Page" className="p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100 transition-colors">
                <Home className="h-5 w-5" />
              </Link>
              <button onClick={onLogout} className="p-2 text-gray-700 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" title={t('header.logout')}>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <TabButton id="therapists" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Users className="h-5 w-5" />} label={t('adminDashboard.manageTherapists')} />
            <TabButton id="places" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Building className="h-5 w-5" />} label={t('adminDashboard.managePlaces')} />
            <TabButton id="reviews" activeTab={activeTab} setActiveTab={setActiveTab} icon={<MessageSquare className="h-5 w-5" />} label={t('adminDashboard.manageReviews')} />
          </nav>
        </div>
        {activeTab === 'therapists' && <TherapistsTable therapists={therapists} onUpdateStatus={handleUpdateTherapistStatus} t={t} />}
        {activeTab === 'places' && <PlacesTable places={places} onUpdateStatus={handleUpdatePlaceStatus} t={t} />}
        {activeTab === 'reviews' && <ReviewsTable reviews={reviews} profiles={[...therapists, ...places]} onUpdateReview={handleUpdateReview} t={t} />}
      </main>
    </div>
  );
};

const TabButton = ({ id, activeTab, setActiveTab, icon, label }: any) => (
  <button onClick={() => setActiveTab(id)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
    {icon}<span>{label}</span>
  </button>
);

const TherapistsTable = ({ therapists, onUpdateStatus, t }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.therapist')}</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.whatsappNumber')}</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.status')}</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.actions')}</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {therapists.map((therapist: TherapistProfile) => (
          <tr key={therapist.id}>
            <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><img className="h-10 w-10 rounded-full object-cover" src={therapist.profileImageUrl || '/placeholder.png'} alt={therapist.name} /><div className="ml-4"><div className="text-sm font-medium text-gray-900">{therapist.name}</div><div className="text-sm text-gray-500">{therapist.location.city}</div></div></div></td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{therapist.phone}</td>
            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${therapist.status === 'active' ? 'bg-green-100 text-green-800' : therapist.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{t(`adminDashboard.${therapist.status}`)}</span></td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              {therapist.status === 'pending' ? <button onClick={() => onUpdateStatus(therapist.id, 'active')} className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200"><Check className="h-4 w-4" /><span>{t('adminDashboard.approve')}</span></button> : <div className="flex items-center space-x-2"><ToggleSwitch isOn={therapist.status === 'active'} onToggle={(isOn) => onUpdateStatus(therapist.id, isOn ? 'active' : 'blocked')} /><span className="text-xs text-gray-600">{t('adminDashboard.visibility')}</span></div>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </motion.div>
);

const PlacesTable = ({ places, onUpdateStatus, t }: any) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.place')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.whatsappNumber')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.status')}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminDashboard.actions')}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {places.map((place: MassagePlaceProfile) => (
            <tr key={place.id}>
              <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><img className="h-10 w-10 rounded-full object-cover" src={place.profileImageUrl || '/placeholder.png'} alt={place.name} /><div className="ml-4"><div className="text-sm font-medium text-gray-900">{place.name}</div><div className="text-sm text-gray-500">{place.city}</div></div></div></td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{place.phone}</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${place.status === 'active' ? 'bg-green-100 text-green-800' : place.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{t(`adminDashboard.${place.status}`)}</span></td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {place.status === 'pending' ? <button onClick={() => onUpdateStatus(place.id, 'active')} className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200"><Check className="h-4 w-4" /><span>{t('adminDashboard.approve')}</span></button> : <div className="flex items-center space-x-2"><ToggleSwitch isOn={place.status === 'active'} onToggle={(isOn) => onUpdateStatus(place.id, isOn ? 'active' : 'blocked')} /><span className="text-xs text-gray-600">{t('adminDashboard.visibility')}</span></div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );

const ReviewsTable = ({ reviews, profiles, onUpdateReview, t }: any) => {
    const getTargetName = (targetId: string) => profiles.find((p: any) => p.id === targetId)?.name || 'Unknown';
    return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
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
              <td className="px-6 py-4 whitespace-nowrap align-top"><div className="text-sm font-medium text-gray-900">{review.customerName}</div><div className="text-sm text-gray-500">{review.customerWhatsApp}</div><div className="text-sm text-gray-500 mt-1">For: {getTargetName(review.targetId)} ({review.targetType})</div></td>
              <td className="px-6 py-4 align-top">
                <div className="flex items-center space-x-1"><span>{'⭐'.repeat(review.rating)}</span><span className="text-gray-400">{'⭐'.repeat(5 - review.rating)}</span></div>
                <p className="text-sm text-gray-600 mt-2 max-w-sm whitespace-pre-wrap">{review.comment}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap align-top"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${review.status === 'approved' ? 'bg-green-100 text-green-800' : review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{t(`adminDashboard.reviewStatus.${review.status}`)}</span></td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium align-top">
                <div className="flex flex-col space-y-2">
                  {review.status === 'pending' && (
                    <>
                      <button onClick={() => onUpdateReview(review.id, 'approved')} className="flex items-center space-x-2 px-2 py-1 rounded text-xs bg-green-100 text-green-700 hover:bg-green-200"><Check className="h-4 w-4" /><span>{t('adminDashboard.approve')}</span></button>
                      <button onClick={() => onUpdateReview(review.id, 'rejected')} className="flex items-center space-x-2 px-2 py-1 rounded text-xs bg-orange-100 text-orange-700 hover:bg-orange-200"><X className="h-4 w-4" /><span>{t('adminDashboard.reject')}</span></button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
)};
