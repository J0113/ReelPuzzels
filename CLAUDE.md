# ReelPuzzels

A TikTok-style vertical "reel" of brain puzzles. Solve one puzzle at a time, earn XP,
build streaks/combos, climb levels. Built from a Claude Design handoff (`Logic
games-handoff.zip`) — the mockup was visual reference only; all game logic here is real.

## Stack & commands

- **Vite + React 18 + TypeScript.** Builds to a self-contained static `/dist` (deployable to
  any static host — `vite.config.ts` sets `base: "./"` so it works under any subpath).
- `npm run dev` — dev server (http://localhost:5173).
- `npm run build` — `tsc --noEmit` typecheck + `vite build` → `/dist`.
- `npm run preview` — serve the production build.

## How the app is wired

`src/main.tsx` → `src/App.tsx` is the screen router. Screens:
`onboarding | feed | single | menu | stats`. App owns theme + progress and passes them down.

- **Feed** (`src/screens/Feed.tsx`) — endless reel. Puzzles appended on demand (no fixed
  list, no progress dots). Difficulty **ramps** with `solvedCount` (`rampDifficulty` in the
  registry). Swipe / wheel / drag navigation ported from the mockup.
- **SingleGame** (`src/screens/SingleGame.tsx`) — practice one mode. Pick easy/medium/hard,
  play one puzzle at a time via a "Next puzzle" button. **No infinite scroll.**
- **Menu / Onboarding / Stats** — `src/screens/`. Stats are derived from real progress.

## Game modes are modular — this is the core extensibility point

Each mode is a self-contained folder under `src/games/<mode>/` that exports a
`GameModule` (see `src/types.ts`):

```ts
interface GameModule<D> {
  meta: GameMeta;                                   // id, skill label, styling
  generate(difficulty: Difficulty, rng: RNG): PuzzleInstance<D>;  // random puzzle
  Component: React.FC<PuzzleComponentProps<D>>;     // renders + drives the puzzle
}
```

**To add a new mode:** create `src/games/<mode>/` exporting a `GameModule`, then append it
to `MODES` in `src/games/registry.ts`. Nothing else changes — the feed, single-game,
menu, stats, and dispatch (`src/components/PuzzleBody.tsx`) all read from the registry.

Current modes (only two for now, by request):
- `src/games/wordScramble/` — pick a word from a length bucket, shuffle letters, accept
  listed anagrams. Word pools in `words.ts`.
- `src/games/speedMath/` — 3×3 grid where each row obeys `c = a op b`; one cell blanked.
  `+` (easy), `*` (medium), mixed/larger (hard). Generator in `generate.ts`.

Difficulty tiers: `easy | medium | hard`. Base XP per tier in `XP_BY_DIFFICULTY`
(`src/types.ts`): 100 / 150 / 220.

## Generation

`src/lib/rng.ts` — seedable RNG (mulberry32) with `int/pick/shuffle`, plus `uid()` for
instance ids. **Seedable on purpose**: a future server can hand the client a seed and both
sides produce identical puzzles.

## Scoring & timer (important behavior rules)

In `src/state/useProgress.ts` (`scoreSolve`, constants `DECAY=22`, `BONUS_FACTOR=0.6`,
`COMBO_STEP=15`):

- **The timer only ever counts UP.** There is no countdown anywhere (the mockup's live
  decaying speed-bonus meter was removed deliberately).
- The **speed bonus is computed but shown only AFTER solving**, in the solved tray
  (`src/components/PuzzleCard.tsx`, e.g. `+40 fast`). Never as a live meter during play.
- `gained = base xp + speedBonus + comboBonus`. Combo kicks in at streak ≥ 2.

## Progress store — built to move server-side

All progress goes through the async `ProgressStore` interface (`src/store/ProgressStore.ts`):

```ts
interface ProgressStore { load(): Promise<Progress>; save(p: Progress): Promise<void>; }
```

- Current impl: `LocalStorageStore` (key `rp_progress`).
- `src/store/index.ts` exports a single `store` instance — **the one line to change** to go
  server-side (swap for an `HttpProgressStore`). No call site changes, because everything
  consumes the interface via the `useProgress` hook.
- Theme (`rp_theme`) is a UI preference, persisted separately in `src/state/useTheme.ts`.

`Progress` = `{ xp, streak, bestStreak, solvedCount, timeSum, skills }`. `skills` is keyed
by mode id (solve counts), driving the Stats "skill power" bars.

## Styling

Ported from the design handoff, split into:
- `src/styles/tokens.css` — design tokens + both themes (`.stage[data-theme="neon|calm"]`),
  verbatim so colors/fonts match the mockup.
- `src/styles/app.css` — layout + components. Pattern / spatial / memory mode styles and the
  live speed meter were pruned (those modes are out of scope).

Font: Space Grotesk via `<link>` in `index.html`.

## Status / scope notes

- Only **Word Scramble** and **Speed Math** are implemented (intentional — more modes later).
- Mockup had pattern / spatial / memory modes; **dropped** for this build.
- Progress is **local only** for now; the store is structured for a server backend later.
- Generators sanity-checked: 1200 random puzzles across all tiers verified solvable
  (word = valid permutation of an accepted answer; math = single blank, integer answer,
  row rule holds).
