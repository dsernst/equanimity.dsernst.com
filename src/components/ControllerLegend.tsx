'use client'

import { startTransition, useEffect, useState } from 'react'
import { DIRECTION_LABELS, KEY_COLORS, KEY_LABELS } from '@/lib/constants'
import { readLocalStorage, writeLocalStorage } from '@/lib/localStorage'
import { TrackedKey } from '@/lib/types'

type DpadDirection = 'up' | 'right' | 'down' | 'left'
type ViewMode = 'compact' | 'full'

const STORAGE_KEY = 'equanimity-controller-view'

const DPAD_MAP: Record<DpadDirection, TrackedKey> = {
  up: 'e',
  right: 'c',
  down: 'f',
  left: 'd',
}

const CONTROLLER_GREEN = '#8bdf63'

const FULL_CONTROLLER_STYLE = {
  backgroundColor: CONTROLLER_GREEN,
  height: '15.5rem',
  width: '9rem',
} as const

function loadViewMode(): ViewMode {
  const raw = readLocalStorage(STORAGE_KEY, 'full')
  return raw === 'compact' ? 'compact' : 'full'
}

function saveViewMode(mode: ViewMode) {
  writeLocalStorage(STORAGE_KEY, mode)
}

function KeyHint({ direction }: { direction: DpadDirection }) {
  const key = DPAD_MAP[direction]
  const { label, note } = KEY_LABELS[key]
  const isSide = direction === 'left' || direction === 'right'

  return (
    <div
      className={`flex min-w-0 flex-col gap-0.5 text-[10px] leading-snug sm:text-[11px] ${
        isSide ? 'flex-1' : 'max-w-36'
      } ${
        direction === 'left'
          ? 'items-end text-right'
          : direction === 'right'
            ? 'items-start text-left'
            : 'items-center text-center'
      }`}
    >
      <div
        className={`flex items-center gap-1.5 ${direction === 'left' ? 'flex-row-reverse' : ''}`}
      >
        <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${KEY_COLORS[key]}`} />
        <span className="font-medium text-zinc-100">&ldquo;{label}&rdquo;</span>
      </div>
      {note && <span className={`text-zinc-400 ${isSide ? 'max-w-full' : ''}`}>{note}</span>}
    </div>
  )
}

function DpadArrow({ direction }: { direction: DpadDirection }) {
  const rotation =
    direction === 'right'
      ? 'rotate(90deg)'
      : direction === 'down'
        ? 'rotate(180deg)'
        : direction === 'left'
          ? 'rotate(-90deg)'
          : undefined

  return (
    <svg
      viewBox="0 0 12 12"
      className="h-3.5 w-3.5"
      style={rotation ? { transform: rotation } : undefined}
      aria-hidden
    >
      <path d="M6 2 L10 9 H2 Z" fill="currentColor" />
    </svg>
  )
}

const DPAD_CORNERS: Record<DpadDirection, string> = {
  up: 'rounded-t-md',
  right: 'rounded-r-md',
  down: 'rounded-b-md',
  left: 'rounded-l-md',
}

function DpadKey({
  direction,
  held,
  interactive,
  onKeyDown,
  onKeyUp,
}: {
  direction: DpadDirection
  held: boolean
  interactive: boolean
  onKeyDown: (key: TrackedKey) => void
  onKeyUp: (key: TrackedKey) => void
}) {
  const key = DPAD_MAP[direction]
  const position =
    direction === 'up'
      ? 'col-start-2 row-start-1'
      : direction === 'left'
        ? 'col-start-1 row-start-2'
        : direction === 'right'
          ? 'col-start-3 row-start-2'
          : 'col-start-2 row-start-3'

  return (
    <button
      type="button"
      disabled={!interactive}
      aria-label={KEY_LABELS[key].label}
      onPointerDown={(e) => {
        if (!interactive) return
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        onKeyDown(key)
      }}
      onPointerUp={(e) => {
        if (!interactive) return
        e.preventDefault()
        onKeyUp(key)
      }}
      onPointerCancel={() => onKeyUp(key)}
      className={`relative z-10 flex h-8 w-8 touch-none items-center justify-center sm:h-9 sm:w-9 ${DPAD_CORNERS[direction]} transition-all duration-100 ${position} ${
        held
          ? `${KEY_COLORS[key]} text-white shadow-md`
          : 'bg-transparent text-zinc-600 hover:bg-white/40 hover:ring-2 hover:ring-black/15 active:scale-95'
      } ${interactive ? 'cursor-pointer disabled:cursor-default disabled:opacity-60 disabled:hover:ring-0' : ''}`}
    >
      <DpadArrow direction={direction} />
    </button>
  )
}

function DpadCross() {
  const arm = 'absolute bg-white/80 shadow-sm'
  const cell = 'h-8 w-8 sm:h-9 sm:w-9'

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className={`${arm} ${cell} left-1/2 top-0 -translate-x-1/2 rounded-t-md`} />
      <div className={`${arm} ${cell} bottom-0 left-1/2 -translate-x-1/2 rounded-b-md`} />
      <div className={`${arm} ${cell} left-0 top-1/2 -translate-y-1/2 rounded-l-md`} />
      <div className={`${arm} ${cell} right-0 top-1/2 -translate-y-1/2 rounded-r-md`} />
      <div
        className={`absolute left-1/2 top-1/2 ${cell} -translate-x-1/2 -translate-y-1/2 scale-[1.04] bg-white/50`}
      />
    </div>
  )
}

function DpadGrid({
  heldKeys,
  interactive,
  onKeyDown,
  onKeyUp,
}: {
  heldKeys: Set<TrackedKey>
  interactive: boolean
  onKeyDown: (key: TrackedKey) => void
  onKeyUp: (key: TrackedKey) => void
}) {
  return (
    <div className="relative h-24 w-24 shrink-0 sm:h-27 sm:w-27">
      <DpadCross />
      <div className="relative grid h-full w-full grid-cols-3 grid-rows-3">
        <DpadKey direction="up" held={heldKeys.has('e')} interactive={interactive} onKeyDown={onKeyDown} onKeyUp={onKeyUp} />
        <DpadKey direction="left" held={heldKeys.has('d')} interactive={interactive} onKeyDown={onKeyDown} onKeyUp={onKeyUp} />
        <DpadKey direction="right" held={heldKeys.has('c')} interactive={interactive} onKeyDown={onKeyDown} onKeyUp={onKeyUp} />
        <DpadKey direction="down" held={heldKeys.has('f')} interactive={interactive} onKeyDown={onKeyDown} onKeyUp={onKeyUp} />
      </div>
    </div>
  )
}

function AbxyCluster() {
  return (
    <div className="relative mt-auto h-16 w-16">
      <div className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 rounded-full bg-white/35" />
      <div className="absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white/35" />
      <div className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white/35" />
      <div className="absolute bottom-0 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-white/35" />
    </div>
  )
}

function CompactController({
  heldKeys,
  interactive,
  onKeyDown,
  onKeyUp,
}: {
  heldKeys: Set<TrackedKey>
  interactive: boolean
  onKeyDown: (key: TrackedKey) => void
  onKeyUp: (key: TrackedKey) => void
}) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center">
      <KeyHint direction="up" />

      <div className="mt-2 flex w-full items-center gap-1.5 px-1 sm:gap-3 sm:px-0">
        <KeyHint direction="left" />
        <div
          className="shrink-0 rounded-3xl p-2 shadow-inner sm:p-2.5"
          style={{ backgroundColor: CONTROLLER_GREEN }}
        >
          <DpadGrid
            heldKeys={heldKeys}
            interactive={interactive}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
          />
        </div>
        <KeyHint direction="right" />
      </div>

      <div className="mt-2">
        <KeyHint direction="down" />
      </div>
    </div>
  )
}

function KeyReminders() {
  return (
    <div className="w-full max-w-sm">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Labels</p>
      <ul className="flex flex-col gap-3 text-sm">
        {DIRECTION_LABELS.map(({ direction, key }) => {
          const { label, note } = KEY_LABELS[key]
          return (
            <li key={key} className="flex items-start gap-2">
              <span
                className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${KEY_COLORS[key]}`}
              />
              <div>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-zinc-400">{direction}</span>
                  <span className="font-medium text-zinc-100">&ldquo;{label}&rdquo;</span>
                </div>
                {note && <p className="text-zinc-400">{note}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function FullController({
  heldKeys,
  interactive,
  onKeyDown,
  onKeyUp,
}: {
  heldKeys: Set<TrackedKey>
  interactive: boolean
  onKeyDown: (key: TrackedKey) => void
  onKeyUp: (key: TrackedKey) => void
}) {
  return (
    <>
      <div
        className="relative flex flex-col items-center rounded-4xl px-4 py-5 shadow-inner"
        style={FULL_CONTROLLER_STYLE}
      >
        <DpadGrid
          heldKeys={heldKeys}
          interactive={interactive}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
        />
        <AbxyCluster />
      </div>

      <p className="text-center text-[10px] leading-snug text-zinc-400">
        <a
          href="https://www.amazon.com/dp/B0CDG2HKBF/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          8BitDo
        </a>{' '}
        — rotated, D-pad on top
      </p>
    </>
  )
}

export default function ControllerLegend({
  heldKeys,
  interactive,
  onKeyDown,
  onKeyUp,
}: {
  heldKeys: Set<TrackedKey>
  interactive: boolean
  onKeyDown: (key: TrackedKey) => void
  onKeyUp: (key: TrackedKey) => void
}) {
  const [view, setView] = useState<ViewMode>('full')

  useEffect(() => {
    startTransition(() => setView(loadViewMode()))
  }, [])

  const selectView = (mode: ViewMode) => {
    setView(mode)
    saveViewMode(mode)
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex items-center gap-2.5">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Controller</p>
        <div
          className="flex rounded-lg border border-zinc-700/80 p-0.5 text-[11px]"
          role="group"
          aria-label="Controller view"
        >
          <button
            type="button"
            onClick={() => selectView('full')}
            className={`cursor-pointer rounded-md px-2 py-0.5 transition ${
              view === 'full'
                ? 'bg-zinc-800 text-zinc-200'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Full
          </button>
          <button
            type="button"
            onClick={() => selectView('compact')}
            className={`cursor-pointer rounded-md px-2 py-0.5 transition ${
              view === 'compact'
                ? 'bg-zinc-800 text-zinc-200'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Compact
          </button>
        </div>
      </div>

      {view === 'compact' ? (
        <CompactController
          heldKeys={heldKeys}
          interactive={interactive}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
        />
      ) : (
        <div className="flex w-full flex-col items-center gap-8">
          <FullController
            heldKeys={heldKeys}
            interactive={interactive}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
          />
          <KeyReminders />
        </div>
      )}

    </div>
  )
}
