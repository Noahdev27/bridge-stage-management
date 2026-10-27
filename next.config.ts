import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 *
 * - frame-ancestors / X-Frame-Options : le back-office ne peut pas être affiché
 *   dans une iframe d'un autre site (détournement de clic).
 * - La CSP reste volontairement limitée aux directives sans risque : restreindre
 *   les scripts demanderait des nonces sur chaque script inline de Next.js.
 * - Permissions-Policy : seule la géolocalisation est utilisée (bouton « Me
 *   localiser »), et uniquement par le site lui-même.
 */
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Les PDF des candidats ne transitent plus par les Server Actions (dépôt
      // direct dans le stockage). Reste la griffe de l'attestation (1 Mo max)
      // et son enveloppe de formulaire : 2 Mo suffisent.
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;