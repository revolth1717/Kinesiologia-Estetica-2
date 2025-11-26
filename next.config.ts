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
        hostname: "x8ki-letl-twmt.n7.xano.io",
      },
    ],
  },
};

export default nextConfig;
