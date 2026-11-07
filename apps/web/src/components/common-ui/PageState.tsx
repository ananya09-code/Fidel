import { AlertTriangle, ArrowRight, LoaderCircle } from "lucide-react";
import { SESSION_EXPIRED_MESSAGE } from "@/lib/api";
import "./app-ui.css";

type PageStateProps = {
  kind: "loading" | "error" | "empty";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function PageState({ kind, title, description, actionLabel, onAction, compact = false }: PageStateProps) {
  return <section className={"app-page-state" + (compact ? " is-compact" : "") + " is-" + kind} role={kind === "error" ? "alert" : "status"} aria-live={kind === "error" ? "assertive" : "polite"}>
    {kind === "loading" ? <><LoaderCircle className="app-spinner" size={28} aria-hidden="true" /><span className="sr-only">{title}</span></> : <>
      {kind === "error" && <AlertTriangle size={20} aria-hidden="true" />}
      <div><h2>{title}</h2>{description && <p>{description}</p>}
        {kind === "error" && description === SESSION_EXPIRED_MESSAGE
          ? <a className="app-secondary" href="/sign-in">Sign in again<ArrowRight size={16} aria-hidden="true" /></a>
          : actionLabel && onAction && <button type="button" className="app-secondary" onClick={onAction}>{actionLabel}<ArrowRight size={16} aria-hidden="true" /></button>}
      </div>
    </>}
  </section>;
}
