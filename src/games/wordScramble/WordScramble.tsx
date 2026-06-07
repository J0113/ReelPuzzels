import { useEffect, useState } from "react";
import type { PuzzleComponentProps } from "../../types";

export interface WordData {
  /** Scrambled letters laid out in the tray. */
  letters: string[];
  /** Accepted answers (uppercase) of the same letters. */
  accept: string[];
}

export function WordScramble({
  puzzle,
  solved,
  onSolve,
  onMiss,
}: PuzzleComponentProps<WordData>) {
  const { letters, accept } = puzzle.data;
  const [placed, setPlaced] = useState<{ ch: string; from: number }[]>([]);
  const [wrong, setWrong] = useState(false);

  // Reset interaction state when the puzzle instance changes.
  useEffect(() => {
    setPlaced([]);
    setWrong(false);
  }, [puzzle.id]);

  const usedFrom = placed.map((p) => p.from);

  function place(ch: string, idx: number) {
    if (solved || usedFrom.includes(idx) || placed.length >= letters.length)
      return;
    const next = [...placed, { ch, from: idx }];
    setPlaced(next);
    if (next.length === letters.length) {
      const w = next.map((p) => p.ch).join("");
      if (accept.includes(w)) {
        setTimeout(onSolve, 180);
      } else {
        setWrong(true);
        onMiss();
        setTimeout(() => {
          setWrong(false);
          setPlaced([]);
        }, 600);
      }
    }
  }

  return (
    <>
      <div className="reel-stage">
        <div className={"word-slots" + (wrong ? " err" : "")}>
          {letters.map((_, i) => (
            <div key={i} className={"slot" + (placed[i] ? " filled" : "")}>
              {solved ? accept[0][i] : placed[i] ? placed[i].ch : ""}
            </div>
          ))}
        </div>
        <p className="hint-line">{puzzle.hint}</p>
      </div>
      <div className="reel-input">
        {solved ? null : (
          <>
            <div className="letter-tray">
              {letters.map((ch, i) => (
                <button
                  key={i}
                  className={"tile" + (usedFrom.includes(i) ? " used" : "")}
                  onClick={() => place(ch, i)}
                >
                  {ch}
                </button>
              ))}
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => !solved && setPlaced([])}
              disabled={!placed.length}
            >
              ↺ Reset
            </button>
          </>
        )}
      </div>
    </>
  );
}
