"use client";

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { 
  User, 
  Lock, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  UserPlus,
  Wifi,
  WifiOff,
  Mail,
  UserCheck
} from 'lucide-react';

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

interface ApiError {
  detail: string | Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

interface RegisterResponse {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
}

// Component that uses useSearchParams wrapped in Suspense
const RegisterInvitationForm: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [isInviteMode, setIsInviteMode] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [logoError, setLogoError] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Verificar si es un registro por invitación
  useEffect(() => {
    console.log('=== INICIALIZANDO PÁGINA ===');
    console.log('URL actual:', window.location.href);
    console.log('SearchParams disponibles:', Array.from(searchParams.entries()));
    
    const timer = setTimeout(() => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');
      
      console.log('Parámetros extraídos:');
      console.log('- token:', token);
      console.log('- email:', email);
      
      // Si hay token, es modo invitación (el email es opcional)
      if (token) {
        console.log('Configurando modo INVITACIÓN (token encontrado)');
        setIsInviteMode(true);
        setInviteToken(token);
        // El email puede ser opcional si viene desde la invitación
        if (email) {
          setInviteEmail(email);
        }
      } else {
        console.log('Configurando modo NORMAL (sin token)');
        setIsInviteMode(false);
      }
      
      setPageLoaded(true);
      console.log('Página cargada completamente');
    }, 100);

    return () => clearTimeout(timer);
  }, [searchParams]);

  // Efecto para el countdown de redirección
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (redirectCountdown !== null && redirectCountdown > 0) {
      interval = setInterval(() => {
        setRedirectCountdown(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    } else if (redirectCountdown === 0) {
      router.push('/login');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [redirectCountdown, router]);

  const validateForm = (): string | null => {
    console.log('=== VALIDANDO FORMULARIO ===');
    
    if (!fullName.trim()) {
      console.log('Error: Nombre vacío');
      return 'El nombre completo es requerido';
    }
    
    if (fullName.trim().length < 2) {
      console.log('Error: Nombre muy corto');
      return 'El nombre debe tener al menos 2 caracteres';
    }

    if (!password) {
      console.log('Error: Password vacío');
      return 'La contraseña es requerida';
    }

    if (password.length < 8) {
      console.log('Error: Password muy corto');
      return 'La contraseña debe tener al menos 8 caracteres';
    }

    if (password !== confirmPassword) {
      console.log('Error: Passwords no coinciden');
      return 'Las contraseñas no coinciden';
    }

    if (isInviteMode && !inviteToken) {
      console.log('Error: Token de invitación vacío en modo invitación');
      return 'Token de invitación no válido';
    }

    console.log('Validación: TODOS LOS CAMPOS VÁLIDOS');
    return null;
  };

  const parseApiError = (error: any): string => {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      
      if (typeof detail === 'string') {
        // Mensajes específicos para errores comunes
        if (detail.includes('already exists')) {
          return 'Esta invitación ya ha sido utilizada o el usuario ya existe';
        }
        if (detail.includes('token') || detail.includes('invitation')) {
          return 'El enlace de invitación ha expirado o no es válido';
        }
        if (detail.includes('suspended')) {
          return 'Esta cuenta ha sido suspendida. Contacta al administrador';
        }
        return detail;
      }
      
      if (Array.isArray(detail)) {
        const errorMessages = detail.map((item: any) => {
          if (item.loc?.includes('password')) {
            return 'La contraseña debe tener al menos 8 caracteres';
          }
          if (item.loc?.includes('full_name')) {
            return 'El nombre completo es requerido y debe ser válido';
          }
          if (item.loc?.includes('invitation_token')) {
            return 'El token de invitación es requerido y debe ser válido';
          }
          return item.msg || 'Error en los datos ingresados';
        });
        return errorMessages.join(', ');
      }
    }

    // Errores por código de estado
    if (error.response?.status === 400) {
      return 'Los datos proporcionados no son válidos';
    }
    if (error.response?.status === 422) {
      return 'Por favor verifica que todos los campos estén completos y correctos';
    }
    if (error.response?.status >= 500) {
      return 'Error del servidor. Intenta nuevamente en unos momentos';
    }
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return 'Error de conexión. Verifica tu conexión a internet';
    }

    return 'Ocurrió un error inesperado. Por favor intenta nuevamente';
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Check if online before attempting registration
    if (!navigator.onLine) {
      setError('No hay conexión a internet. Por favor, verifica tu conexión e inténtalo de nuevo.');
      return;
    }

    setError(null);
    setSuccessMessage(null);

    console.log('=== INICIO DEL PROCESO DE REGISTRO ===');
    console.log('Estado actual:');
    console.log('- fullName:', fullName);
    console.log('- password length:', password.length);
    console.log('- confirmPassword length:', confirmPassword.length);
    console.log('- isInviteMode:', isInviteMode);
    console.log('- inviteToken:', inviteToken);
    console.log('- inviteEmail:', inviteEmail);

    // Validación del formulario
    const validationError = validateForm();
    if (validationError) {
      console.log('Error de validación:', validationError);
      setError(validationError);
      return;
    }

    console.log('Validación del formulario: PASÓ');
    setIsLoading(true);

    try {
      let requestData;
      let endpoint;

      if (isInviteMode) {
        // Registro por invitación - exactamente como tu ejemplo
        requestData = {
          full_name: fullName.trim(),
          password: password,
          invitation_token: inviteToken
        };
        endpoint = `${API_BASE_URL}/auth/register/invitation`;
        
        console.log('Modo INVITACIÓN detectado');
        console.log('Endpoint:', endpoint);
        console.log('Request data (sin password):', {
          full_name: requestData.full_name,
          invitation_token: requestData.invitation_token,
          password: `[${password.length} caracteres]`
        });
      } else {
        // Para registro normal, mostrar error ya que necesitamos un email
        console.log('Modo NORMAL detectado - No implementado');
        setError('Esta página solo funciona con enlaces de invitación. Por favor use un enlace de invitación válido.');
        setIsLoading(false);
        return;
      }

      console.log('=== ENVIANDO PETICIÓN ===');
      console.log('URL completa:', endpoint);
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      const response = await axios.post<RegisterResponse>(endpoint, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      console.log('=== RESPUESTA RECIBIDA ===');
      console.log('Status:', response.status);
      console.log('Data:', response.data);

      // Verificar respuesta exitosa
      if (response.status === 201 && response.data) {
        console.log('Registro exitoso!');
        setSuccessMessage('¡Registro completado exitosamente! Tu cuenta ha sido activada.');
        
        // Limpiar el formulario
        setFullName('');
        setPassword('');
        setConfirmPassword('');
        
        // Iniciar countdown de 3 segundos para redirección
        setRedirectCountdown(3);
      } else {
        console.log('Respuesta inesperada:', response);
        setError('Respuesta inesperada del servidor');
      }

    } catch (err: any) {
      console.log('=== ERROR EN LA PETICIÓN ===');
      console.error('Error completo:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      console.error('Response headers:', err.response?.headers);
      console.error('Request config:', err.config);
      
      const errorMessage = parseApiError(err);
      console.log('Error parseado:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('=== FIN DEL PROCESO ===');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleManualLogin = () => {
    router.push('/login');
  };

  const handleLogoError = () => {
    setLogoError(true);
  };

  // Mostrar loading solo mientras se determina el modo
  if (!pageLoaded) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-50 shadow-2xl rounded-2xl px-8 py-10 sm:px-12 border border-gray-100">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-600 font-medium">Cargando página de registro...</p>
            </div>
          </div>
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
                src="https://app-web-final-qr.vercel.app/logo.png"
                alt="Logo del Sistema"
                className="h-24 w-auto max-w-full"
                onError={handleLogoError}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                <UserCheck className="h-10 w-10 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {isInviteMode ? 'Completar Registro' : 'Crear Cuenta'}
          </h1>
          <p className="text-base text-gray-600 mb-4">
            {isInviteMode 
              ? `Complete los datos para finalizar su registro${inviteEmail ? ` (${inviteEmail})` : ''}` 
              : 'Únete a nuestro sistema educativo'
            }
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

          {/* Invitation Email Display */}
          {isInviteMode && inviteEmail && (
            <div className="mt-4 flex items-center justify-center">
              <div className="flex items-center text-blue-600 text-sm bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                <Mail className="h-4 w-4 mr-2" />
                <span className="font-medium">{inviteEmail}</span>
              </div>
            </div>
          )}
        </div>

        {/* Registration Form Card */}
        <div className="bg-gray-50 shadow-2xl rounded-2xl px-8 py-10 sm:px-12 border border-gray-100">
          {/* Success Message */}
          {successMessage && !error && (
            <div className="mb-8 bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-700 font-medium">
                  {successMessage}
                </div>
              </div>
              
              {redirectCountdown !== null && redirectCountdown > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-green-600 mb-2">
                    Redirigiendo en {redirectCountdown} segundo{redirectCountdown !== 1 ? 's' : ''}...
                  </p>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${((3 - redirectCountdown) / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <Button 
                  onClick={handleManualLogin}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Ir al Inicio de Sesión
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700 font-medium">
                  {error}
                </div>
              </div>
            </div>
          )}

          {/* Offline Warning */}
          {!isOnline && (
            <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex">
                <WifiOff className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700 font-medium">
                  Sin conexión a internet. Verifica tu conexión para continuar.
                </div>
              </div>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-3">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
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
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
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
                <p className="mt-1 text-xs text-gray-500 font-medium">
                  Usa al menos 8 caracteres con letras y números
                </p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-3">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu contraseña"
                    disabled={isLoading || !isOnline}
                    className="pl-12 pr-14 block w-full bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base py-4 transition-all duration-200 hover:border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    disabled={isLoading || !isOnline}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || !isOnline || !fullName || !password || !confirmPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-4 focus:ring-blue-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Completando registro...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-5 w-5" />
                      <span>Completar Registro</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Login Link - Solo mostrar si no es modo invitación */}
          {!isInviteMode && (
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50 text-gray-500 font-medium">¿Ya tienes cuenta?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline transition-colors">
                  Inicia sesión aquí
                </Link>
              </div>
            </div>
          )}
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
const RegisterInvitationLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-gray-50 shadow-2xl rounded-2xl px-8 py-10 sm:px-12 border border-gray-100">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-600 font-medium">Cargando página de registro...</p>
        </div>
      </div>
    </div>
  </div>
);

// Main component with Suspense boundary
const RegisterInvitationPage: React.FC = () => {
  return (
    <Suspense fallback={<RegisterInvitationLoadingFallback />}>
      <RegisterInvitationForm />
    </Suspense>
  );
};

export default RegisterInvitationPage;