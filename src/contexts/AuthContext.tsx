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
      console.log('🔄 Auth initialization - Token exists:', !!token);
      
      if (token) {
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
          console.log('✅ User loaded:', currentUser.full_name);
          
          if (window.location.pathname === '/login') {
            navigate('/dashboard');
          }
        } catch (error: any) {
          console.error('❌ Failed to load user:', error);
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
      console.log('🚀 Login attempt for phone:', credentials.phone_number);
      
      const response: LoginResponse = await apiService.login(credentials);
      
      console.log('✅ Login API success, fetching user...');
      
      try {
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
        console.log('👤 User data loaded:', currentUser.full_name);
        toast.success('Muvaffaqiyatli kirdingiz!');
        navigate('/dashboard');
      } catch (userError) {
        console.error('⚠️ User fetch failed but login succeeded');
        // Still redirect since we have token
        toast.success('Kirish muvaffaqiyatli!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('💥 Login failed:', error);
      
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
    console.log('👋 Logging out');
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