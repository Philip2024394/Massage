import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { AuthInfo } from '../types';

const ADMIN_CODE = 'ADMIN1';

export const useAuth = () => {
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('authInfo');
      if (storedAuth) {
        setAuthInfo(JSON.parse(storedAuth));
      }
    } catch (error) {
      console.error("Failed to parse auth info from localStorage", error);
      localStorage.removeItem('authInfo');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (code: string): Promise<string | void> => {
    const upperCaseCode = code.toUpperCase();

    if (upperCaseCode === ADMIN_CODE) {
      const adminAuthInfo: AuthInfo = { code: ADMIN_CODE, type: 'admin' };
      localStorage.setItem('authInfo', JSON.stringify(adminAuthInfo));
      setAuthInfo(adminAuthInfo);
      navigate('/admin-dashboard');
      return;
    }

    try {
      const { data: therapist, error: therapistError } = await supabase
        .from('therapists')
        .select('login_code')
        .eq('login_code', upperCaseCode)
        .single();
      
      if (therapist) {
        const therapistAuthInfo: AuthInfo = { code: upperCaseCode, type: 'therapist' };
        localStorage.setItem('authInfo', JSON.stringify(therapistAuthInfo));
        setAuthInfo(therapistAuthInfo);
        navigate(`/therapist-dashboard/${upperCaseCode}`);
        return;
      }

      const { data: place, error: placeError } = await supabase
        .from('places')
        .select('login_code')
        .eq('login_code', upperCaseCode)
        .single();
      
      if (place) {
        const placeAuthInfo: AuthInfo = { code: upperCaseCode, type: 'place' };
        localStorage.setItem('authInfo', JSON.stringify(placeAuthInfo));
        setAuthInfo(placeAuthInfo);
        navigate(`/place-dashboard/${upperCaseCode}`);
        return;
      }

      return 'Invalid code. Please try again.';
    } catch (err) {
      console.error("Login error:", err);
      return 'An error occurred during login.';
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('authInfo');
    setAuthInfo(null);
    navigate('/');
  }, [navigate]);

  return { authInfo, loading, login, logout };
};
