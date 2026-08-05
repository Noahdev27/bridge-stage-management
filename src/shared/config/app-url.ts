import "server-only";

/**
 * URL publique de l'application, pour construire les liens absolus des emails
 * transactionnels (un client mail ne résout pas les chemins relatifs).
 */
export function getAppUrl(): string {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
