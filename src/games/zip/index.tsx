import type { GameModule } from "../../types";
import { generate, type ZipData } from "./logic";
import { ZipGrid } from "./ZipGrid";

export const zip: GameModule<ZipData> = {
  meta: { id: "zip", skill: "ZIP", skillFull: "Zip", lang: false },
  generate,
  Component: ZipGrid,
};
