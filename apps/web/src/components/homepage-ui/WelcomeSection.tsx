import { Sparkles } from "lucide-react";

export function WelcomeSection() {
  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <section className="flex items-center justify-between gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          YOUR LEARNING JOURNEY
        </p>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-3xl">
          {greeting}! 👋
        </h1>

        <p className="text-sm text-muted-foreground sm:text-base">
          Ready to learn something new?
        </p>
      </div>

      <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sand)] sm:flex">
        <Sparkles className="h-6 w-6 text-[var(--sea-ink)]" />
      </div>
    </section>
  );
}
