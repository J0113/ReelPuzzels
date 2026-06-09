import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { PuzzleComponentProps } from "../../types";
import { cellAtPoint } from "../pointer";
import { neighbors, solved as isWin, type ZipData } from "./logic";

export function ZipGrid({
  puzzle,
  solved: isSolved,
  onSolve,
  onMiss,
}: PuzzleComponentProps<ZipData>) {
  const { n, numbers } = puzzle.data;
  const start = numbers.indexOf(1);
  const [path, setPath] = useState<number[]>(() => [start]);
  const pathRef = useRef(path);
  const drag = useRef<{ moved: boolean } | null>(null);

  useEffect(() => {
    const s = [numbers.indexOf(1)];
    setPath(s);
    pathRef.current = s;
  }, [puzzle.id]);

  function commit(next: number[]) {
    pathRef.current = next;
    setPath(next);
    if (next.length === n * n) {
      if (isWin(next, n, numbers)) setTimeout(onSolve, 140);
      else onMiss();
    }
  }

  function down(i: number) {
    if (isSolved) return;
    const p = pathRef.current;
    const at = p.indexOf(i);
    if (at !== -1) {
      commit(p.slice(0, at + 1)); // grab the line at this cell
      drag.current = { moved: false };
    } else if (neighbors(p[p.length - 1], n).includes(i)) {
      commit([...p, i]);
      drag.current = { moved: false };
    } else {
      drag.current = null;
    }
  }

  // Drag extends the line into the neighbour under the pointer, or retraces it
  // by dragging back onto the previous cell.
  function move(e: PointerEvent) {
    if (!drag.current || isSolved) return;
    const j = cellAtPoint(e.clientX, e.clientY);
    if (j == null) return;
    const p = pathRef.current;
    const h = p[p.length - 1];
    if (j === h) return;
    if (p.length >= 2 && j === p[p.length - 2]) {
      commit(p.slice(0, p.length - 1));
      drag.current.moved = true;
    } else if (p.indexOf(j) === -1 && neighbors(h, n).includes(j)) {
      commit([...p, j]);
      drag.current.moved = true;
    }
  }

  function up() {
    drag.current = null;
  }

  const head = path[path.length - 1];
  const center = (i: number) => `${(i % n) + 0.5},${Math.floor(i / n) + 0.5}`;

  return (
    <>
      <div className="reel-stage">
        <div className="board zip">
          <div
            className="bgrid drawgrid"
            style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
            onPointerMove={move}
            onPointerUp={up}
            onPointerLeave={up}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {numbers.map((num, i) => {
              const cls = ["bc"];
              if (num > 0) cls.push("cp");
              if (path.includes(i)) cls.push("on");
              return (
                <div
                  key={i}
                  data-i={i}
                  className={cls.join(" ")}
                  onPointerDown={() => down(i)}
                >
                  {num > 0 ? <span className="cpnum">{num}</span> : ""}
                </div>
              );
            })}
          </div>
          <svg
            className="zip-line"
            viewBox={`0 0 ${n} ${n}`}
            preserveAspectRatio="none"
          >
            {path.length > 1 && (
              <polyline points={path.map(center).join(" ")} />
            )}
            {path.length > 1 && (
              <circle
                className="zip-head"
                cx={(head % n) + 0.5}
                cy={Math.floor(head / n) + 0.5}
                r={0.2}
              />
            )}
          </svg>
        </div>
        <p className="hint-line">{puzzle.hint}</p>
      </div>
      <div className="reel-input">
        {!isSolved && (
          <button
            className="btn btn-ghost"
            onClick={() => commit([numbers.indexOf(1)])}
            disabled={path.length <= 1}
          >
            ↺ Reset path
          </button>
        )}
      </div>
    </>
  );
}
