/**
 * Generator sanity harness. Kept out of src/ so `tsc` doesn't typecheck its
 * Node globals. Run with: npm run validate
 *
 * Generates many puzzles per mode/tier and asserts each is well-formed and
 * solvable by its own win-predicate — mirroring the project's existing
 * "verified solvable" checks for word/math.
 */
import { RNG } from "../src/lib/rng";
import { DIFFICULTIES, type Difficulty } from "../src/types";

import * as sudoku from "../src/games/miniSudoku/logic";
import * as queens from "../src/games/queens/logic";
import * as zip from "../src/games/zip/logic";
import * as tango from "../src/games/tango/logic";
import * as patches from "../src/games/patches/logic";

const PER_TIER = 150;
let failures = 0;

function check(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    if (failures <= 20) console.error("  ✗ " + msg);
  }
}

function run(name: string, fn: (d: Difficulty, rng: RNG) => void) {
  const t0 = Date.now();
  const before = failures;
  for (const d of DIFFICULTIES)
    for (let i = 0; i < PER_TIER; i++) fn(d, new RNG(i * 7919 + d.length * 131));
  const n = PER_TIER * DIFFICULTIES.length;
  console.log(
    `${failures - before === 0 ? "✓" : "✗"} ${name}: ${n} puzzles, ${failures - before} failures (${Date.now() - t0}ms)`,
  );
}

run("miniSudoku", (d, rng) => {
  const p = sudoku.generate(d, rng);
  const { given, solution } = p.data;
  check(sudoku.solved(solution, solution), `sudoku ${p.id}: solution not solved`);
  check(
    sudoku.conflicts(solution).every((b) => !b),
    `sudoku ${p.id}: solution has conflicts`,
  );
  check(
    given.every((v, i) => v === 0 || v === solution[i]),
    `sudoku ${p.id}: given disagrees with solution`,
  );
  check(given.some((v) => v === 0), `sudoku ${p.id}: nothing removed`);
});

run("queens", (d, rng) => {
  const p = queens.generate(d, rng);
  const { n, regionOf, solution } = p.data;
  check(queens.solved(solution, n, regionOf), `queens ${p.id}: solution not solved`);
  check(regionOf.every((r) => r >= 0 && r < n), `queens ${p.id}: bad region id`);
  check(new Set(regionOf).size === n, `queens ${p.id}: not ${n} regions`);
  check(
    queens.solvableByLogic(n, regionOf),
    `queens ${p.id}: not solvable by pure logic`,
  );
});

run("zip", (d, rng) => {
  const p = zip.generate(d, rng);
  const { n, numbers, solution } = p.data;
  check(zip.solved(solution, n, numbers), `zip ${p.id}: solution not solved`);
  const max = Math.max(...numbers);
  check(
    numbers.filter((x) => x > 0).length === max,
    `zip ${p.id}: checkpoint numbering broken`,
  );
  check(solution.length === n * n, `zip ${p.id}: path doesn't cover grid`);
});

run("tango", (d, rng) => {
  const p = tango.generate(d, rng);
  const { given, solution, constraints } = p.data;
  check(tango.solved(solution, constraints), `tango ${p.id}: solution not solved`);
  check(
    given.every((v, i) => v === 0 || v === solution[i]),
    `tango ${p.id}: given disagrees with solution`,
  );
});

run("patches", (d, rng) => {
  const p = patches.generate(d, rng);
  const { n, clues, solution } = p.data;
  check(patches.solved(solution, n, clues), `patches ${p.id}: solution not solved`);
  check(
    patches.countSolutions(n, clues, 2) === 1,
    `patches ${p.id}: solution not unique`,
  );
  check(
    clues.every((c, i) => solution[c.cell] === i),
    `patches ${p.id}: clue cell not owned by its shape`,
  );
});

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
