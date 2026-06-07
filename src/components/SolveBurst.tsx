import { CheckM } from "./icons";

/** Celebratory overlay shown the moment a puzzle is solved. */
export function SolveBurst({ combo }: { combo: number }) {
  return (
    <div className="solve-burst">
      <div className="solve-wash" />
      <div className="solve-check">
        <CheckM />
      </div>
      {combo ? <div className="combo-pop">{combo}× COMBO!</div> : null}
      <span className="speck s0" style={{ left: "44%", top: "48%" }} />
      <span className="speck s1" style={{ left: "52%", top: "50%" }} />
      <span className="speck s2" style={{ left: "48%", top: "46%" }} />
    </div>
  );
}
