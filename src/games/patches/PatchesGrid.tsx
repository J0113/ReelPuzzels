import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import type { PuzzleComponentProps } from "../../types";
import { cellAtPoint } from "../pointer";
import { solved as isWin, type PatchesData, type ShapeType } from "./logic";

const TYPE_GLYPH: Record<ShapeType, string> = {
  square: "◻",
  tall: "▯",
  wide: "▭",
};

/** All cells in the bounding box spanned by two cell indices. */
function boxCells(a: number, b: number, n: number): number[] {
  const ax = a % n;
  const ay = Math.floor(a / n);
  const bx = b % n;
  const by = Math.floor(b / n);
  const out: number[] = [];
  for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++)
    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) out.push(y * n + x);
  return out;
}

export function PatchesGrid({
  puzzle,
  solved: isSolved,
  onSolve,
}: PuzzleComponentProps<PatchesData>) {
  const { n, clues } = puzzle.data;

  const fresh = () => {
    const o = new Array<number>(n * n).fill(-1);
    clues.forEach((c, i) => (o[c.cell] = i));
    return o;
  };
  const [owner, setOwner] = useState<number[]>(fresh);
  const [preview, setPreview] = useState<number[]>([]);
  const start = useRef<number | null>(null);
  const moved = useRef(false);

  useEffect(() => setOwner(fresh()), [puzzle.id]);

  const hue = (i: number) => Math.round((i * 360) / Math.max(1, clues.length));

  function commit(next: number[]) {
    setOwner(next);
    if (isWin(next, n, clues)) setTimeout(onSolve, 140);
  }

  function down(i: number) {
    if (isSolved) return;
    start.current = i;
    moved.current = false;
    setPreview([i]);
  }

  function move(e: PointerEvent) {
    if (start.current == null || isSolved) return;
    const j = cellAtPoint(e.clientX, e.clientY);
    if (j == null) return;
    if (j !== start.current) moved.current = true;
    setPreview(boxCells(start.current, j, n));
  }

  function up() {
    if (start.current == null || isSolved) {
      start.current = null;
      setPreview([]);
      return;
    }
    const cells = preview.length ? preview : [start.current];
    if (!moved.current) {
      // Tap: clear the shape owning this cell back to just its clue cell.
      const c = owner[start.current];
      if (c >= 0) {
        const next = owner.slice();
        for (let k = 0; k < next.length; k++) if (next[k] === c) next[k] = -1;
        next[clues[c].cell] = c;
        commit(next);
      }
    } else {
      const inside = clues
        .map((c, i) => (cells.includes(c.cell) ? i : -1))
        .filter((i) => i >= 0);
      if (inside.length === 1) {
        const c = inside[0];
        const next = owner.slice();
        for (let k = 0; k < next.length; k++) if (next[k] === c) next[k] = -1;
        for (const k of cells) next[k] = c;
        commit(next);
      }
    }
    start.current = null;
    setPreview([]);
  }

  function cellStyle(i: number): CSSProperties {
    const o = owner[i];
    const r = Math.floor(i / n);
    const c = i % n;
    const diff = (nr: number, nc: number) =>
      nr < 0 || nr >= n || nc < 0 || nc >= n || owner[nr * n + nc] !== o;
    const edge = (on: boolean) =>
      on ? "2.5px solid var(--ink)" : "2.5px solid transparent";
    return {
      background:
        o >= 0 ? `hsl(${hue(o)} 60% 72%)` : "var(--surface-2)",
      borderTop: edge(diff(r - 1, c)),
      borderBottom: edge(diff(r + 1, c)),
      borderLeft: edge(diff(r, c - 1)),
      borderRight: edge(diff(r, c + 1)),
    };
  }

  // cell index → clue (for rendering clue chips)
  const clueByCell = new Map<number, number>();
  clues.forEach((c, i) => clueByCell.set(c.cell, i));

  return (
    <>
      <div className="reel-stage">
        <div className="board patches">
          <div
            className="bgrid drawgrid"
            style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
            onPointerMove={move}
            onPointerUp={up}
            onPointerLeave={up}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {owner.map((_, i) => {
              const ci = clueByCell.get(i);
              const clue = ci !== undefined ? clues[ci] : null;
              return (
                <div
                  key={i}
                  data-i={i}
                  className={"bc" + (preview.includes(i) ? " prev" : "")}
                  style={cellStyle(i)}
                  onPointerDown={() => down(i)}
                >
                  {clue && (
                    <span className="clue-chip">
                      {clue.size !== null && (
                        <b>{clue.size}</b>
                      )}
                      {clue.type !== null && (
                        <i>{TYPE_GLYPH[clue.type]}</i>
                      )}
                      {clue.size === null && clue.type === null && (
                        <i className="clue-any">?</i>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <p className="hint-line">{puzzle.hint}</p>
      </div>
      <div className="reel-input" />
    </>
  );
}
