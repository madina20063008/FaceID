// contexts/AuthContext.tsx - Simplified version without checkPhoneNumber
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, LoginRequest, LoginResponse, User } from '../lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = apiService.getAccessToken();
      
      if (token) {
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
          
          if (window.location.pathname === '/login') {
            navigate('/dashboard');
          }
        } catch (error: any) {
          apiService.clearTokens();
          
          if (window.location.pathname !== '/login') {
            toast.error('Sessiya tugadi. Iltimos, qaytadan kiring.');
            navigate('/login');
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [navigate]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      
      const response: LoginResponse = await apiService.login(credentials);
      
      
      try {
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
        toast.success('Muvaffaqiyatli kirdingiz!');
        navigate('/dashboard');
      } catch (userError) {
        // Still redirect since we have token
        toast.success('Kirish muvaffaqiyatli!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      
      // Show appropriate error message
      if (error.message.includes('Telefon raqami yoki parol')) {
        toast.error('Telefon raqami yoki parol noto\'g\'ri');
      } else if (error.message.includes('Internet aloqasi')) {
        toast.error('Internet aloqasi yo\'q');
      } else {
        toast.error(error.message || 'Kirishda xatolik');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiService.clearTokens();
    setUser(null);
    toast.success('Tizimdan chiqdingiz');
    navigate('/login');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}