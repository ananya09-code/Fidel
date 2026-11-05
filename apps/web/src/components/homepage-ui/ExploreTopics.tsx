import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { WordCategory } from "@/lib/api/words";
import { topicLabel } from "./labels";

import { PageState } from "@/components/common-ui/PageState";
import { usePreferences } from "@/hooks/use-preferences";
import { useWordCategories } from "@/hooks/use-words";


export function ExploreTopics() {
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

  return <TopicList topics={categories.data?.data ?? []} />;
}

export function TopicList({ topics }: { topics: WordCategory[] }) {
  const [visibleCount, setVisibleCount] = useState(4);
  const visibleTopics = topics.slice(0, visibleCount);
  const remaining = Math.max(0, topics.length - visibleTopics.length);
  return (
    <section>
      <div className="home-section-heading"><h2>Learn by topic</h2><Link to="/dictionary" className="home-text-link">Dictionary <ArrowRight size={15} aria-hidden="true" /></Link></div>
      {topics.length ? <ul className="home-topic-list">{visibleTopics.map(topic => (
        <li key={topic.name}><Link to="/dictionary" search={{ category: topic.name }} aria-label={`Open ${topic.name} vocabulary`}>
          <span>{topicLabel(topic.name)}</span><span>{topic.word_count.toLocaleString()} {topic.word_count === 1 ? "word" : "words"}<ArrowRight size={15} aria-hidden="true" /></span>
        </Link></li>
      ))}</ul> : <p className="home-empty">Approved vocabulary topics will appear here when they’re ready.</p>}
      {(remaining > 0 || visibleCount > 4) && <div className="home-topic-controls">
        {remaining > 0 && <button type="button" onClick={() => setVisibleCount(count => count + 4)}>More topics ({remaining})</button>}
        {visibleCount > 4 && <button type="button" onClick={() => setVisibleCount(4)}>Show fewer</button>}
      </div>}
    </section>
  );
}
