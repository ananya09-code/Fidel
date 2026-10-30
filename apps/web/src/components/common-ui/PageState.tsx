import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";

type PageStateProps = {
  kind: "loading" | "error" | "empty";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function PageState({
  kind,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: PageStateProps) {
  if (kind === "loading") {
    return (
      <section
        className={`flex items-center justify-center ${compact ? "min-h-32" : "min-h-72"}`}
        role="status"
        aria-live="polite"
      >
        <LoaderCircle className="size-8 animate-spin text-[#E9A23B]" />
        <span className="sr-only">{title}</span>
      </section>
    );
  }

  const Icon = kind === "error" ? AlertTriangle : Inbox;

  return (
    <section
      className={`mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-3xl border border-[var(--sea-ink)]/10 bg-white/55 px-6 text-center ${compact ? "min-h-44 py-8" : "min-h-72 py-12"}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <div className={`flex size-12 items-center justify-center rounded-2xl ${kind === "error" ? "bg-rose-50 text-rose-700" : "bg-[var(--sand)]/40 text-[var(--sea-ink)]"}`}>
        <Icon className="size-6" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-[var(--sea-ink)]">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--sea-ink)]/60">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-xl bg-[var(--sea-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}
