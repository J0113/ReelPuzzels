import type React from "react";
import type { RNG } from "./lib/rng";

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

/** Base XP awarded per difficulty tier (matches the mockup's xp values). */
export const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 100,
  medium: 150,
  hard: 220,
};

/** A single generated puzzle ready to be played. */
export interface PuzzleInstance<D = unknown> {
  /** Unique per generated instance. */
  id: string;
  /** Owning game mode id, e.g. "word" | "math". */
  modeId: string;
  difficulty: Difficulty;
  /** Headline question shown above the puzzle body. */
  prompt: string;
  /** Supporting hint line. */
  hint: string;
  /** Base XP for solving (before speed / combo bonuses). */
  xp: number;
  /** Mode-specific payload consumed by the mode's Component. */
  data: D;
}

export interface PuzzleComponentProps<D = unknown> {
  puzzle: PuzzleInstance<D>;
  solved: boolean;
  onSolve: () => void;
  onMiss: () => void;
}

/** Static descriptor for a mode — drives HUD pills, menu cards, stats. */
export interface GameMeta {
  id: string;
  /** Short uppercase label for the HUD pill, e.g. "WORDS". */
  skill: string;
  /** Full name for menu / stats, e.g. "Word Scramble". */
  skillFull: string;
  /** Render the accent ("lang") pill variant instead of primary. */
  lang: boolean;
}

/**
 * A self-contained game mode. Add a new mode by creating a folder under
 * src/games/<mode>/ that default-exports one of these, then register it in
 * src/games/registry.ts — no other file needs to change.
 */
export interface GameModule<D = unknown> {
  meta: GameMeta;
  /** Procedurally build one puzzle at the requested difficulty. */
  generate(difficulty: Difficulty, rng: RNG): PuzzleInstance<D>;
  /** React component that renders + drives the puzzle. */
  Component: React.FC<PuzzleComponentProps<D>>;
}
