import { useEffect, useState } from "react";
import type { PuzzleComponentProps } from "../../types";
import {
  N,
  SUN,
  MOON,
  conflicts,
  solved as isWin,
  type TangoData,
} from "./logic";

const GLYPH: Record<number, string> = { [SUN]: "☀", [MOON]: "☾" };

export function TangoGrid({
  puzzle,
  solved: isSolved,
  onSolve,
  onMiss,
}: PuzzleComponentProps<TangoData>) {
  const { given, constraints } = puzzle.data;
  const [cells, setCells] = useState<number[]>(() => given.slice());
  // Lagged copy: conflicts only highlight 3s after the last move, so a cell
  // mid-cycle (empty → sun → moon needs two taps) isn't flagged immediately.
  const [shown, setShown] = useState<number[]>(() => given.slice());
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    setCells(given.slice());
    setShown(given.slice());
    setWrong(false);
  }, [puzzle.id]);

  useEffect(() => {
    const t = setTimeout(() => setShown(cells), 3000);
    return () => clearTimeout(t);
  }, [cells]);

  const bad = conflicts(shown, constraints);

  function tap(i: number) {
    if (isSolved || given[i] !== 0) return;
    setWrong(false);
    const next = cells.slice();
    next[i] = (cells[i] + 1) % 3; // empty → sun → moon → empty
    setCells(next);
    if (next.every((v) => v !== 0)) {
      if (isWin(next, constraints)) setTimeout(onSolve, 140);
      else {
        setWrong(true);
        onMiss();
        setTimeout(() => setWrong(false), 500);
      }
    }
  }

  return (
    <>
      <div className="reel-stage">
        <div className={"board tango" + (wrong ? " err" : "")}>
          <div
            className="bgrid"
            style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}
          >
            {cells.map((v, i) => {
              const cls = ["bc"];
              if (given[i]) cls.push("given");
              if (v === SUN) cls.push("sun");
              if (v === MOON) cls.push("moon");
              if (bad[i]) cls.push("bad");
              return (
                <div key={i} className={cls.join(" ")} onClick={() => tap(i)}>
                  {GLYPH[v] || ""}
                </div>
              );
            })}
          </div>
          {constraints.map((ct, k) => {
            const ac = ct.a % N;
            const ar = Math.floor(ct.a / N);
            const bc = ct.b % N;
            const br = Math.floor(ct.b / N);
            const left = (((ac + bc) / 2 + 0.5) / N) * 100;
            const top = (((ar + br) / 2 + 0.5) / N) * 100;
            return (
              <span
                key={k}
                className="cmark"
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                {ct.eq ? "=" : "✕"}
              </span>
            );
          })}
        </div>
        <p className="hint-line">{puzzle.hint}</p>
      </div>
      <div className="reel-input" />
    </>
  );
}
