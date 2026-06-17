import { TrackedKey } from '@/lib/types'

export type KeyLabel = {
  label: string
  note?: string
}

export const HOLD_THRESHOLD_MS = 400

export const KEY_LABELS: Record<TrackedKey, KeyLabel> = {
  e: { label: 'Start Again', note: 'distracted mind' },
  c: { label: 'Craving' },
  d: { label: 'Hatred' },
  f: { label: 'Breath', note: 'too agitated for sensations' },
}

export const KEY_COLORS: Record<TrackedKey, string> = {
  d: 'bg-sky-500',
  e: 'bg-emerald-500',
  c: 'bg-amber-500',
  f: 'bg-rose-500',
}

export const KEY_RING_COLORS: Record<TrackedKey, string> = {
  d: 'ring-sky-400',
  e: 'ring-emerald-400',
  c: 'ring-amber-400',
  f: 'ring-rose-400',
}

export const DIRECTION_LABELS: { direction: string; key: TrackedKey }[] = [
  { direction: 'Up', key: 'e' },
  { direction: 'Right', key: 'c' },
  { direction: 'Left', key: 'd' },
  { direction: 'Down', key: 'f' },
]
