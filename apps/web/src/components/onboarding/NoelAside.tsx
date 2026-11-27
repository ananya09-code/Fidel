import type { ReactNode } from "react";
import { NoelGuide } from "./NoelGuide";
import "./noel-aside.css";

/** A quiet guide note; language characters remain the speakers in lessons and Quest. */
export function NoelAside({ children, step = 0, className = "" }: { children: ReactNode; step?: number; className?: string }) {
  return <div className={`noel-aside ${className}`}>
    <span className="noel-aside-portrait" aria-hidden="true"><NoelGuide step={step} /></span>
    <div className="noel-aside-copy"><strong>Noel</strong><p>{children}</p></div>
  </div>;
}
