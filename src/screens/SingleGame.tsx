import { useEffect, useRef, useState } from "react";
import { PuzzleCard } from "../components/PuzzleCard";
import { IClose } from "../components/icons";
import { fmt } from "../lib/format";
import { RNG } from "../lib/rng";
import { getMode } from "../games/registry";
import { DIFFICULTIES, type Difficulty, type PuzzleInstance } from "../types";
import type { SolveResult, UseProgress } from "../state/useProgress";

/**
 * Single-mode practice: pick a difficulty and play that mode one puzzle at a
 * time (button-advanced). No infinite scroll.
 */
export function SingleGame({
  modeId,
  recordSolve,
  onClose,
}: {
  modeId: string;
  recordSolve: UseProgress["recordSolve"];
  onClose: () => void;
}) {
  const mode = getMode(modeId);
  const rng = useRef(new RNG());
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [puzzle, setPuzzle] = useState<PuzzleInstance>(() =>
    mode!.generate("easy", rng.current),
  );
  const [solved, setSolved] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [elapsed, setElapsed] = useState(0);

  function newPuzzle(d: Difficulty) {
    setPuzzle(mode!.generate(d, rng.current));
    setSolved(false);
    setResult(null);
    setElapsed(0);
  }

  function changeDifficulty(d: Difficulty) {
    if (d === difficulty && !solved) return;
    setDifficulty(d);
    newPuzzle(d);
  }

  // Count-UP stopwatch while unsolved.
  useEffect(() => {
    if (solved) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [solved, puzzle.id]);

  function handleSolve() {
    if (solved) return;
    setResult(recordSolve(puzzle, elapsed));
    setSolved(true);
  }

  if (!mode) return null;

  return (
    <div className="screen">
      <div className="field-bg" />
      <div className="hud">
        <div className="brand">
          <span className="brand-name">{mode.meta.skillFull}</span>
        </div>
        {!solved && <div className="hud-chip clock">⏱ {fmt(elapsed)}</div>}
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <IClose />
        </button>
      </div>

      <div className="solo-diff">
        <div className="seg" role="group" aria-label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={d === difficulty ? "on" : ""}
              onClick={() => changeDifficulty(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="solo-body">
        <PuzzleCard
          key={puzzle.id}
          puzzle={puzzle}
          solved={solved}
          result={result}
          onSolve={handleSolve}
          onMiss={() => {}}
          footer={
            <button
              className="btn btn-primary solo-next"
              onClick={() => newPuzzle(difficulty)}
            >
              ⚡ Next puzzle
            </button>
          }
        />
      </div>
    </div>
  );
}
