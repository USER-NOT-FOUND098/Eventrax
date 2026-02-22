import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, UserRole } from '@/types';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isCreator: () => boolean;
  isTeamLead: () => boolean;
  isStudent: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for active session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await api.get('/auth/me.php');
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        // Session invalid or expired
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login.php', { email, password });
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (error: any) {
      console.error('LOGIN ERROR DETAILS:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      const msg = error.response?.data?.error || 'Login failed. Check console for details.';
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout.php');
    } catch (error) {
      console.error('Logout API failure, proceeding with local cleanup', error);
    } finally {
      // Robustly clear all local state and caches
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();

      // Force a hard reload to the login page to clear any remaining state
      window.location.href = '/login';
    }
  }, []);

  const hasRole = useCallback((roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  const isAdmin = useCallback(() => user?.role === 'admin', [user]);
  const isCreator = useCallback(() => user?.role === 'creator', [user]);
  const isTeamLead = useCallback(() => user?.role === 'teamlead', [user]);
  const isStudent = useCallback(() => user?.role === 'student', [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasRole,
      isAdmin,
      isCreator,
      isTeamLead,
      isStudent,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
