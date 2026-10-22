
import { createFileRoute } from "@tanstack/react-router";
import { LandingHeader } from "@/components/landing-ui/Header";
import { Hero } from "@/components/landing-ui/Hero";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (<div className="relative isolate min-h-screen overflow-hidden">
    {/* Ambient background lighting */} <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    > <div className="absolute -top-40 left-1/4 h-[420px] w-[420px] rounded-full bg-sky-200/30 blur-[120px]" />

      ```
      <div className="absolute right-[-100px] top-[20%] h-[360px] w-[360px] rounded-full bg-violet-200/25 blur-[120px]" />

      <div className="absolute bottom-[-100px] left-[-80px] h-[320px] w-[320px] rounded-full bg-amber-100/40 blur-[100px]" />
    </div>

    <LandingHeader />

    <main>
      <Hero />
    </main>
  </div>

  );
}
