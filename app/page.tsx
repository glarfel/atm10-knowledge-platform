"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Mod = {
  id: number;
  name: string;
  category: string | null;
  summary: string | null;
  sourceUrl: string;
};

type Stats = {
  mods: number;
  categories: number;
};

export default function HomePage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const [categories, setCategories] = useState<string[]>([""]);
  const [results, setResults] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  const inputRef = useRef<HTMLInputElement | null>(null);

  const normalizedQ = useMemo(() => q.trim(), [q]);

  const hasQuery = normalizedQ.length >= 2 || Boolean(category);

  /* ---------------- Theme ---------------- */
  useEffect(() => {
    try {
      const current =
        (document.documentElement.dataset.theme as "light" | "dark") ||
        (localStorage.getItem("theme") as "light" | "dark") ||
        "light";
      setTheme(current);
    } catch {}
  }, []);

  /* ---------------- Categories ---------------- */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setCategories(["", ...(Array.isArray(data?.categories) ? data.categories : [])]);
      } catch {}
    };
    loadCategories();
  }, []);

  /* ---------------- Stats ---------------- */
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setStats(data);
      } catch {}
    };
    loadStats();
  }, []);

  /* ---------------- Keyboard shortcuts ---------------- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQ("");
        setCategory("");
        setResults([]);
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ---------------- Search ---------------- */
  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      // If user isn't really searching yet, reset
      if (!hasQuery) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const params = new URLSearchParams();
        if (normalizedQ) params.set("q", normalizedQ);
        if (category) params.set("category", category);

        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          setResults([]);
          return;
        }

        const data = await res.json();
        setResults(data.results ?? []);
      } catch (err: any) {
        // Ignore abort errors (normal when typing quickly)
        if (err?.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    };

    // Debounce typing
    const t = setTimeout(run, 350);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [normalizedQ, category, hasQuery]);

  const clearAll = () => {
    setQ("");
    setCategory("");
    setResults([]);
    inputRef.current?.focus();
  };

  const resultsLabel = useMemo(() => {
    if (!hasQuery) return "";
    if (loading) return "Searching…";
    return `${results.length} result${results.length === 1 ? "" : "s"}`;
  }, [hasQuery, loading, results.length]);

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

      {/* Theme toggle */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => {
            const next = theme === "dark" ? "light" : "dark";
            setTheme(next);
            document.documentElement.dataset.theme = next;
            localStorage.setItem("theme", next);
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--text)",
            cursor: "pointer",
          }}
        >
          Theme: {theme === "dark" ? "Dark" : "Light"}
        </button>

        <span style={{ opacity: 0.75 }}>
          (Tip: press <kbd>Esc</kbd> to clear)
        </span>
      </div>

      <p style={{ marginTop: 10, opacity: 0.8 }}>
        Search and explore mods from the All The Mods 10 modpack.
      </p>

      {stats && (
        <p style={{ marginTop: 4, opacity: 0.7 }}>
          {stats.mods} mods indexed • {stats.categories} categories
        </p>
      )}

      {/* Search controls */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 420px", position: "relative" }}>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a mod (e.g., Applied, storage, magic)"
            style={{
              width: "100%",
              padding: "12px 44px 12px 12px",
              fontSize: 16,
              background: "var(--card)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 10,
            }}
          />

          {(q.length > 0 || category) && (
            <button
              type="button"
              onClick={clearAll}
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--text)",
                cursor: "pointer",
                opacity: 0.9,
              }}
            >
              Clear
            </button>
          )}
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: 12,
            fontSize: 16,
            minWidth: 220,
            background: "var(--card)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: 10,
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "" ? "All categories" : c}
            </option>
          ))}
        </select>
      </div>

      {/* Status line */}
      {hasQuery ? (
        <p style={{ marginTop: 12, opacity: 0.8 }}>
          {resultsLabel}
          {!loading && normalizedQ.length > 0 && (
            <>
              {" "}
              for <strong>{normalizedQ}</strong>
            </>
          )}
          {!loading && !normalizedQ && category && (
            <>
              {" "}
              in <strong>{category}</strong>
            </>
          )}
        </p>
      ) : (
        <p style={{ marginTop: 12, opacity: 0.7 }}>
          Start typing (2+ characters) or pick a category to browse.
        </p>
      )}

      {/* Empty state */}
      {!loading && hasQuery && results.length === 0 && (
        <p style={{ marginTop: 16, opacity: 0.8 }}>
          No mods matched{" "}
          {normalizedQ ? (
            <>
              <strong>{normalizedQ}</strong>
            </>
          ) : (
            <>your filters</>
          )}
          .
          <br />
          Try keywords like <em>storage</em>, <em>magic</em>, <em>performance</em>
          , or clear filters.
        </p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <hr style={{ margin: "18px 0", opacity: 0.3 }} />

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {results.map((m) => (
              <li
                key={m.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 12,
                  background: "var(--card)",
                  boxShadow: "0 0 0 rgba(0,0,0,0)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                      <Link
                        href={`/mods/${encodeURIComponent(m.name)}`}
                        style={{ textDecoration: "none", color: "var(--text)" }}
                      >
                        {m.name}
                      </Link>
                    </div>

                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        border: "1px solid var(--border)",
                        borderRadius: 999,
                        fontSize: 12,
                        opacity: 0.85,
                        marginTop: 6,
                        background: "var(--chip-bg)",
                      }}
                    >
                      {m.category ?? "Uncategorized"}
                    </span>
                  </div>

                  <a
                    href={m.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      whiteSpace: "nowrap",
                      opacity: 0.85,
                      color: "var(--text)",
                    }}
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
        </>
      )}
    </main>
  );
}
