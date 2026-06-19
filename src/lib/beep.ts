let audioCtx: AudioContext | null = null

function getAudioContext() {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

/** Short double beep — idle warning before the controller sleeps. */
export function playIdleWarningBeep() {
  const ctx = getAudioContext()
  const now = ctx.currentTime

  for (const [start, freq] of [
    [0, 880],
    [0.2, 660],
  ] as const) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.12, now + start)
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + start)
    osc.stop(now + start + 0.12)
  }
}
