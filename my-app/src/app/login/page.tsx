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

// Función de debug que funciona en producción
const debugLog = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toLocaleString();
  console.log(`🔍 [${category}] ${timestamp} - ${message}`);
  if (data) {
    console.log('📊 Data:', data);
  }
  
  // También mostrar en alert para Vercel si está en modo debug
  if (typeof window !== 'undefined' && window.localStorage?.getItem('debug-mode') === 'true') {
    const debugMsg = `[${category}] ${message}${data ? '\nData: ' + JSON.stringify(data, null, 2) : ''}`;
    console.warn('DEBUG ALERT:', debugMsg);
  }
};

// Función de login manual para debug
const manualLogin = async (email: string, password: string) => {
  debugLog('MANUAL_LOGIN', 'Iniciando login manual directo', { email, apiUrl: API_BASE_URL });
  
  try {
    const loginUrl = `${API_BASE_URL}/auth/login`;
    debugLog('REQUEST_PREP', 'Preparando request', { 
      url: loginUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const requestBody = { email, password };
    debugLog('REQUEST_BODY', 'Cuerpo del request', requestBody);

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    debugLog('RESPONSE_STATUS', 'Respuesta recibida', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
      debugLog('RESPONSE_JSON', 'Datos JSON recibidos', responseData);
    } else {
      const textData = await response.text();
      debugLog('RESPONSE_TEXT', 'Respuesta en texto', { text: textData });
      responseData = { error: 'Respuesta no JSON', data: textData };
    }

    if (response.ok) {
      debugLog('LOGIN_SUCCESS', 'Login exitoso', responseData);
      return { success: true, data: responseData };
    } else {
      debugLog('LOGIN_FAILED', 'Login falló', { status: response.status, data: responseData });
      return { success: false, error: responseData.message || 'Error desconocido', data: responseData };
    }

  } catch (error) {
    debugLog('REQUEST_ERROR', 'Error en la petición', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return { success: false, error: `Error de conexión: ${error instanceof Error ? error.message : String(error)}` };
  }
};

// Component that uses useSearchParams wrapped in Suspense
const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  
  const { login, isLoading, error: authError, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = searchParams.get('redirect') || '/';

  // Activar modo debug
  useEffect(() => {
    const isDebug = typeof window !== 'undefined' && window.localStorage?.getItem('debug-mode') === 'true';
    setDebugMode(isDebug);
    debugLog('COMPONENT_INIT', 'Componente inicializado', {
      debugMode: isDebug,
      redirectUrl,
      hasToken: !!token,
      apiUrl: API_BASE_URL
    });
  }, []);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      debugLog('NETWORK', 'Conexión restaurada');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      debugLog('NETWORK', 'Conexión perdida');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Redirect if authenticated
  useEffect(() => {
    if (token) {
      debugLog('AUTH_REDIRECT', 'Redirigiendo usuario autenticado', { redirectUrl });
      router.replace(redirectUrl);
    }
  }, [token, router, redirectUrl]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    
    debugLog('FORM_SUBMIT', 'Formulario enviado', {
      email,
      passwordLength: password.length,
      isOnline: navigator.onLine,
      hasAuthContext: !!login
    });

    setManualError(null);

    if (!navigator.onLine) {
      debugLog('NETWORK_ERROR', 'Sin conexión a internet');
      alert('No hay conexión a internet');
      return;
    }

    if (!email || !password) {
      debugLog('VALIDATION_ERROR', 'Campos faltantes', { hasEmail: !!email, hasPassword: !!password });
      setManualError('Email y contraseña son requeridos');
      return;
    }

    // Probar primero el contexto de autenticación
    debugLog('AUTH_CONTEXT', 'Intentando login con contexto Auth');
    try {
      if (login) {
        const success = await login(email, password);
        debugLog('AUTH_CONTEXT_RESULT', 'Resultado del contexto', { success });
        
        if (success) {
          router.push(redirectUrl);
          return;
        }
      } else {
        debugLog('AUTH_CONTEXT_ERROR', 'Contexto de auth no disponible');
      }
    } catch (error) {
      debugLog('AUTH_CONTEXT_ERROR', 'Error en contexto auth', { error });
    }

    // Si el contexto falla, probar login manual
    debugLog('MANUAL_LOGIN_START', 'Iniciando login manual');
    setManualLoading(true);
    
    try {
      const result = await manualLogin(email, password);
      
      if (result.success) {
        debugLog('MANUAL_LOGIN_SUCCESS', 'Login manual exitoso');
        // Aquí podrías guardar el token manualmente si es necesario
        if (result.data?.token) {
          localStorage.setItem('authToken', result.data.token);
        }
        router.push(redirectUrl);
      } else {
        debugLog('MANUAL_LOGIN_FAILED', 'Login manual falló');
        setManualError(result.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      debugLog('MANUAL_LOGIN_ERROR', 'Error en login manual', { error });
      setManualError('Error de conexión con el servidor');
    } finally {
      setManualLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogoError = () => {
    debugLog('ASSET_ERROR', 'Error cargando logo');
    setLogoError(true);
  };

  const toggleDebugMode = () => {
    const newMode = !debugMode;
    setDebugMode(newMode);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('debug-mode', newMode.toString());
    }
    debugLog('DEBUG_MODE', `Modo debug ${newMode ? 'activado' : 'desactivado'}`);
  };

  if (token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  const currentError = manualError || authError;
  const currentLoading = manualLoading || isLoading;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Debug Toggle Button */}
        <div className="text-center mb-4">
          <button
            onClick={toggleDebugMode}
            className={`px-3 py-1 text-xs rounded ${debugMode ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Debug: {debugMode ? 'ON' : 'OFF'}
          </button>
        </div>

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
          
          {/* Connection Status */}
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@dominio.com"
                  disabled={currentLoading || !isOnline}
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={currentLoading || !isOnline}
                  className="pl-12 pr-14 block w-full bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base py-4 transition-all duration-200 hover:border-gray-300"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  disabled={currentLoading || !isOnline}
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

            {/* Debug Info Panel */}
            {debugMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <div className="font-semibold text-blue-800 mb-2">🔍 Debug Info:</div>
                <div className="text-blue-700 space-y-1">
                  <div>API URL: {API_BASE_URL}</div>
                  <div>Email: {email || 'vacío'}</div>
                  <div>Password Length: {password.length}</div>
                  <div>Auth Loading: {isLoading ? 'Sí' : 'No'}</div>
                  <div>Manual Loading: {manualLoading ? 'Sí' : 'No'}</div>
                  <div>Online: {isOnline ? 'Sí' : 'No'}</div>
                  <div>Has Token: {token ? 'Sí' : 'No'}</div>
                  <div>Auth Error: {authError || 'ninguno'}</div>
                  <div>Manual Error: {manualError || 'ninguno'}</div>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  Abre DevTools Console para logs detallados
                </div>
              </div>
            )}

            {/* Error Message */}
            {currentError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700 font-medium">
                    {currentError}
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
                disabled={currentLoading || !isOnline || !email || !password}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-4 focus:ring-blue-300"
              >
                {currentLoading ? (
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

          {/* Test API Button */}
          {debugMode && (
            <div className="mt-4">
              <button
                onClick={async () => {
                  debugLog('API_TEST', 'Probando conectividad con API');
                  try {
                    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
                    debugLog('API_TEST_RESULT', 'Resultado test API', {
                      status: response.status,
                      ok: response.ok
                    });
                    alert(`API Test: ${response.ok ? 'OK' : 'FAIL'} (${response.status})`);
                  } catch (error) {
                    debugLog('API_TEST_ERROR', 'Error test API', { error });
                    alert('API Test: ERROR - ' + (error instanceof Error ? error.message : String(error)));
                  }
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-sm"
              >
                🧪 Test API Connection
              </button>
            </div>
          )}

          {/* Additional Links */}
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
