import { useUser } from "@clerk/tanstack-react-start";
import {
  BookOpen,
  CalendarDays,
  Flame,
  Globe2,
  Mail,
  Target,
  Trophy,
} from "lucide-react";

import { useProfile } from "@/hooks/use-profile";
import { useDashboard } from "@/hooks/use-dashboard";
import { usePreferences } from "@/hooks/use-preferences";
import { PageState } from "@/components/common-ui/PageState";

export default function ProfileOverview() {
  const { user } = useUser();
  const profile = useProfile();
  const localProfile = profile.data;
  const dashboard = useDashboard();
  const preferences = usePreferences();

  if (profile.isPending || dashboard.isPending || preferences.isPending) {
    return <PageState kind="loading" title="Loading your profile" />;
  }

  if (profile.isError || dashboard.isError || preferences.isError) {
    const error = profile.error ?? dashboard.error ?? preferences.error;
    return <PageState kind="error" title="Couldn't load your profile" description={error?.message ?? "Your profile data is unavailable."} actionLabel="Try again" onAction={() => { void profile.refetch(); void dashboard.refetch(); void preferences.refetch(); }} />;
  }

  const stats = [
    { label: "Words learned", value: dashboard.data?.learned_words ?? 0, icon: BookOpen },
    { label: "Day streak", value: dashboard.data?.streak_days ?? 0, icon: Flame },
    { label: "Lessons completed", value: dashboard.data?.lessons_completed ?? 0, icon: Trophy },
    { label: "Daily goal", value: `${dashboard.data?.daily_word_goal ?? 5} words`, icon: Target },
  ];
  const activity = (dashboard.data?.weekly_activity ?? []).map((item) => ({
    day: new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" }),
    minutes: item.minutes,
  }));
  const maxMinutes = Math.max(1, ...activity.map((item) => item.minutes));
  const weeklyMinutes = activity.reduce((total, item) => total + item.minutes, 0);
  const language = preferences.data?.learning_language === "am" ? "Amharic" : "Afaan Oromoo";

  const name =
    user?.fullName ||
    localProfile?.display_name ||
    user?.username ||
    "Fidel learner";
  const username = user?.username ?? localProfile?.username ?? "";
  const email =
    user?.primaryEmailAddress?.emailAddress ?? localProfile?.email ?? "";
  const imageUrl = user?.imageUrl ?? localProfile?.image_url ?? null;
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "F";
  const joinedLabel = localProfile?.created_at
    ? `Joined ${new Date(localProfile.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })}`
    : "Recently joined";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 pb-10">
      <div>
        <p className="mb-2 text-sm font-medium text-[var(--sea-ink)]/55">
          YOUR JOURNEY
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          Your profile
        </h1>
        <p className="mt-2 text-sm text-[var(--sea-ink)]/65 sm:text-base">
          A little progress every day adds up to something big.
        </p>
      </div>

      {/* Profile card */}
      <section className="overflow-hidden rounded-3xl border border-[var(--sea-ink)]/10 bg-[var(--bg-base)]">
        <div className="h-28 bg-gradient-to-r from-[var(--hero-a)] to-[var(--hero-b)] sm:h-36" />

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-11 flex flex-wrap items-end justify-between gap-4 sm:-mt-12">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-[var(--bg-base)] bg-[var(--sand)] text-3xl font-bold text-[var(--sea-ink)]">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-2xl font-bold text-[var(--sea-ink)]">
              {name}
            </h2>

            {username && (
              <p className="mt-1 text-sm text-[var(--sea-ink)]/55">
                @{username}
              </p>
            )}

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--sea-ink)]/75">
              Learning Ethiopian languages, one word at a time.
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--sea-ink)]/60">
              {email && (
                <span className="inline-flex items-center gap-2">
                  <Mail size={16} />
                  {email}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <Globe2 size={16} />
                Learning {language}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} />
                {joinedLabel}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Learning statistics */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--sea-ink)]">
            Learning at a glance
          </h2>
          <p className="mt-1 text-sm text-[var(--sea-ink)]/60">
            Your progress so far.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-[var(--sea-ink)]/10 bg-[var(--bg-base)] p-4 sm:p-5"
            >
              <div className="mb-4 flex size-9 items-center justify-center rounded-xl bg-[var(--sand)]/60 text-[var(--sea-ink)]">
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold tracking-tight text-[var(--sea-ink)]">
                {value}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--sea-ink)]/60 sm:text-sm">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly activity */}
      <section className="rounded-3xl border border-[var(--sea-ink)]/10 bg-[var(--bg-base)] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[var(--sea-ink)]">
              This week's activity
            </h2>
            <p className="mt-1 text-sm text-[var(--sea-ink)]/60">
              Daily learning time, in minutes.
            </p>
          </div>
          <span className="rounded-full bg-[var(--sand)]/60 px-3 py-1.5 text-xs font-medium text-[var(--sea-ink)]">
            {weeklyMinutes} min total
          </span>
        </div>

        <div className="mt-7 flex h-40 items-end justify-between gap-2 sm:gap-4">
          {activity.map(({ day, minutes }) => (
            <div
              key={day}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="text-xs font-medium text-[var(--sea-ink)]/65">
                {minutes}m
              </span>
              <div className="flex h-24 w-full max-w-12 items-end overflow-hidden rounded-t-lg bg-[var(--sand)]/40">
                <div
                  className="w-full rounded-t-lg bg-[var(--sea-ink)]/75 transition-all"
                  style={{ height: `${(minutes / maxMinutes) * 100}%` }}
                  title={`${minutes} minutes`}
                />
              </div>
              <span className="text-xs text-[var(--sea-ink)]/55">{day}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Learning language */}
      <section className="flex flex-col gap-4 rounded-3xl border border-[var(--sea-ink)]/10 bg-[var(--bg-base)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--sand)]/60 text-[var(--sea-ink)]">
            <Globe2 size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-[var(--sea-ink)]">
              Your learning language
            </h2>
            <p className="mt-1 text-sm text-[var(--sea-ink)]/60">
              The language you're currently focusing on.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--sea-ink)]/10 px-4 py-3 text-sm font-medium text-[var(--sea-ink)]">
          <span className="size-2 rounded-full bg-[var(--sea-ink)]/60" />
          {language}
        </span>
      </section>
    </div>
  );
}
