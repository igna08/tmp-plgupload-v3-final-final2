"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'http://localhost:8000/api';

interface UserRoles {
  super_admin: boolean;
  school_admin: boolean;
  teacher: boolean;
  inventory_manager: boolean;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  roles: UserRoles;
  // Propiedades computadas para compatibilidad
  is_active: boolean;
  is_superuser: boolean;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email_or_username: string, password_param: string) => Promise<boolean>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const router = useRouter();

  // Debug logs para rastrear el estado
  const debugLog = (message: string, data?: any) => {
    console.log(`[AuthContext] ${message}`, data || '');
  };

  // Función para transformar la respuesta de la API al formato esperado
  const transformUserData = (apiUser: any): User => {
    return {
      ...apiUser,
      is_active: apiUser.status === 'active',
      is_superuser: apiUser.roles?.super_admin || false
    };
  };

  const fetchUser = useCallback(async (): Promise<void> => {
    const currentToken = token || localStorage.getItem('accessToken');
    
    debugLog('fetchUser called', { hasToken: !!currentToken, token: currentToken?.substring(0, 20) + '...' });
    
    if (!currentToken) {
      debugLog('No token found, clearing user');
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Configurar header si no está configurado
    if (!axios.defaults.headers.common['Authorization']) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      debugLog('Set Authorization header');
    }

    try {
      setIsLoading(true);
      debugLog('Fetching user from API...');
      
      const response = await axios.get<any>(`${API_BASE_URL}/users/me`);
      
      debugLog('Raw API response', response.data);
      
      // Transformar los datos al formato esperado
      const transformedUser = transformUserData(response.data);
      
      debugLog('User fetched and transformed successfully', {
        original: response.data,
        transformed: transformedUser
      });
      
      setUser(transformedUser);
      setError(null);
    } catch (err: any) {
      debugLog('Failed to fetch user', { 
        status: err.response?.status, 
        data: err.response?.data,
        message: err.message 
      });
      
      // Si el token es inválido, limpiar todo
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      setError('Session expired. Please login again.');
    } finally {
      setIsLoading(false);
      debugLog('fetchUser completed');
    }
  }, [token]);

  // Efecto para la inicialización
  useEffect(() => {
    const initializeAuth = async () => {
      debugLog('Initializing auth...');
      
      const storedToken = localStorage.getItem('accessToken');
      debugLog('Stored token found', { hasToken: !!storedToken });
      
      if (storedToken) {
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        debugLog('Token set from localStorage');
      } else {
        setIsLoading(false);
        debugLog('No stored token, auth initialized without token');
      }
      
      setIsInitialized(true);
      debugLog('Auth initialization completed');
    };

    initializeAuth();
  }, []);

  // Efecto para fetchUser cuando cambia el token
  useEffect(() => {
    debugLog('Token/initialization effect triggered', { 
      isInitialized, 
      hasToken: !!token,
      tokenPreview: token?.substring(0, 20) + '...'
    });
    
    if (isInitialized) {
      if (token) {
        debugLog('Token exists, fetching user...');
        fetchUser();
      } else {
        debugLog('No token, clearing user state');
        setUser(null);
        setIsLoading(false);
      }
    }
  }, [token, isInitialized, fetchUser]);

  const login = async (email_or_username: string, password_param: string): Promise<boolean> => {
    debugLog('Login attempt started', { email: email_or_username });
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('username', email_or_username);
      params.append('password', password_param);

      debugLog('Sending login request...');
      
      const response = await axios.post<{ access_token: string }>(
        `${API_BASE_URL}/auth/login`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const newAccessToken = response.data.access_token;
      debugLog('Login successful, token received', { tokenPreview: newAccessToken.substring(0, 20) + '...' });
      
      // Guardar en localStorage y estado
      localStorage.setItem('accessToken', newAccessToken);
      setToken(newAccessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

      debugLog('Token saved and state updated');
      return true;
    } catch (err: any) {
      debugLog('Login failed', { 
        status: err.response?.status, 
        data: err.response?.data,
        message: err.message 
      });
      
      const errorMessage = err.response?.data?.detail || 'Invalid credentials or server error.';
      setError(errorMessage);
      
      // Limpiar todo en caso de error
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      setIsLoading(false);
      return false;
    }
  };

  const logout = useCallback(() => {
    debugLog('Logout called');
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    setError(null);
    delete axios.defaults.headers.common['Authorization'];
    router.push('/login');
  }, [router]);

  // Debug del estado actual
  useEffect(() => {
    debugLog('Auth state update', {
      hasToken: !!token,
      hasUser: !!user,
      isLoading,
      isInitialized,
      error,
      userRoles: user?.roles,
      isActive: user?.is_active,
      isSuperuser: user?.is_superuser
    });
  }, [token, user, isLoading, isInitialized, error]);

  return (
    <AuthContext.Provider value={{ token, user, isLoading, error, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};