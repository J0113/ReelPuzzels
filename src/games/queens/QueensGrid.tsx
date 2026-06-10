import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import type { PuzzleComponentProps } from "../../types";
import { cellAtPoint } from "../pointer";
import {
  EMPTY,
  MARK,
  QUEEN,
  conflicts,
  solved as isWin,
  type QueensData,
} from "./logic";

/** One pastel colour per region, spread around the hue wheel. */
function regionColors(n: number): string[] {
  return Array.from(
    { length: n },
    (_, i) => `hsl(${Math.round((i * 360) / n)} 58% 72%)`,
  );
}

export function QueensGrid({
  puzzle,
  solved: isSolved,
  onSolve,
}: PuzzleComponentProps<QueensData>) {
  const { n, regionOf } = puzzle.data;
  const [state, setState] = useState<number[]>(() =>
    new Array<number>(n * n).fill(EMPTY),
  );
  const stateRef = useRef(state);
  const drag = useRef<{ start: number; moved: boolean } | null>(null);

  useEffect(() => {
    const fresh = new Array<number>(n * n).fill(EMPTY);
    setState(fresh);
    stateRef.current = fresh;
  }, [puzzle.id, n]);

  const colors = regionColors(n);
  const bad = conflicts(state, n, regionOf);

  // Thick black edge wherever a cell borders a different region, so the colour
  // groups read clearly even when adjacent hues are close.
  function cellStyle(i: number): CSSProperties {
    const r = Math.floor(i / n);
    const c = i % n;
    const reg = regionOf[i];
    const diff = (nr: number, nc: number) =>
      nr < 0 || nr >= n || nc < 0 || nc >= n || regionOf[nr * n + nc] !== reg;
    const edge = "3px solid #161310";
    return {
      background: colors[reg],
      borderTop: diff(r - 1, c) ? edge : undefined,
      borderBottom: diff(r + 1, c) ? edge : undefined,
      borderLeft: diff(r, c - 1) ? edge : undefined,
      borderRight: diff(r, c + 1) ? edge : undefined,
    };
  }

  function commit(next: number[]) {
    stateRef.current = next;
    setState(next);
    if (isWin(next, n, regionOf)) setTimeout(onSolve, 140);
  }

  function down(i: number) {
    if (isSolved) return;
    drag.current = { start: i, moved: false };
  }

  // Drag paints ✕ across empty cells; a plain tap cycles the single cell.
  function move(e: PointerEvent) {
    if (!drag.current || isSolved) return;
    const j = cellAtPoint(e.clientX, e.clientY);
    if (j == null) return;
    if (!drag.current.moved) {
      if (j === drag.current.start) return;
      drag.current.moved = true;
      const next = stateRef.current.slice();
      if (next[drag.current.start] === EMPTY) next[drag.current.start] = MARK;
      if (next[j] === EMPTY) next[j] = MARK;
      commit(next);
    } else if (stateRef.current[j] === EMPTY) {
      const next = stateRef.current.slice();
      next[j] = MARK;
      commit(next);
    }
  }

  function up() {
    if (!drag.current || isSolved) {
      drag.current = null;
      return;
    }
    if (!drag.current.moved) {
      const i = drag.current.start;
      const next = stateRef.current.slice();
      next[i] = (next[i] + 1) % 3; // EMPTY → MARK → QUEEN → EMPTY
      commit(next);
    }
    drag.current = null;
  }

  return (
    <>
      <div className="reel-stage">
        <div className="board queens">
          <div
            className="bgrid drawgrid"
            style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
            onPointerMove={move}
            onPointerUp={up}
            onPointerLeave={up}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {state.map((v, i) => (
              <div
                key={i}
                data-i={i}
                className={"bc" + (bad[i] ? " bad" : "")}
                style={cellStyle(i)}
                onPointerDown={() => down(i)}
              >
                {v === QUEEN ? (
                  <span className="qq">♛</span>
                ) : v === MARK ? (
                  <span className="qx">✕</span>
                ) : (
                  ""
                )}
              </div>
            ))}
          </div>
        </div>
        <p className="hint-line">{puzzle.hint}</p>
      </div>
      <div className="reel-input" />
    </>
  );
}
