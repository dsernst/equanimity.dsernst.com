'use client'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import ControllerLegend from '@/components/ControllerLegend'
import { formatDuration, formatRelative, formatTimestamp } from '@/lib/format'
import { HOLD_THRESHOLD_MS, KEY_COLORS, KEY_LABELS } from '@/lib/constants'
import { speakLabel } from '@/lib/speech'
import { KeyEventType, KeyLogEntry, TRACKED_KEYS, TrackedKey } from '@/lib/types'

const STORAGE_KEY = 'equanimity-key-log'

function isTrackedKey(key: string): key is TrackedKey {
  return TRACKED_KEYS.includes(key as TrackedKey)
}

function loadEntries(): KeyLogEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as KeyLogEntry[]
    return parsed.map((entry) => ({
      ...entry,
      type: entry.type ?? 'press',
      label: entry.label ?? KEY_LABELS[entry.key]?.label ?? entry.key,
    }))
  } catch {
    return []
  }
}

function saveEntries(entries: KeyLogEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export default function KeyLogger() {
  const [entries, setEntries] = useState<KeyLogEntry[]>([])
  const [heldKeys, setHeldKeys] = useState<Set<TrackedKey>>(new Set())
  const [listening, setListening] = useState(true)
  const entriesRef = useRef<KeyLogEntry[]>([])
  const pressStartRef = useRef<Partial<Record<TrackedKey, number>>>({})

  const appendEntry = useCallback((entry: KeyLogEntry) => {
    entriesRef.current = [entry, ...entriesRef.current]
    setEntries(entriesRef.current)
    saveEntries(entriesRef.current)
  }, [])

  const logKeyRelease = useCallback(
    (key: TrackedKey, pressStart: number) => {
      const durationMs = Date.now() - pressStart
      const type: KeyEventType = durationMs >= HOLD_THRESHOLD_MS ? 'hold' : 'press'
      appendEntry({
        id: crypto.randomUUID(),
        key,
        label: KEY_LABELS[key].label,
        timestamp: pressStart,
        type,
        durationMs,
      })
    },
    [appendEntry],
  )

  useEffect(() => {
    const loaded = loadEntries()
    entriesRef.current = loaded
    startTransition(() => setEntries(loaded))
  }, [])

  useEffect(() => {
    if (!listening) {
      window.speechSynthesis?.cancel()
      return
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (!isTrackedKey(key)) return
      e.preventDefault()
      if (e.repeat) return

      pressStartRef.current[key] = Date.now()
      setHeldKeys((prev) => new Set(prev).add(key))
      speakLabel(KEY_LABELS[key].label)
    }

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (!isTrackedKey(key)) return
      e.preventDefault()

      const start = pressStartRef.current[key]
      delete pressStartRef.current[key]
      setHeldKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })

      if (!start) return
      logKeyRelease(key, start)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [listening, logKeyRelease])

  const clearLog = () => {
    entriesRef.current = []
    setEntries([])
    pressStartRef.current = {}
    setHeldKeys(new Set())
    localStorage.removeItem(STORAGE_KEY)
  }

  const exportLog = () => {
    const lines = [...entries]
      .reverse()
      .map((e) => {
        const duration = e.durationMs !== undefined ? formatDuration(e.durationMs) : ''
        return `${formatTimestamp(e.timestamp)}\t${e.label}\t${e.type}\t${duration}`
      })
      .join('\n')
    const blob = new Blob([`timestamp\tlabel\ttype\tduration\n${lines}\n`], {
      type: 'text/tab-separated-values',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `equanimity-log-${new Date().toISOString().slice(0, 19)}.tsv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sessionStart = entries.length > 0 ? entries[entries.length - 1]!.timestamp : null

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

      <section className="flex flex-col gap-4 overflow-visible rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${listening ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`}
          />
          <span className="text-zinc-600 dark:text-zinc-300">
            {listening ? 'Listening' : 'Paused'}
          </span>
        </div>

        <ControllerLegend heldKeys={heldKeys} />

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Each entry is logged on release; holds over {HOLD_THRESHOLD_MS}ms are marked. Spoken
          feedback on press.
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
              {listening ? 'Pause' : 'Resume'}
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
                const prev = entries[i + 1]
                const relative = prev ? formatRelative(prev.timestamp, entry.timestamp) : null

                return (
                  <li key={entry.id} className="flex items-center gap-4 px-4 py-2.5 text-sm">
                    <span className="w-28 shrink-0 font-mono text-zinc-500 dark:text-zinc-400">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                    {sessionStart && i === entries.length - 1 && (
                      <span className="w-16 shrink-0 text-zinc-400">start</span>
                    )}
                    {relative && <span className="w-16 shrink-0 text-zinc-400">{relative}</span>}
                    {!relative && i !== entries.length - 1 && <span className="w-16 shrink-0" />}
                    <span
                      className={`inline-block h-2 w-2 shrink-0 rounded-full ${KEY_COLORS[entry.key]}`}
                    />
                    <span className="font-medium text-zinc-800 dark:text-zinc-100">
                      &ldquo;{entry.label}&rdquo;
                    </span>
                    {entry.type === 'hold' && entry.durationMs !== undefined && (
                      <span className="text-zinc-500 dark:text-zinc-400">
                        held {formatDuration(entry.durationMs)}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
