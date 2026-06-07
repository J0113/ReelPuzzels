import { useCallback, useEffect, useRef, useState } from "react";
import { store, DEFAULT_PROGRESS, type Progress } from "../store";
import type { PuzzleInstance } from "../types";

/** Seconds until the speed bonus reaches zero (matches the mockup). */
export const DECAY = 22;
/** Max speed bonus as a fraction of base XP. */
export const BONUS_FACTOR = 0.6;
/** Flat bonus per combo step once a streak of 2+ is active. */
export const COMBO_STEP = 15;

export interface SolveResult {
  /** Total XP gained for this solve (base + speed + combo). */
  gained: number;
  /** Speed-only portion, surfaced in the solved tray ("+N fast"). */
  speedBonus: number;
  /** Combo multiplier in effect (0 when no combo). */
  combo: number;
  /** Seconds the solve took. */
  time: number;
}

/** Pure scoring so it can be unit-tested / shared with a server. */
export function scoreSolve(
  puzzle: PuzzleInstance,
  elapsed: number,
  prevStreak: number,
): SolveResult {
  const speedBonus = Math.max(
    0,
    Math.round(puzzle.xp * BONUS_FACTOR * (1 - elapsed / DECAY)),
  );
  const newStreak = prevStreak + 1;
  const combo = newStreak >= 2 ? newStreak : 0;
  const comboBonus = combo ? combo * COMBO_STEP : 0;
  return {
    gained: puzzle.xp + speedBonus + comboBonus,
    speedBonus,
    combo,
    time: elapsed,
  };
}

export interface UseProgress {
  progress: Progress;
  ready: boolean;
  /** Apply a solve, persist, and return the score breakdown for the UI. */
  recordSolve(puzzle: PuzzleInstance, elapsed: number): SolveResult;
  /** Reset the streak without scoring (e.g. on giving up — unused for now). */
  breakStreak(): void;
}

export function useProgress(): UseProgress {
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    store.load().then((p) => {
      if (alive) {
        setProgress(p);
        setReady(true);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // Debounced persistence whenever progress changes (after initial load).
  useEffect(() => {
    if (!ready) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void store.save(progress);
    }, 250);
    return () => window.clearTimeout(saveTimer.current);
  }, [progress, ready]);

  const recordSolve = useCallback(
    (puzzle: PuzzleInstance, elapsed: number): SolveResult => {
      // Score against the streak we currently hold (one solve per interaction).
      const result = scoreSolve(puzzle, elapsed, progress.streak);
      setProgress((prev) => {
        const newStreak = prev.streak + 1;
        return {
          xp: prev.xp + result.gained,
          streak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          solvedCount: prev.solvedCount + 1,
          timeSum: prev.timeSum + elapsed,
          skills: {
            ...prev.skills,
            [puzzle.modeId]: (prev.skills[puzzle.modeId] ?? 0) + 1,
          },
        };
      });
      return result;
    },
    [progress.streak],
  );

  const breakStreak = useCallback(() => {
    setProgress((prev) => (prev.streak === 0 ? prev : { ...prev, streak: 0 }));
  }, []);

  return { progress, ready, recordSolve, breakStreak };
}
