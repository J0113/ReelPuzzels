import { ThemeSeg } from "../components/ThemeSeg";
import {
  IChevUp,
  IClose,
  IPlay,
  ITrophy,
} from "../components/icons";
import { MODES } from "../games/registry";
import type { Theme } from "../state/useTheme";

/** Glyph + accent colour for each mode's menu thumbnail. */
const MODE_ICO: Record<string, { glyph: string; color: string; size?: number }> = {
  math: { glyph: "5", color: "var(--a-primary)", size: 18 },
  word: { glyph: "Aa", color: "var(--a-accent)", size: 15 },
  sudoku: { glyph: "6", color: "var(--a-primary)", size: 18 },
  queens: { glyph: "♛", color: "var(--a-accent)", size: 19 },
  zip: { glyph: "1·2", color: "var(--a-deep)", size: 13 },
  tango: { glyph: "☀☾", color: "var(--a-warm)", size: 14 },
  patches: { glyph: "▦", color: "var(--a-good)", size: 19 },
};

/** Small per-mode menu thumbnail. */
function ModeIco({ id }: { id: string }) {
  const ico = MODE_ICO[id] ?? { glyph: "?", color: "var(--ink-soft)", size: 16 };
  return (
    <span
      style={{
        fontWeight: 800,
        fontSize: ico.size ?? 16,
        color: ico.color,
        letterSpacing: "0.02em",
      }}
    >
      {ico.glyph}
    </span>
  );
}

export function Menu({
  theme,
  setTheme,
  onPlay,
  onResume,
  onOpenStats,
  onClose,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  onPlay: (modeId: string) => void;
  onResume: () => void;
  onOpenStats: () => void;
  onClose: () => void;
}) {
  return (
    <div className="menu screen screen-enter">
      <div className="field-bg" />
      <div className="menu-head">
        <div>
          <div className="menu-kicker">Brain Reel</div>
          <h1 className="menu-title">Pick a puzzle</h1>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <IClose />
        </button>
      </div>

      <div className="theme-block">
        <div>
          <div className="tb-label">Color theme</div>
          <div className="tb-sub">Calm earth tones or charged neon</div>
        </div>
        <ThemeSeg theme={theme} setTheme={setTheme} />
      </div>

      <div className="menu-section">Jump back in</div>
      <div className="glist">
        <button className="gcard" onClick={onResume}>
          <div className="gcard-ico">
            <IPlay />
          </div>
          <div className="gcard-main">
            <div className="gcard-name">Resume the reel</div>
            <div className="gcard-meta">
              <span className="diff-tag xp">Endless · ramps as you solve</span>
            </div>
          </div>
          <div className="gcard-go">
            <IChevUp style={{ transform: "rotate(90deg)" }} />
          </div>
        </button>
        <button className="gcard" onClick={onOpenStats}>
          <div className="gcard-ico">
            <ITrophy />
          </div>
          <div className="gcard-main">
            <div className="gcard-name">Your scorecard</div>
            <div className="gcard-meta">
              <span className="diff-tag xp">XP, streak & skills</span>
            </div>
          </div>
          <div className="gcard-go">
            <IChevUp style={{ transform: "rotate(90deg)" }} />
          </div>
        </button>
      </div>

      <div className="menu-section">Practice a mode</div>
      <div className="glist">
        {MODES.map((m) => (
          <button
            key={m.meta.id}
            className="gcard"
            onClick={() => onPlay(m.meta.id)}
          >
            <div className="gcard-ico">
              <ModeIco id={m.meta.id} />
            </div>
            <div className="gcard-main">
              <div className="gcard-name">{m.meta.skillFull}</div>
              <div className="gcard-meta">
                <span className="diff-tag xp">Pick easy · medium · hard</span>
              </div>
            </div>
            <div className="gcard-go">
              <IPlay />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
