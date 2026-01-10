import "dotenv/config";

import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import * as cheerio from "cheerio";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

// Starter source (mod list page)
const SOURCE_URL =
  "https://www.minecraft-guides.com/wiki/all-the-mods-10/atm-10-mod-list/";

async function main() {
  console.log("Fetching:", SOURCE_URL);

  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();

  const $ = cheerio.load(html);

  // First-pass extraction (we'll clean this next)
  const candidates = new Set();

  $("li, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length >= 3 && text.length <= 80) candidates.add(text);
  });

  const modNames = [...candidates]
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => !s.toLowerCase().includes("all the mods"))
    .slice(0, 300);

  console.log(`Found ~${modNames.length} candidates. Saving...`);

  let saved = 0;
  for (const name of modNames) {
    await prisma.mod.upsert({
      where: { name },
      update: { sourceUrl: SOURCE_URL },
      create: { name, sourceUrl: SOURCE_URL },
    });
    saved++;
  }

  console.log("Saved:", saved);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
