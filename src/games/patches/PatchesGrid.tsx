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
  conflicts,
  solved as isWin,
  type PatchesData,
  type ShapeType,
} from "./logic";

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

  // Offset off 0° so no shape lands on pure red — keeps region colours clearly
  // distinct from the red error highlight.
  const hue = (i: number) =>
    Math.round(25 + (i * 320) / Math.max(1, clues.length));
  const bad = conflicts(owner, n, clues);

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
      // Legal only if the box holds exactly one clue and steals no cell already
      // claimed by another shape. Reject illegal drags outright (no overlaps, no
      // error state) instead of overwriting.
      const c = inside.length === 1 ? inside[0] : -1;
      const legal =
        c >= 0 && cells.every((k) => owner[k] < 0 || owner[k] === c);
      if (legal) {
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
    const style: CSSProperties = {};
    if (o < 0) return style; // unclaimed cell: just the dashed base grid
    const r = Math.floor(i / n);
    const c = i % n;
    const same = (nr: number, nc: number) =>
      nr >= 0 && nr < n && nc >= 0 && nc < n && owner[nr * n + nc] === o;
    const top = !same(r - 1, c);
    const bottom = !same(r + 1, c);
    const left = !same(r, c - 1);
    const right = !same(r, c + 1);
    const flag = bad[i];
    // Translucent fill so the dashed grid still reads through the patch.
    style.background = flag
      ? "hsl(0 75% 60% / 0.32)"
      : `hsl(${hue(o)} 70% 60% / 0.34)`;
    // Solid coloured border only on the patch's outer edges (interior edges
    // keep the dashed base grid). Rounded where two outer edges meet.
    const col = flag ? "hsl(0 72% 52%)" : `hsl(${hue(o)} 60% 46%)`;
    const solid = `2.5px solid ${col}`;
    if (top) style.borderTop = solid;
    if (bottom) style.borderBottom = solid;
    if (left) style.borderLeft = solid;
    if (right) style.borderRight = solid;
    const rad = "10px";
    if (top && left) style.borderTopLeftRadius = rad;
    if (top && right) style.borderTopRightRadius = rad;
    if (bottom && left) style.borderBottomLeftRadius = rad;
    if (bottom && right) style.borderBottomRightRadius = rad;
    return style;
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
                  {clue && ci !== undefined && (
                    <span
                      className="clue-chip"
                      style={{ background: `hsl(${hue(ci)} 62% 44%)` }}
                    >
                      {clue.size !== null && <b>{clue.size}</b>}
                      {clue.type !== null && <i>{TYPE_GLYPH[clue.type]}</i>}
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
