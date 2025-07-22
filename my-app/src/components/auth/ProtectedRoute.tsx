"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ['/auth/register/invitation']; // Podés agregar más rutas públicas aquí

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Verifica si es una ruta pública
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

  const debugLog = (message: string, data?: any) => {
    console.log(`[ProtectedRoute] ${message}`, data || '');
  };

  useEffect(() => {
    debugLog('State changed', {
      pathname,
      hasToken: !!token,
      hasUser: !!user,
      isLoading,
      shouldRedirect,
    });

    if (!isLoading && !isPublicRoute) {
      if (!token) {
        debugLog('No token found, should redirect to login');
        setShouldRedirect(true);
        const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
        debugLog('Redirecting to', redirectUrl);
        router.replace(redirectUrl);
      } else {
        debugLog('Token exists, access granted');
        setShouldRedirect(false);
      }
    }
  }, [token, isLoading, pathname, router, isPublicRoute]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutralLighter">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-neutralDark">Cargando autenticación...</p>
          <p className="text-sm text-neutralTextSecondary mt-2">
            Token: {token ? 'Presente' : 'Ninguno'} | Usuario: {user ? 'Cargado' : 'Ninguno'}
          </p>
        </div>
      </div>
    );
  }

  if (!token && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutralLighter">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-12 w-12 bg-gray-300 mx-auto mb-4"></div>
          <p className="text-lg text-neutralDark">Redirigiendo al login...</p>
          <p className="text-sm text-neutralTextSecondary mt-2">
            No se encontró token de autenticación
          </p>
        </div>
      </div>
    );
  }

  if (token && !user && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutralLighter">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-neutralDark">Cargando datos del usuario...</p>
          <p className="text-sm text-neutralTextSecondary mt-2">
            Autenticación verificada, obteniendo perfil...
          </p>
        </div>
      </div>
    );
  }

  debugLog('Rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;