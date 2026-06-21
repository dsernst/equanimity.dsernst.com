export type TrackedKey = 'd' | 'e' | 'c' | 'f'

export const TRACKED_KEYS: TrackedKey[] = ['d', 'e', 'c', 'f']

const ARROW_TO_TRACKED_KEY: Record<string, TrackedKey> = {
  arrowup: 'e',
  arrowright: 'c',
  arrowleft: 'd',
  arrowdown: 'f',
}

export function resolveTrackedKey(key: string): TrackedKey | null {
  const normalized = key.toLowerCase()
  if (TRACKED_KEYS.includes(normalized as TrackedKey)) return normalized as TrackedKey
  return ARROW_TO_TRACKED_KEY[normalized] ?? null
}

export type KeyEventType = 'press' | 'hold'

export type KeyLogEntry = {
  id: string
  key: TrackedKey
  label: string
  timestamp: number
  type: KeyEventType
  durationMs?: number
}
