import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from '../components/AdminDashboard';
import { TherapistDashboard }from '../components/TherapistDashboard';
import { PlaceDashboard } from '../components/PlaceDashboard';
import { LoadingScreen } from '../components/LoadingScreen';
import { Navigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'therapist':
      return <TherapistDashboard />;
    case 'place':
      return <PlaceDashboard />;
    default:
      // This should be caught by ProtectedRoute, but as a fallback:
      return <Navigate to="/login" replace />;
  }
};
