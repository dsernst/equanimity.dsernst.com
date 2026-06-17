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
  const delta = to - from
  return `+${(delta / 1000).toFixed(1)}s`
}

export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}
