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

  const login = useCallback(async (emailOrAdmin: string, code: string): Promise<string | void> => {
    const upperCaseEmail = emailOrAdmin.toUpperCase();

    // Handle admin login separately
    if (upperCaseEmail === ADMIN_CODE) {
      const adminAuthInfo: AuthInfo = { code: ADMIN_CODE, type: 'admin' };
      localStorage.setItem('authInfo', JSON.stringify(adminAuthInfo));
      setAuthInfo(adminAuthInfo);
      navigate('/admin-dashboard');
      return;
    }

    // Handle user login
    if (!code) {
      return 'Login code is required.';
    }

    try {
      const { data, error } = await supabase.functions.invoke('secure-login', {
        body: { email: emailOrAdmin, code },
      });

      if (error) {
        throw new Error(error.message);
      }
      if (data.error) {
        throw new Error(data.error);
      }
      
      const { type, login_code } = data;
      const userAuthInfo: AuthInfo = { code: login_code, type };
      localStorage.setItem('authInfo', JSON.stringify(userAuthInfo));
      setAuthInfo(userAuthInfo);
      navigate(`/${type}-dashboard/${login_code}`);

    } catch (err: any) {
      console.error("Login error:", err);
      return err.message || 'An error occurred during login.';
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('authInfo');
    setAuthInfo(null);
    navigate('/');
  }, [navigate]);

  return { authInfo, loading, login, logout };
};
