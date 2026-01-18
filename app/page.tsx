"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Mod = {
  id: number;
  name: string;
  category: string | null;
  summary: string | null;
  sourceUrl: string;
};

export default function HomePage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const [categories, setCategories] = useState<string[]>([""]); // dynamic, loaded from API
  const [results, setResults] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(false);

  // Load categories once from the DB (via API)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) return;
        const data = await res.json();
        setCategories(["", ...(data.categories ?? [])]);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  // Search whenever query/category changes (with small debounce)
  useEffect(() => {
    const run = async () => {
      if (q.trim().length < 2 && !category) {
        setResults([]);
        return;
      }

      setLoading(true);

      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (category) params.set("category", category);

        const res = await fetch(`/api/search?${params.toString()}`);

        // ✅ harden against API errors / empty responses
        if (!res.ok) {
          setResults([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [q, category]);

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 980,
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: 6 }}>ATM10 Knowledge Platform</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Search mods from the ATM10 mod list and view a clean summary with source
        attribution.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a mod (e.g., Applied Energistics 2, Embeddium, Powah)"
          style={{ flex: "1 1 420px", padding: 12, fontSize: 16 }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: 12, fontSize: 16, minWidth: 220 }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "" ? "All categories" : c}
            </option>
          ))}
        </select>
      </div>

      {loading && <p style={{ marginTop: 16 }}>Searching…</p>}

      <div style={{ marginTop: 16 }}>
        {results.length > 0 && (
          <p style={{ opacity: 0.8 }}>{results.length} results</p>
        )}

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {results.map((m) => (
            <li
              key={m.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    <Link
                      href={`/mods/${encodeURIComponent(m.name)}`}
                      style={{ textDecoration: "none" }}
                    >
                      {m.name}
                    </Link>
                  </div>
                  <div style={{ opacity: 0.8, marginTop: 2 }}>
                    {m.category ?? "Uncategorized"}
                  </div>
                </div>

                <a
                  href={m.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Source
                </a>
              </div>

              {m.summary ? (
                <p style={{ marginTop: 10, marginBottom: 0 }}>{m.summary}</p>
              ) : (
                <p style={{ marginTop: 10, marginBottom: 0, opacity: 0.7 }}>
                  No summary available.
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
