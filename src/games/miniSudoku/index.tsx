import type { GameModule } from "../../types";
import { generate, type SudokuData } from "./logic";
import { MiniSudoku } from "./MiniSudoku";

export const miniSudoku: GameModule<SudokuData> = {
  meta: { id: "sudoku", skill: "SUDOKU", skillFull: "Mini Sudoku", lang: false },
  generate,
  Component: MiniSudoku,
};
