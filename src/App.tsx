import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { TermsPage } from './pages/TermsPage';
import { PackageDetailsPage } from './pages/PackageDetailsPage';
import { LocationModal } from './components/LocationModal';
import { LoadingScreen } from './components/LoadingScreen';
import { TherapistProfilePage } from './pages/TherapistProfilePage';
import { PlaceProfilePage } from './pages/PlaceProfilePage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PaymentPage } from './pages/PaymentPage';
import { AgentSignUpPage } from './pages/AgentSignUpPage';
import { RequestActivationPage } from './pages/RequestActivationPage';
import { UserLocation, FilterOptions, TherapistProfile, MassagePlaceProfile } from './types';
import { calculateDistance } from './utils/location';
import { supabase } from './supabaseClient';
import { useAuth } from './context/AuthContext';
import { mapSupabaseTherapistToProfile, mapSupabasePlaceToProfile } from './data/data-mappers';
import { ProtectedRoute } from './components/ProtectedRoute';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

function App() {
  const { loading: authLoading } = useAuth();
  const location = useLocation();
  const [isAppReady, setIsAppReady] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [places, setPlaces] = useState<MassagePlaceProfile[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [filters, setFilters] = useState<FilterOptions>({
    serviceType: 'home', onlineOnly: false, massageTypes: [], maxDistance: 50, minRating: 0, priceRange: { min: 0, max: 500 }, city: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [therapistsRes, placesRes] = await Promise.all([
        supabase.from('therapists').select('*').eq('status', 'active'),
        supabase.from('places').select('*').eq('status', 'active')
      ]);

      if (therapistsRes.error) {
        if (therapistsRes.error.message !== 'Failed to fetch') throw therapistsRes.error;
      } else {
        setTherapists(shuffleArray(therapistsRes.data.map(mapSupabaseTherapistToProfile)));
      }

      if (placesRes.error) {
        if (placesRes.error.message !== 'Failed to fetch') throw placesRes.error;
      } else {
        setPlaces(shuffleArray(placesRes.data.map(mapSupabasePlaceToProfile)));
      }

    } catch (error) {
      console.error('Error fetching all data:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    if (view === 'therapists') {
      setFilters(f => ({ ...f, serviceType: 'home' }));
    } else if (view === 'places') {
      setFilters(f => ({ ...f, serviceType: 'places' }));
    }
  }, [location.search]);
  
  useEffect(() => {
    if (!dataLoading && !authLoading) {
      const timer = setTimeout(() => setIsAppReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, [dataLoading, authLoading]);

  useEffect(() => {
    if (!userLocation && window.location.pathname === '/home') {
      setShowLocationModal(true);
    }
  }, [userLocation, window.location.pathname]);

  const therapistsWithDistance = useMemo(() => {
    if (!userLocation) return therapists;
    return therapists.map(t => ({ ...t, distance: calculateDistance(userLocation.lat, userLocation.lng, t.location.lat || 0, t.location.lng || 0) }));
  }, [therapists, userLocation]);

  const placesWithDistance = useMemo(() => {
    if (!userLocation) return places;
    return places.map(p => ({ ...p, distance: calculateDistance(userLocation.lat, userLocation.lng, p.location.lat || 0, p.location.lng || 0) }));
  }, [places, userLocation]);

  const filteredTherapists = useMemo(() => therapistsWithDistance.filter(therapist => {
      if (filters.city && therapist.location.city !== filters.city) return false;
      if (filters.onlineOnly && !therapist.isOnline) return false;
      if (filters.massageTypes.length > 0 && !filters.massageTypes.some(type => therapist.massageTypes?.includes(type))) return false;
      if (therapist.distance && therapist.distance > filters.maxDistance) return false;
      if (therapist.rating < filters.minRating) return false;
      if (searchQuery && !therapist.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }), [therapistsWithDistance, filters, searchQuery]);
  
  const filteredPlaces = useMemo(() => placesWithDistance.filter(place => {
      if (filters.city && place.city !== filters.city) return false;
      if (filters.onlineOnly && !place.isOpen) return false;
      if (filters.massageTypes.length > 0 && !filters.massageTypes.some(type => place.services?.includes(type))) return false;
      if (place.distance && place.distance > filters.maxDistance) return false;
      if (place.rating < place.rating) return false;
      if (searchQuery && !place.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
  }), [placesWithDistance, filters, searchQuery]);

  const onlineCount = useMemo(() => therapists.filter(t => t.isOnline).length, [therapists]);
  const openPlacesCount = useMemo(() => places.filter(p => p.isOpen).length, [places]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <AnimatePresence>{!isAppReady && <LoadingScreen />}</AnimatePresence>
      {isAppReady && (
        <>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/home" element={
              <HomePage
                filteredTherapists={filteredTherapists} filteredPlaces={filteredPlaces}
                filters={filters} onlineCount={onlineCount} totalCount={therapists.length}
                openPlacesCount={openPlacesCount} totalPlacesCount={places.length}
                onFiltersChange={setFilters}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
              />
            } />
            <Route path="/therapist-profiles/:code" element={<TherapistProfilePage />} />
            <Route path="/place-profiles/:code" element={<PlaceProfilePage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/setup-profile" element={<ProfileSetupPage />} />
            <Route path="/pay" element={<PaymentPage />} />
            <Route path="/agent-signup" element={<AgentSignUpPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/package-details" element={<PackageDetailsPage />} />
            <Route path="/request-activation" element={<RequestActivationPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <LocationModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} onLocationSet={setUserLocation} />
        </>
      )}
    </div>
  );
}

export default App;
