'use client'

import { DIRECTION_LABELS, KEY_COLORS, KEY_LABELS } from '@/lib/constants'
import { TrackedKey } from '@/lib/types'

type DpadDirection = 'up' | 'right' | 'down' | 'left'

const DPAD_MAP: Record<DpadDirection, TrackedKey> = {
  up: 'e',
  right: 'c',
  down: 'f',
  left: 'd',
}

const CONTROLLER_STYLE = {
  backgroundColor: '#8bdf63',
  height: '15.5rem',
  width: '9rem',
} as const

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

function DpadKey({ direction, held }: { direction: DpadDirection; held: boolean }) {
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
    <div
      className={`flex h-9 w-9 items-center justify-center ${DPAD_CORNERS[direction]} transition-all duration-100 ${position} ${
        held ? `${KEY_COLORS[key]} text-white shadow-md` : 'bg-white/90 text-zinc-600'
      }`}
    >
      <DpadArrow direction={direction} />
    </div>
  )
}

function ControllerGraphic({ heldKeys }: { heldKeys: Set<TrackedKey> }) {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Controller</p>
      <div
        className="relative flex flex-col items-center rounded-4xl px-4 py-5 shadow-inner"
        style={CONTROLLER_STYLE}
      >
        <div className="grid grid-cols-3 grid-rows-3">
          <DpadKey direction="up" held={heldKeys.has('e')} />
          <DpadKey direction="left" held={heldKeys.has('d')} />
          <div className="col-start-2 row-start-2 h-9 w-9 bg-white/50" />
          <DpadKey direction="right" held={heldKeys.has('c')} />
          <DpadKey direction="down" held={heldKeys.has('f')} />
        </div>

        <div className="relative mt-auto h-16 w-16">
          <div className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 rounded-full bg-white/35" />
          <div className="absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white/35" />
          <div className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white/35" />
          <div className="absolute bottom-0 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-white/35" />
        </div>
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
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    &ldquo;{label}&rdquo;
                  </span>
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

export default function ControllerLegend({ heldKeys }: { heldKeys: Set<TrackedKey> }) {
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <ControllerGraphic heldKeys={heldKeys} />
      <KeyReminders />
    </div>
  )
}
