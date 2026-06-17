"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatRelative, formatTimestamp } from "@/lib/format";
import { KeyLogEntry, TRACKED_KEYS, TrackedKey } from "@/lib/types";

const STORAGE_KEY = "equanimity-key-log";
const KEY_COLORS: Record<TrackedKey, string> = {
  d: "bg-sky-500",
  e: "bg-emerald-500",
  c: "bg-amber-500",
  f: "bg-rose-500",
};

function isTrackedKey(key: string): key is TrackedKey {
  return TRACKED_KEYS.includes(key as TrackedKey);
}

function loadEntries(): KeyLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as KeyLogEntry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: KeyLogEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function KeyLogger() {
  const [entries, setEntries] = useState<KeyLogEntry[]>([]);
  const [activeKeys, setActiveKeys] = useState<Set<TrackedKey>>(new Set());
  const [listening, setListening] = useState(true);
  const entriesRef = useRef<KeyLogEntry[]>([]);

  const logKey = useCallback((key: TrackedKey) => {
    const entry: KeyLogEntry = {
      id: crypto.randomUUID(),
      key,
      timestamp: Date.now(),
    };

    entriesRef.current = [entry, ...entriesRef.current];
    setEntries(entriesRef.current);
    saveEntries(entriesRef.current);

    setActiveKeys((prev) => new Set(prev).add(key));
    window.setTimeout(() => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 150);
  }, []);

  useEffect(() => {
    setEntries(loadEntries());
    entriesRef.current = loadEntries();
  }, []);

  useEffect(() => {
    if (!listening) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!isTrackedKey(key)) return;
      e.preventDefault();
      logKey(key);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [listening, logKey]);

  const clearLog = () => {
    entriesRef.current = [];
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportLog = () => {
    const lines = [...entries]
      .reverse()
      .map((e) => `${formatTimestamp(e.timestamp)}\t${e.key}`)
      .join("\n");
    const blob = new Blob([`timestamp\tkey\n${lines}\n`], { type: "text/tab-separated-values" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equanimity-log-${new Date().toISOString().slice(0, 19)}.tsv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sessionStart = entries.length > 0 ? entries[entries.length - 1]!.timestamp : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Equanimity
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Log timestamps for controller key presses
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${listening ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`}
          />
          <span className="text-zinc-600 dark:text-zinc-300">
            {listening ? "Listening" : "Paused"}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {TRACKED_KEYS.map((key) => (
            <div
              key={key}
              className={`flex h-20 flex-col items-center justify-center rounded-xl border-2 transition-all duration-100 ${
                activeKeys.has(key)
                  ? `${KEY_COLORS[key]} border-transparent text-white scale-105 shadow-lg`
                  : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              <span className="font-mono text-2xl font-bold uppercase">{key}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Press D, E, C, or F on your controller or keyboard.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Log ({entries.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setListening((v) => !v)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {listening ? "Pause" : "Resume"}
            </button>
            <button
              onClick={exportLog}
              disabled={entries.length === 0}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Export
            </button>
            <button
              onClick={clearLog}
              disabled={entries.length === 0}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-red-950/30"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          {entries.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-400">
              No presses logged yet. Press a key on your controller.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {entries.map((entry, i) => {
                const prev = entries[i + 1];
                const relative = prev ? formatRelative(prev.timestamp, entry.timestamp) : null;

                return (
                  <li
                    key={entry.id}
                    className="flex items-center gap-4 px-4 py-2.5 font-mono text-sm"
                  >
                    <span className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                    {sessionStart && i === entries.length - 1 && (
                      <span className="w-16 shrink-0 text-zinc-400">start</span>
                    )}
                    {relative && (
                      <span className="w-16 shrink-0 text-zinc-400">{relative}</span>
                    )}
                    {!relative && i !== entries.length - 1 && (
                      <span className="w-16 shrink-0" />
                    )}
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold uppercase text-white ${KEY_COLORS[entry.key]}`}
                    >
                      {entry.key}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
