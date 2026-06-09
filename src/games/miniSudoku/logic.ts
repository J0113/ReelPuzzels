import {
  XP_BY_DIFFICULTY,
  type Difficulty,
  type PuzzleInstance,
} from "../../types";
import { RNG, uid } from "../../lib/rng";

/** 6×6 Sudoku with 2-row × 3-col boxes. */
export const N = 6;
export const BOX_H = 2; // box height in rows
export const BOX_W = 3; // box width in cols

export interface SudokuData {
  /** 36 cells, 0 = blank. The clues the player starts with. */
  given: number[];
  /** 36 cells, the unique completed solution. */
  solution: number[];
}

const PROMPTS = [
  "Fill the grid so every line holds 1–6.",
  "One number per row, column and box.",
  "Complete the mini sudoku.",
];

/** Could value v legally sit at (r,c) given the partial grid (0 = blank)? */
function legal(grid: number[], r: number, c: number, v: number): boolean {
  for (let i = 0; i < N; i++) {
    if (grid[r * N + i] === v) return false; // row
    if (grid[i * N + c] === v) return false; // column
  }
  const br = Math.floor(r / BOX_H) * BOX_H;
  const bc = Math.floor(c / BOX_W) * BOX_W;
  for (let dr = 0; dr < BOX_H; dr++)
    for (let dc = 0; dc < BOX_W; dc++)
      if (grid[(br + dr) * N + (bc + dc)] === v) return false; // box
  return true;
}

/** Fill a complete valid grid in place via randomized backtracking. */
function fill(grid: number[], pos: number, rng: RNG): boolean {
  if (pos === N * N) return true;
  if (grid[pos] !== 0) return fill(grid, pos + 1, rng);
  const r = Math.floor(pos / N);
  const c = pos % N;
  for (const v of rng.shuffle([1, 2, 3, 4, 5, 6])) {
    if (legal(grid, r, c, v)) {
      grid[pos] = v;
      if (fill(grid, pos + 1, rng)) return true;
      grid[pos] = 0;
    }
  }
  return false;
}

/** True if the puzzle (0 = blank) has exactly one completion. */
function unique(puzzle: number[]): boolean {
  const grid = puzzle.slice();
  let count = 0;
  // Returns true once a second solution is found (early-exit).
  const rec = (): boolean => {
    let pos = -1;
    for (let i = 0; i < N * N; i++)
      if (grid[i] === 0) {
        pos = i;
        break;
      }
    if (pos === -1) {
      count++;
      return count >= 2;
    }
    const r = Math.floor(pos / N);
    const c = pos % N;
    for (let v = 1; v <= N; v++) {
      if (legal(grid, r, c, v)) {
        grid[pos] = v;
        const stop = rec();
        grid[pos] = 0;
        if (stop) return true;
      }
    }
    return false;
  };
  rec();
  return count === 1;
}

/** How many clues to dig out, by tier (more removed = harder). */
const REMOVE: Record<Difficulty, number> = { easy: 12, medium: 18, hard: 24 };

export function generate(
  difficulty: Difficulty,
  rng: RNG,
): PuzzleInstance<SudokuData> {
  const solution = new Array<number>(N * N).fill(0);
  fill(solution, 0, rng);

  // Dig holes while the solution stays unique.
  const given = solution.slice();
  const target = REMOVE[difficulty];
  let removed = 0;
  for (const idx of rng.shuffle([...Array(N * N).keys()])) {
    if (removed >= target) break;
    const backup = given[idx];
    given[idx] = 0;
    if (unique(given)) removed++;
    else given[idx] = backup;
  }

  return {
    id: uid("sudoku"),
    modeId: "sudoku",
    difficulty,
    prompt: rng.pick(PROMPTS),
    hint: "Each row, column and 2×3 box uses 1–6 exactly once.",
    xp: XP_BY_DIFFICULTY[difficulty],
    data: { given, solution },
  };
}

/** Win when the board is full and matches the (unique) solution. */
export function solved(cells: number[], solution: number[]): boolean {
  for (let i = 0; i < N * N; i++)
    if (cells[i] === 0 || cells[i] !== solution[i]) return false;
  return true;
}

/** Cells that clash with another filled cell in their row, column or box. */
export function conflicts(cells: number[]): boolean[] {
  const bad = new Array<boolean>(N * N).fill(false);
  const mark = (a: number, b: number) => {
    if (cells[a] !== 0 && cells[a] === cells[b]) {
      bad[a] = true;
      bad[b] = true;
    }
  };
  for (let r = 0; r < N; r++)
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++) mark(r * N + i, r * N + j);
  for (let c = 0; c < N; c++)
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++) mark(i * N + c, j * N + c);
  for (let b = 0; b < N; b++) {
    const br = Math.floor(b / (N / BOX_W)) * BOX_H;
    const bc = (b % (N / BOX_W)) * BOX_W;
    const idx: number[] = [];
    for (let dr = 0; dr < BOX_H; dr++)
      for (let dc = 0; dc < BOX_W; dc++) idx.push((br + dr) * N + (bc + dc));
    for (let i = 0; i < idx.length; i++)
      for (let j = i + 1; j < idx.length; j++) mark(idx[i], idx[j]);
  }
  return bad;
}
