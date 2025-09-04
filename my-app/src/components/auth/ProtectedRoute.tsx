"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = [
  "/auth/register/invitation",
  "/public",
  "login",
  "/register",
];

const STATIC_FILES_PATTERNS = [
  "/.well-known",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
];

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [readyToRender, setReadyToRender] = useState(false);

  const isPublicRoute =
    PUBLIC_ROUTES.some((route) => pathname?.startsWith(route)) ||
    STATIC_FILES_PATTERNS.some((pattern) => pathname?.includes(pattern)) ||
    pathname?.includes(".json") ||
    pathname?.includes(".xml") ||
    pathname?.includes(".txt");

  useEffect(() => {
    if (!isLoading && !isPublicRoute) {
      if (!token) {
        const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
        // ⚠️ Ejecutar en el próximo tick para evitar "NextRouter not mounted"
        setTimeout(() => {
          router.replace(redirectUrl);
        }, 0);
      } else {
        setReadyToRender(true);
      }
    } else {
      // Rutas públicas siempre renderizan
      setReadyToRender(true);
    }
  }, [token, isLoading, pathname, router, isPublicRoute]);

  if (isLoading && !isPublicRoute) {
    return <div>Cargando autenticación...</div>;
  }

  if (!readyToRender) {
    return <div>Preparando redirección...</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
