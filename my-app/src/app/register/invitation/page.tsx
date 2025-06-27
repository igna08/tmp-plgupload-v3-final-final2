"use client";

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';

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
const RegisterForm: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [isInviteMode, setIsInviteMode] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

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

    // El email no es requerido si viene solo el token
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

  const handleManualLogin = () => {
    router.push('/login');
  };

  // Mostrar loading solo mientras se determina el modo
  if (!pageLoaded) {
    return (
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-radiusLarge">
        <div className="flex flex-col items-center justify-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-shopifyGreen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-neutralTextSecondary">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-radiusLarge">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutralDarker">
          {isInviteMode ? 'Completar Registro' : 'Crear Cuenta'}
        </h1>
        <p className="mt-2 text-sm text-neutralTextSecondary">
          {isInviteMode 
            ? `Complete los datos para finalizar su registro${inviteEmail ? ` (${inviteEmail})` : ''}` 
            : 'Únete para acceder a todas las funcionalidades'
          }
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-shopifyGreen rounded-radiusSmall text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-shopifyGreen mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-shopifyGreen">¡Registro Completado!</p>
          </div>
          <p className="text-sm text-shopifyGreen mb-3">{successMessage}</p>
          
          {redirectCountdown !== null && redirectCountdown > 0 && (
            <div className="mb-3">
              <p className="text-xs text-neutralTextSecondary">
                Redirigiendo en {redirectCountdown} segundo{redirectCountdown !== 1 ? 's' : ''}...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div 
                  className="bg-shopifyGreen h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${((3 - redirectCountdown) / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <Button 
            variant="primary" 
            size="small"
            onClick={handleManualLogin}
            className="w-full"
          >
            Ir al Inicio de Sesión
          </Button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-accentRed rounded-radiusSmall">
          <div className="flex items-start">
            <svg className="w-4 h-4 text-accentRed mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-accentRed">{error}</p>
          </div>
        </div>
      )}

      {!successMessage && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-neutralDark mb-2">
              Nombre Completo *
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ingresa tu nombre completo"
              disabled={isLoading}
              className="transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutralDark mb-2">
              Contraseña *
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              disabled={isLoading}
              className="transition-all duration-200"
            />
            <p className="mt-1 text-xs text-neutralTextSecondary">
              Usa al menos 8 caracteres con letras y números
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutralDark mb-2">
              Confirmar Contraseña *
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirma tu contraseña"
              disabled={isLoading}
              className="transition-all duration-200"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full transition-all duration-200"
              disabled={isLoading}
              size="large"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isInviteMode ? 'Completando registro...' : 'Creando cuenta...'}
                </div>
              ) : (
                isInviteMode ? 'Completar Registro' : 'Crear Cuenta'
              )}
            </Button>
          </div>
        </form>
      )}

      {!isInviteMode && (
        <div className="text-sm text-center text-neutralTextSecondary border-t pt-4">
          ¿Ya tienes una cuenta?{' '}
          <Link 
            href="/login" 
            className="font-medium text-shopifyGreen hover:text-green-700 transition-colors duration-200"
          >
            Inicia sesión aquí
          </Link>
        </div>
      )}
    </div>
  );
};

// Loading component for Suspense fallback
const RegisterLoadingFallback: React.FC = () => (
  <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-radiusLarge">
    <div className="flex flex-col items-center justify-center space-y-4">
      <svg className="animate-spin h-8 w-8 text-shopifyGreen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-sm text-neutralTextSecondary">Cargando página de registro...</p>
    </div>
  </div>
);

// Main component with Suspense boundary
const RegisterPage: React.FC = () => {
  return (
    <Suspense fallback={<RegisterLoadingFallback />}>
      <RegisterForm />
    </Suspense>
  );
};

export default RegisterPage;