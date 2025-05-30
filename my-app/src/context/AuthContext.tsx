"use client"; // Required for context and hooks

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation'; // For redirection

const API_BASE_URL = 'http://localhost:8000/api';

interface User {
  id: string;
  full_name: string; // As per API doc for /users/me (assuming this field)
  email: string;
  is_active: boolean; // Renamed from 'status' to match typical API responses for user status
  is_superuser: boolean;
  // Add other fields if necessary from /users/me
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email_or_username: string, password_param: string) => Promise<boolean>;
  logout: () => void;
  fetchUser: () => Promise<void>; // Added to fetch user data after login or on load
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
  const [isLoading, setIsLoading] = useState<boolean>(true); // Initialize isLoading to true
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true); // Set loading true at the very start of auth initialization
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchUser(); // fetchUser will set isLoading to false once it's done
    } else {
      // No token found, ensure state is clean and finish loading
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization']; // Ensure header is clear
      setIsLoading(false); // Crucial: set loading to false if no token to check
    }
  }, []); // Empty dependency array means this runs once on mount

  const login = async (email_or_username: string, password_param: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('username', email_or_username); // API expects 'username'
      params.append('password', password_param); // API expects 'password'

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
      localStorage.setItem('accessToken', newAccessToken);
      setToken(newAccessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

      await fetchUser(); // Fetch user details after successful login

      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMessage = err.response?.data?.detail || 'Invalid credentials or server error.';
      setError(errorMessage);
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      setIsLoading(false);
      return false;
    }
  };

  const fetchUser = async (): Promise<void> => {
    if (!axios.defaults.headers.common['Authorization'] && !localStorage.getItem('accessToken')) {
        // If there's no token set in headers (e.g. after a page refresh and only localStorage has it)
        // AND no token in localStorage, then don't attempt to fetch.
        // Or if there is a token in localStorage but not in headers, set it.
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
            setUser(null); // Ensure user is cleared if no token
            return;
        }
    }

    // If Authorization header is not set (e.g. after a page refresh where only localStorage has token)
    // and we have a token in localStorage, set it.
    if (!axios.defaults.headers.common['Authorization']) {
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
             // This case should ideally not be reached if token state is managed correctly with useEffect
            setUser(null);
            return;
        }
    }


    setIsLoading(true); // Can set loading for user fetch specifically if needed
    try {
      // Assuming the user data structure from the prompt for /users/me
      const response = await axios.get<User>(`${API_BASE_URL}/users/me`);
      setUser(response.data);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch user:', err);
      // If fetching user fails (e.g. token expired), log out the user
      setError('Session expired or failed to fetch user data.');
      logout(); // This will clear token, user, and redirect
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    setError(null);
    // Redirect to login page after logout
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, error, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
