import {
  XP_BY_DIFFICULTY,
  type Difficulty,
  type PuzzleInstance,
} from "../../types";
import { RNG, uid } from "../../lib/rng";

/**
 * Patches (LinkedIn-style): partition the whole grid into rectangles/squares.
 * Each shape contains exactly one clue cell; a clue may reveal the shape's size
 * (cell count) and/or its type (square / tall / wide). Win when the grid is
 * tiled with no gaps or overlaps and every shape matches its clue.
 */
export type ShapeType = "square" | "tall" | "wide";

export interface Clue {
  cell: number; // grid index of this shape's clue cell
  size: number | null; // revealed area, or null = unknown
  type: ShapeType | null; // revealed shape type, or null = unknown
}

export interface PatchesData {
  n: number;
  clues: Clue[];
  /** n*n → index of the clue/shape that owns each cell (the answer). */
  solution: number[];
}

const PROMPTS = [
  "Cut the grid into rectangles — one clue each.",
  "Tile the board: every shape fits its clue.",
  "Fill the square with patches, no gaps.",
];

const SIZE: Record<Difficulty, number> = { easy: 4, medium: 5, hard: 6 };
const KEEP: Record<Difficulty, number> = { easy: 0.55, medium: 0.45, hard: 0.4 };
const MAX_AREA: Record<Difficulty, number> = { easy: 9, medium: 8, hard: 6 };
/** Probability of trying to hide a given clue field (higher = harder). */
const HIDE: Record<Difficulty, number> = { easy: 0.2, medium: 0.55, hard: 0.9 };

export function shapeType(w: number, h: number): ShapeType {
  return w === h ? "square" : h > w ? "tall" : "wide";
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Recursively (guillotine) cut the grid into rectangles. */
function carve(n: number, difficulty: Difficulty, rng: RNG): Rect[] {
  const rects: Rect[] = [];
  const rec = (x: number, y: number, w: number, h: number) => {
    const canV = w >= 2;
    const canH = h >= 2;
    if (
      (!canV && !canH) ||
      (w * h <= MAX_AREA[difficulty] && rng.next() < KEEP[difficulty])
    ) {
      rects.push({ x, y, w, h });
      return;
    }
    if (canV && (!canH || rng.next() < 0.5)) {
      const cut = rng.int(1, w - 1);
      rec(x, y, cut, h);
      rec(x + cut, y, w - cut, h);
    } else {
      const cut = rng.int(1, h - 1);
      rec(x, y, w, cut);
      rec(x, y + cut, w, h - cut);
    }
  };
  rec(0, 0, n, n);
  return rects;
}

/** Count tilings consistent with the clues, up to `cap` (early-exit). */
export function countSolutions(n: number, clues: Clue[], cap: number): number {
  const clueAt = new Map<number, number>();
  clues.forEach((c, i) => clueAt.set(c.cell, i));
  const covered = new Array<boolean>(n * n).fill(false);
  let count = 0;

  const rec = (): boolean => {
    let tl = -1;
    for (let i = 0; i < n * n; i++)
      if (!covered[i]) {
        tl = i;
        break;
      }
    if (tl === -1) {
      count++;
      return count >= cap;
    }
    const x = tl % n;
    const y = Math.floor(tl / n);
    // Every rectangle covering tl has its top-left corner exactly at tl.
    let width = n - x;
    for (let h = 1; y + h <= n; h++) {
      let run = 0;
      while (x + run < n && !covered[(y + h - 1) * n + (x + run)]) run++;
      width = Math.min(width, run);
      if (width === 0) break;
      for (let w = 1; w <= width; w++) {
        let cc = 0;
        let ci = -1;
        for (let dy = 0; dy < h; dy++)
          for (let dx = 0; dx < w; dx++) {
            const c = clueAt.get((y + dy) * n + (x + dx));
            if (c !== undefined) {
              cc++;
              ci = c;
            }
          }
        if (cc >= 2) break; // two clues → this and any wider rect are invalid
        if (cc === 0) continue; // need a clue; a larger rect may include one
        const clue = clues[ci];
        if (clue.size !== null && clue.size !== w * h) continue;
        if (clue.type !== null && shapeType(w, h) !== clue.type) continue;
        for (let dy = 0; dy < h; dy++)
          for (let dx = 0; dx < w; dx++) covered[(y + dy) * n + (x + dx)] = true;
        const stop = rec();
        for (let dy = 0; dy < h; dy++)
          for (let dx = 0; dx < w; dx++) covered[(y + dy) * n + (x + dx)] = false;
        if (stop) return true;
      }
    }
    return false;
  };

  rec();
  return count;
}

export function generate(
  difficulty: Difficulty,
  rng: RNG,
): PuzzleInstance<PatchesData> {
  const n = SIZE[difficulty];

  let rects: Rect[] = [];
  let clues: Clue[] = [];
  // Retry until full-info clues describe a unique tiling.
  for (let attempt = 0; attempt < 80; attempt++) {
    rects = carve(n, difficulty, rng);
    if (rects.length < 3) continue;
    clues = rects.map((r) => {
      const cx = r.x + rng.int(0, r.w - 1);
      const cy = r.y + rng.int(0, r.h - 1);
      return {
        cell: cy * n + cx,
        size: r.w * r.h,
        type: shapeType(r.w, r.h),
      };
    });
    if (countSolutions(n, clues, 2) === 1) break;
  }

  // Hide clue fields while the tiling stays unique (more hidden = harder).
  const fields: [number, "size" | "type"][] = [];
  clues.forEach((_, i) => fields.push([i, "size"], [i, "type"]));
  for (const [i, f] of rng.shuffle(fields)) {
    if (rng.next() > HIDE[difficulty]) continue;
    const backup = clues[i][f];
    (clues[i] as Clue)[f] = null as never;
    if (countSolutions(n, clues, 2) !== 1) (clues[i] as Clue)[f] = backup as never;
  }

  const solution = new Array<number>(n * n).fill(-1);
  rects.forEach((r, i) => {
    for (let dy = 0; dy < r.h; dy++)
      for (let dx = 0; dx < r.w; dx++)
        solution[(r.y + dy) * n + (r.x + dx)] = i;
  });

  return {
    id: uid("patches"),
    modeId: "patches",
    difficulty,
    prompt: rng.pick(PROMPTS),
    hint: "Drag a rectangle around each clue. Number = cell count; ◻ square · ▯ tall · ▭ wide.",
    xp: XP_BY_DIFFICULTY[difficulty],
    data: { n, clues, solution },
  };
}

/** Bounding box + cell count of the cells a clue currently owns. */
function ownedBox(owner: number[], n: number, clue: number) {
  let x0 = n;
  let y0 = n;
  let x1 = -1;
  let y1 = -1;
  let count = 0;
  for (let i = 0; i < n * n; i++)
    if (owner[i] === clue) {
      const x = i % n;
      const y = Math.floor(i / n);
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
      count++;
    }
  return { x0, y0, x1, y1, count };
}

/** Win: grid fully owned, each shape a rectangle matching its clue. */
export function solved(owner: number[], n: number, clues: Clue[]): boolean {
  for (let i = 0; i < n * n; i++) if (owner[i] < 0) return false;
  for (let i = 0; i < clues.length; i++) {
    const clue = clues[i];
    const { x0, y0, x1, y1, count } = ownedBox(owner, n, i);
    if (count === 0) return false;
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    if (w * h !== count) return false; // not a solid rectangle
    if (owner[clue.cell] !== i) return false; // clue cell must belong to it
    if (clue.size !== null && clue.size !== count) return false;
    if (clue.type !== null && shapeType(w, h) !== clue.type) return false;
  }
  return true;
}
