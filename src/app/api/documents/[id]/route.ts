import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { AuthorizationError, requireStaff } from "@/shared/auth/guards";
import {
  createSignedUrl,
  extractStoragePathFromUrl,
} from "@/shared/storage/supabase";

/**
 * Lecture d'un document de candidature.
 *
 * L'accès aux pièces jointes est réservé au back-office authentifié : la route
 * signe une URL Supabase de courte durée à la demande, plutôt que d'exposer une
 * URL permanente stockée en base (qui finirait par expirer côté RH).
 * Un tuteur ne voit que les dossiers qui lui sont affectés.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireStaff();
    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        url: true,
        storagePath: true,
        request: { select: { tutorId: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
    }

    if (user.role === "TUTOR" && document.request.tutorId !== user.id) {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    // Les documents créés avant le stockage du chemin n'ont que leur URL signée.
    const storagePath =
      document.storagePath ?? extractStoragePathFromUrl(document.url);

    if (!storagePath) {
      return NextResponse.json(
        { error: "Chemin du document introuvable." },
        { status: 404 }
      );
    }

    const signedUrl = await createSignedUrl(storagePath);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 401 });
    }
    console.error("[documents] Erreur lors de la lecture du document:", error);
    return NextResponse.json(
      { error: "Impossible d'ouvrir le document." },
      { status: 500 }
    );
  }
}
