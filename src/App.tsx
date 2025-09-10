import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { AnimatePresence } from 'framer-motion';
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { ReviewsPage } from './pages/ReviewsPage';
import { TermsPage } from './pages/TermsPage';
import { PackageDetailsPage } from './pages/PackageDetailsPage';
import { LocationModal } from './components/LocationModal';
import { LoadingScreen } from './components/LoadingScreen';
import { AuthModal, RegisterForm, LoginForm } from './components/AuthModal';
import { TherapistDashboard } from './components/TherapistDashboard';
import { PlaceDashboard } from './components/PlaceDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { PlaceDetailsPage } from './pages/PlaceDetailsPage';
import { TherapistProfile, UserLocation, FilterOptions, User, Review, MassagePlaceProfile, TherapistFilterData, PlaceFilterData } from './types';
import { calculateDistance, getWhatsAppUrl } from './utils/location';
import { useTranslation } from './hooks/useTranslation';
import { supabase } from './supabaseClient';
import { ReviewFormData } from './components/SubmitReviewModal';

const ADMIN_EMAIL = 'admin@2gomassage.app';
const ADMIN_PASSWORD = 'Phil123456';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

function AppContent() {
  const navigate = useNavigate();
  const [isAppReady, setIsAppReady] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginActionCompleted, setLoginActionCompleted] = useState(false);

  const [therapists, setTherapists] = useState<TherapistFilterData[]>([]);
  const [places, setPlaces] = useState<PlaceFilterData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [filters, setFilters] = useState<FilterOptions>({
    serviceType: 'home', onlineOnly: false, massageTypes: [], maxDistance: 50, minRating: 0, priceRange: { min: 0, max: 500 }
  });
  const { language } = useTranslation();

  const fetchFilterableData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [therapistsRes, placesRes] = await Promise.all([
        supabase.from('therapists').select('id, is_online, massage_types, rating, lat, lng').eq('status', 'active'),
        supabase.from('places').select('id, is_online, services, rating, lat, lng').eq('status', 'active')
      ]);

      if (therapistsRes.error) throw therapistsRes.error;
      if (placesRes.error) throw placesRes.error;

      setTherapists(shuffleArray(therapistsRes.data as TherapistFilterData[]));
      setPlaces(shuffleArray(placesRes.data as PlaceFilterData[]));

    } catch (error) {
      console.error('Error fetching filterable data:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilterableData();
  }, [fetchFilterableData]);
  
  useEffect(() => {
    if (!dataLoading && !authLoading) {
      // Use a timeout to ensure the loading screen is visible for a minimum duration on first load
      const timer = setTimeout(() => setIsAppReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, [dataLoading, authLoading]);

  useEffect(() => {
    setAuthLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session) {
        let userProfile: User | null = null;
        const { data: therapistData } = await supabase.from('therapists').select('id, name, phone').eq('id', session.user.id).single();
        if (therapistData) {
          userProfile = { id: therapistData.id, name: therapistData.name || 'Therapist', userType: 'therapist', phone: therapistData.phone || '' };
        } else {
          const { data: placeData } = await supabase.from('places').select('id, name, phone').eq('id', session.user.id).single();
          if (placeData) {
            userProfile = { id: placeData.id, name: placeData.name || 'Place Owner', userType: 'place', phone: placeData.phone || '' };
          }
        }
        if (userProfile) setCurrentUser(userProfile);
      } else {
        setCurrentUser(null);
      }
    };
    fetchUserProfile();
  }, [session]);

  useEffect(() => {
    if (loginActionCompleted && currentUser) {
      switch (currentUser.userType) {
        case 'therapist': navigate('/therapist-dashboard'); break;
        case 'place': navigate('/place-dashboard'); break;
        case 'admin': navigate('/admin-dashboard'); break;
        default: navigate('/home');
      }
      setLoginActionCompleted(false);
    }
  }, [loginActionCompleted, currentUser, navigate]);

  const therapistsWithDistance = useMemo(() => {
    if (!userLocation) return therapists;
    return therapists.map(t => ({ ...t, distance: calculateDistance(userLocation.lat, userLocation.lng, t.lat || 0, t.lng || 0) }));
  }, [therapists, userLocation]);

  const placesWithDistance = useMemo(() => {
    if (!userLocation) return places;
    return places.map(p => ({ ...p, distance: calculateDistance(userLocation.lat, userLocation.lng, p.lat || 0, p.lng || 0) }));
  }, [places, userLocation]);

  const filteredTherapistIds = useMemo(() => therapistsWithDistance.filter(therapist => {
      if (filters.onlineOnly && !therapist.is_online) return false;
      if (filters.massageTypes.length > 0 && !filters.massageTypes.some(type => therapist.massage_types?.includes(type))) return false;
      if (therapist.distance && therapist.distance > filters.maxDistance) return false;
      if (therapist.rating < filters.minRating) return false;
      return true;
    }).map(t => t.id), [therapistsWithDistance, filters]);
  
  const filteredPlaceIds = useMemo(() => placesWithDistance.filter(place => {
      if (filters.onlineOnly && !place.is_online) return false;
      if (filters.massageTypes.length > 0 && !filters.massageTypes.some(type => place.services?.includes(type))) return false;
      if (place.distance && place.distance > filters.maxDistance) return false;
      if (place.rating < filters.minRating) return false;
      return true;
  }).map(p => p.id), [placesWithDistance, filters]);

  const onlineCount = useMemo(() => therapists.filter(t => t.is_online).length, [therapists]);
  const openPlacesCount = useMemo(() => places.filter(p => p.is_online).length, [places]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    navigate('/');
  };

  const handleLogin = async (data: LoginForm): Promise<string | void> => {
    if (data.email === ADMIN_EMAIL && data.password === ADMIN_PASSWORD) {
      setCurrentUser({ id: 'admin-user', phone: '', name: 'Admin User', userType: 'admin' });
      setLoginActionCompleted(true);
      setShowAuthModal(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error) return error.message;
    setLoginActionCompleted(true);
    setShowAuthModal(false);
  };

  const handleRegister = async (data: RegisterForm, accountType: 'therapist' | 'place'): Promise<string | void> => {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email, password: data.password,
      options: { data: { account_type: accountType, name: data.name, phone: `+62${data.phone}`, experience: data.experience, address: data.address, city: data.city } }
    });
    
    if (signUpError) return signUpError.message.includes("User already registered") ? "This email is already registered." : signUpError.message;
    
    if (signUpData.user && signUpData.session) {
      setSession(signUpData.session);
      setLoginActionCompleted(true);
      setShowAuthModal(false);
    } else if (signUpData.user && !signUpData.session) {
      // This case handles when a user is created but the session is not returned,
      // which can happen if the profile creation trigger fails.
      return "Database error saving new user. Please contact support.";
    }
  };

  useEffect(() => {
    if (!userLocation && !currentUser && window.location.pathname === '/home') setShowLocationModal(true);
  }, [userLocation, currentUser, language, window.location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <AnimatePresence>{!isAppReady && <LoadingScreen />}</AnimatePresence>
      {isAppReady && (
        <>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={
              <HomePage
                currentUser={currentUser} filteredTherapistIds={filteredTherapistIds} filteredPlaceIds={filteredPlaceIds}
                filters={filters} onlineCount={onlineCount} totalCount={therapists.length}
                openPlacesCount={openPlacesCount} totalPlacesCount={places.length}
                onAuthClick={() => setShowAuthModal(true)} onLogout={handleLogout}
                onFiltersChange={setFilters} onWhatsAppClick={(p, n) => window.open(getWhatsAppUrl(p, `Hi ${n}`), '_blank')}
              />
            } />
            <Route path="/therapist/:therapistId/reviews" element={<ReviewsPage />} />
            <Route path="/place/:placeId/details" element={<PlaceDetailsPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/package-details" element={<PackageDetailsPage />} />
            <Route path="/therapist-dashboard" element={currentUser?.userType === 'therapist' ? <TherapistDashboard user={currentUser} onLogout={handleLogout} onProfileUpdate={fetchFilterableData} /> : <Navigate to="/home" />} />
            <Route path="/place-dashboard" element={currentUser?.userType === 'place' ? <PlaceDashboard user={currentUser} onLogout={handleLogout} onProfileUpdate={fetchFilterableData} /> : <Navigate to="/home" />} />
            <Route path="/admin-dashboard" element={currentUser?.userType === 'admin' ? <AdminDashboard user={currentUser} onLogout={handleLogout} /> : <Navigate to="/home" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <LocationModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} onLocationSet={setUserLocation} />
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLogin={handleLogin} onRegister={handleRegister} />
        </>
      )}
    </div>
  );
}

function App() { return (<Router><AppContent /></Router>); }
export default App;
