import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runRejectedPurge } from "@/features/demandes-admin/purge";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const { purgedCount } = await runRejectedPurge();
    revalidatePath("/admin");

    return NextResponse.json({ success: true, purgedCount });
  } catch (error) {
    console.error("[cron] Erreur exécution purge RGPD:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la purge des dossiers." },
      { status: 500 }
    );
  }
}
