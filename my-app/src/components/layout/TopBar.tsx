"use client"; // Required for useAuth hook (which uses useContext)

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button'; // Using the existing Button component for logout
import Link from 'next/link';

const TopBar: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="h-[56px] bg-white shadow-sm flex items-center justify-between px-4 md:px-6">
      {/* Left: Logo */}
      <div className="text-lg font-semibold text-neutralDark">
        <Link href="/">AppLogo</Link> {/* Assuming clicking logo goes to dashboard/home */}
      </div>

      {/* Center: Search (Optional) */}
      <div className="hidden md:flex flex-grow justify-center items-center px-4">
        <input
          type="text"
          placeholder="Search..."
          disabled // Kept disabled as per original placeholder
          className="w-full max-w-md h-9 px-3 rounded-radiusSmall border border-neutralLight bg-neutralLightest text-sm"
        />
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Placeholder for Notifications Icon - kept original SVG */}
        <div className="text-neutralTextSecondary hover:text-neutralDark cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center">
          {isLoading && !user ? ( // Show loading only if user is not yet available
            <div className="text-sm text-neutralTextSecondary">Loading user...</div>
          ) : user ? (
            <div className="flex items-center space-x-2 md:space-x-3">
              <span className="text-sm text-neutralDark font-medium hidden sm:inline">
                {user.full_name || user.email}
              </span>
              {/* User Icon - can be replaced with an avatar later */}
              <div className="w-7 h-7 rounded-full bg-shopifyGreen flex items-center justify-center text-white text-xs font-semibold sm:hidden md:flex">
                {user.full_name ? user.full_name.substring(0, 1).toUpperCase() : (user.email ? user.email.substring(0,1).toUpperCase() : '?')}
              </div>
              <Button
                variant="secondary"
                size="small"
                onClick={logout}
                className="!px-2 !py-1 md:!px-3 md:!py-1.5" // More compact for top bar
              >
                Logout
              </Button>
            </div>
          ) : (
            // Fallback if not loading and no user (e.g., error or not logged in)
            // The AuthContext's logout should redirect to /login, so this might only be briefly visible
            // or if the user manually clears localStorage and visits a protected page.
            <Link href="/login">
              <Button variant="primary" size="small">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
