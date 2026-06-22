import { useSyncExternalStore } from 'react'

/** Read a browser-only value on the client without setState-in-effect. */
export function useClientSnapshot<T>(getSnapshot: () => T, serverSnapshot: T) {
  return useSyncExternalStore(
    () => () => {},
    getSnapshot,
    () => serverSnapshot,
  )
}
