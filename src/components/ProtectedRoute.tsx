import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
