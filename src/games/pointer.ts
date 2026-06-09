/**
 * Maps a screen point to the grid cell under it via the cell's `data-i`
 * attribute. Used by the drag-driven modes (Queens / Zip / Patches) so a single
 * pointer stroke can cross many cells — works for both touch and mouse, since
 * touch uses implicit pointer capture and `elementFromPoint` still resolves the
 * visually-topmost cell.
 */
export function cellAtPoint(clientX: number, clientY: number): number | null {
  const el = document.elementFromPoint(clientX, clientY);
  const cell = (el as Element | null)?.closest("[data-i]");
  if (!cell) return null;
  const v = cell.getAttribute("data-i");
  return v == null ? null : Number(v);
}
