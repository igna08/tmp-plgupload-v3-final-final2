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

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

// Función de utilidad para logs estructurados
const debugLog = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    category,
    message,
    ...(data && { data })
  };
  
  console.group(`🔍 [LOGIN-DEBUG] ${category}`);
  console.log(`⏰ ${timestamp}`);
  console.log(`📝 ${message}`);
  if (data) {
    console.log('📊 Data:', data);
  }
  console.groupEnd();
};

// Component that uses useSearchParams wrapped in Suspense
const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const { login, isLoading, error: authError, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Obtener la URL de redirección de los query params
  const redirectUrl = searchParams.get('redirect') || '/';

  // Debug inicial del componente
  useEffect(() => {
    debugLog('COMPONENT_INIT', 'Componente LoginForm inicializado', {
      redirectUrl,
      initialOnlineStatus: navigator.onLine,
      hasToken: !!token,
      apiBaseUrl: API_BASE_URL
    });
  }, []);

  // Monitor connection status
  useEffect(() => {
    debugLog('NETWORK_MONITOR', 'Configurando listeners de conectividad');
    
    const handleOnline = () => {
      debugLog('NETWORK_STATUS', 'Conexión restaurada - ONLINE');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      debugLog('NETWORK_STATUS', 'Conexión perdida - OFFLINE');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    const initialStatus = navigator.onLine;
    debugLog('NETWORK_CHECK', 'Estado inicial de conectividad', { isOnline: initialStatus });
    setIsOnline(initialStatus);

    return () => {
      debugLog('NETWORK_MONITOR', 'Removiendo listeners de conectividad');
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (token) {
      debugLog('AUTH_REDIRECT', 'Usuario ya autenticado, redirigiendo', {
        token: token.substring(0, 20) + '...',
        redirectUrl
      });
      router.replace(redirectUrl);
    }
  }, [token, router, redirectUrl]);

  // Debug cambios en el estado de loading
  useEffect(() => {
    debugLog('AUTH_STATE', 'Estado de autenticación cambió', {
      isLoading,
      hasError: !!authError,
      error: authError,
      hasToken: !!token
    });
  }, [isLoading, authError, token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    
    debugLog('FORM_SUBMIT', 'Iniciando proceso de login', {
      email: email,
      passwordLength: password.length,
      isOnline: navigator.onLine,
      formValid: !!(email && password)
    });

    // Check if online before attempting login
    if (!navigator.onLine) {
      debugLog('NETWORK_ERROR', 'Intento de login sin conexión a internet');
      alert('No hay conexión a internet. Por favor, verifica tu conexión e inténtalo de nuevo.');
      return;
    }

    // Validación de campos
    if (!email || !password) {
      debugLog('VALIDATION_ERROR', 'Campos requeridos faltantes', {
        hasEmail: !!email,
        hasPassword: !!password
      });
      return;
    }

    try {
      debugLog('LOGIN_REQUEST', 'Enviando solicitud de login al backend', {
        apiUrl: API_BASE_URL,
        email,
        timestamp: new Date().toISOString()
      });

      // Medir tiempo de respuesta
      const startTime = performance.now();
      
      const success = await login(email, password);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      if (success) {
        debugLog('LOGIN_SUCCESS', 'Login exitoso', {
          responseTime: `${responseTime.toFixed(2)}ms`,
          redirectUrl,
          timestamp: new Date().toISOString()
        });
        
        debugLog('NAVIGATION', 'Redirigiendo usuario', { to: redirectUrl });
        router.push(redirectUrl);
      } else {
        debugLog('LOGIN_FAILURE', 'Login falló - credenciales inválidas', {
          responseTime: `${responseTime.toFixed(2)}ms`,
          email,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      debugLog('LOGIN_ERROR', 'Error durante el proceso de login', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        email,
        timestamp: new Date().toISOString()
      });
      
      // Análisis del tipo de error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        debugLog('NETWORK_ERROR', 'Error de red detectado', {
          message: 'Posible problema de conectividad o CORS',
          apiUrl: API_BASE_URL
        });
      } else if (error instanceof Error && error.message.includes('timeout')) {
        debugLog('TIMEOUT_ERROR', 'Timeout de request detectado');
      }
      
      console.error('Error completo en login:', error);
    }
  };

  const togglePasswordVisibility = () => {
    const newState = !showPassword;
    debugLog('UI_INTERACTION', 'Toggle visibilidad de contraseña', {
      previousState: showPassword,
      newState
    });
    setShowPassword(newState);
  };

  const handleLogoError = () => {
    debugLog('ASSET_ERROR', 'Error cargando logo, usando fallback');
    setLogoError(true);
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    debugLog('INPUT_CHANGE', `Campo ${field} modificado`, {
      field,
      valueLength: value.length,
      isEmpty: !value.trim()
    });

    if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }
  };

  // Si ya está autenticado, mostrar mensaje de carga
  if (token) {
    debugLog('RENDER', 'Renderizando estado de redirección');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  debugLog('RENDER', 'Renderizando formulario de login', {
    isLoading,
    isOnline,
    hasError: !!authError,
    formReady: !!(email && password)
  });

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex justify-center">
            {!logoError ? (
              <img
                src="https://app-web-final-qr.vercel.app/logo.png"
                alt="Logo del Sistema"
                className="h-24 w-auto max-w-full"
                onError={handleLogoError}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                <User className="h-10 w-10 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Bienvenido
          </h1>
          <p className="text-base text-gray-600 mb-4">
            Inicia sesión en tu cuenta
          </p>
          
          {/* Connection Status Indicator */}
          <div className="flex items-center justify-center">
            {isOnline ? (
              <div className="flex items-center text-green-600 text-sm bg-green-50 px-3 py-1 rounded-full">
                <Wifi className="h-4 w-4 mr-2" />
                <span>Conectado</span>
              </div>
            ) : (
              <div className="flex items-center text-red-500 text-sm bg-red-50 px-3 py-1 rounded-full">
                <WifiOff className="h-4 w-4 mr-2" />
                <span>Sin conexión</span>
              </div>
            )}
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-gray-50 shadow-2xl rounded-2xl px-8 py-10 sm:px-12 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="ejemplo@dominio.com"
                  disabled={isLoading || !isOnline}
                  className="pl-12 block w-full bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base py-4 transition-all duration-200 hover:border-gray-300"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading || !isOnline}
                  className="pl-12 pr-14 block w-full bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base py-4 transition-all duration-200 hover:border-gray-300"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  disabled={isLoading || !isOnline}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Debug Info (Solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                <div className="font-semibold text-blue-800 mb-1">Debug Info:</div>
                <div className="text-blue-700 space-y-1">
                  <div>Email: {email || 'vacío'}</div>
                  <div>Password Length: {password.length}</div>
                  <div>Loading: {isLoading ? 'Sí' : 'No'}</div>
                  <div>Online: {isOnline ? 'Sí' : 'No'}</div>
                  <div>API URL: {API_BASE_URL}</div>
                </div>
              </div>
            )}

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
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-4 focus:ring-blue-300"
                onClick={() => {
                  debugLog('BUTTON_CLICK', 'Botón de submit clickeado', {
                    formValid: !!(email && password),
                    canSubmit: !isLoading && isOnline && email && password
                  });
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Additional Links/Info */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500 font-medium">¿No tienes una cuenta?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                <span>Regístrate </span>
                <a
                  href="/register"
                  className="text-blue-600 hover:text-blue-700 underline font-semibold transition-colors"
                  onClick={() => {
                    debugLog('NAVIGATION', 'Navegando a registro');
                  }}
                >
                  aquí
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 font-medium">
            Scanly © 2025 - Sistema Educativo
          </p>
        </div>
      </div>
    </div>
  );
};

// Loading component for Suspense fallback
const LoginLoadingFallback: React.FC = () => {
  debugLog('SUSPENSE', 'Mostrando fallback de carga');
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
};

// Main component with Suspense boundary
const LoginPage: React.FC = () => {
  debugLog('APP_INIT', 'Inicializando LoginPage principal');
  
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
