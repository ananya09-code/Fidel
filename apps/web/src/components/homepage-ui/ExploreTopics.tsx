import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Coffee,
  Hash,
  MapPin,
  MessageCircle,
  Shapes,
  Utensils,
  Users,
} from "lucide-react";

import { PageState } from "@/components/common-ui/PageState";
import { usePreferences } from "@/hooks/use-preferences";
import { useWordCategories } from "@/hooks/use-words";

const topicIcons = [MessageCircle, Coffee, Utensils, Users, MapPin, Hash, Shapes];

export function ExploreTopics() {
  const [visibleCount, setVisibleCount] = useState(4);
  const preferences = usePreferences();
  const languageCode = preferences.data?.learning_language ?? "om";
  const categories = useWordCategories(languageCode);

  if (preferences.isPending || categories.isPending) {
    return <PageState kind="loading" title="Loading vocabulary topics" compact />;
  }

  if (preferences.isError || categories.isError) {
    const error = preferences.error ?? categories.error;
    return (
      <PageState
        kind="error"
        title="Couldn't load vocabulary topics"
        description={error?.message ?? "Topic data is unavailable."}
        actionLabel="Try again"
        onAction={() => {
          void preferences.refetch();
          void categories.refetch();
        }}
        compact
      />
    );
  }

  const topics = categories.data?.data ?? [];
  const visibleTopics = topics.slice(0, visibleCount);
  const remainingTopics = Math.max(0, topics.length - visibleTopics.length);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--sea-ink)]/55">
            Explore your vocabulary
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-3xl">
            Learn by topic
          </h2>
          <p className="max-w-xl text-sm leading-6 text-[var(--sea-ink)]/55">
            Choose a topic to open its approved words in your dictionary.
          </p>
        </div>

        <span className="w-fit rounded-full bg-[var(--sand)]/35 px-3 py-1.5 text-sm font-medium text-[var(--sea-ink)]">
          {topics.length} {topics.length === 1 ? "topic" : "topics"}
        </span>
      </div>

      {topics.length === 0 ? (
        <PageState
          kind="empty"
          title="No topics available yet"
          description="Approved vocabulary categories will appear here."
          compact
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleTopics.map((topic, index) => {
            const Icon = topicIcons[index % topicIcons.length];
            return (
              <Link
                key={topic.name}
                to="/dictionary"
                search={{ category: topic.name }}
                aria-label={`Open ${topic.name} vocabulary`}
                className="group flex h-full flex-col rounded-2xl border border-[var(--sea-ink)]/10 bg-white/60 p-5 outline-none transition hover:-translate-y-0.5 hover:border-[var(--sea-ink)]/25 hover:bg-[var(--sand)]/15 focus-visible:ring-2 focus-visible:ring-[var(--sea-ink)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--sea-ink)] text-white">
                    <Icon className="size-5" strokeWidth={1.8} />
                  </div>
                  <span className="rounded-full bg-[var(--sand)]/35 px-2.5 py-1 text-xs font-semibold text-[var(--sea-ink)]">
                    {topic.word_count} {topic.word_count === 1 ? "word" : "words"}
                  </span>
                </div>

                <div className="mt-5 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink)]/45">
                    Topic {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight text-[var(--sea-ink)]">
                    {topic.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--sea-ink)]/55">
                    Explore the approved words and phrases in this topic.
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--sea-ink)]/8 pt-4">
                  <span className="text-sm font-medium text-[var(--sea-ink)]/55">
                    Open dictionary
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-full bg-[var(--sea-ink)] text-white transition-transform group-hover:translate-x-1">
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {(remainingTopics > 0 || visibleCount > 4) && (
        <div className="flex flex-wrap justify-center gap-3">
          {visibleCount > 4 && (
            <button
              type="button"
              onClick={() => setVisibleCount(4)}
              className="rounded-xl border border-[var(--sea-ink)]/15 bg-white/60 px-5 py-3 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--sand)]/25"
            >
              Show fewer topics
            </button>
          )}
          {remainingTopics > 0 && (
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + 4)}
            className="rounded-xl bg-[var(--sea-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Load more topics ({remainingTopics} remaining)
          </button>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-[var(--sea-ink)]/10 bg-white/50 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sand)]/35">
          <BookOpen className="size-5 text-[var(--sea-ink)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--sea-ink)]">Learn one topic at a time</p>
          <p className="mt-1 text-sm leading-6 text-[var(--sea-ink)]/55">
            Every card is connected to the live vocabulary in your dictionary.
          </p>
        </div>
      </div>
    </section>
  );
}
