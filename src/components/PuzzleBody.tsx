import { getMode } from "../games/registry";
import type { PuzzleComponentProps } from "../types";

/** Dispatches to the owning mode's Component based on the puzzle's modeId. */
export function PuzzleBody(props: PuzzleComponentProps) {
  const mode = getMode(props.puzzle.modeId);
  if (!mode) return null;
  const Component = mode.Component;
  return <Component {...props} />;
}
