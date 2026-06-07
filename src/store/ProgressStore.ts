/**
 * Server-ready progress contract. The app only ever talks to the `ProgressStore`
 * interface, so swapping the local implementation for an HTTP-backed one later
 * (see src/store/index.ts) requires no changes at any call site.
 */
export interface Progress {
  xp: number;
  streak: number;
  bestStreak: number;
  solvedCount: number;
  /** Total seconds spent across solved puzzles (for avg solve time). */
  timeSum: number;
  /** Skill points keyed by mode id, e.g. { word: 12, math: 8 }. */
  skills: Record<string, number>;
}

export interface ProgressStore {
  load(): Promise<Progress>;
  save(progress: Progress): Promise<void>;
}

export const DEFAULT_PROGRESS: Progress = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  solvedCount: 0,
  timeSum: 0,
  skills: {},
};

/** Normalize a possibly-partial loaded object into a full Progress. */
export function hydrate(raw: Partial<Progress> | null | undefined): Progress {
  return { ...DEFAULT_PROGRESS, ...(raw ?? {}), skills: { ...(raw?.skills ?? {}) } };
}
