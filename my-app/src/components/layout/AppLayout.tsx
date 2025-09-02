'use client';

import { usePathname } from 'next/navigation';
import AppLayout from "@/components/layout/AppLayout";
import FloatingAssetButton from '@/components/layout/FloatingAssetButton';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  
  // Define routes where floating button should be hidden
  const authRoutes = ['/login', '/register', '/register/invitation'];
  const isAuthPage = authRoutes.includes(pathname);

  return (
    <>
      <AppLayout>{children}</AppLayout>
      {/* Only show floating button if not on auth pages */}
      {!isAuthPage && <FloatingAssetButton />}
    </>
  );
}