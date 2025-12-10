import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporal: permitir build aún con errores de TypeScript para poder previsualizar UI
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "x1xv-egpg-1mua.b2.xano.io",
      },
    ],
  },
};

export default nextConfig;
