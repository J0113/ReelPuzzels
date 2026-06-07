import type { Theme } from "../state/useTheme";

export function ThemeSeg({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  return (
    <div className="seg" role="group" aria-label="Color theme">
      <button
        className={theme === "calm" ? "on" : ""}
        onClick={() => setTheme("calm")}
      >
        <span className="sw" style={{ background: "#6F9E45" }} />
        Calm
      </button>
      <button
        className={theme === "neon" ? "on" : ""}
        onClick={() => setTheme("neon")}
      >
        <span className="sw" style={{ background: "#1FE6FF" }} />
        Neon
      </button>
    </div>
  );
}
