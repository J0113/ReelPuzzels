import {
  XP_BY_DIFFICULTY,
  type Difficulty,
  type PuzzleInstance,
} from "../../types";
import { RNG, uid } from "../../lib/rng";

export interface ZipData {
  n: number;
  /** n*n → checkpoint number (1..K) or 0 for a plain cell. */
  numbers: number[];
  /** A valid ordered path covering every cell (the generator's solution). */
  solution: number[];
}

const PROMPTS = [
  "Draw one line through every cell, in order.",
  "Connect 1 → last, filling the whole grid.",
  "Trace a path that hits the numbers in sequence.",
];

const SIZE: Record<Difficulty, number> = { easy: 5, medium: 7, hard: 8 };
const CHECKS: Record<Difficulty, number> = { easy: 5, medium: 8, hard: 11 };

/** Orthogonal neighbours of a cell index. */
export function neighbors(idx: number, n: number): number[] {
  const r = Math.floor(idx / n);
  const c = idx % n;
  const out: number[] = [];
  if (r > 0) out.push(idx - n);
  if (r < n - 1) out.push(idx + n);
  if (c > 0) out.push(idx - 1);
  if (c < n - 1) out.push(idx + 1);
  return out;
}

/** Snake path through the whole grid — the seed for randomization. */
function boustrophedon(n: number): number[] {
  const path: number[] = [];
  for (let r = 0; r < n; r++) {
    const cols = [...Array(n).keys()];
    if (r % 2 === 1) cols.reverse();
    for (const c of cols) path.push(r * n + c);
  }
  return path;
}

/**
 * A random Hamiltonian path via the "backbite" algorithm: starting from a
 * snake path, repeatedly fold an endpoint onto one of its grid neighbours.
 * Every move provably keeps the path Hamiltonian, so this never backtracks and
 * always returns a full-grid path (unlike a DFS search, which can blow up).
 */
function hamiltonian(n: number, rng: RNG): number[] {
  const total = n * n;
  const path = boustrophedon(n);
  const pos = new Array<number>(total); // cell → its index along the path
  const sync = () => {
    for (let i = 0; i < total; i++) pos[path[i]] = i;
  };
  const reverse = (lo: number, hi: number) => {
    while (lo < hi) {
      const t = path[lo];
      path[lo] = path[hi];
      path[hi] = t;
      lo++;
      hi--;
    }
  };
  sync();
  for (let m = 0; m < total * 40; m++) {
    const fromTail = rng.next() < 0.5;
    const end = fromTail ? path[total - 1] : path[0];
    const k = pos[rng.pick(neighbors(end, n))];
    if (fromTail) {
      if (k >= total - 2) continue; // already adjacent to the tail
      reverse(k + 1, total - 1);
    } else {
      if (k <= 1) continue; // already adjacent to the head
      reverse(0, k - 1);
    }
    sync();
  }
  return path;
}

export function generate(
  difficulty: Difficulty,
  rng: RNG,
): PuzzleInstance<ZipData> {
  const n = SIZE[difficulty];
  const total = n * n;
  const path = hamiltonian(n, rng);

  // Checkpoints: always the first and last path positions, plus interior ones,
  // numbered 1..K in path order so they are inherently ascending.
  const k = CHECKS[difficulty];
  const interior = rng
    .shuffle([...Array(total - 2).keys()].map((x) => x + 1))
    .slice(0, k - 2);
  const positions = [0, total - 1, ...interior].sort((a, b) => a - b);

  const numbers = new Array<number>(total).fill(0);
  positions.forEach((p, i) => {
    numbers[path[p]] = i + 1;
  });

  return {
    id: uid("zip"),
    modeId: "zip",
    difficulty,
    prompt: rng.pick(PROMPTS),
    hint: "Start at 1, end at the last number, and cover every cell once.",
    xp: XP_BY_DIFFICULTY[difficulty],
    data: { n, numbers, solution: path },
  };
}

/** Win: path covers every cell once, is connected, and hits 1..K in order. */
export function solved(path: number[], n: number, numbers: number[]): boolean {
  const total = n * n;
  if (path.length !== total) return false;
  const seen = new Set<number>();
  for (const x of path) {
    if (seen.has(x)) return false;
    seen.add(x);
  }
  for (let i = 1; i < path.length; i++)
    if (!neighbors(path[i - 1], n).includes(path[i])) return false;
  let expect = 1;
  const max = Math.max(...numbers);
  for (const x of path)
    if (numbers[x] > 0) {
      if (numbers[x] !== expect) return false;
      expect++;
    }
  return expect - 1 === max;
}
