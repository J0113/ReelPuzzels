import { ThemeSeg } from "../components/ThemeSeg";
import { IBrain, IDot } from "../components/icons";
import type { Theme } from "../state/useTheme";

export function Onboarding({
  onBegin,
  onBrowse,
  theme,
  setTheme,
}: {
  onBegin: () => void;
  onBrowse: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  return (
    <div className="onb screen screen-enter">
      <div className="field-bg" />
      <div className="onb-top">
        <ThemeSeg theme={theme} setTheme={setTheme} />
      </div>
      <div className="onb-art">
        <div className="onb-ring r2" />
        <div className="onb-ring r1" />
        <div className="onb-orb">
          <IBrain />
        </div>
      </div>
      <div className="onb-copy">
        <div className="onb-kicker">ReelPuzzels · Brain Reel</div>
        <h1 className="onb-title">
          Think it through.
          <br />
          <em>One reel at a time.</em>
        </h1>
        <p className="onb-text">
          Swap the endless feed for one puzzle at a time. Solve faster for more
          points, build combos, and watch your skills climb — calm or charged,
          your call.
        </p>
        <div className="onb-points">
          <div className="onb-point" style={{ color: "var(--a-primary)" }}>
            <IDot /> Beat your time
          </div>
          <div className="onb-point" style={{ color: "var(--a-warm)" }}>
            <IDot /> Build combos
          </div>
          <div className="onb-point" style={{ color: "var(--a-good)" }}>
            <IDot /> Climb levels
          </div>
        </div>
        <div className="onb-actions">
          <button className="btn btn-primary" onClick={onBegin}>
            ⚡ Start the reel
          </button>
          <button className="btn btn-ghost" onClick={onBrowse}>
            Browse puzzles
          </button>
        </div>
      </div>
    </div>
  );
}
