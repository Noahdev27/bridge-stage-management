import { prisma } from "@/shared/db/prisma";

export async function getAllTutorsWithCounts() {
  try {
    return await prisma.user.findMany({
      where: { role: "TUTOR" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { tutoredRequests: true } },
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });
  } catch (error) {
    console.error("[tuteurs] Erreur lecture tuteurs:", error);
    return [];
  }
}

export async function getTutorById(id: string) {
  try {
    return await prisma.user.findFirst({
      where: { id, role: "TUTOR" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { tutoredRequests: true } },
      },
    });
  } catch (error) {
    console.error(`[tuteurs] Erreur lecture tuteur ${id}:`, error);
    return null;
  }
}
