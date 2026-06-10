import { useCallback, useEffect, useRef, useState } from "react";
import { Hud } from "../components/Hud";
import { PuzzleCard } from "../components/PuzzleCard";
import { IChevUp } from "../components/icons";
import { RNG } from "../lib/rng";
import { generateFeedPuzzle } from "../games/registry";
import type { PuzzleInstance } from "../types";
import type { SolveResult, UseProgress } from "../state/useProgress";

const BATCH = 4;
const APPEND_WHEN_WITHIN = 2;

/** Endless vertical reel: puzzles are appended on demand, never a fixed list. */
export function Feed({
  progress,
  recordSolve,
  onOpenMenu,
  onOpenStats,
  paused,
}: {
  progress: UseProgress["progress"];
  recordSolve: UseProgress["recordSolve"];
  onOpenMenu: () => void;
  onOpenStats: () => void;
  paused: boolean;
}) {
  const rng = useRef(new RNG());
  // Ramping reads the solved count at generation time.
  const solvedCountRef = useRef(progress.solvedCount);
  solvedCountRef.current = progress.solvedCount;

  const makeBatch = useCallback(
    (n: number): PuzzleInstance[] =>
      Array.from({ length: n }, () =>
        generateFeedPuzzle(solvedCountRef.current, rng.current),
      ),
    [],
  );

  const [instances, setInstances] = useState<PuzzleInstance[]>(() =>
    Array.from({ length: BATCH }, () =>
      generateFeedPuzzle(progress.solvedCount, new RNG()),
    ),
  );
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, SolveResult>>({});
  const [elapsed, setElapsed] = useState(0);

  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startY: 0, dy: 0 });

  const cur = instances[index];
  const isSolved = !!solved[cur.id];

  // Grow the feed before the player reaches the end.
  useEffect(() => {
    if (index >= instances.length - APPEND_WHEN_WITHIN) {
      setInstances((prev) => [...prev, ...makeBatch(BATCH)]);
    }
  }, [index, instances.length, makeBatch]);

  const go = useCallback(
    (next: number) =>
      setIndex(() => Math.max(0, Math.min(instances.length - 1, next))),
    [instances.length],
  );

  // Reset + run the count-UP stopwatch on each unsolved puzzle.
  useEffect(() => setElapsed(0), [index]);
  useEffect(() => {
    if (isSolved || paused) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [isSolved, index, paused]);

  function handleSolve() {
    if (solved[cur.id]) return;
    const result = recordSolve(cur, elapsed);
    setSolved((s) => ({ ...s, [cur.id]: true }));
    setResults((r) => ({ ...r, [cur.id]: result }));
  }

  // --- touch / mouse / wheel navigation (ported from the mockup) ---
  // Gestures that begin on the puzzle itself (a board, a control) must drive the
  // puzzle, not the reel — otherwise dragging to draw/tap a cell flips the page.
  function fromPuzzle(e: React.MouseEvent | React.TouchEvent) {
    return !!(e.target as HTMLElement).closest(
      ".bgrid, .drawgrid, .reel-input, .reel-stage, button, input, textarea, a",
    );
  }
  function onDown(e: React.MouseEvent | React.TouchEvent) {
    if (fromPuzzle(e)) {
      drag.current.active = false;
      return;
    }
    const y = "touches" in e ? e.touches[0].clientY : e.clientY;
    drag.current = { active: true, startY: y, dy: 0 };
  }
  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drag.current.active) return;
    const y = "touches" in e ? e.touches[0].clientY : e.clientY;
    drag.current.dy = y - drag.current.startY;
    const base = -index * 100;
    const pct = (drag.current.dy / window.innerHeight) * 100 * 0.9;
    if (trackRef.current) {
      trackRef.current.style.transition = "none";
      trackRef.current.style.transform = `translateY(calc(${base}% + ${pct}px))`;
    }
  }
  function onUp() {
    if (!drag.current.active) return;
    const dy = drag.current.dy;
    drag.current.active = false;
    if (trackRef.current) {
      // Restore the index-correct transform (not ""): if this gesture doesn't
      // cross the threshold below, go() never fires, so React never re-renders
      // to re-apply the style — leaving the track on a blank (hidden) reel.
      trackRef.current.style.transition = "";
      trackRef.current.style.transform = `translateY(${-index * 100}%)`;
    }
    if (dy < -70) go(index + 1);
    else if (dy > 70) go(index - 1);
  }
  useEffect(() => {
    let lock = false;
    function onWheel(e: WheelEvent) {
      if (lock || Math.abs(e.deltaY) < 14) return;
      lock = true;
      setIndex((i) =>
        Math.max(0, Math.min(instances.length - 1, i + (e.deltaY > 0 ? 1 : -1))),
      );
      setTimeout(() => {
        lock = false;
      }, 600);
    }
    const el = trackRef.current?.parentElement;
    el?.addEventListener("wheel", onWheel, { passive: true });
    return () => el?.removeEventListener("wheel", onWheel);
  }, [instances.length]);

  return (
    <div
      className="screen feed-screen"
      style={paused ? { display: "none" } : undefined}
    >
      <div className="field-bg" />
      <Hud
        streak={progress.streak}
        xp={progress.xp}
        elapsed={isSolved ? null : elapsed}
        onOpenMenu={onOpenMenu}
        onOpenStats={onOpenStats}
      />

      <div
        className="feed"
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
      >
        <div
          ref={trackRef}
          className="reel-track"
          style={{ transform: `translateY(${-index * 100}%)` }}
        >
          {instances.map((p, i) => (
            <PuzzleCard
              key={p.id}
              puzzle={p}
              active={i === index}
              solved={!!solved[p.id]}
              result={results[p.id] ?? null}
              onSolve={p.id === cur.id ? handleSolve : () => {}}
              onMiss={() => {}}
              footer={
                <button className="swipe-cue" onClick={() => go(index + 1)}>
                  <IChevUp />
                  <span>SWIPE UP · NEXT PUZZLE</span>
                </button>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
