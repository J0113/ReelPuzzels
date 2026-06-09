import type { GameModule } from "../../types";
import { generate, type TangoData } from "./logic";
import { TangoGrid } from "./TangoGrid";

export const tango: GameModule<TangoData> = {
  meta: { id: "tango", skill: "TANGO", skillFull: "Tango", lang: true },
  generate,
  Component: TangoGrid,
};
