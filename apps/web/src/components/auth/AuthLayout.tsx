
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import fidelLogo from "@/assets/fidallogo.png";
interface AuthLayoutProps {
  children: ReactNode;
  variant: "sign-in" | "sign-up";
}

export function AuthLayout({ children, variant }: AuthLayoutProps) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-amber-50">
      {/* Ambient gradient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-sky-200/40 blur-[110px]" />
        <div className="absolute -right-24 top-16 h-96 w-96 rounded-full bg-violet-200/30 blur-[120px]" />
        <div className="absolute bottom-[-180px] left-1/3 h-[440px] w-[440px] rounded-full bg-amber-200/40 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 lg:px-14">

        {/* Logo */}
        <Link
          to="/"
          className="relative z-10 hidden shrink-0 items-center gap-2.5 md:flex"
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
        <p className="hidden text-sm text-slate-500 sm:block">
          Ethiopian languages. A closer you.
        </p>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl items-center justify-center px-5 pb-12 pt-4 sm:px-8">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Brand panel */}
          <section className="hidden lg:block">
            <div className="max-w-md">
              <div className="inline-flex rounded-full border border-orange-200/60 bg-white/60 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur-md">
                <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Your language journey starts here
                </span>
              </div>


              <h1 className="mt-6 text-5xl font-bold leading-[1.12] tracking-tight text-slate-900 xl:text-6xl">
                Every language
                <br />
                brings us
                <br />
                <span className="text-teal-700">closer.</span>
              </h1>

              <p className="mt-6 max-w-sm text-lg leading-8 text-slate-600">
                Discover the beauty of Ethiopian languages, one word,
                one conversation, and one day at a time.
              </p>

              <div className="relative mt-10 flex h-40 w-64 items-center justify-center">
                <div className="absolute inset-4 rounded-full bg-teal-200/40 blur-2xl" />

                <div className="relative flex size-32 items-center justify-center rounded-[2.5rem] border border-white/80 bg-white/65 text-6xl shadow-xl shadow-teal-900/5 backdrop-blur-xl">
                  🦌
                </div>

                <div className="absolute right-0 top-2 rounded-2xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-md">
                  እንኳን ደህና መጡ!
                </div>

                <div className="absolute bottom-1 left-0 rounded-2xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-md">
                  Akkam jirtu?
                </div>
              </div>
            </div>
          </section>

          {/* Authentication card */}
          <section className="mx-auto w-full max-w-md">
            <Card className="gap-0 rounded-[2rem] border-white/80 bg-white/75 py-0 shadow-2xl shadow-slate-900/[0.07] backdrop-blur-2xl">
              <CardContent className="p-6 sm:p-9">
                {children}
              </CardContent>
            </Card>

            {variant === "sign-up" && (
              <p className="mt-5 px-4 text-center text-xs leading-5 text-slate-500">
                By creating an account, you agree to our{" "}
                <Link to="/" className="underline underline-offset-4">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/" className="underline underline-offset-4">
                  Privacy Policy
                </Link>
                .
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
