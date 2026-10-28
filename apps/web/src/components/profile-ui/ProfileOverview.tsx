
import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  Flame,
  Globe2,
  Pencil,
  Target,
  Trophy,
  X,
} from "lucide-react";

const initialProfile = {
  name: "Ananya Mengistu",
  username: "ananya",
  email: "[ananya@example.com](mailto:ananya@example.com)",
  bio: "Learning Ethiopian languages, one word at a time.",
  language: "Afaan Oromoo",
};

const stats = [
  { label: "Words learned", value: "124", icon: BookOpen },
  { label: "Day streak", value: "7", icon: Flame },
  { label: "Lessons completed", value: "18", icon: Trophy },
  { label: "Daily goal", value: "10 min", icon: Target },
];

const activity = [
  { day: "Mon", minutes: 12 },
  { day: "Tue", minutes: 8 },
  { day: "Wed", minutes: 15 },
  { day: "Thu", minutes: 10 },
  { day: "Fri", minutes: 6 },
  { day: "Sat", minutes: 18 },
  { day: "Sun", minutes: 4 },
];

export default function ProfileOverview() {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  function saveProfile() {
    setProfile(draft);
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  function cancelEditing() {
    setDraft(profile);
    setEditing(false);
  }

  return (<div className="mx-auto w-full max-w-5xl space-y-7 pb-10"> <div> <p className="mb-2 text-sm font-medium text-[var(--sea-ink)]/55">
    YOUR JOURNEY </p> <h1 className="text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
      Your profile </h1> <p className="mt-2 text-sm text-[var(--sea-ink)]/65 sm:text-base">
      A little progress every day adds up to something big. </p> </div>

    ```
    {/* Profile card */}
    <section className="overflow-hidden rounded-3xl border border-[var(--sea-ink)]/10 bg-[var(--bg-base)]">
      <div className="h-28 bg-gradient-to-r from-[var(--hero-a)] to-[var(--hero-b)] sm:h-36" />

      <div className="px-5 pb-6 sm:px-8">
        <div className="-mt-11 flex flex-wrap items-end justify-between gap-4 sm:-mt-12">
          <div className="flex size-24 items-center justify-center rounded-3xl border-4 border-[var(--bg-base)] bg-[var(--sand)] text-3xl font-bold text-[var(--sea-ink)]">
            {profile.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setDraft(profile);
                setEditing(true);
              }}
              className="mb-1 inline-flex items-center gap-2 rounded-xl border border-[var(--sea-ink)]/15 px-4 py-2.5 text-sm font-medium text-[var(--sea-ink)] transition hover:bg-[var(--sand)]/50"
            >
              <Pencil size={15} />
              Edit profile
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--sea-ink)]">
                Display name
              </span>
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                className="w-full rounded-xl border border-[var(--sea-ink)]/15 bg-transparent px-4 py-3 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--sea-ink)]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--sea-ink)]">
                Username
              </span>
              <input
                value={draft.username}
                onChange={(event) =>
                  setDraft({ ...draft, username: event.target.value })
                }
                className="w-full rounded-xl border border-[var(--sea-ink)]/15 bg-transparent px-4 py-3 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--sea-ink)]"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-[var(--sea-ink)]">
                Email
              </span>
              <input
                type="email"
                value={draft.email}
                onChange={(event) =>
                  setDraft({ ...draft, email: event.target.value })
                }
                className="w-full rounded-xl border border-[var(--sea-ink)]/15 bg-transparent px-4 py-3 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--sea-ink)]"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-[var(--sea-ink)]">
                About you
              </span>
              <textarea
                rows={3}
                value={draft.bio}
                onChange={(event) =>
                  setDraft({ ...draft, bio: event.target.value })
                }
                className="w-full resize-y rounded-xl border border-[var(--sea-ink)]/15 bg-transparent px-4 py-3 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--sea-ink)]"
              />
            </label>

            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={saveProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--sea-ink)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                <Check size={16} />
                Save profile
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--sea-ink)]/15 px-4 py-2.5 text-sm font-medium text-[var(--sea-ink)] hover:bg-[var(--sand)]/40"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-[var(--sea-ink)]">
              {profile.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--sea-ink)]/55">
              @{profile.username}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--sea-ink)]/75">
              {profile.bio}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--sea-ink)]/60">
              <span className="inline-flex items-center gap-2">
                <Globe2 size={16} />
                Learning {profile.language}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} />
                Joined recently
              </span>
            </div>
            {saved && (
              <p className="mt-3 text-sm font-medium text-[var(--sea-ink)]">
                Profile updated successfully.
              </p>
            )}
          </div>
        )}
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
      <p className="mt-3 text-xs text-[var(--sea-ink)]/45">
        Illustrative demo statistics — not your actual learning history.
      </p>
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
          Demo data
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
                style={{ height: `${(minutes / 20) * 100}%` }}
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
        {profile.language}
      </span>
    </section>
  </div>

  );
}

