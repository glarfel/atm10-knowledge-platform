// app/api/search/route.ts
export const runtime = "nodejs";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "").trim();

  if (!q && !category) {
    return Response.json({ results: [] });
  }

  const results = await prisma.mod.findMany({
    where: {
      AND: [
        q
          ? { name: { contains: q } } : {},
        category ? { category: { equals: category } } : {},
      ],
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    take: 50,
    select: {
      id: true,
      name: true,
      category: true,
      summary: true,
      sourceUrl: true,
    },
  });

  return Response.json({ results });
}
