import { NextRequest, NextResponse } from "next/server";
import { runRejectedPurge } from "@/features/demandes-admin/actions";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const result = await runRejectedPurge();
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    purgedCount: result.purgedCount ?? 0,
  });
}
