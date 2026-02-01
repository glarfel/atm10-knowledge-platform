# ATM10 Knowledge Platform

A searchable knowledge platform for the **All The Mods 10 (ATM10)** Minecraft modpack.  
This project aggregates mod metadata into a structured database and provides a clean search and browsing experience.

## 🚀 Features
- 🔍 Search mods by **name or summary**
- 🗂 Filter by mod **category**
- 📄 Dedicated mod detail pages with descriptions and source links
- 🔁 Related mods by category
- 🧠 Data ingestion pipeline that scrapes and normalizes mod data

## 🛠 Tech Stack
- **Next.js (App Router)** – frontend & API routes  
- **Prisma ORM (v7)** – database access layer  
- **SQLite** – local development database  
- **Cheerio** – HTML parsing & scraping  
- **Node.js runtime** – required for Prisma + SQLite adapters

## 📊 Data Pipeline
1. Scrapes the ATM10 mod list from `minecraft-guides.com`
2. Parses category tables containing:
   - Mod name
   - Summary
   - Category
3. Normalizes and de-duplicates data
4. Stores structured records in SQLite via Prisma

This approach ensures accurate, repeatable ingestion and avoids navigation or UI noise.

## 🧪 Local Development

### 1. Install dependencies
```bash
npm install
