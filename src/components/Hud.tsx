import { fmt } from "../lib/format";
import { IBolt, IBrain, IFlame, IGrid, ITrophy } from "./icons";

/**
 * Top bar: brand, streak + xp chips, a live count-UP elapsed stopwatch (never a
 * countdown), and menu / stats buttons.
 */
export function Hud({
  streak,
  xp,
  elapsed,
  onOpenMenu,
  onOpenStats,
}: {
  streak: number;
  xp: number;
  /** Live elapsed seconds for the active puzzle, or null to hide the clock. */
  elapsed: number | null;
  onOpenMenu: () => void;
  onOpenStats: () => void;
}) {
  return (
    <div className="hud">
      <div className="brand">
        <span className="brand-mark">
          <IBrain />
        </span>
        <span className="brand-name">
          Reel<b>Puzzles</b>
        </span>
      </div>
      {elapsed !== null && (
        <div className="hud-chip clock">⏱ {fmt(elapsed)}</div>
      )}
      <div className="hud-chip streak" aria-label={`Streak: ${streak}`}>
        <IFlame />
        {streak}
      </div>
      <div className="hud-chip xp" aria-label={`XP: ${xp}`}>
        <IBolt />
        {xp}
      </div>
      <button className="icon-btn" onClick={onOpenMenu} aria-label="Puzzle menu" title="Browse puzzles">
        <IGrid />
      </button>
      <button className="icon-btn" onClick={onOpenStats} aria-label="Stats" title="Your scorecard">
        <ITrophy />
      </button>
    </div>
  );
}
