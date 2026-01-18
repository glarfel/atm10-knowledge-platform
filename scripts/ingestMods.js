// scripts/ingestMods.js
// Parse the ATM10 mod list page tables (MOD NAME + SUMMARY) and store into SQLite via Prisma (Prisma 7 + better-sqlite3 adapter).

import "dotenv/config";

import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as cheerio from "cheerio";

const SOURCE_URL =
  "https://www.minecraft-guides.com/wiki/all-the-mods-10/atm-10-mod-list/";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

function norm(s) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function isModSummaryTable($, tableEl) {
  // Determine if a table is the mod list table by checking its header cells.
  const headers = [];
  $(tableEl)
    .find("tr")
    .first()
    .find("th,td")
    .each((_, cell) => headers.push(norm($(cell).text()).toLowerCase()));

  // We want a table whose first row looks like: "MOD NAME" and "SUMMARY"
  const hasModName = headers.some((h) => h.includes("mod name"));
  const hasSummary = headers.some((h) => h.includes("summary"));
  return hasModName && hasSummary;
}

function extractRows($, tableEl) {
  const rows = [];

  $(tableEl)
    .find("tr")
    .slice(1) // skip header
    .each((_, tr) => {
      const cells = [];
      $(tr)
        .find("td")
        .each((__, td) => cells.push(norm($(td).text())));

      if (cells.length < 2) return;

      const name = cells[0];
      const summary = cells.slice(1).join(" ").trim();

      // 🔒 FILTER HERE (correct place)
      if (!name) return;
      if (!summary) return;
      if (summary.toLowerCase() === "null") return;

      rows.push({ name, summary });
    });

  return rows;
}

async function main() {
  console.log("Fetching:", SOURCE_URL);

  // Clean up any old junk rows from earlier scraping attempts for this same source
await prisma.mod.deleteMany({
  where: {
    sourceUrl: SOURCE_URL,
    OR: [{ category: null }, { summary: null }],
  },
});

  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();

  const $ = cheerio.load(html);

  // Try common "main content" containers first so we don't grab nav/footer tables.
  const content =
    $("article").first().length
      ? $("article").first()
      : $(".entry-content").first().length
        ? $(".entry-content").first()
        : $("main").first().length
          ? $("main").first()
          : $.root();

  // Categories are h2 headings on the page (e.g., "API & Library", "Biomes & Dimensions", etc.)
  const categories = [];
  content.find("h2").each((_, h2) => {
    const title = norm($(h2).text());
    if (!title) return;

    // Skip generic / page title repeats
    const lower = title.toLowerCase();
    if (
      lower.includes("all the mods") ||
      lower === "contents" ||
      lower === "share"
    ) {
      return;
    }

    categories.push({ title, el: h2 });
  });

  console.log(`Found ${categories.length} h2 category headings.`);
  console.log("Category sample:", categories.slice(0, 10).map((c) => c.title));

  let totalFound = 0;
  let totalSaved = 0;

  for (const cat of categories) {
    const categoryTitle = cat.title;

    // Starting from the category h2, walk forward through siblings
    // until the next h2 appears. Collect mod summary tables in that region.
    const regionEls = [];
    let cur = $(cat.el).next();

    while (cur.length) {
      if (cur.is("h2")) break;
      regionEls.push(cur);
      cur = cur.next();
    }

    // Search tables within the region
    const tables = [];
    for (const el of regionEls) {
      el.find("table").each((_, t) => tables.push(t));
      if (el.is("table")) tables.push(el.get(0));
    }

    const modTables = tables.filter((t) => isModSummaryTable($, t));
    if (modTables.length === 0) continue;

    let categoryMods = [];
    for (const t of modTables) {
      const rows = extractRows($, t);
      categoryMods.push(...rows);
    }

    // Dedup within category by name
    const seen = new Set();
    categoryMods = categoryMods.filter((m) => {
      const key = m.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    totalFound += categoryMods.length;

    console.log(
      `\n[${categoryTitle}] found ${categoryMods.length} mods (sample: ${categoryMods
        .slice(0, 6)
        .map((m) => m.name)
        .join(", ")})`
    );

    // Upsert to DB
    for (const m of categoryMods) {
      await prisma.mod.upsert({
        where: { name: m.name },
        update: {
          category: categoryTitle,
          summary: m.summary,
          sourceUrl: SOURCE_URL,
        },
        create: {
          name: m.name,
          category: categoryTitle,
          summary: m.summary,
          sourceUrl: SOURCE_URL,
        },
      });
      totalSaved++;
    }
  }

  console.log("\nDone.");
  console.log("Total mods parsed:", totalFound);
  console.log("Total upserted:", totalSaved);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
