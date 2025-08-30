import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthContext"; // Added AuthProvider import
import FloatingAssetButton from '@/components/layout/FloatingAssetButton';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ISSA - Sistema de Gestión de QR Escolar",
  description: "Sistema de gestión de QR Escolar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutralLighter`}
      >
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
          <FloatingAssetButton />

        </AuthProvider>
      </body>
    </html>
  );
}
