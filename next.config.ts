import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Augmente la limite globale pour l'envoi de fichiers lourds
    },
  },
};

export default nextConfig;