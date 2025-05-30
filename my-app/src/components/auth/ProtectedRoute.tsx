"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token, user, isLoading, fetchUser } = useAuth(); // Assuming fetchUser might be needed if token exists but user doesn't
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  useEffect(() => {
    // If still loading auth state, wait.
    if (isLoading) {
      return;
    }

    // If not loading and no token (implies no user), redirect to login.
    // Preserve the intended path for redirection after login.
    if (!token) {
      console.log('ProtectedRoute: No token, redirecting to login. Current path:', pathname);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (token && !user) {
      // If there's a token but no user object, try to fetch the user.
      // This can happen on initial load if token is from localStorage.
      // AuthContext's useEffect might already handle this, but an explicit call can be a safeguard.
      console.log('ProtectedRoute: Token exists, but no user object. Attempting to fetch user.');
      fetchUser().catch(err => {
        // If fetchUser fails (e.g. token invalid), AuthContext's fetchUser should ideally logout.
        // If not, we might need to redirect here too.
        console.error("ProtectedRoute: fetchUser failed, potential need for redirect to login", err);
        // router.replace(`/login?redirect=${encodeURIComponent(pathname)}`); // Consider this if fetchUser doesn't trigger logout on failure
      });
    }
    // If token and user are present, or if token exists and user is being fetched, allow rendering.
    // The main check is !token for redirection. If user fetch fails, AuthContext should clear token.

  }, [token, user, isLoading, router, pathname, fetchUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutralLighter">
        <p className="text-lg text-neutralDark">Loading authentication status...</p>
        {/* Optionally, add a spinner here */}
      </div>
    );
  }

  // If there's no token and we've passed the useEffect (which should have redirected),
  // it might mean the redirect is in progress or there's a slight delay.
  // Rendering null or a minimal loader here can prevent flashing content before redirect.
  if (!token) {
    return (
        <div className="flex items-center justify-center h-screen bg-neutralLighter">
            <p className="text-lg text-neutralDark">Redirecting to login...</p>
        </div>
    );
  }

  // If token exists and user is loaded (or being loaded, as isLoading is false now), render children.
  // If user is null but token exists, fetchUser was called; AuthContext will update user.
  // It's assumed that if fetchUser fails, AuthContext will clear the token, triggering a re-render and redirect.
  return <>{children}</>;
};

export default ProtectedRoute;
