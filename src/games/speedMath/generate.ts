import {
  XP_BY_DIFFICULTY,
  type Difficulty,
  type PuzzleInstance,
} from "../../types";
import { RNG, uid } from "../../lib/rng";

export interface MathData {
  /** 9 cells (3×3). The blanked cell holds "?". */
  grid: (number | string)[];
  /** Flat index 0–8 of the blanked cell. */
  qIndex: number;
  /** Value that belongs in the blanked cell. */
  answer: number;
}

type Op = "+" | "*";

interface Spec {
  op: Op;
  aRange: [number, number];
  bRange: [number, number];
}

// Each difficulty maps to the row rule c = a op b with these operand ranges.
const SPECS: Record<Difficulty, Spec[]> = {
  easy: [{ op: "+", aRange: [1, 9], bRange: [1, 9] }],
  medium: [{ op: "*", aRange: [2, 9], bRange: [2, 9] }],
  hard: [
    { op: "*", aRange: [3, 12], bRange: [3, 12] },
    { op: "+", aRange: [11, 49], bRange: [11, 49] },
  ],
};

const apply = (op: Op, a: number, b: number) => (op === "+" ? a + b : a * b);

const PROMPTS = [
  "One cell is missing. What belongs there?",
  "Find the number that completes the grid.",
  "Each row plays by the same rule — fill the gap.",
];

export function generate(
  difficulty: Difficulty,
  rng: RNG,
): PuzzleInstance<MathData> {
  const spec = rng.pick(SPECS[difficulty]);

  // Build three rows of [a, b, c] where c = a op b.
  const rows: number[][] = [];
  for (let r = 0; r < 3; r++) {
    const a = rng.int(...spec.aRange);
    const b = rng.int(...spec.bRange);
    rows.push([a, b, apply(spec.op, a, b)]);
  }

  // Blank one cell. Any column is recoverable from the shared rule.
  const r = rng.int(0, 2);
  const c = rng.int(0, 2);
  const answer = rows[r][c];
  const qIndex = r * 3 + c;

  const grid: (number | string)[] = rows
    .flat()
    .map((v, i) => (i === qIndex ? "?" : v));

  return {
    id: uid("math"),
    modeId: "math",
    difficulty,
    prompt: rng.pick(PROMPTS),
    hint: "Scan each row for the rule, then solve the gap.",
    xp: XP_BY_DIFFICULTY[difficulty],
    data: { grid, qIndex, answer },
  };
}
