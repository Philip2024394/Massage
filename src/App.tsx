import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { ReviewsPage } from './pages/ReviewsPage';
import { TermsPage } from './pages/TermsPage';
import { PackageDetailsPage } from './pages/PackageDetailsPage';
import { LocationModal } from './components/LocationModal';
import { AuthModal, RegisterForm, LoginForm } from './components/AuthModal';
import { TherapistDashboard } from './components/TherapistDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TherapistProfile, UserLocation, FilterOptions, User, Review } from './types';
import { calculateDistance, getWhatsAppUrl } from './utils/location';
import { useTranslation } from './hooks/useTranslation';
import { ReviewFormData } from './components/SubmitReviewModal';
import { generateMockTherapists } from './data/mockTherapists';
import { generateMockReviews } from './data/mockReviews';

interface ProfileForm { name: string; bio: string; experience: number; phone: string; city: string; pricing60: number; pricing90: number; pricing120: number; massageTypes: string[]; specialties: string[]; isOnline: boolean; }

const ADMIN_PHONE = '+6281392000050';
const ADMIN_PASSWORD = 'Phil123456';

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
    // This ensures we are loading mock data and not calling Supabase.
    setLoading(true);
    const mockTherapists = generateMockTherapists(25);
    const mockReviews = generateMockReviews(50, mockTherapists);
    setTherapists(mockTherapists);
    setReviews(mockReviews);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userLocation && therapists.length > 0) {
      const therapistsWithDistance = therapists.map(therapist => ({
        ...therapist,
        distance: calculateDistance(userLocation.lat, userLocation.lng, therapist.location.lat, therapist.location.lng)
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setTherapists(therapistsWithDistance);
    }
  }, [userLocation]);

  const filteredTherapists = useMemo(() => therapists.filter(therapist => {
      if (therapist.status !== 'active') return false;
      if (filters.onlineOnly && !therapist.isOnline) return false;
      if (filters.massageTypes.length > 0 && !filters.massageTypes.some(type => therapist.massageTypes.includes(type))) return false;
      if (therapist.distance && therapist.distance > filters.maxDistance) return false;
      if (therapist.rating < filters.minRating) return false;
      return true;
    }), [therapists, filters]);

  const onlineCount = useMemo(() => therapists.filter(t => t.isOnline && t.status === 'active').length, [therapists]);
  const totalVisibleCount = useMemo(() => therapists.filter(t => t.status === 'active').length, [therapists]);

  const handleLocationSet = (location: UserLocation) => setUserLocation(location);
  const handleWhatsAppClick = (phone: string, name: string) => window.open(getWhatsAppUrl(phone, `Hi ${name}, I'm interested in booking a massage session.`), '_blank');
  
  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/');
  };

  const handleLogin = (data: LoginForm): string | void => {
    const fullPhone = `+62${data.phone}`;

    if (fullPhone === ADMIN_PHONE && data.password === ADMIN_PASSWORD) {
      setCurrentUser({ id: 'admin-user', phone: ADMIN_PHONE, name: 'Admin User', userType: 'admin' });
      setShowAuthModal(false);
      navigate('/admin-dashboard');
      return;
    }
    
    const therapistUser = therapists.find(t => t.phone === fullPhone);
    if (therapistUser) {
      setCurrentUser({ id: therapistUser.id, phone: therapistUser.phone, name: therapistUser.name, userType: 'therapist' });
      setShowAuthModal(false);
      navigate('/therapist-dashboard');
    } else {
      return "Invalid WhatsApp number or password.";
    }
  };

  const handleRegister = (data: RegisterForm) => {
    const newTherapist: TherapistProfile = {
      id: `mock-${Date.now()}`,
      name: data.name,
      profileImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80',
      rating: 0,
      reviewCount: 0,
      specialties: [],
      bio: `Newly registered therapist with ${data.experience} years of experience.`,
      experience: data.experience,
      isOnline: false,
      status: 'pending',
      location: { lat: 0, lng: 0, city: 'Unknown' },
      pricing: { session60: 100000, session90: 150000, session120: 200000 },
      massageTypes: [],
      phone: `+62${data.phone}`,
      languages: ['English', 'Indonesian'],
      certifications: [],
      therapistNumber: data.therapistNumber,
    };
    setTherapists(prev => [...prev, newTherapist]);
  };

  const handleUpdateTherapistStatus = (therapistId: string, newStatus: 'active' | 'pending' | 'blocked') => {
    setTherapists(prev => prev.map(t => t.id === therapistId ? { ...t, status: newStatus } : t));
  };
  
  const handleReviewSubmit = (therapistId: string, formData: ReviewFormData) => {
    const newReview: Review = {
      id: `mock-review-${Date.now()}`,
      therapistId,
      customerName: formData.customerName,
      customerWhatsApp: formData.customerWhatsApp,
      rating: formData.rating,
      comment: formData.comment,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setReviews(prev => [newReview, ...prev]);
  };

  const handleUpdateReview = (reviewId: string, updates: Partial<Review>) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...updates } : r));
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  const currentTherapistProfile = useMemo(() => therapists.find(t => t.id === currentUser?.id), [therapists, currentUser]);

  const handleUpdateProfile = (data: ProfileForm) => {
    if (!currentUser) return;
    setTherapists(prev => prev.map(t => {
      if (t.id === currentUser.id) {
        return {
          ...t,
          name: data.name, bio: data.bio, experience: data.experience, phone: data.phone,
          location: { ...t.location, city: data.city },
          pricing: { session60: data.pricing60, session90: data.pricing90, session120: data.pricing120 },
          massageTypes: data.massageTypes, specialties: data.specialties, isOnline: data.isOnline,
        };
      }
      return t;
    }));
  };

  const handleUpdateProfileImage = (file: File) => {
    if (!currentUser) return;
    const newImageUrl = URL.createObjectURL(file);
    setTherapists(prev => prev.map(t => t.id === currentUser.id ? { ...t, profileImageUrl: newImageUrl } : t));
  };

  const handleToggleStatus = () => {
    if (!currentUser || !currentTherapistProfile) return;
    const newStatus = !currentTherapistProfile.isOnline;
    setTherapists(prev => prev.map(t => t.id === currentUser.id ? { ...t, isOnline: newStatus } : t));
  };

  useEffect(() => {
    if (!userLocation && !currentUser && window.location.pathname === '/home') {
      setShowLocationModal(true);
    }
  }, [userLocation, currentUser, language, window.location.pathname]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

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
        <Route path="/therapist/:therapistId/reviews" element={<ReviewsPage therapists={therapists} reviews={reviews} onReviewSubmit={handleReviewSubmit} />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/package-details" element={<PackageDetailsPage />} />
        <Route path="/therapist-dashboard" element={
          currentUser?.userType === 'therapist' && currentTherapistProfile ? (
            <TherapistDashboard 
              user={currentUser} therapistProfile={currentTherapistProfile} onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile} onUpdateProfileImage={handleUpdateProfileImage}
              onToggleStatus={handleToggleStatus}
            />
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
