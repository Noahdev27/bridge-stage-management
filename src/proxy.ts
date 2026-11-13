import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Proxy (ex-middleware) : renvoie vers la connexion avant même de rendre une
 * page protégée. Ce n'est qu'une première barrière : chaque page et chaque
 * Server Action revérifient la session et le rôle (voir `shared/auth/guards`),
 * y compris la version de session, que ce fichier ne peut pas contrôler sans
 * interroger la base.
 *
 * Emplacement : `src/proxy.ts`. Avec une application rangée dans `src/`,
 * Next.js ignore un fichier placé à la racine du projet ; c'est ce qui
 * rendait l'ancien `middleware.ts` inopérant.
 */

/**
 * Lecture du JWT de session.
 *
 * Auth.js préfixe le cookie par `__Secure-` en HTTPS et se sert de ce nom
 * comme sel de déchiffrement. Derrière le proxy d'un hébergeur, la requête
 * peut arriver en HTTP alors que le navigateur est en HTTPS : deviner le nom
 * d'après le protocole a déjà provoqué une boucle sur l'écran de connexion.
 * Les deux noms sont donc essayés.
 */
async function readToken(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  return (
    (await getToken({ req: request, secret, secureCookie: true })) ??
    (await getToken({ req: request, secret, secureCookie: false }))
  );
}

/** Pages du back-office accessibles sans session. */
const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/admin/mot-de-passe-oublie"]);

const STAFF_ROLES = new Set(["ADMIN", "RH", "TUTOR"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.has(pathname)) {
    const token = await readToken(request);

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (!STAFF_ROLES.has(String(token.role))) {
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
