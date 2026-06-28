'use client'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import ControllerLegend from '@/components/ControllerLegend'
import { IdleWarningBeeps, useIdleWarningBeeps } from '@/components/IdleWarningBeeps'
import { useClientSnapshot } from '@/hooks/useClientSnapshot'
import { useTouchAudioGate } from '@/hooks/useTouchAudioGate'
import {
  formatDuration,
  formatExportFilename,
  formatHoldDurationLive,
  formatRelative,
  formatTimestamp,
} from '@/lib/format'
import { HOLD_THRESHOLD_MS, KEY_COLORS, KEY_LABELS } from '@/lib/constants'
import { playHoldTickBeep } from '@/lib/beep'
import { speakLabel } from '@/lib/speech'
import { KeyLogEntry, resolveTrackedKey, TrackedKey } from '@/lib/types'

const STORAGE_KEY = 'equanimity-key-log'

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
  const [activeHoldEntryIds, setActiveHoldEntryIds] = useState<Set<string>>(new Set())
  const [listening, setListening] = useState(true)
  const [exportedCount, setExportedCount] = useState<number | null>(null)
  const insecureContext = useClientSnapshot(() => !window.isSecureContext, false)
  const { needsAudioGate, enableAudio } = useTouchAudioGate()
  const { bumpActivity, ...idleBeepsProps } = useIdleWarningBeeps(listening, enableAudio)
  const entriesRef = useRef<KeyLogEntry[]>([])
  const pressRef = useRef<Partial<Record<TrackedKey, { start: number; entryId: string }>>>({})

  const persistEntries = useCallback((next: KeyLogEntry[]) => {
    entriesRef.current = next
    setEntries(next)
    saveEntries(next)
  }, [])

  const syncEntries = useCallback((next: KeyLogEntry[]) => {
    entriesRef.current = next
    setEntries(next)
  }, [])

  const updateActiveHolds = useCallback(() => {
    const presses = Object.values(pressRef.current)
    if (presses.length === 0) return

    const now = Date.now()
    let changed = false
    const next = entriesRef.current.map((e) => {
      const press = presses.find((p) => p.entryId === e.id)
      if (!press) return e

      const elapsed = now - press.start
      if (elapsed < 1000) return e

      const liveDurationMs = Math.floor(elapsed / 1000) * 1000
      if (e.type === 'hold' && e.durationMs === liveDurationMs) return e

      changed = true
      return { ...e, type: 'hold' as const, durationMs: liveDurationMs }
    })

    if (changed) {
      syncEntries(next)
      playHoldTickBeep()
    }
  }, [syncEntries])

  const logKeyPress = useCallback(
    (key: TrackedKey, timestamp: number) => {
      const entry: KeyLogEntry = {
        id: crypto.randomUUID(),
        key,
        label: KEY_LABELS[key].label,
        timestamp,
        type: 'press',
      }
      persistEntries([entry, ...entriesRef.current])
      return entry.id
    },
    [persistEntries],
  )

  const finalizeKeyRelease = useCallback(
    (entryId: string, pressStart: number) => {
      const durationMs = Date.now() - pressStart
      const isHold = durationMs >= HOLD_THRESHOLD_MS
      persistEntries(
        entriesRef.current.map((e) =>
          e.id === entryId
            ? { ...e, type: isHold ? 'hold' : 'press', durationMs: isHold ? durationMs : undefined }
            : e,
        ),
      )
    },
    [persistEntries],
  )

  const handleTrackedKeyDown = useCallback(
    (key: TrackedKey) => {
      if (!listening || pressRef.current[key]) return
      enableAudio()
      bumpActivity()
      const start = Date.now()
      const entryId = logKeyPress(key, start)
      pressRef.current[key] = { start, entryId }
      setHeldKeys((prev) => new Set(prev).add(key))
      setActiveHoldEntryIds((prev) => new Set(prev).add(entryId))
      speakLabel(KEY_LABELS[key].label)
    },
    [listening, bumpActivity, logKeyPress, enableAudio],
  )

  const handleTrackedKeyUp = useCallback(
    (key: TrackedKey) => {
      if (!listening) return

      const press = pressRef.current[key]
      delete pressRef.current[key]
      setHeldKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      if (press) {
        setActiveHoldEntryIds((prev) => {
          const next = new Set(prev)
          next.delete(press.entryId)
          return next
        })
      }

      if (!press) return
      finalizeKeyRelease(press.entryId, press.start)
    },
    [listening, finalizeKeyRelease],
  )

  useEffect(() => {
    if (heldKeys.size === 0) return

    const id = window.setInterval(updateActiveHolds, 1000)
    return () => window.clearInterval(id)
  }, [heldKeys.size, updateActiveHolds])

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
      if (e.repeat) return
      bumpActivity()

      const key = resolveTrackedKey(e.key)
      if (!key) return
      e.preventDefault()

      handleTrackedKeyDown(key)
    }

    const onKeyUp = (e: KeyboardEvent) => {
      const key = resolveTrackedKey(e.key)
      if (!key) return
      e.preventDefault()

      handleTrackedKeyUp(key)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [listening, bumpActivity, handleTrackedKeyDown, handleTrackedKeyUp])

  const clearLog = () => {
    entriesRef.current = []
    setEntries([])
    setExportedCount(null)
    pressRef.current = {}
    setHeldKeys(new Set())
    setActiveHoldEntryIds(new Set())
    localStorage.removeItem(STORAGE_KEY)
  }

  const exportLog = () => {
    const lines = [...entries]
      .reverse()
      .map((e) => {
        const duration =
          e.type === 'hold' && e.durationMs !== undefined ? formatDuration(e.durationMs) : ''
        return `${formatTimestamp(e.timestamp)}\t${e.label}\t${duration}`
      })
      .join('\n')
    const blob = new Blob([`timestamp\tlabel\tduration\n${lines}\n`], {
      type: 'text/tab-separated-values',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = formatExportFilename()
    a.click()
    URL.revokeObjectURL(url)
    setExportedCount(entries.length)
  }

  const sessionStart = entries.length > 0 ? entries[entries.length - 1]!.timestamp : null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">Equanimity</h1>
        <p className="text-zinc-400">Log timestamps for controller key presses</p>
      </header>

      <section className="flex flex-col gap-4 overflow-visible rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${listening ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`}
          />
          <span className="text-zinc-300">{listening ? 'Listening' : 'Paused'}</span>
        </div>

        {insecureContext && (
          <p className="rounded-lg border border-amber-800/60 bg-amber-950/40 px-3 py-2 text-xs leading-relaxed text-amber-200/90">
            Audio requires a secure connection.{' '}
            <code className="text-amber-100">http://192.168…</code> blocks Web Audio and speech on
            many browsers. Use <code className="text-amber-100">npm run dev:https</code> (HTTPS) for
            phone testing, or deploy to production.
          </p>
        )}

        {needsAudioGate ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <button
              type="button"
              onClick={enableAudio}
              className="cursor-pointer rounded-xl bg-lime-600 px-8 py-3 text-sm font-medium text-white transition"
            >
              Enable audio feedback
            </button>
          </div>
        ) : (
          <>
            <ControllerLegend
              heldKeys={heldKeys}
              interactive={listening}
              onKeyDown={handleTrackedKeyDown}
              onKeyUp={handleTrackedKeyUp}
            />

            <IdleWarningBeeps {...idleBeepsProps} />
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Log ({entries.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setListening((v) => !v)}
              className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
            >
              {listening ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={exportLog}
              disabled={entries.length === 0}
              className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {exportedCount === entries.length && entries.length > 0 ? 'Exported.' : 'Export'}
            </button>
            <button
              onClick={clearLog}
              disabled={entries.length === 0}
              className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-950/30 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto rounded-xl border border-zinc-800">
          {entries.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-400">
              No presses logged yet. Press a key on your controller.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {entries.map((entry, i) => {
                const prev = entries[i + 1]
                const relative = prev ? formatRelative(prev.timestamp, entry.timestamp) : null
                const activelyHeld = activeHoldEntryIds.has(entry.id)

                return (
                  <li key={entry.id} className="flex items-center gap-4 px-4 py-2.5 text-sm">
                    <span className="w-28 shrink-0 font-mono text-zinc-400">
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
                    <span className="font-medium text-zinc-100">&ldquo;{entry.label}&rdquo;</span>
                    {entry.type === 'hold' && entry.durationMs !== undefined && (
                      <span className="text-zinc-400">
                        held{' '}
                        {activelyHeld
                          ? formatHoldDurationLive(entry.durationMs)
                          : formatDuration(entry.durationMs)}
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
