import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Sign in with email + password */
  login: (email: string, password: string) => Promise<void>;
  /** Create a new account with email + password. Returns the session if one was created (email confirmation off), or null if the user must confirm via email first. */
  signup: (email: string, password: string) => Promise<{ session: Session | null }>;
  /** Start the Google OAuth flow. Redirects the browser to Google; the user lands back on /auth/callback when done. */
  signInWithGoogle: () => Promise<void>;
  /** Sign out the current user */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Provides Supabase auth state (session, user) and login/logout actions */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /** Signs in with email + password via Supabase */
  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  /** Creates a new account with email + password via Supabase. When a session is created (email confirmation off), pushes it into local state immediately so downstream <ProtectedRoute> renders see the user without waiting for the onAuthStateChange tick. */
  async function signup(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    return { session: data.session };
  }

  /** Starts the Google OAuth flow via Supabase. Browser is redirected to Google; on return Supabase lands the user on `/auth/callback` where session detection runs. */
  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }

  /** Signs out the current user via Supabase */
  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, login, signup, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Returns auth context — must be used inside AuthProvider */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
