import {
  XP_BY_DIFFICULTY,
  type Difficulty,
  type GameModule,
  type PuzzleInstance,
} from "../../types";
import { RNG, uid } from "../../lib/rng";
import { WORDS } from "./words";
import { WordScramble, type WordData } from "./WordScramble";

const PROMPTS = [
  "Unscramble the letters into a word.",
  "Rearrange the tiles to spell a word.",
  "Find the hidden word in these letters.",
];

function scramble(word: string, rng: RNG): string[] {
  const letters = word.split("");
  let out = rng.shuffle(letters);
  // Avoid handing back the already-solved word (retry a few times).
  for (let i = 0; i < 6 && out.join("") === word; i++) {
    out = rng.shuffle(letters);
  }
  return out;
}

function generate(
  difficulty: Difficulty,
  rng: RNG,
): PuzzleInstance<WordData> {
  const entry = rng.pick(WORDS[difficulty]);
  const accept = [entry.word, ...(entry.anagrams ?? [])];
  return {
    id: uid("word"),
    modeId: "word",
    difficulty,
    prompt: rng.pick(PROMPTS),
    hint: entry.hint,
    xp: XP_BY_DIFFICULTY[difficulty],
    data: { letters: scramble(entry.word, rng), accept },
  };
}

export const wordScramble: GameModule<WordData> = {
  meta: { id: "word", skill: "WORDS", skillFull: "Word Scramble", lang: true },
  generate,
  Component: WordScramble,
};
