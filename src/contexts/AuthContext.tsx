import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, User, LoginRequest } from '../lib/api';
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
    // Check if user is already logged in
    const token = apiService.getAccessToken();
    if (token) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      // For demonstration, use mock data
      const mockUser: User = {
        id: 1,
        full_name: 'Admin User',
        phone_number: '+998901234567',
        role: 'admin',
        is_active: true,
      };
      setUser(mockUser);
    } catch (error) {
      console.error('Failed to load user:', error);
      apiService.clearAccessToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      
      // Mock login - in production, call the real API
      // const response = await apiService.login(credentials);
      // apiService.setAccessToken(response.data.access);
      
      // For demonstration purposes
      apiService.setAccessToken('mock_token_' + Date.now());
      
      await loadUser();
      toast.success('Muvaffaqiyatli kirdingiz!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Telefon raqami yoki parol noto\'g\'ri');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiService.clearAccessToken();
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
