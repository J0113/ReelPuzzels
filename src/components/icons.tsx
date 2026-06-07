/** SVG icon set ported from the mockup (only the icons the two modes need). */
import type { CSSProperties } from "react";

type P = { style?: CSSProperties };

export const IBolt = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
  </svg>
);
export const IFlame = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c1 3-1 4-2 6-1 1.6-1 3 0 4 .6-1 1.4-1.6 2-3 1.5 2 3 3.3 3 6a5 5 0 11-10 0c0-3 2-5 3-7 1-2 3-3 4-6z" />
  </svg>
);
export const ITrophy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4h12v4a6 6 0 01-12 0V4zM6 6H3v1a3 3 0 003 3M18 6h3v1a3 3 0 01-3 3M9 20h6M12 14v6" />
  </svg>
);
export const IGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="7" height="7" rx="1.6" />
    <rect x="13" y="4" width="7" height="7" rx="1.6" />
    <rect x="4" y="13" width="7" height="7" rx="1.6" />
    <rect x="13" y="13" width="7" height="7" rx="1.6" />
  </svg>
);
export const IClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IChevUp = ({ style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M6 15l6-6 6 6" />
  </svg>
);
export const IPlay = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 5l11 7-11 7V5z" />
  </svg>
);
export const IBrain = () => (
  <svg viewBox="0 0 32 32" fill="currentColor">
    <path d="M11 5a4 4 0 00-4 4 4 4 0 00-2 7 4 4 0 003 6 4 4 0 008 0V7a3 3 0 00-5-2zM21 5a3 3 0 015 2v15a4 4 0 01-8 0V7a3 3 0 013-2z" />
  </svg>
);
export const IDot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4 4L19 7" />
  </svg>
);
export const CheckM = ({ cls }: { cls?: string }) => (
  <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.2 4.2L19 7" />
  </svg>
);
