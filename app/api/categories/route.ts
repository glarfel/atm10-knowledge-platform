import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const mods = await prisma.mod.count();

    // Get distinct non-null categories
    const rows = await prisma.mod.findMany({
      where: { category: { not: null } },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });

    const categoryList = rows
      .map((r) => r.category)
      .filter((c): c is string => typeof c === "string" && c.trim().length > 0);

    return Response.json({
      mods,
      categories: categoryList,          // ✅ array for the dropdown
      categoryCount: categoryList.length // ✅ count if you want it
    });
  } catch (e: any) {
    console.error("GET /api/categories failed:", e);
    return Response.json(
      { mods: 0, categories: [], categoryCount: 0, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
