import type { GameModule } from "../../types";
import { generate, type QueensData } from "./logic";
import { QueensGrid } from "./QueensGrid";

export const queens: GameModule<QueensData> = {
  meta: { id: "queens", skill: "QUEENS", skillFull: "Queens", lang: true },
  generate,
  Component: QueensGrid,
};
