"use client"; // Required for usePathname
import React from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  
  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };
  
  // Close mobile sidebar when pathname changes
  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);
  
  // Define routes that are authentication pages
  const authRoutes = ['/login', '/register', '/register/invitation'];
  const isAuthPage = authRoutes.includes(pathname);
  
  // Layout for authentication pages (no Sidebar, TopBar or ProtectedRoute)
  if (isAuthPage) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-neutralLighter">
        {children}
      </main>
    );
  }
  
  // Layout for all other pages
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-neutralLighter">
        {/* Sidebar */}
        <Sidebar isMobileOpen={isMobileSidebarOpen} />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TopBar */}
          <TopBar
            onMobileMenuToggle={toggleMobileSidebar}
            isMobileMenuOpen={isMobileSidebarOpen}
          />
          
          {/* Page content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutralLighter p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AppLayout;