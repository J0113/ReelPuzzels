import { useEffect, useState } from "react";
import type { PuzzleComponentProps } from "../../types";
import {
  N,
  BOX_H,
  BOX_W,
  conflicts,
  solved as isWin,
  type SudokuData,
} from "./logic";

const DIGITS = [1, 2, 3, 4, 5, 6];

export function MiniSudoku({
  puzzle,
  solved: isSolved,
  onSolve,
  onMiss,
}: PuzzleComponentProps<SudokuData>) {
  const { given, solution } = puzzle.data;
  const [cells, setCells] = useState<number[]>(() => given.slice());
  const [sel, setSel] = useState<number | null>(null);

  useEffect(() => {
    setCells(given.slice());
    setSel(null);
  }, [puzzle.id]);

  const bad = conflicts(cells);

  function commit(next: number[]) {
    setCells(next);
    if (isWin(next, solution)) setTimeout(onSolve, 140);
    else if (next.every((v) => v !== 0)) onMiss();
  }

  function place(d: number) {
    if (isSolved || sel === null || given[sel] !== 0) return;
    const next = cells.slice();
    next[sel] = d;
    commit(next);
  }

  function erase() {
    if (isSolved || sel === null || given[sel] !== 0) return;
    const next = cells.slice();
    next[sel] = 0;
    setCells(next);
  }

  return (
    <>
      <div className="reel-stage">
        <div className="board sudoku">
          <div
            className="bgrid"
            style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}
          >
            {cells.map((v, i) => {
              const r = Math.floor(i / N);
              const c = i % N;
              const cls = ["bc"];
              if (given[i]) cls.push("given");
              else if (v) cls.push("user");
              if (i === sel && !isSolved) cls.push("sel");
              if (bad[i]) cls.push("bad");
              if (c % BOX_W === BOX_W - 1 && c < N - 1) cls.push("bx");
              if (r % BOX_H === BOX_H - 1 && r < N - 1) cls.push("by");
              return (
                <div
                  key={i}
                  className={cls.join(" ")}
                  onClick={() => !isSolved && setSel(i)}
                >
                  {v || ""}
                </div>
              );
            })}
          </div>
        </div>
        <p className="hint-line">{puzzle.hint}</p>
      </div>
      <div className="reel-input">
        {!isSolved && (
          <div className="numrow">
            {DIGITS.map((d) => (
              <button key={d} className="key" onClick={() => place(d)}>
                {d}
              </button>
            ))}
            <button className="key util" onClick={erase}>
              ⌫
            </button>
          </div>
        )}
      </div>
    </>
  );
}
