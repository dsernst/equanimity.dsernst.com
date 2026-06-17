export type TrackedKey = 'd' | 'e' | 'c' | 'f'

export const TRACKED_KEYS: TrackedKey[] = ['d', 'e', 'c', 'f']

export type KeyEventType = 'press' | 'hold'

export type KeyLogEntry = {
  id: string
  key: TrackedKey
  label: string
  timestamp: number
  type: KeyEventType
  durationMs?: number
}
