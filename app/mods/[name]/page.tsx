export const runtime = "nodejs";

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ModPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: encodedName } = await params;
  const name = decodeURIComponent(encodedName);

  const mod = await prisma.mod.findUnique({
    where: { name },
    select: {
      name: true,
      category: true,
      summary: true,
      sourceUrl: true,
      updatedAt: true,
    },
  });

  if (!mod) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <p style={{ marginTop: 0 }}>Mod not found: {name}</p>
        <Link href="/" style={{ textDecoration: "none" }}>
          ← Back
        </Link>
      </main>
    );
  }

  const related = mod.category
    ? await prisma.mod.findMany({
        where: { category: mod.category, NOT: { name: mod.name } },
        orderBy: { name: "asc" },
        take: 12,
        select: { name: true },
      })
    : [];

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <Link href="/" style={{ textDecoration: "none" }}>
        ← Back
      </Link>

      <h1 style={{ marginBottom: 6 }}>{mod.name}</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Category: {mod.category ?? "Uncategorized"}
      </p>

      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Summary</h3>
        <p style={{ marginBottom: 0 }}>
          {mod.summary ?? "No summary available."}
        </p>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href={mod.sourceUrl} target="_blank" rel="noreferrer">
          View source
        </a>
        <span style={{ opacity: 0.7 }}>
          Updated: {mod.updatedAt.toLocaleString()}
        </span>
      </div>

      {related.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ marginBottom: 10 }}>Related in {mod.category}</h3>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {related.map((r) => (
              <li key={r.name} style={{ marginBottom: 6 }}>
                <Link href={`/mods/${encodeURIComponent(r.name)}`}>
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
