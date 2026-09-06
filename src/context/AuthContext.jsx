import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

// Date mock pentru explorare instantanee în caz că utilizatorul nu a configurat încă baza de date
const DEMO_USER = {
  id: 'demo-user-manager-id',
  email: 'manager@companie.ro',
  user_metadata: { full_name: 'Manager Demo' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // 1. Dacă Supabase este configurat, ascultăm sesiunea reală
    if (isSupabaseConfigured && supabase) {
      // Obținem sesiunea inițială
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch((err) => {
        console.error('Eroare la preluarea sesiunii:', err);
        setLoading(false);
      });

      // Ascultăm schimbările de stare de autentificare (persistent session)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // 2. Dacă nu este configurat, verificăm dacă e activat modul demo în localStorage
      const demoActive = localStorage.getItem('CREARE_ORAR_DEMO_MODE') === 'true';
      if (demoActive) {
        setIsDemoMode(true);
        setUser(DEMO_USER);
        setSession({ user: DEMO_USER });
      }
      setLoading(false);
    }
  }, []);

  // Înregistrare utilizator nou (Supabase Auth)
  const signUp = async (email, password, metadata = {}) => {
    if (!isSupabaseConfigured || !supabase) {
      // Mod demo
      setIsDemoMode(true);
      localStorage.setItem('CREARE_ORAR_DEMO_MODE', 'true');
      const newUser = { id: 'demo-user-id', email, user_metadata: metadata };
      setUser(newUser);
      setSession({ user: newUser });
      return { data: { user: newUser, session: { user: newUser } }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    return { data, error };
  };

  // Autentificare utilizator existent (Supabase Auth)
  const signIn = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      // Mod demo
      setIsDemoMode(true);
      localStorage.setItem('CREARE_ORAR_DEMO_MODE', 'true');
      const demoUser = { id: 'demo-user-id', email, user_metadata: { full_name: 'Manager Demo' } };
      setUser(demoUser);
      setSession({ user: demoUser });
      return { data: { user: demoUser, session: { user: demoUser } }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  };

  // Deconectare
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('CREARE_ORAR_DEMO_MODE');
    setIsDemoMode(false);
    setUser(null);
    setSession(null);
  };

  // Activare mod demo pentru testare imediată
  const startDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem('CREARE_ORAR_DEMO_MODE', 'true');
    setUser(DEMO_USER);
    setSession({ user: DEMO_USER });
  };

  const value = {
    user,
    session,
    loading,
    isDemoMode,
    isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    startDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth trebuie utilizat în interiorul unui AuthProvider');
  }
  return context;
};
