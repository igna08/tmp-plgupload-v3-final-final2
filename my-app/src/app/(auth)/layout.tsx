// CRC/App/(out)/layout.tsx


import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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

export default function OutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>; // Layout vacío, no renderiza layout principal
}
