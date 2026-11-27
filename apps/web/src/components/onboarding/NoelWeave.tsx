import { useId } from "react";

/** The small diamond motif from Fidel's tibeb strip, used as a quiet moving ground. */
export function NoelWeave() {
  const patternId = useId();
  return <svg className="noel-weave" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <pattern id={patternId} width="48" height="24" patternUnits="userSpaceOnUse">
        <path d="M0 12 12 0 24 12 12 24ZM24 12 36 0 48 12 36 24Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="m6 12 6-6 6 6-6 6Zm24 0 6-6 6 6-6 6Z" fill="currentColor" />
      </pattern>
    </defs>
    <g className="noel-weave-field"><rect x="-80" y="-80" width="960" height="960" fill={`url(#${patternId})`} /></g>
    <g className="noel-weave-trail" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m-28 288 32-32 32 32-32 32Zm64 0 32-32 32 32-32 32Zm64 0 32-32 32 32-32 32Zm64 0 32-32 32 32-32 32Z" />
      <path d="m-28 536 32-32 32 32-32 32Zm64 0 32-32 32 32-32 32Zm64 0 32-32 32 32-32 32Z" />
    </g>
  </svg>;
}
