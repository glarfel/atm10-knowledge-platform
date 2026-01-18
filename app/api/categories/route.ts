export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.mod.findMany({
    select: { category: true },
  });

  const categories = Array.from(
    new Set(rows.map((r) => r.category).filter(Boolean))
  ).sort((a, b) => a!.localeCompare(b!));

  return Response.json({ categories });
}
