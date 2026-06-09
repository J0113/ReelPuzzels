import {
  XP_BY_DIFFICULTY,
  type Difficulty,
  type PuzzleInstance,
} from "../../types";
import { RNG, uid } from "../../lib/rng";

/** 6×6 binary grid: cells hold SUN or MOON (0 = empty). */
export const N = 6;
export const SUN = 1;
export const MOON = 2;

/** A relation between two orthogonally adjacent cells. */
export interface Constraint {
  a: number;
  b: number;
  /** true → the two cells must match; false → they must differ. */
  eq: boolean;
}

export interface TangoData {
  n: number;
  given: number[]; // 36 cells, 0 = blank
  solution: number[]; // 36 cells, SUN/MOON
  constraints: Constraint[];
}

const PROMPTS = [
  "Fill the grid with suns and moons.",
  "Balance every row and column.",
  "No three in a row — mind the = and ✕ clues.",
];

/** A full line is valid if ≤3 of each symbol and never three-in-a-row. */
function lineValid(vals: number[]): boolean {
  let a = 0;
  let b = 0;
  for (const x of vals) {
    if (x === SUN) a++;
    else if (x === MOON) b++;
  }
  if (a > 3 || b > 3) return false;
  let run = 1;
  for (let i = 1; i < vals.length; i++) {
    if (vals[i] !== 0 && vals[i] === vals[i - 1]) {
      if (++run >= 3) return false;
    } else run = 1;
  }
  return true;
}

/** A complete line: exactly 3/3 and no three-in-a-row. */
function lineExact(vals: number[]): boolean {
  let a = 0;
  let b = 0;
  for (const x of vals) {
    if (x === SUN) a++;
    else if (x === MOON) b++;
  }
  return a === 3 && b === 3 && lineValid(vals);
}

/** Does setting cell `pos` to `v` keep its row, column and clues satisfiable? */
function feasible(
  grid: number[],
  pos: number,
  v: number,
  constraints: Constraint[],
): boolean {
  grid[pos] = v;
  const r = Math.floor(pos / N);
  const c = pos % N;
  const row: number[] = [];
  const col: number[] = [];
  for (let i = 0; i < N; i++) {
    row.push(grid[r * N + i]);
    col.push(grid[i * N + c]);
  }
  let ok = lineValid(row) && lineValid(col);
  if (ok) {
    for (const ct of constraints) {
      if (ct.a === pos || ct.b === pos) {
        const other = ct.a === pos ? ct.b : ct.a;
        if (grid[other] !== 0 && (grid[ct.a] === grid[ct.b]) !== ct.eq) {
          ok = false;
          break;
        }
      }
    }
  }
  grid[pos] = 0;
  return ok;
}

/** Count solutions of given+constraints up to `cap` (early-exit). */
function countSolutions(
  given: number[],
  constraints: Constraint[],
  cap: number,
): number {
  const grid = given.slice();
  let count = 0;
  const rec = (pos: number): boolean => {
    if (pos === N * N) {
      count++;
      return count >= cap;
    }
    if (grid[pos] !== 0) return rec(pos + 1);
    for (const v of [SUN, MOON]) {
      if (feasible(grid, pos, v, constraints)) {
        grid[pos] = v;
        const stop = rec(pos + 1);
        grid[pos] = 0;
        if (stop) return true;
      }
    }
    return false;
  };
  rec(0);
  return count;
}

/** Build a full valid solution by randomized backtracking. */
function buildSolution(rng: RNG): number[] | null {
  const grid = new Array<number>(N * N).fill(0);
  const rec = (pos: number): boolean => {
    if (pos === N * N) return true;
    for (const v of rng.shuffle([SUN, MOON])) {
      if (feasible(grid, pos, v, [])) {
        grid[pos] = v;
        if (rec(pos + 1)) return true;
        grid[pos] = 0;
      }
    }
    return false;
  };
  return rec(0) ? grid : null;
}

/** Higher = reveal more cells outright (easier). */
const REVEAL_BIAS: Record<Difficulty, number> = {
  easy: 0.7,
  medium: 0.45,
  hard: 0.25,
};

export function generate(
  difficulty: Difficulty,
  rng: RNG,
): PuzzleInstance<TangoData> {
  let solution: number[] | null = null;
  for (let i = 0; i < 30 && !solution; i++) solution = buildSolution(rng);
  if (!solution) solution = new Array<number>(N * N).fill(SUN); // unreachable

  // All adjacent pairs, each typed by the solution (= match, ✕ differ).
  const allPairs: Constraint[] = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const i = r * N + c;
      if (c < N - 1)
        allPairs.push({ a: i, b: i + 1, eq: solution[i] === solution[i + 1] });
      if (r < N - 1)
        allPairs.push({ a: i, b: i + N, eq: solution[i] === solution[i + N] });
    }

  const given = new Array<number>(N * N).fill(0);
  let constraints: Constraint[] = [];
  let hidden = rng.shuffle([...Array(N * N).keys()]);
  let pairs = rng.shuffle(allPairs);
  const bias = REVEAL_BIAS[difficulty];

  // Add clues (a revealed cell or a pair-relation) until the answer is forced.
  // Revealing every cell would make it unique, so this always terminates.
  while (countSolutions(given, constraints, 2) > 1) {
    const revealable = hidden.filter((i) => given[i] === 0);
    if (pairs.length === 0 || (revealable.length && rng.next() < bias)) {
      const i = revealable[0];
      given[i] = solution[i];
      hidden = hidden.filter((x) => x !== i);
    } else {
      constraints.push(pairs[0]);
      pairs = pairs.slice(1);
    }
  }

  // Greedy add can leave redundant clues. Prune any clue whose removal keeps the
  // solution unique — relations (= / ✕) first, since those are the visual noise.
  for (const ct of rng.shuffle([...constraints])) {
    const trial = constraints.filter((c) => c !== ct);
    if (countSolutions(given, trial, 2) === 1) constraints = trial;
  }
  for (const i of rng.shuffle([...Array(N * N).keys()])) {
    if (given[i] === 0) continue;
    const v = given[i];
    given[i] = 0;
    if (countSolutions(given, constraints, 2) !== 1) given[i] = v;
  }

  return {
    id: uid("tango"),
    modeId: "tango",
    difficulty,
    prompt: rng.pick(PROMPTS),
    hint: "Each row & column gets three of each. = matches, ✕ differs. Never three alike in a row.",
    xp: XP_BY_DIFFICULTY[difficulty],
    data: { n: N, given, solution, constraints },
  };
}

/** Win: full grid, every line balanced, and all clues honoured. */
export function solved(cells: number[], constraints: Constraint[]): boolean {
  for (const x of cells) if (x !== SUN && x !== MOON) return false;
  for (let r = 0; r < N; r++) {
    const row: number[] = [];
    const col: number[] = [];
    for (let i = 0; i < N; i++) {
      row.push(cells[r * N + i]);
      col.push(cells[i * N + r]);
    }
    if (!lineExact(row) || !lineExact(col)) return false;
  }
  for (const ct of constraints)
    if ((cells[ct.a] === cells[ct.b]) !== ct.eq) return false;
  return true;
}

/**
 * Cells that make the current fill impossible — drives live highlighting:
 * a 4th of a symbol in a row/column, a run of three alike, or a broken
 * = / ✕ clue. Only filled cells are flagged.
 */
export function conflicts(cells: number[], constraints: Constraint[]): boolean[] {
  const bad = new Array<boolean>(N * N).fill(false);
  const scan = (idxs: number[]) => {
    let s = 0;
    let m = 0;
    for (const i of idxs) {
      if (cells[i] === SUN) s++;
      else if (cells[i] === MOON) m++;
    }
    if (s > 3 || m > 3)
      for (const i of idxs)
        if ((s > 3 && cells[i] === SUN) || (m > 3 && cells[i] === MOON))
          bad[i] = true;
    for (let k = 2; k < idxs.length; k++) {
      const a = cells[idxs[k - 2]];
      if (a !== 0 && a === cells[idxs[k - 1]] && a === cells[idxs[k]])
        bad[idxs[k - 2]] = bad[idxs[k - 1]] = bad[idxs[k]] = true;
    }
  };
  for (let r = 0; r < N; r++) scan([...Array(N).keys()].map((c) => r * N + c));
  for (let c = 0; c < N; c++) scan([...Array(N).keys()].map((r) => r * N + c));
  for (const ct of constraints)
    if (
      cells[ct.a] !== 0 &&
      cells[ct.b] !== 0 &&
      (cells[ct.a] === cells[ct.b]) !== ct.eq
    )
      bad[ct.a] = bad[ct.b] = true;
  return bad;
}
