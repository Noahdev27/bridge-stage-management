import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Décodage direct du JWT (sans passer par `auth()`) pour éviter d'embarquer
 * Prisma + bcryptjs dans le bundle Edge du middleware, qui dépasse sinon la
 * limite de 1 Mo du plan gratuit Vercel.
 */
/**
 * Auth.js prefixe le cookie de session par `__Secure-` en HTTPS, et se sert de
 * ce nom comme salt pour deriver la cle de dechiffrement du JWT. Sans ce
 * parametre, `getToken` cherche le cookie non prefixe avec le mauvais salt :
 * il fonctionne en local (HTTP) et renvoie `null` en production (HTTPS), ce qui
 * boucle indefiniment sur l'ecran de connexion.
 */
function readToken(request: NextRequest) {
  return getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = await readToken(request);

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const role = token.role;
    const isAuthorized = role === "ADMIN" || role === "RH" || role === "TUTOR";

    if (!isAuthorized) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/espace-candidat")) {
    const token = await readToken(request);
    if (!token || token.role !== "CANDIDATE") {
      return NextResponse.redirect(new URL("/candidat/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/espace-candidat/:path*"],
};
