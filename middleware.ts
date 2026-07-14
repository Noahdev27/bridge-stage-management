import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/shared/auth/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = await auth();

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const role = session.user?.role;
    const isAuthorized = role === "ADMIN" || role === "RH" || role === "TUTOR";

    if (!isAuthorized) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/espace-candidat")) {
    const session = await auth();
    if (!session || session.user?.role !== "CANDIDATE") {
      return NextResponse.redirect(new URL("/candidat/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/espace-candidat/:path*"],
};
