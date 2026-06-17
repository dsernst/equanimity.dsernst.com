import { TrackedKey } from "@/lib/types";

export const HOLD_THRESHOLD_MS = 400;

export const KEY_COLORS: Record<TrackedKey, string> = {
  d: "bg-sky-500",
  e: "bg-emerald-500",
  c: "bg-amber-500",
  f: "bg-rose-500",
};

export const KEY_RING_COLORS: Record<TrackedKey, string> = {
  d: "ring-sky-400",
  e: "ring-emerald-400",
  c: "ring-amber-400",
  f: "ring-rose-400",
};
