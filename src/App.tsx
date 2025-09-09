import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { ReviewsPage } from './pages/ReviewsPage';
import { TermsPage } from './pages/TermsPage';
import { PackageDetailsPage } from './pages/PackageDetailsPage';
import { LocationModal } from './components/LocationModal';
import { AuthModal } from './components/AuthModal';
import { TherapistDashboard } from './components/TherapistDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TherapistProfile, UserLocation, FilterOptions, User, Review } from './types';
import { calculateDistance, getWhatsAppUrl } from './utils/location';
import { useTranslation } from './hooks/useTranslation';
import { supabase } from './supabaseClient';
import { AuthError, Session } from '@supabase/supabase-js';

interface RegisterFormData { name: string; email: string; password: string; phone: string; therapistNumber: string; experience: number; }
export interface ReviewFormData { customerName: string; customerWhatsApp: string; rating: number; comment: string; }

const ADMIN_EMAIL = 'phillipofarrell@gmail.com';

function AppContent() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    onlineOnly: false, massageTypes: [], maxDistance: 50, minRating: 0, priceRange: { min: 0, max: 500 }
  });
  const { language } = useTranslation();

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: therapistsData, error: therapistsError } = await supabase.from('therapists').select('*');
      const { data: reviewsData, error: reviewsError } = await supabase.from('reviews').select('*');
      if (therapistsData) {
        const formattedTherapists = therapistsData.map(t => ({
          id: t.id, name: t.name ?? '', email: t.email ?? '', profileImageUrl: t.profile_image_url ?? '',
          rating: t.rating, reviewCount: t.review_count, specialties: t.specialties ?? [], bio: t.bio ?? '',
          experience: t.experience ?? 0, isOnline: t.is_online, status: t.status,
          location: { lat: t.lat ?? 0, lng: t.lng ?? 0, city: t.city ?? '' },
          pricing: { session60: t.pricing_session_60 ?? 0, session90: t.pricing_session_90 ?? 0, session120: t.pricing_session_120 ?? 0 },
          massageTypes: t.massage_types ?? [], phone: t.phone ?? '', languages: t.languages ?? [],
          certifications: t.certifications ?? [], therapistNumber: t.therapist_number ?? ''
        }));
        setTherapists(formattedTherapists);
      }
      if (reviewsData) {
        const formattedReviews = reviewsData.map(r => ({
          id: r.id, therapistId: r.therapist_id, customerName: r.customer_name,
          customerWhatsApp: r.customer_whatsapp, rating: r.rating, comment: r.comment,
          status: r.status, createdAt: r.created_at
        }));
        setReviews(formattedReviews);
      }
      if (therapistsError) console.error('Error fetching therapists:', therapistsError);
      if (reviewsError) console.error('Error fetching reviews:', reviewsError);
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const user = session.user;
        const userType = user.email === ADMIN_EMAIL ? 'admin' : 'therapist';
        setCurrentUser({ id: user.id, email: user.email!, name: user.user_metadata.name || user.email!, userType });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userLocation) {
      const therapistsWithDistance = therapists.map(therapist => ({
        ...therapist,
        distance: calculateDistance(userLocation.lat, userLocation.lng, therapist.location.lat, therapist.location.lng)
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setTherapists(therapistsWithDistance);
    }
  }, [userLocation, therapists.length]);

  const filteredTherapists = useMemo(() => {
    return therapists.filter(therapist => {
      if (therapist.status !== 'active') return false;
      if (filters.onlineOnly && !therapist.isOnline) return false;
      if (filters.massageTypes.length > 0) {
        const hasMatchingType = filters.massageTypes.some(type => therapist.massageTypes.includes(type));
        if (!hasMatchingType) return false;
      }
      if (therapist.distance && therapist.distance > filters.maxDistance) return false;
      if (therapist.rating < filters.minRating) return false;
      return true;
    });
  }, [therapists, filters]);

  const onlineCount = useMemo(() => therapists.filter(t => t.isOnline && t.status === 'active').length, [therapists]);
  const totalVisibleCount = useMemo(() => therapists.filter(t => t.status === 'active').length, [therapists]);

  const handleLocationSet = (location: UserLocation) => setUserLocation(location);

  const handleWhatsAppClick = (phone: string, name: string) => {
    const message = `Hi ${name}, I'm interested in booking a massage session. Could you please share your availability?`;
    const whatsappUrl = getWhatsAppUrl(phone, message);
    window.open(whatsappUrl, '_blank');
  };

  const handleLogin = async (email: string, password: string): Promise<{ success: boolean, error?: AuthError }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error };
    setShowAuthModal(false);
    navigate(email === ADMIN_EMAIL ? '/admin-dashboard' : '/therapist-dashboard');
    return { success: true };
  };
  
  const handleRegister = async (data: RegisterFormData): Promise<{ success: boolean, error?: AuthError }> => {
    const { error } = await supabase.auth.signUp({
      email: data.email, password: data.password,
      options: {
        data: {
          name: data.name, phone: data.phone, therapist_number: data.therapistNumber, experience: data.experience
        }
      }
    });
    if (error) return { success: false, error };
    setShowAuthModal(false);
    navigate('/therapist-dashboard');
    return { success: true };
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

  const handleUpdateTherapistStatus = async (therapistId: string, newStatus: 'active' | 'pending' | 'blocked') => {
    const { error } = await supabase.from('therapists').update({ status: newStatus }).eq('id', therapistId);
    if (!error) { setTherapists(prev => prev.map(t => t.id === therapistId ? { ...t, status: newStatus } : t)); }
  };

  const handleReviewSubmit = async (therapistId: string, formData: ReviewFormData) => {
    const { data: newReview, error } = await supabase.from('reviews').insert({
      therapist_id: therapistId,
      customer_name: formData.customerName,
      customer_whatsapp: formData.customerWhatsApp,
      rating: formData.rating,
      comment: formData.comment,
      status: 'pending'
    }).select().single();
    if (newReview) {
      const formattedReview = {
        id: newReview.id, therapistId: newReview.therapist_id, customerName: newReview.customer_name,
        customerWhatsApp: newReview.customer_whatsapp, rating: newReview.rating, comment: newReview.comment,
        status: newReview.status, createdAt: newReview.created_at
      };
      setReviews(prev => [formattedReview, ...prev]);
    }
    if (error) console.error("Error submitting review:", error);
  };

  const handleUpdateReview = async (reviewId: string, updates: Partial<Review>) => {
    const { error } = await supabase.from('reviews').update({
      comment: updates.comment, rating: updates.rating, status: updates.status
    }).eq('id', reviewId);
    if (!error) { setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...updates } : r)); }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (!error) { setReviews(prev => prev.filter(r => r.id !== reviewId)); }
  };

  useEffect(() => {
    if (!userLocation && !currentUser && window.location.pathname === '/home') {
      setShowLocationModal(true);
    }
  }, [userLocation, currentUser, language, window.location.pathname]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={
          <HomePage
            userLocation={userLocation} currentUser={currentUser} filteredTherapists={filteredTherapists}
            filters={filters} onlineCount={onlineCount} totalCount={totalVisibleCount}
            onAuthClick={() => setShowAuthModal(true)} onLogout={handleLogout}
            onFiltersChange={setFilters} onWhatsAppClick={handleWhatsAppClick}
          />
        } />
        <Route path="/therapist/:therapistId/reviews" element={
          <ReviewsPage therapists={therapists} reviews={reviews} onReviewSubmit={handleReviewSubmit} />
        } />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/package-details" element={<PackageDetailsPage />} />
        <Route path="/therapist-dashboard" element={
          currentUser?.userType === 'therapist' ? (
            <TherapistDashboard user={currentUser} onLogout={handleLogout} />
          ) : (<Navigate to="/home" />)
        } />
        <Route path="/admin-dashboard" element={
          currentUser?.userType === 'admin' ? (
            <AdminDashboard
              user={currentUser} therapists={therapists} reviews={reviews} onLogout={handleLogout}
              onUpdateTherapistStatus={handleUpdateTherapistStatus}
              onUpdateReview={handleUpdateReview} onDeleteReview={handleDeleteReview}
            />
          ) : (<Navigate to="/home" />)
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <LocationModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} onLocationSet={handleLocationSet} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLogin={handleLogin} onRegister={handleRegister} />
    </div>
  );
}

function App() { return (<Router><AppContent /></Router>); }
export default App;
