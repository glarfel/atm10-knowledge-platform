export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const modCount = await prisma.mod.count();

  const categories = await prisma.mod.findMany({
    distinct: ["category"],
    select: { category: true },
    where: { category: { not: null } },
  });

  return Response.json({
    mods: modCount,
    categories: categories.length,
  });
}
