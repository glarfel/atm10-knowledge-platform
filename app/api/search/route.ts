// app/api/search/route.ts
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";

type ModResult = {
  id: number;
  name: string;
  category: string | null;
  summary: string | null;
  sourceUrl: string;
};

function score(mod: ModResult, q: string) {
  const ql = q.toLowerCase();
  const nl = mod.name.toLowerCase();
  const sl = (mod.summary ?? "").toLowerCase();

  // lower score = higher relevance
  if (nl === ql) return 0;
  if (nl.startsWith(ql)) return 1;
  if (nl.includes(ql)) return 2;
  if (sl.includes(ql)) return 3;
  return 9;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "").trim();

  // If nothing to search/filter, return empty result set
  if (!q && !category) {
    return Response.json({ results: [] });
  }

  const results = await prisma.mod.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q } },
                { summary: { contains: q } },
              ],
            }
          : {},
        category ? { category: { equals: category } } : {},
      ],
    },
    take: 100, // grab more, then rank down
    select: {
      id: true,
      name: true,
      category: true,
      summary: true,
      sourceUrl: true,
    },
  });

  // Rank results for better UX
  if (q) {
    results.sort(
      (a, b) =>
        score(a, q) - score(b, q) ||
        a.name.localeCompare(b.name)
    );
  }

  // Return top 50 after ranking
  return Response.json({
    results: results.slice(0, 50),
  });
}
