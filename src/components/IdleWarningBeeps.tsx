'use client'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import {
  cancelIdleWarningSequenceTest,
  playIdleWarningBeep,
  playIdleWarningSequenceTest,
} from '@/lib/beep'
import { CONTROLLER_IDLE_WARNINGS, CONTROLLER_SLEEP_MS } from '@/lib/constants'
import { readLocalStorage, writeLocalStorage } from '@/lib/localStorage'

const STORAGE_KEY = 'equanimity-idle-warning-beeps'
const IDLE_POLL_MS = 500

function loadEnabled(): boolean {
  return readLocalStorage(STORAGE_KEY, 'true') === 'true'
}

function saveEnabled(enabled: boolean) {
  writeLocalStorage(STORAGE_KEY, String(enabled))
}

function useControllerIdleWarning(active: boolean) {
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

    const id = window.setInterval(tick, IDLE_POLL_MS)
    return () => window.clearInterval(id)
  }, [active, bumpActivity])

  return bumpActivity
}

export function useIdleWarningBeeps(listening: boolean, enableAudio: () => void) {
  const [enabled, setEnabled] = useState(true)
  const [testing, setTesting] = useState(false)
  const [testSecs, setTestSecs] = useState(30)
  const bumpActivity = useControllerIdleWarning(listening && enabled)

  useEffect(() => {
    startTransition(() => setEnabled(loadEnabled()))
  }, [])

  useEffect(() => () => cancelIdleWarningSequenceTest(), [])

  const stopTest = useCallback(() => {
    cancelIdleWarningSequenceTest()
    setTesting(false)
  }, [])

  const toggleEnabled = useCallback(() => {
    if (enabled && testing) stopTest()
    setEnabled((v) => {
      const next = !v
      saveEnabled(next)
      return next
    })
  }, [enabled, testing, stopTest])

  const toggleTest = useCallback(() => {
    if (testing) return stopTest()
    enableAudio()
    setTestSecs(30)
    setTesting(true)
    playIdleWarningSequenceTest(stopTest)
  }, [testing, enableAudio, stopTest])

  useEffect(() => {
    if (!testing) return

    const id = window.setInterval(() => {
      setTestSecs((s) => Math.max(0, s - 1))
    }, 1000)

    return () => window.clearInterval(id)
  }, [testing])

  return {
    bumpActivity,
    enabled,
    testing,
    testSecs,
    toggleEnabled,
    toggleTest,
  }
}

export function IdleWarningBeeps({
  enabled,
  testing,
  testSecs,
  onToggleEnabled,
  onToggleTest,
}: {
  enabled: boolean
  testing: boolean
  testSecs: number
  onToggleEnabled: () => void
  onToggleTest: () => void
}) {
  return (
    <details className="text-xs text-zinc-500">
      <summary className="cursor-pointer hover:text-zinc-400 [&::-webkit-details-marker]:hidden">
        Idle warning beeps{!enabled ? ' (disabled)' : ''}
      </summary>
      <div className="mt-1.5 leading-relaxed space-y-0.5">
        <p>Controller auto-sleeps after 15min of inactivity.</p>
        <p>
          So subtle warning beeps are given at 30s before (after 14m30s idleness), -20, -15, -10,
          -6.5, -3.5.
        </p>
        <p>Press any controller button to reset the timer.</p>
        <p>
          <i>ABXY recommended to avoid new log entries.</i>
        </p>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onToggleEnabled}
          className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
        >
          {enabled ? 'Disable' : 'Enable'}
        </button>
        <button
          type="button"
          onClick={onToggleTest}
          className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-1.5 text-sm tabular-nums text-zinc-300 transition hover:bg-zinc-800"
        >
          {testing ? `Testing - ${testSecs}s` : 'Test'}
        </button>
      </div>
    </details>
  )
}
