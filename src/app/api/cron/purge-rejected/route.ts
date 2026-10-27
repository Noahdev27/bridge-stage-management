import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runRejectedPurge } from "@/features/demandes-admin/purge";
import { SYSTEM_ACTOR, recordAudit } from "@/shared/audit/audit";
import { purgeStaleUploads } from "@/shared/storage/supabase";
import { purgeExpiredRateLimits } from "@/shared/security/rate-limit";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const { purgedCount } = await runRejectedPurge();

    // Une passe sans effet n'est pas consignée : le cron tourne chaque nuit et
    // noierait le journal sous des entrées vides.
    if (purgedCount > 0) {
      await recordAudit(SYSTEM_ACTOR, {
        action: "request.purged",
        summary: `Purge automatique : ${purgedCount} dossier(s) rejeté(s) supprimé(s)`,
        metadata: { purgedCount, trigger: "cron" },
      });
    }

    // Entretien : dépôts de dossiers abandonnés en cours de route, et
    // compteurs de limitation dont la fenêtre est close. Un échec ici ne doit
    // pas faire échouer la purge RGPD, déjà effectuée.
    const [staleUploads, expiredLimits] = await Promise.all([
      purgeStaleUploads().catch((error) => {
        console.error("[cron] Nettoyage des dépôts abandonnés:", error);
        return 0;
      }),
      purgeExpiredRateLimits().catch((error) => {
        console.error("[cron] Nettoyage des compteurs:", error);
        return 0;
      }),
    ]);

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      purgedCount,
      staleUploads,
      expiredLimits,
    });
  } catch (error) {
    console.error("[cron] Erreur exécution purge RGPD:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la purge des dossiers." },
      { status: 500 }
    );
  }
}
