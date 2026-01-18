import "dotenv/config";

import pkg from "@prisma/client";
const { PrismaClient } = pkg;

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const SOURCE_URL =
  "https://www.minecraft-guides.com/wiki/all-the-mods-10/atm-10-mod-list/";

// Obvious non-mod strings we saw in your table dump
const BAD_EXACT = [
  "Mod Lists",
  "Mods",
  "Servers",
  "Wiki",
  "Minecraft Guides",
  "Font ResizerAa",
  "Email",
  "Facebook",
  "Print",
  "Guides",
  "You Might Also Like",
  "PRIVACY POLICY",
  "All the Mods 10",
  "Lost your password?",
];

async function main() {
  // 1) Delete anything that has no category OR no summary (these came from link-scrape attempts)
  // but ONLY for this source URL (so we don't accidentally wipe future sources)
  const r1 = await prisma.mod.deleteMany({
    where: {
      sourceUrl: SOURCE_URL,
      OR: [{ category: null }, { summary: null }],
    },
  });

  // 2) Delete any known bad strings (extra safety)
  const r2 = await prisma.mod.deleteMany({
    where: {
      sourceUrl: SOURCE_URL,
      name: { in: BAD_EXACT },
    },
  });

  // 3) Delete category-heading leftovers like "Technology Mods", "Magic Mods", etc.
  const r3 = await prisma.mod.deleteMany({
    where: {
      sourceUrl: SOURCE_URL,
      OR: [
        { name: { endsWith: " Mods" } },
        { name: { endsWith: " Mod" } }, // catches rare headings like "Ad Astra Mod" if it’s not in the table data
      ],
      AND: [{ summary: null }],
    },
  });

  const remaining = await prisma.mod.count();

  console.log("Deleted (null category/summary):", r1.count);
  console.log("Deleted (known bad exact):", r2.count);
  console.log("Deleted (heading-like):", r3.count);
  console.log("Remaining rows:", remaining);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
