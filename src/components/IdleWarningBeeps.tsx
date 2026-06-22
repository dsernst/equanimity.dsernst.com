'use client'

import { startTransition, useCallback, useEffect, useState } from 'react'
import { useControllerIdleWarning } from '@/hooks/useControllerIdleWarning'
import { cancelIdleWarningSequenceTest, playIdleWarningSequenceTest } from '@/lib/beep'

const STORAGE_KEY = 'equanimity-idle-warning-beeps'

function loadEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return true
    return raw === 'true'
  } catch {
    return true
  }
}

function saveEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, String(enabled))
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
