import { useEffect, useState } from "react";

export type Theme = "neon" | "calm";

const KEY = "rp_theme";

/** Theme is a UI preference, persisted separately from game progress. */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(KEY) as Theme) || "neon",
  );
  useEffect(() => {
    localStorage.setItem(KEY, theme);
  }, [theme]);
  return [theme, setTheme];
}
