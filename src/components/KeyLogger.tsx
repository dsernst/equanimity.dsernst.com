'use client'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import ControllerLegend from '@/components/ControllerLegend'
import { useControllerIdleWarning } from '@/hooks/useControllerIdleWarning'
import { formatDuration, formatExportFilename, formatRelative, formatTimestamp } from '@/lib/format'
import { HOLD_THRESHOLD_MS, KEY_COLORS, KEY_LABELS } from '@/lib/constants'
import { cancelIdleWarningSequenceTest, playIdleWarningSequenceTest } from '@/lib/beep'
import { speakLabel } from '@/lib/speech'
import { KeyLogEntry, TRACKED_KEYS, TrackedKey } from '@/lib/types'

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
  const [idleBeepTesting, setIdleBeepTesting] = useState(false)
  const [idleBeepTestSecs, setIdleBeepTestSecs] = useState(30)
  const entriesRef = useRef<KeyLogEntry[]>([])
  const pressRef = useRef<Partial<Record<TrackedKey, { start: number; entryId: string }>>>({})
  const bumpActivity = useControllerIdleWarning(listening)

  const persistEntries = useCallback((next: KeyLogEntry[]) => {
    entriesRef.current = next
    setEntries(next)
    saveEntries(next)
  }, [])

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
      bumpActivity()
      const start = Date.now()
      const entryId = logKeyPress(key, start)
      pressRef.current[key] = { start, entryId }
      setHeldKeys((prev) => new Set(prev).add(key))
      speakLabel(KEY_LABELS[key].label)
    },
    [listening, bumpActivity, logKeyPress],
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

      if (!press) return
      finalizeKeyRelease(press.entryId, press.start)
    },
    [listening, finalizeKeyRelease],
  )

  useEffect(() => {
    const loaded = loadEntries()
    entriesRef.current = loaded
    startTransition(() => setEntries(loaded))
  }, [])

  useEffect(() => () => cancelIdleWarningSequenceTest(), [])

  const stopIdleBeepTest = () => {
    cancelIdleWarningSequenceTest()
    setIdleBeepTesting(false)
  }

  const toggleIdleBeepTest = () => {
    if (idleBeepTesting) {
      stopIdleBeepTest()
      return
    }
    setIdleBeepTestSecs(30)
    setIdleBeepTesting(true)
    playIdleWarningSequenceTest(stopIdleBeepTest)
  }

  useEffect(() => {
    if (!idleBeepTesting) return

    const id = window.setInterval(() => {
      setIdleBeepTestSecs((s) => Math.max(0, s - 1))
    }, 1000)

    return () => window.clearInterval(id)
  }, [idleBeepTesting])

  useEffect(() => {
    if (!listening) {
      window.speechSynthesis?.cancel()
      return
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      bumpActivity()

      const key = e.key.toLowerCase()
      if (!isTrackedKey(key)) return
      e.preventDefault()

      handleTrackedKeyDown(key)
    }

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (!isTrackedKey(key)) return
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
    pressRef.current = {}
    setHeldKeys(new Set())
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

        <ControllerLegend
          heldKeys={heldKeys}
          interactive={listening}
          onKeyDown={handleTrackedKeyDown}
          onKeyUp={handleTrackedKeyUp}
        />

        <p className="text-xs text-zinc-500">
          Each entry is logged on press; holds over {HOLD_THRESHOLD_MS}ms are marked. Spoken
          feedback on press.
        </p>
        <details className="text-xs text-zinc-500">
          <summary className="cursor-pointer hover:text-zinc-400 [&::-webkit-details-marker]:hidden">
            Idle warning beeps
          </summary>
          <div className="mt-1.5 leading-relaxed space-y-0.5">
            <p>Controller auto-sleeps after 15min of inactivity.</p>
            <p>
              So subtle warning beeps are given at 30s before (after 14m30s idleness), -20, -15,
              -10, -6.5, -3.5.
            </p>
            <p>Press any controller button to reset the timer.</p>
            <p>
              <i>ABXY recommended to avoid new log entries.</i>
            </p>
          </div>
          <button
            type="button"
            onClick={toggleIdleBeepTest}
            className="mt-2 cursor-pointer rounded-lg border border-zinc-700 px-3 py-1.5 text-sm tabular-nums text-zinc-300 transition hover:bg-zinc-800"
          >
            {idleBeepTesting ? `Testing - ${idleBeepTestSecs}s` : 'Test'}
          </button>
        </details>
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
              Export
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
                      <span className="text-zinc-400">held {formatDuration(entry.durationMs)}</span>
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
