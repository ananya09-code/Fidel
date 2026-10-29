
import { Link } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import fidelLogo from "@/assets/fidallogo.png";

export function LandingHeader() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-4 sm:px-6">
      <div
        className="
          relative mx-auto flex h-[68px] max-w-7xl items-center
          justify-between gap-4 overflow-hidden rounded-[22px]
          border border-white/70
          bg-white/35 px-4
          shadow-[0_8px_32px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(255,255,255,0.2)]
          backdrop-blur-2xl backdrop-saturate-200
          sm:px-6
        "
      >
        {/* Glossy light reflections */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-b from-white/65 via-white/15 to-white/5"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 left-[15%] h-20 w-2/3 rounded-full bg-white/50 blur-2xl"
        />

        {/* Logo */}
        <Link
          to="/"
          className="relative z-10 flex shrink-0 items-center gap-2.5"
          aria-label="Fidel home"
        >
          <img
            src={fidelLogo}
            alt="Fidel"
            className="h-10 w-10 object-contain drop-shadow-sm"
          />
          <span className="text-xl font-bold tracking-tight text-[var(--sea-ink)]">
            Fidel
          </span>
        </Link>

        {/* Actions */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-3">
          {isLoaded && isSignedIn ? (
            <Link
              to="/Home"
              className="
                group relative overflow-hidden rounded-xl
                border border-white/20
                bg-[var(--sea-ink)] px-4 py-2.5
                text-sm font-semibold text-white
                shadow-[0_3px_12px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.2)]
                transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-lg
                active:translate-y-0 active:scale-95
                sm:px-5
              "
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent"
              />
              <span className="relative">Go to dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                to="/sign-in"
                className="
                  rounded-xl px-3 py-2.5 text-sm font-semibold
                  text-[var(--sea-ink)]
                  transition-all duration-200
                  hover:bg-white/40
                  active:scale-95
                  sm:px-4
                "
              >
                Log in
              </Link>

              <Link
                to="/sign-up"
                className="
                  group relative overflow-hidden rounded-xl
                  border border-white/20
                  bg-[var(--sea-ink)] px-4 py-2.5
                  text-sm font-semibold text-white
                  shadow-[0_3px_12px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.2)]
                  transition-all duration-200
                  hover:-translate-y-0.5 hover:shadow-lg
                  active:translate-y-0 active:scale-95
                  sm:px-5
                "
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent"
                />
                <span className="relative">Start learning</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

