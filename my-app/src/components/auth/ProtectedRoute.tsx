"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token, isLoading } = useAuth(); // Removed 'user' and 'fetchUser'
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      return; // Wait until authentication status is resolved
    }

    if (!token) {
      // If authentication is resolved (isLoading is false) and there's no token,
      // redirect to login.
      console.log('ProtectedRoute: No token after loading, redirecting to login. Current path:', pathname);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    // If token exists, AuthContext should have ensured 'user' is populated
    // or cleared the token if it was invalid (which would trigger the !token condition above in a subsequent render).
  }, [token, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutralLighter">
        <p className="text-lg text-neutralDark">Loading authentication status...</p>
        {/* Optionally, add a spinner here */}
      </div>
    );
  }

  if (!token) {
    // This case handles the very brief moment before redirection or if useEffect hasn't run yet post-loading.
    // Or, if for some reason, the redirect didn't happen immediately, this prevents rendering children.
    return (
      <div className="flex items-center justify-center h-screen bg-neutralLighter">
        <p className="text-lg text-neutralDark">Redirecting to login...</p>
      </div>
    );
  }

  // If loading is complete and token exists, render the protected content.
  return <>{children}</>;
};

export default ProtectedRoute;
