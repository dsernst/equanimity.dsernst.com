import { TrackedKey } from '@/lib/types'

export type KeyLabel = {
  label: string
  note?: string
}

export const HOLD_THRESHOLD_MS = 400

/** 8BitDo Bluetooth auto-sleep after this much inactivity. */
export const CONTROLLER_SLEEP_MS = 15 * 60 * 1000

/** Escalating beeps in the final 30s before sleep — remainingMs before sleep, gain 0–1. */
export const CONTROLLER_IDLE_WARNINGS = [
  { remainingMs: 30_000, gain: 0.12 },
  { remainingMs: 20_000, gain: 0.18 },
  { remainingMs: 15_000, gain: 0.26 },
  { remainingMs: 10_000, gain: 0.34 },
  { remainingMs: 6_500, gain: 0.44 },
  { remainingMs: 3_500, gain: 0.58 },
] as const

export const KEY_LABELS: Record<TrackedKey, KeyLabel> = {
  e: { label: 'Start Again', note: 'distracted mind' },
  c: { label: 'Craving' },
  d: { label: 'Hatred' },
  f: { label: 'Breathing', note: 'too agitated for sensations' },
}

export const KEY_COLORS: Record<TrackedKey, string> = {
  d: 'bg-rose-500',
  e: 'bg-emerald-500',
  c: 'bg-amber-500',
  f: 'bg-sky-500',
}

export const DIRECTION_LABELS: { direction: string; key: TrackedKey }[] = [
  { direction: 'Up', key: 'e' },
  { direction: 'Right', key: 'c' },
  { direction: 'Left', key: 'd' },
  { direction: 'Down', key: 'f' },
]
