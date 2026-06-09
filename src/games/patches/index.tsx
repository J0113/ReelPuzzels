import type { GameModule } from "../../types";
import { generate, type PatchesData } from "./logic";
import { PatchesGrid } from "./PatchesGrid";

export const patches: GameModule<PatchesData> = {
  meta: { id: "patches", skill: "PATCHES", skillFull: "Patches", lang: true },
  generate,
  Component: PatchesGrid,
};
