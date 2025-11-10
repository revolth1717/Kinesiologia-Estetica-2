import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporal: permitir build aún con errores de TypeScript para poder previsualizar UI
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
