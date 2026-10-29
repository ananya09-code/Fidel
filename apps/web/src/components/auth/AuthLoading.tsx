import fidelLogo from "@/assets/fidallogo.png";

export function AuthLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh items-center justify-center bg-[var(--bg-base)] px-6"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <img
          src={fidelLogo}
          alt=""
          className="h-12 w-12 animate-pulse object-contain"
        />
        <div>
          <p className="font-semibold text-[var(--sea-ink)]">
            Checking your session
          </p>
          <p className="mt-1 text-sm text-[var(--sea-ink)]/60">
            One moment while Fidel gets ready.
          </p>
        </div>
      </div>
    </div>
  );
}
