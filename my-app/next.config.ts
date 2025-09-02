import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",          // dónde guarda el service worker
  register: true,          // registra automáticamente el SW
  skipWaiting: true,       // actualiza sin esperar
  disable: process.env.NODE_ENV === "development", // desactiva en dev
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // no corta la build por ESLint
  },
  reactStrictMode: true,
  swcMinify: true,
};

export default withPWA(nextConfig);
