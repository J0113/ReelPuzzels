import {
  XP_BY_DIFFICULTY,
  type Difficulty,
  type PuzzleInstance,
} from "../../types";
import { RNG, uid } from "../../lib/rng";

/** Cell states the player cycles through. */
export const EMPTY = 0;
export const MARK = 1; // an "X" (this cell can't hold a queen)
export const QUEEN = 2;

export interface QueensData {
  n: number;
  /** n*n → region index 0..n-1. Each region holds exactly one queen. */
  regionOf: number[];
  /** n*n → QUEEN for the generator's solution cells, else EMPTY. */
  solution: number[];
}

const PROMPTS = [
  "One queen per row, column and colour.",
  "Place the queens — none may touch.",
  "Crown each colour exactly once.",
];

const SIZE: Record<Difficulty, number> = { easy: 6, medium: 7, hard: 8 };

const orth = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * A permutation cols[r] = column of the queen in row r, with no two queens in
 * adjacent rows landing in adjacent columns (so no two queens ever touch).
 */
function placeQueens(n: number, rng: RNG): number[] | null {
  const cols = new Array<number>(n).fill(-1);
  const used = new Array<boolean>(n).fill(false);
  const rec = (r: number): boolean => {
    if (r === n) return true;
    for (const c of rng.shuffle([...Array(n).keys()])) {
      if (used[c]) continue;
      if (r > 0 && Math.abs(c - cols[r - 1]) < 2) continue;
      used[c] = true;
      cols[r] = c;
      if (rec(r + 1)) return true;
      used[c] = false;
    }
    return false;
  };
  return rec(0) ? cols : null;
}

/** Multi-source BFS from the queens → one contiguous region per queen. */
function growRegions(n: number, queens: number[], rng: RNG): number[] {
  const region = new Array<number>(n * n).fill(-1);
  let frontier: number[] = [];
  queens.forEach((idx, i) => {
    region[idx] = i;
    frontier.push(idx);
  });
  while (frontier.length) {
    const next: number[] = [];
    for (const idx of rng.shuffle(frontier)) {
      const r = Math.floor(idx / n);
      const c = idx % n;
      for (const [dr, dc] of rng.shuffle(orth)) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
        const nIdx = nr * n + nc;
        if (region[nIdx] === -1) {
          region[nIdx] = region[idx];
          next.push(nIdx);
        }
      }
    }
    frontier = next;
  }
  return region;
}

/** Find a valid arrangement different from `truth`, or null if it's unique. */
function findAlt(n: number, region: number[], truth: number[]): number[] | null {
  const colUsed = new Array<boolean>(n).fill(false);
  const regUsed = new Array<boolean>(n).fill(false);
  const pick = new Array<number>(n).fill(-1);
  let found: number[] | null = null;
  const rec = (r: number): boolean => {
    if (r === n) {
      if (pick.some((c, i) => c !== truth[i])) {
        found = pick.slice();
        return true;
      }
      return false;
    }
    for (let c = 0; c < n; c++) {
      if (colUsed[c]) continue;
      const reg = region[r * n + c];
      if (regUsed[reg]) continue;
      if (r > 0 && Math.abs(c - pick[r - 1]) <= 1) continue;
      colUsed[c] = true;
      regUsed[reg] = true;
      pick[r] = c;
      if (rec(r + 1)) return true;
      colUsed[c] = false;
      regUsed[reg] = false;
    }
    return false;
  };
  rec(0);
  return found;
}

/** Is region `g` still connected (and non-empty) if cell `drop` is removed? */
function connectedWithout(
  n: number,
  region: number[],
  g: number,
  drop: number,
): boolean {
  const cells: number[] = [];
  for (let i = 0; i < n * n; i++) if (region[i] === g && i !== drop) cells.push(i);
  if (!cells.length) return false;
  const seen = new Set<number>([cells[0]]);
  const stack = [cells[0]];
  while (stack.length) {
    const idx = stack.pop() as number;
    const r = Math.floor(idx / n);
    const c = idx % n;
    for (const [dr, dc] of orth) {
      const nr = r + dr;
      const nc = c + dc;
      const j = nr * n + nc;
      if (
        nr >= 0 &&
        nr < n &&
        nc >= 0 &&
        nc < n &&
        region[j] === g &&
        j !== drop &&
        !seen.has(j)
      ) {
        seen.add(j);
        stack.push(j);
      }
    }
  }
  return seen.size === cells.length;
}

/**
 * Force a unique solution by repeatedly finding an alternate arrangement and
 * breaking it: move one of its queen cells into an adjacent region. That makes
 * the alternate invalid while keeping the true solution valid and every region
 * contiguous. Returns true once unique (false if it gets stuck).
 */
function repair(
  n: number,
  region: number[],
  truth: number[],
  rng: RNG,
): boolean {
  const trueQ = new Array<number>(n).fill(-1);
  truth.forEach((c, r) => (trueQ[region[r * n + c]] = r * n + c));
  for (let iter = 0; iter < 3000; iter++) {
    const alt = findAlt(n, region, truth);
    if (!alt) return true;
    let moved = false;
    for (const r of rng.shuffle([...Array(n).keys()])) {
      const qc = r * n + alt[r];
      const g = region[qc];
      if (qc === trueQ[g]) continue; // don't move the true queen
      const cr = Math.floor(qc / n);
      const cc = qc % n;
      const hs: number[] = [];
      for (const [dr, dc] of orth) {
        const nr = cr + dr;
        const nc = cc + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
          const h = region[nr * n + nc];
          if (h !== g && !hs.includes(h)) hs.push(h);
        }
      }
      if (!hs.length || !connectedWithout(n, region, g, qc)) continue;
      region[qc] = rng.pick(hs);
      moved = true;
      break;
    }
    if (!moved) return false;
  }
  return false;
}

/**
 * Solve purely by deduction — never guessing — using only sound rules a human
 * would apply. Returns true if the board can be solved to completion this way.
 * If it can, the solution is forced (hence unique) and guess-free; that is the
 * acceptance test the generator uses.
 *
 * Rules, all sound (a queen never gets removed from where it truly belongs):
 *  - placing a queen eliminates its row, column, region and 8 neighbours;
 *  - a row / column / region with a single remaining candidate → place it;
 *  - confinement: a region whose candidates all share one row/column blocks
 *    other regions there, and the converse for a row/column confined to one
 *    region;
 *  - contradiction elimination (depth 1): if *tentatively* placing a queen on a
 *    candidate forces a contradiction under the above rules, that candidate is
 *    impossible and is removed. This is deduction, not guessing — it only ever
 *    removes options that provably cannot hold.
 */
interface QState {
  cand: boolean[];
  placed: boolean[];
  count: number;
}

/**
 * Solve with contradiction elimination up to `depth` levels of nesting. depth 0
 * = only direct rules (singles + confinement); each extra level lets the solver
 * reason "if a queen went here, a deeper contradiction follows, so it can't".
 * Deeper = stronger but slower. Returns true if fully solved without guessing.
 */
export function solvableByLogicDepth(
  n: number,
  regionOf: number[],
  depth: number,
): boolean {
  const total = n * n;
  const rows = Array.from({ length: n }, (_, r) =>
    [...Array(n).keys()].map((c) => r * n + c),
  );
  const cols = Array.from({ length: n }, (_, c) =>
    [...Array(n).keys()].map((r) => r * n + c),
  );
  const regs = Array.from({ length: n }, () => [] as number[]);
  for (let i = 0; i < total; i++) regs[regionOf[i]].push(i);
  const groups = [...rows, ...cols, ...regs];
  const hasQueen = (s: QState, g: number[]) => g.some((i) => s.placed[i]);

  const place = (s: QState, i: number) => {
    s.placed[i] = true;
    s.count++;
    const r = Math.floor(i / n);
    const c = i % n;
    for (let k = 0; k < n; k++) {
      s.cand[r * n + k] = false;
      s.cand[k * n + c] = false;
    }
    for (let k = 0; k < total; k++) if (regionOf[k] === regionOf[i]) s.cand[k] = false;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n) s.cand[nr * n + nc] = false;
      }
  };

  // One sweep of confinement rules. Returns true if anything changed.
  const confine = (s: QState): boolean => {
    let changed = false;
    for (let gi = 0; gi < n; gi++) {
      if (hasQueen(s, regs[gi])) continue;
      const cs = regs[gi].filter((i) => s.cand[i]);
      if (cs.length < 2) continue;
      const rs = new Set(cs.map((i) => Math.floor(i / n)));
      const cset = new Set(cs.map((i) => i % n));
      if (rs.size === 1) {
        const r = rs.values().next().value as number;
        for (const i of rows[r])
          if (s.cand[i] && regionOf[i] !== gi) ((s.cand[i] = false), (changed = true));
      }
      if (cset.size === 1) {
        const c = cset.values().next().value as number;
        for (const i of cols[c])
          if (s.cand[i] && regionOf[i] !== gi) ((s.cand[i] = false), (changed = true));
      }
    }
    for (let r = 0; r < n; r++) {
      if (hasQueen(s, rows[r])) continue;
      const cs = rows[r].filter((i) => s.cand[i]);
      if (cs.length < 2) continue;
      const rs = new Set(cs.map((i) => regionOf[i]));
      if (rs.size === 1) {
        const g = rs.values().next().value as number;
        for (const i of regs[g])
          if (s.cand[i] && Math.floor(i / n) !== r) ((s.cand[i] = false), (changed = true));
      }
    }
    for (let c = 0; c < n; c++) {
      if (hasQueen(s, cols[c])) continue;
      const cs = cols[c].filter((i) => s.cand[i]);
      if (cs.length < 2) continue;
      const rs = new Set(cs.map((i) => regionOf[i]));
      if (rs.size === 1) {
        const g = rs.values().next().value as number;
        for (const i of regs[g])
          if (s.cand[i] && i % n !== c) ((s.cand[i] = false), (changed = true));
      }
    }
    return changed;
  };

  // Propagate to a fixpoint. Returns true on contradiction.
  const propagate = (s: QState, d: number): boolean => {
    for (;;) {
      let changed = false;
      for (const g of groups) {
        if (hasQueen(s, g)) continue;
        const cs = g.filter((i) => s.cand[i]);
        if (cs.length === 0) return true;
        if (cs.length === 1) {
          place(s, cs[0]);
          changed = true;
        }
      }
      if (changed) continue;
      if (confine(s)) continue;
      if (d > 0) {
        let elim = false;
        for (let i = 0; i < total; i++) {
          if (!s.cand[i]) continue;
          const t: QState = {
            cand: s.cand.slice(),
            placed: s.placed.slice(),
            count: s.count,
          };
          place(t, i);
          if (propagate(t, d - 1)) {
            s.cand[i] = false;
            elim = true;
          }
        }
        if (elim) continue;
      }
      break;
    }
    return false;
  };

  const s: QState = {
    cand: new Array<boolean>(total).fill(true),
    placed: new Array<boolean>(total).fill(false),
    count: 0,
  };
  if (propagate(s, depth)) return false;
  return s.count === n;
}

/** Guess-free solvability at the depth the generator targets. */
export function solvableByLogic(n: number, regionOf: number[]): boolean {
  return solvableByLogicDepth(n, regionOf, 2);
}

export function generate(
  difficulty: Difficulty,
  rng: RNG,
): PuzzleInstance<QueensData> {
  const n = SIZE[difficulty];

  // Seed (always succeeds for n ≥ 4).
  let cols = placeQueens(n, rng);
  while (!cols) cols = placeQueens(n, rng);
  let queens = cols.map((c, r) => r * n + c);
  let regionOf = growRegions(n, queens, rng);

  // Grow regions, then repair to a UNIQUE solution and confirm it's solvable by
  // pure deduction (no guessing). Every unique board has proven solvable here,
  // so this almost always succeeds within a handful of tries.
  for (let attempt = 0; attempt < 300; attempt++) {
    const c = placeQueens(n, rng);
    if (!c) continue;
    const q = c.map((col, r) => r * n + col);
    const region = growRegions(n, q, rng);
    if (repair(n, region, c, rng) && solvableByLogic(n, region)) {
      cols = c;
      queens = q;
      regionOf = region;
      break;
    }
  }

  const solution = new Array<number>(n * n).fill(EMPTY);
  for (const q of queens) solution[q] = QUEEN;

  return {
    id: uid("queens"),
    modeId: "queens",
    difficulty,
    prompt: rng.pick(PROMPTS),
    hint: "Exactly one queen per row, column and colour — and none adjacent, even diagonally.",
    xp: XP_BY_DIFFICULTY[difficulty],
    data: { n, regionOf, solution },
  };
}

/** Win: one queen per row, column and region, with no two queens touching. */
export function solved(
  state: number[],
  n: number,
  regionOf: number[],
): boolean {
  const rowCnt = new Array<number>(n).fill(0);
  const colCnt = new Array<number>(n).fill(0);
  const regCnt = new Array<number>(n).fill(0);
  const qs: number[] = [];
  for (let i = 0; i < n * n; i++) {
    if (state[i] === QUEEN) {
      qs.push(i);
      rowCnt[Math.floor(i / n)]++;
      colCnt[i % n]++;
      regCnt[regionOf[i]]++;
    }
  }
  if (qs.length !== n) return false;
  for (let k = 0; k < n; k++)
    if (rowCnt[k] !== 1 || colCnt[k] !== 1 || regCnt[k] !== 1) return false;
  for (const i of qs) {
    const r = Math.floor(i / n);
    const c = i % n;
    for (const j of qs) {
      if (i === j) continue;
      const r2 = Math.floor(j / n);
      const c2 = j % n;
      if (Math.abs(r - r2) <= 1 && Math.abs(c - c2) <= 1) return false;
    }
  }
  return true;
}
