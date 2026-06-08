import { useState } from "react";
import { useProgress } from "./state/useProgress";
import { useTheme } from "./state/useTheme";
import { Onboarding } from "./screens/Onboarding";
import { Feed } from "./screens/Feed";
import { SingleGame } from "./screens/SingleGame";
import { Menu } from "./screens/Menu";
import { Stats } from "./screens/Stats";

type Screen = "onboarding" | "feed" | "single" | "menu" | "stats";

export function App() {
  const [theme, setTheme] = useTheme();
  const { progress, recordSolve } = useProgress();
  const [screen, setScreen] = useState<Screen>("onboarding");
  const [modeId, setModeId] = useState("word");

  return (
    <div className="stage" data-theme={theme}>
      {screen === "onboarding" && (
        <Onboarding
          theme={theme}
          setTheme={setTheme}
          onBegin={() => setScreen("feed")}
          onBrowse={() => setScreen("menu")}
        />
      )}

      {(screen === "feed" || screen === "menu" || screen === "stats") && (
        <Feed
          progress={progress}
          recordSolve={recordSolve}
          onOpenMenu={() => setScreen("menu")}
          onOpenStats={() => setScreen("stats")}
          paused={screen !== "feed"}
        />
      )}

      {screen === "single" && (
        <SingleGame
          modeId={modeId}
          recordSolve={recordSolve}
          onClose={() => setScreen("menu")}
        />
      )}

      {screen === "menu" && (
        <Menu
          theme={theme}
          setTheme={setTheme}
          onPlay={(id) => {
            setModeId(id);
            setScreen("single");
          }}
          onResume={() => setScreen("feed")}
          onOpenStats={() => setScreen("stats")}
          onClose={() => setScreen("feed")}
        />
      )}

      {screen === "stats" && (
        <Stats progress={progress} onClose={() => setScreen("menu")} />
      )}
    </div>
  );
}
