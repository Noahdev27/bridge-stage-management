import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Décodage direct du JWT (sans passer par `auth()`) pour éviter d'embarquer
 * Prisma + bcryptjs dans le bundle Edge du middleware, qui dépasse sinon la
 * limite de 1 Mo du plan gratuit Vercel.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

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
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token || token.role !== "CANDIDATE") {
      return NextResponse.redirect(new URL("/candidat/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/espace-candidat/:path*"],
};
