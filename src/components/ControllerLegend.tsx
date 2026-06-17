'use client'

import { DIRECTION_LABELS, KEY_COLORS, KEY_LABELS, KEY_RING_COLORS } from '@/lib/constants'
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
      className={`flex h-9 w-9 items-center justify-center rounded-md font-mono text-sm font-bold uppercase transition-all duration-100 ${position} ${
        held
          ? `${KEY_COLORS[key]} text-white shadow-md ring-2 ${KEY_RING_COLORS[key]} scale-110`
          : 'bg-white/90 text-zinc-700'
      }`}
    >
      {key}
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
        <div className="grid grid-cols-3 grid-rows-3 gap-0.5">
          <DpadKey direction="up" held={heldKeys.has('e')} />
          <DpadKey direction="left" held={heldKeys.has('d')} />
          <div className="col-start-2 row-start-2 flex h-9 w-9 items-center justify-center">
            <div className="relative h-full w-full">
              <div className="absolute left-1/2 top-0 h-full w-2.5 -translate-x-1/2 rounded-sm bg-white/90" />
              <div className="absolute left-0 top-1/2 h-2.5 w-full -translate-y-1/2 rounded-sm bg-white/90" />
            </div>
          </div>
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
        8BitDo — rotated, D-pad on top
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
