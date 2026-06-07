import { useEffect, useState } from "react";
import type { PuzzleComponentProps } from "../../types";
import type { MathData } from "./generate";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function SpeedMath({
  puzzle,
  solved,
  onSolve,
  onMiss,
}: PuzzleComponentProps<MathData>) {
  const { grid, qIndex, answer } = puzzle.data;
  const [val, setVal] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    setVal("");
    setWrong(false);
  }, [puzzle.id]);

  function press(k: string) {
    if (solved) return;
    setWrong(false);
    if (k === "del") {
      setVal((v) => v.slice(0, -1));
      return;
    }
    if (k === "ok") {
      if (parseInt(val, 10) === answer) {
        onSolve();
      } else {
        setWrong(true);
        onMiss();
        setTimeout(() => setWrong(false), 500);
      }
      return;
    }
    setVal((v) => (v.length >= 3 ? v : v + k));
  }

  return (
    <>
      <div className="reel-stage">
        <div className="ngrid">
          {grid.map((n, i) => (
            <div key={i} className={"ncell" + (i === qIndex ? " q" : "")}>
              {i === qIndex ? (solved ? answer : val || "?") : n}
            </div>
          ))}
        </div>
        <p className="hint-line">{puzzle.hint}</p>
      </div>
      <div className="reel-input">
        {solved ? null : (
          <>
            <div
              className={
                "answer-display" +
                (val ? "" : " empty") +
                (wrong ? " err" : "")
              }
            >
              {val || "??"}
            </div>
            <div className="keypad">
              {KEYS.map((k) => (
                <button key={k} className="key" onClick={() => press(k)}>
                  {k}
                </button>
              ))}
              <button className="key util" onClick={() => press("del")}>
                DEL
              </button>
              <button className="key" onClick={() => press("0")}>
                0
              </button>
              <button className="key go" onClick={() => press("ok")}>
                GO
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
