// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/shared/auth/auth'; // Vérifie que ton fichier auth.ts est bien ici

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. On protège tout ce qui commence par /admin, sauf le login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const session = await auth();

    // Redirection si non connecté
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // 2. Vérification des rôles (ADMIN et RH autorisés)
    const role = session.user?.role;
    const isAuthorized = role === 'ADMIN' || role === 'RH';

    if (!isAuthorized) {
      // On renvoie les intrus (ex: un utilisateur normal) vers l'accueil
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};