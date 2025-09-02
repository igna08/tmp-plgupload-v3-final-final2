"use client"; // Added to use usePathname
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthContext";
import FloatingAssetButton from '@/components/layout/FloatingAssetButton';
import { usePathname } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Move metadata outside of component since it's now a client component
const metadata: Metadata = {
  metadataBase: new URL("https://issa-qr.vercel.app"),
  manifest: '/manifest.json',

  title: "ISSA - Sistema de Gestión de QR Escolar",
  description: "Plataforma de gestión de QR para instituciones educativas, facilitando la organización y el control escolar.",
  keywords: [
    "QR",
    "escuela",
    "educación",
    "gestión escolar",
    "control",
    "organización"
  ],
  authors: [{ name: "ISSA" }],
  openGraph: {
    title: "ISSA - Sistema de Gestión de QR Escolar",
    description: "Plataforma de gestión de QR para instituciones educativas, facilitando la organización y el control escolar.",
    url: "https://issa-qr.vercel.app",
    siteName: "ISSA QR",
    images: [
      {
        url: "/foto.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ISSA - Sistema de Gestión de QR Escolar",
    description: "Plataforma de gestión de QR para instituciones educativas, facilitando la organización y el control escolar.",
    images: ["/foto.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  // Define routes where floating button should be hidden
  const authRoutes = ['/login', '/register', '/register/invitation'];
  const isAuthPage = authRoutes.includes(pathname);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutralLighter`}
      >
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
          {/* Only show floating button if not on auth pages */}
          {!isAuthPage && <FloatingAssetButton />}
        </AuthProvider>
      </body>
    </html>
  );
}