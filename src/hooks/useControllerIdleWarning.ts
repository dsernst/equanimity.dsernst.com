import { useCallback, useEffect, useRef } from 'react'
import { playIdleWarningBeep } from '@/lib/beep'
import { CONTROLLER_IDLE_WARNING_BEFORE_MS, CONTROLLER_SLEEP_MS } from '@/lib/constants'

const POLL_MS = 1000

export function useControllerIdleWarning(active: boolean) {
  const lastActivityRef = useRef(0)
  const warnedRef = useRef(false)

  const bumpActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    warnedRef.current = false
  }, [])

  useEffect(() => {
    if (!active) return

    lastActivityRef.current = Date.now()
    warnedRef.current = false

    const tick = () => {
      const idleMs = Date.now() - lastActivityRef.current
      const warnAtMs = CONTROLLER_SLEEP_MS - CONTROLLER_IDLE_WARNING_BEFORE_MS
      if (idleMs < warnAtMs || warnedRef.current) return

      warnedRef.current = true
      playIdleWarningBeep()
    }

    const id = window.setInterval(tick, POLL_MS)
    return () => window.clearInterval(id)
  }, [active, bumpActivity])

  return bumpActivity
}
