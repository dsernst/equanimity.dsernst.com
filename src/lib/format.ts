export function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 1,
  })
}

export function formatRelative(from: number, to: number): string {
  const seconds = (to - from) / 1000
  const minutes = seconds / 60
  if (minutes > 60) return `+${(minutes / 60).toFixed(1)} hrs`
  if (seconds > 60) return `+${minutes.toFixed(1)}min`
  return `+${seconds.toFixed(1)}s`
}

export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

/** Whole seconds while a key is still held. */
export function formatHoldDurationLive(ms: number): string {
  return `${Math.floor(ms / 1000)}s`
}

/** Local datetime for export filenames, e.g. `2026-06-19T17_07_29.tsv` */
export function formatExportFilename(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}_${pad(date.getMinutes())}_${pad(date.getSeconds())}.tsv`
}
