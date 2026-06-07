import type { Difficulty } from "../../types";

export interface WordEntry {
  /** Canonical answer (uppercase). */
  word: string;
  /** Hint shown under the slots. */
  hint: string;
  /** Other valid solutions of the same letters (uppercase), optional. */
  anagrams?: string[];
}

/**
 * Word pools by difficulty. easy = 4 letters, medium = 5–6, hard = 7+.
 * `anagrams` lists alternative correct unscramblings of the same tiles.
 */
export const WORDS: Record<Difficulty, WordEntry[]> = {
  easy: [
    { word: "CALM", hint: "A settled, unhurried mind.", anagrams: ["CLAM"] },
    { word: "PLAY", hint: "What you came here to do." },
    { word: "MIND", hint: "Where the puzzles get solved." },
    { word: "FAST", hint: "Solve this quickly for a bonus." },
    { word: "GAME", hint: "One round of fun." },
    { word: "WORD", hint: "You are unscrambling one now." },
    { word: "STAR", hint: "Twinkles at night.", anagrams: ["RATS", "ARTS", "TARS"] },
    { word: "LOOP", hint: "Goes around and repeats.", anagrams: ["POOL", "POLO"] },
    { word: "TIME", hint: "The clock counts it up.", anagrams: ["ITEM", "MITE", "EMIT"] },
    { word: "BRAIN", hint: "The muscle you train here." },
  ],
  medium: [
    { word: "PUZZLE", hint: "A problem made to be solved." },
    { word: "STREAK", hint: "Solve many in a row to build one." },
    { word: "LETTER", hint: "Twenty-six of them in the alphabet." },
    { word: "REASON", hint: "Logic and the cause of things." },
    { word: "MASTER", hint: "One who has fully learned a skill.", anagrams: ["STREAM", "TAMERS"] },
    { word: "SILENT", hint: "Without a sound.", anagrams: ["LISTEN", "TINSEL", "ENLIST"] },
    { word: "NUMBER", hint: "Math is made of these." },
    { word: "CLEVER", hint: "Quick-witted and sharp." },
    { word: "RANDOM", hint: "No fixed pattern." },
    { word: "SECURE", hint: "Safe and locked down.", anagrams: ["RESCUE"] },
  ],
  hard: [
    { word: "SCRAMBLE", hint: "Exactly what happened to these letters." },
    { word: "PATTERN", hint: "A repeating arrangement." },
    { word: "VICTORY", hint: "The win at the end of a run." },
    { word: "STRATEGY", hint: "A plan to come out ahead." },
    { word: "MEMORIES", hint: "What you store and recall." },
    { word: "TRIANGLE", hint: "A three-sided shape.", anagrams: ["ALERTING", "INTEGRAL", "RELATING", "ALTERING"] },
    { word: "ROUTINE", hint: "A regular, repeated sequence." },
    { word: "DISCOVER", hint: "To find something new." },
    { word: "QUESTION", hint: "Every puzzle poses one." },
    { word: "ELEGANCE", hint: "Graceful, refined simplicity." },
  ],
};
