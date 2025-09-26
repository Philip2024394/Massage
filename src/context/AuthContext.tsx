import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { TherapistProfile, MassagePlaceProfile, AuthInfo } from '../types';
import { mapSupabaseTherapistToProfile, mapSupabasePlaceToProfile } from '../data/data-mappers';
import { useNavigate } from 'react-router-dom';

type Profile = (TherapistProfile | MassagePlaceProfile) & { user_id?: string };
type UserRole = 'admin' | 'therapist' | 'place' | null;

interface AuthContextType {
  session: Session | null;
  profile: Profile | AuthInfo | null;
  role: UserRole;
  loading: boolean;
  login: (credentials: {email: string, password: string}) => Promise<{ error: AuthError | null }>;
  signUp: (credentials: any) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | AuthInfo | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setSession(session);
        const accountType = session.user.user_metadata.account_type;

        if (accountType !== 'therapist' && accountType !== 'place') {
            console.error('Invalid account_type in user metadata:', accountType);
            await supabase.auth.signOut();
            return;
        }

        const tableName = accountType === 'therapist' ? 'therapists' : 'places';
        
        const { data, error } = await supabase.from(tableName).select('*').eq('id', session.user.id).single();
        
        if (data) {
          const mappedProfile = accountType === 'therapist' ? mapSupabaseTherapistToProfile(data) : mapSupabasePlaceToProfile(data);
          setProfile({ ...mappedProfile, user_id: session.user.id });
          setRole(accountType);
        } else {
          console.error("Auth session exists but profile not found in public table. Signing out.", error);
          await supabase.auth.signOut();
          return;
        }
      } else {
        setSession(null);
        try {
          const storedAuth = localStorage.getItem('authInfo');
          if (storedAuth) {
            const parsedAuth = JSON.parse(storedAuth);
            if (parsedAuth.type === 'admin') {
              setProfile(parsedAuth);
              setRole('admin');
            } else {
              localStorage.removeItem('authInfo');
              setProfile(null);
              setRole(null);
            }
          } else {
            setProfile(null);
            setRole(null);
          }
        } catch (e) {
          console.error("Error parsing legacy auth info:", e);
          localStorage.removeItem('authInfo');
          setProfile(null);
          setRole(null);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async ({ email, password }: {email: string, password: string}) => {
    if (email === import.meta.env.VITE_ADMIN_CODE) {
      const adminAuthInfo: AuthInfo = { code: import.meta.env.VITE_ADMIN_CODE, type: 'admin' };
      localStorage.setItem('authInfo', JSON.stringify(adminAuthInfo));
      setProfile(adminAuthInfo);
      setRole('admin');
      navigate('/dashboard');
      return { error: null };
    }
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) navigate('/dashboard');
    return { error };
  };

  const signUp = async ({ email, password, name, accountType }: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          account_type: accountType
        },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('authInfo');
    // State updates will be handled by onAuthStateChange listener
    navigate('/');
  };

  const value = {
    session,
    profile,
    role,
    loading,
    login,
    signUp,
    signOut,
    isAdmin: role === 'admin',
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
