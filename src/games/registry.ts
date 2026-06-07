import type { Difficulty, GameModule, PuzzleInstance } from "../types";
import { RNG } from "../lib/rng";
import { wordScramble } from "./wordScramble";
import { speedMath } from "./speedMath";

/**
 * The live set of game modes. To add a mode, create src/games/<mode>/ that
 * exports a GameModule, import it here, and append it to this array — nothing
 * else in the app needs to change.
 */
// `any` payload: each module is internally typed, but the registry holds a
// heterogeneous mix, and GameModule is invariant in its data via Component.
export const MODES: GameModule<any>[] = [wordScramble, speedMath];

const BY_ID = new Map(MODES.map((m) => [m.meta.id, m]));

export function getMode(id: string): GameModule<any> | undefined {
  return BY_ID.get(id);
}

export function randomMode(rng: RNG): GameModule<any> {
  return rng.pick(MODES);
}

/** Generate one puzzle for a specific mode + difficulty. */
export function generateFor(
  modeId: string,
  difficulty: Difficulty,
  rng: RNG = new RNG(),
): PuzzleInstance {
  const mode = getMode(modeId);
  if (!mode) throw new Error(`Unknown game mode: ${modeId}`);
  return mode.generate(difficulty, rng);
}

/**
 * Ramping difficulty for the endless feed: gentle at first, broader as the
 * player solves more. Returns the difficulty tier for the next feed puzzle.
 */
export function rampDifficulty(solvedCount: number, rng: RNG): Difficulty {
  let pool: Difficulty[];
  if (solvedCount < 5) pool = ["easy"];
  else if (solvedCount < 15) pool = ["easy", "easy", "medium"];
  else pool = ["easy", "medium", "medium", "hard"];
  return rng.pick(pool);
}

/** Generate the next endless-feed puzzle (random mode, ramped difficulty). */
export function generateFeedPuzzle(
  solvedCount: number,
  rng: RNG = new RNG(),
): PuzzleInstance {
  const mode = randomMode(rng);
  const difficulty = rampDifficulty(solvedCount, rng);
  return mode.generate(difficulty, rng);
}
