"use client";

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { 
  User, 
  Lock, 
  AlertCircle, 
  Loader2,
  Eye,
  EyeOff,
  LogIn,
  Wifi,
  WifiOff
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ;

// Component that uses useSearchParams wrapped in Suspense
const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [logoError, setLogoError] = useState(false);

  // Actualizar la desestructuración del contexto
  const { 
    login, 
    isLoading, 
    error: authError, 
    token,
    clearError,
    isAuthenticated 
  } = useAuth();

  const router = useRouter();
  const searchParams = useSearchParams();

  // Obtener la URL de redirección de los query params
  const redirectUrl = searchParams.get('redirect') || '/';

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  // Limpiar errores cuando el usuario empiece a escribir
  useEffect(() => {
    if (authError && (email || password)) {
      clearError();
    }
  }, [email, password, authError, clearError]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Check if online before attempting login
    if (!navigator.onLine) {
      alert('No hay conexión a internet. Por favor, verifica tu conexión e inténtalo de nuevo.');
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        router.push(redirectUrl);
      }
    } catch (error) {
      console.error('Error en login:', error);
      // El error ya se maneja en el contexto de autenticación
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogoError = () => {
    setLogoError(true);
  };

  // Si ya está autenticado, mostrar mensaje de carga
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex justify-center">
            {!logoError ? (
              <img
                src="https://issa-qr.vercel.app/issa.png"
                alt="Logo del Sistema"
                className="h-20 w-auto max-w-full sm:h-24"
                onError={handleLogoError}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                <User className="h-10 w-10 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Bienvenido de vuelta
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Inicia sesión para acceder al sistema
          </p>

          {/* Connection Status Indicator */}
          <div className="flex items-center justify-center">
            {isOnline ? (
              <div className="flex items-center text-green-600 text-xs sm:text-sm bg-green-50 px-3 py-1 rounded-full">
                <Wifi className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span>Conectado</span>
              </div>
            ) : (
              <div className="flex items-center text-red-500 text-xs sm:text-sm bg-red-50 px-3 py-1 rounded-full">
                <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span>Sin conexión</span>
              </div>
            )}
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-gray-50 shadow-2xl rounded-2xl px-6 py-8 sm:px-8 sm:py-10 lg:px-12 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@dominio.com"
                  disabled={isLoading || !isOnline}
                  className="pl-10 sm:pl-12 block w-full bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base py-3 sm:py-4 transition-all duration-200 hover:border-gray-300"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading || !isOnline}
                  className="pl-10 pr-12 sm:pl-12 sm:pr-14 block w-full bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base py-3 sm:py-4 transition-all duration-200 hover:border-gray-300"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center"
                  disabled={isLoading || !isOnline}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700 font-medium">
                    {authError}
                  </div>
                </div>
              </div>
            )}

            {/* Offline Warning */}
            {!isOnline && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex">
                  <WifiOff className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-700 font-medium">
                    Sin conexión a internet. Verifica tu conexión para continuar.
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading || !isOnline || !email || !password}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-6 sm:py-4 sm:px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-4 focus:ring-blue-300 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            ISSA QR © 2025 - Sistema Educativo
          </p>
        </div>
      </div>
    </div>
  );
};

// Loading component for Suspense fallback
const LoginLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-white flex items-center justify-center px-4">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-gray-600">Cargando...</p>
    </div>
  </div>
);

// Main component with Suspense boundary
const LoginPage: React.FC = () => {
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;