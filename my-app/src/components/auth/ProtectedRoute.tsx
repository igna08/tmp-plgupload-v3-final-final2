"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = [
  '/auth/register/invitation',
  '/public', // Rutas que empiecen con /public
  // Podés agregar más rutas públicas aquí
];

// Archivos estáticos y rutas especiales que no deben ser protegidos
const STATIC_FILES_PATTERNS = [
  '/.well-known', // Para archivos como assetlinks.json, apple-app-site-association, etc.
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  // Agrega más patrones según necesites
];

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Verifica si es una ruta pública o archivo estático
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route)) ||
                       STATIC_FILES_PATTERNS.some((pattern) => pathname?.includes(pattern)) ||
                       pathname?.includes('.json') || // Para archivos JSON específicos
                       pathname?.includes('.xml') ||  // Para archivos XML
                       pathname?.includes('.txt');    // Para archivos de texto

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
      isPublicRoute, // Agregado para debug
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
    } else if (isPublicRoute) {
      debugLog('Public route accessed, no authentication required');
    }
  }, [token, isLoading, pathname, router, isPublicRoute]);

  if (isLoading && !isPublicRoute) {
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

  debugLog('Rendering content', { isPublic: isPublicRoute });
  return <>{children}</>;
};

export default ProtectedRoute;