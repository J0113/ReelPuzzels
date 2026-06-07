import { useEffect, useState } from "react";
import { IClose } from "../components/icons";
import { MODES } from "../games/registry";
import type { Progress } from "../store";

const RANKS = ["Rookie", "Sharpshooter", "Tactician", "Mastermind", "Brain Beast"];

/** Map a mode's solve count to a 0–100 "skill power" bar. */
const skillPct = (solves: number) => Math.min(100, solves * 9);

export function Stats({
  progress,
  onClose,
}: {
  progress: Progress;
  onClose: () => void;
}) {
  const [fill, setFill] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFill(true), 140);
    return () => clearTimeout(t);
  }, []);

  const level = Math.floor(progress.xp / 500) + 1;
  const intoLevel = progress.xp % 500;
  const rank = RANKS[Math.min(level - 1, RANKS.length - 1)];
  const avg = progress.solvedCount
    ? Math.round(progress.timeSum / progress.solvedCount)
    : 0;

  const achievements = [
    { ico: "🔥", name: "Hot Streak", locked: progress.bestStreak < 3 },
    { ico: "⚡", name: "Speed Demon", locked: progress.solvedCount < 5 },
    { ico: "🧠", name: "Mastermind", locked: level < 4 },
    { ico: "💎", name: "Flawless", locked: progress.bestStreak < 10 },
  ];

  return (
    <div className="insights screen screen-enter">
      <div className="field-bg" />
      <div className="hud" style={{ position: "static", paddingTop: 0, marginBottom: 4 }}>
        <div style={{ marginRight: "auto" }} />
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <IClose />
        </button>
      </div>
      <div className="ins-head">
        <div className="ins-kicker">Your run so far</div>
        <h1 className="ins-title">
          Your
          <br />
          scorecard
        </h1>
      </div>

      <div className="card level-card">
        <div className="level-row">
          <div className="level-badge">
            <b>{level}</b>
          </div>
          <div style={{ flex: 1 }}>
            <div className="level-label">Current rank</div>
            <div className="level-name">{rank}</div>
          </div>
        </div>
        <div className="level-xp">
          <div className="xp-track">
            <div
              className="xp-fill"
              style={{ width: fill ? (intoLevel / 500) * 100 + "%" : 0 }}
            />
          </div>
          <div className="xp-meta">
            <span>{progress.xp} XP total</span>
            <span>
              {500 - intoLevel} to level {level + 1}
            </span>
          </div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 12 }}>
        <div className="stat">
          <div className="stat-num orange">{progress.bestStreak}</div>
          <div className="stat-label">Best streak</div>
        </div>
        <div className="stat">
          <div className="stat-num cyan">{progress.solvedCount}</div>
          <div className="stat-label">Solved</div>
        </div>
        <div className="stat">
          <div className="stat-num pink">{avg}s</div>
          <div className="stat-label">Avg solve</div>
        </div>
      </div>

      <div className="card">
        <div className="card-label">Skill power</div>
        <div className="skills">
          {MODES.map((m, i) => {
            const solves = progress.skills[m.meta.id] ?? 0;
            return (
              <div className="skill-row" key={m.meta.id}>
                <div className="sk-top">
                  <span className="sk-name">{m.meta.skillFull}</span>
                  <span className="sk-delta">{solves} solved</span>
                </div>
                <div className="sk-track">
                  <div
                    className={"sk-fill" + (i % 2 ? " pink" : "")}
                    style={{ width: fill ? skillPct(solves) + "%" : 0 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-label">Achievements</div>
        <div className="ach-row">
          {achievements.map((a) => (
            <div className={"ach" + (a.locked ? " locked" : "")} key={a.name}>
              <div className="ach-ico">{a.ico}</div>
              <div className="ach-name">{a.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
