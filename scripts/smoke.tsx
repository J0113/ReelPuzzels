/**
 * Render smoke test: mounts every mode's real React component (unsolved and
 * solved) for a generated puzzle and asserts it renders without throwing.
 * Run with: npm run smoke
 */
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server.browser";
import { MODES } from "../src/games/registry";
import { DIFFICULTIES } from "../src/types";
import { RNG } from "../src/lib/rng";

let failures = 0;

for (const mode of MODES) {
  for (const d of DIFFICULTIES) {
    const puzzle = mode.generate(d, new RNG(123 + d.length));
    for (const solved of [false, true]) {
      try {
        const html = renderToStaticMarkup(
          h(mode.Component, {
            puzzle,
            solved,
            onSolve: () => {},
            onMiss: () => {},
          }),
        );
        if (!html || html.length < 5) throw new Error("empty render");
      } catch (e) {
        failures++;
        console.error(`  ✗ ${mode.meta.id} ${d} solved=${solved}: ${e}`);
      }
    }
  }
  console.log(`✓ ${mode.meta.id} (${mode.meta.skillFull}) rendered`);
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
