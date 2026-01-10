# ATM10 Unified Knowledge Platform

A full-stack web application that aggregates and indexes information for the
**All The Mods 10 (ATM10)** Minecraft modpack into a single searchable platform.

## Current Features
- Next.js full-stack application
- SQLite database via Prisma
- Ingestion script to index mod names from public sources
- Case-insensitive search API
- Source-linked search results

## Tech Stack
- Next.js (React)
- Prisma ORM
- SQLite (local dev)
- Cheerio (HTML parsing)

## Motivation
ATM10 information is spread across multiple guides, wikis, and issue trackers.
This project aims to unify those sources into citation-backed concept pages.

## Roadmap
- Improve mod name extraction accuracy
- Add official guide ingestion
- Introduce concept pages (mods, items, mechanics)
- Source reliability scoring
- Version awareness

## Disclaimer
This project uses publicly available information and is not affiliated with
the All The Mods team or Mojang.
