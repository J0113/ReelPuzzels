import { useEffect, useState, type ReactNode } from "react";
import { getMode } from "../games/registry";
import { fmt } from "../lib/format";
import type { PuzzleInstance } from "../types";
import type { SolveResult } from "../state/useProgress";
import { IBolt } from "./icons";
import { PuzzleBody } from "./PuzzleBody";
import { SolveBurst } from "./SolveBurst";

/**
 * One full puzzle "reel": header (skill / difficulty / xp), the mode body, the
 * solve celebration, and a solved tray. The speed bonus is only ever shown here
 * — after the solve — never as a live meter during play.
 */
export function PuzzleCard({
  puzzle,
  solved,
  result,
  onSolve,
  onMiss,
  footer,
  active = true,
}: {
  puzzle: PuzzleInstance;
  solved: boolean;
  result: SolveResult | null;
  onSolve: () => void;
  onMiss: () => void;
  /** Rendered inside the solved tray (e.g. a "next" button or swipe cue). */
  footer?: ReactNode;
  active?: boolean;
}) {
  const meta = getMode(puzzle.modeId)?.meta;
  const [burst, setBurst] = useState(false);

  // Flash the celebration overlay when this card transitions to solved.
  useEffect(() => {
    if (!solved) return;
    setBurst(true);
    const t = setTimeout(() => setBurst(false), 1100);
    return () => clearTimeout(t);
  }, [solved]);

  return (
    <div
      className="reel"
      aria-hidden={!active}
      {...(!active ? { inert: "" } : {})}
    >
      <div className="reel-head">
        <div className="badge-row">
          <span className={"skill-pill" + (meta?.lang ? " lang" : "")}>
            <span className="dot" />
            {meta?.skill}
          </span>
          <span className={"diff-tag " + puzzle.difficulty.toUpperCase()}>
            {puzzle.difficulty.toUpperCase()}
          </span>
          <span className="diff-tag xp">+{puzzle.xp} XP</span>
        </div>
        <h1 className="reel-prompt">{puzzle.prompt}</h1>
      </div>

      <div className="reel-center">
        <PuzzleBody
          puzzle={puzzle}
          solved={solved}
          onSolve={onSolve}
          onMiss={onMiss}
        />
      </div>

      {burst && <SolveBurst combo={result?.combo ?? 0} />}

      {solved && (
        <div className="solved-tray">
          <div className="score-row">
            <span className="score-chip xp">
              <IBolt /> +{result ? result.gained : puzzle.xp}
            </span>
            {result && (
              <span className="score-chip time">
                ⏱ {fmt(result.time)}
                {result.speedBonus > 0
                  ? ` · +${result.speedBonus} fast`
                  : " · base"}
              </span>
            )}
          </div>
          {footer}
        </div>
      )}
    </div>
  );
}
