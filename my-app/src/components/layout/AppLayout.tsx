"use client"; // Required for usePathname

import React from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute'; // Import the new component

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  // Mobile sidebar state management
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Function to toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  // Close mobile sidebar when pathname changes
  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  const authRoutes = ['/login', '/register', '/register/invitation'];
  const isAuthPage = authRoutes.includes(pathname);

  if (isAuthPage) {
    // For auth pages (login, register, register/invitation), render children in a simple centered layout
    // This ensures they don't get the Sidebar/TopBar or the ProtectedRoute wrapper.
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-neutralLighter">
        {children}
      </main>
    );
  }

  // For all other pages, apply ProtectedRoute and the main app shell (Sidebar, TopBar)
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-neutralLighter">
        <Sidebar 
          isMobileOpen={isMobileSidebarOpen} 
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            onMobileMenuToggle={toggleMobileSidebar}
            isMobileMenuOpen={isMobileSidebarOpen}
          />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutralLighter p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AppLayout;