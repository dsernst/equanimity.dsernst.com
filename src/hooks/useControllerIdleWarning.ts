import { useCallback, useEffect, useRef } from 'react'
import { playIdleWarningBeep } from '@/lib/beep'
import { CONTROLLER_IDLE_WARNINGS, CONTROLLER_SLEEP_MS } from '@/lib/constants'

const POLL_MS = 500

export function useControllerIdleWarning(active: boolean) {
  const lastActivityRef = useRef(0)
  const firedRef = useRef<Set<number>>(new Set())

  const bumpActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    firedRef.current.clear()
  }, [])

  useEffect(() => {
    if (!active) return

    lastActivityRef.current = Date.now()
    firedRef.current.clear()

    const tick = () => {
      const idleMs = Date.now() - lastActivityRef.current

      for (const { remainingMs, gain } of CONTROLLER_IDLE_WARNINGS) {
        if (firedRef.current.has(remainingMs)) continue
        if (idleMs < CONTROLLER_SLEEP_MS - remainingMs) continue

        firedRef.current.add(remainingMs)
        playIdleWarningBeep(gain)
      }
    }

    const id = window.setInterval(tick, POLL_MS)
    return () => window.clearInterval(id)
  }, [active, bumpActivity])

  return bumpActivity
}
