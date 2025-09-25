import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from '../components/AdminDashboard';
import { TherapistDashboard } from '../components/TherapistDashboard';
import { PlaceDashboard } from '../components/PlaceDashboard';
import { LoadingScreen } from '../components/LoadingScreen';
import { AuthInfo } from '../types';

export const DashboardPage: React.FC = () => {
  const { profile, role, signOut, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const handleProfileUpdate = async () => {
    // In a real app, you might want to force a profile refresh here.
    // For now, we assume the dashboard components handle their state.
    console.log("Profile update triggered.");
  };

  switch (role) {
    case 'admin':
      return <AdminDashboard onLogout={signOut} />;
    case 'therapist':
      return <TherapistDashboard authInfo={profile as AuthInfo} onLogout={signOut} onProfileUpdate={handleProfileUpdate} />;
    case 'place':
      return <PlaceDashboard authInfo={profile as AuthInfo} onLogout={signOut} onProfileUpdate={handleProfileUpdate} />;
    default:
      // This should not happen if ProtectedRoute is working
      return <div>Error: No valid role found.</div>;
  }
};
