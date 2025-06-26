import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Esto desactiva los errores de ESLint en la build
  },
  // Otras opciones que quieras agregar
};

export default nextConfig;
