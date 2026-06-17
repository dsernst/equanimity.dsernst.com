export type TrackedKey = "d" | "e" | "c" | "f";

export const TRACKED_KEYS: TrackedKey[] = ["d", "e", "c", "f"];

export type KeyLogEntry = {
  id: string;
  key: TrackedKey;
  timestamp: number;
};
