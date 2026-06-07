import type { GameModule } from "../../types";
import { generate, type MathData } from "./generate";
import { SpeedMath } from "./SpeedMath";

export const speedMath: GameModule<MathData> = {
  meta: { id: "math", skill: "MATH", skillFull: "Speed Math", lang: false },
  generate,
  Component: SpeedMath,
};
