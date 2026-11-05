import { ArrowRight, Check, ChevronDown, LockKeyhole, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLearningPath } from "@/hooks/use-learning-path";
import { useLearningProgress } from "@/hooks/use-learning-progress";
import { usePreferences } from "@/hooks/use-preferences";
import { PageState } from "@/components/common-ui/PageState";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import type { LearningPathResponse, ProgressSummary } from "@/lib/api/learning";
import "./learn-path.css";

export function LearningPathView({ path, progress }: { path: LearningPathResponse; progress: ProgressSummary }) {
  const lessons = path.levels.flatMap((level) => level.lessons);
  const ids = new Set(lessons.map((lesson) => lesson.id));
  const completed = new Set(progress.completed_lesson_keys);
  const finished = lessons.filter((lesson) => completed.has(lesson.id)).length;
  const attempt = progress.in_progress.find((item) => ids.has(item.lesson_key) && !completed.has(item.lesson_key));
  const next = lessons.find((lesson) => lesson.id === attempt?.lesson_key) ?? lessons.find((lesson) => !completed.has(lesson.id));
  const language = path.language_code === "om" ? "Afaan Oromoo" : path.language_code === "am" ? "አማርኛ" : path.language_code;
  return <>
    <header className="learn-page-title"><div><h1>Your learning path</h1><p>{language} · One conversation at a time.</p></div><Link to="/dictionary" search={{ category: undefined }} className="learn-dictionary">Explore words <ArrowRight size={16} aria-hidden="true" /></Link></header>
    {!lessons.length ? <PageState kind="empty" title="Lessons are on their way" description="No lessons are available for this language yet." compact /> : <>
      <section className="learn-next" aria-labelledby="learn-next-title">
        <FidelTeacherMark className="learn-teacher" />
        <div className="learn-next-copy"><p>{next ? (attempt ? "Pick up where you left off" : "Your next lesson") : "Every lesson completed"}</p><h2 id="learn-next-title">{next?.title ?? "Look how far you’ve come."}</h2><p>{next ? `${next.word_count} words${attempt ? ` · ${attempt.question_index} of ${attempt.question_count} practice questions finished` : ""}` : "Keep familiar words fresh with a review."}</p></div>
        {next ? <Link className="learn-start" to="/Learn/$lessonId" params={{ lessonId: next.id }} search={{ language_code: path.language_code }}>{attempt ? "Continue lesson" : "Start lesson"}<ArrowRight size={18} aria-hidden="true" /></Link> : <Link className="learn-start" to="/review" search={{ start: false }}>Review words<ArrowRight size={18} aria-hidden="true" /></Link>}
      </section>
      <div className="learn-overall"><p><strong>{finished}</strong> of {lessons.length} lessons completed</p><progress value={finished} max={lessons.length} aria-label="Learning path completion" /><span>{Math.round(finished / lessons.length * 100)}%</span></div>
      <div className="learn-units">{path.levels.map((level) => {
        const done = level.lessons.filter((lesson) => completed.has(lesson.id)).length;
        const active = level.lessons.some((lesson) => lesson.id === next?.id);
        return <details key={level.id} className="learn-unit" open={active || (!next && done > 0)}>
          <summary><span className={`learn-unit-marker${done === level.lessons.length && done > 0 ? " is-done" : active ? " is-active" : ""}`} aria-hidden="true">{done === level.lessons.length && done > 0 ? <Check size={18} /> : <span />}</span><span className="learn-unit-title"><h2>{level.title}</h2><span>{level.subtitle} · {level.total_words} words</span></span><span className="learn-unit-count">{done}/{level.lessons.length}<span> completed</span></span><ChevronDown className="learn-chevron" size={18} aria-hidden="true" /></summary>
          <ol className="learn-trail">{level.lessons.map((lesson, index) => {
            const state = completed.has(lesson.id) ? "done" : lesson.id === next?.id ? "active" : "locked";
            return <li key={lesson.id} className={`learn-stop is-${state}`}><div className="learn-stop-layout"><span className="learn-node" aria-hidden="true">{state === "done" ? <Check size={21} /> : state === "active" ? <Play size={20} fill="currentColor" /> : <LockKeyhole size={18} />}</span><div className="learn-stop-copy"><h3>{lesson.title}</h3><p>{lesson.subtitle}</p><span>{lesson.word_count} words · {state === "done" ? "Completed" : state === "active" ? "Up next" : "Finish previous lessons to unlock"}</span></div>{state !== "locked" && <Link className="learn-stop-link" to="/Learn/$lessonId" params={{ lessonId: lesson.id }} search={{ language_code: path.language_code }} aria-label={`${state === "done" ? "Practise" : "Start"} ${lesson.title}`}><ArrowRight size={20} aria-hidden="true" /></Link>}</div>{index < level.lessons.length - 1 && <svg className="learn-trail-line" viewBox="0 0 88 38" preserveAspectRatio="none" aria-hidden="true"><path d={index % 2 === 0 ? "M24 0 C24 20 64 18 64 38" : "M64 0 C64 20 24 18 24 38"} /></svg>}</li>;
          })}</ol>
        </details>;
      })}</div>
    </>}
  </>;
}

export function LearningPath() {
  const preferences = usePreferences();
  const progress = useLearningProgress();
  const path = useLearningPath(preferences.data?.learning_language ?? "om");
  if (preferences.isPending || progress.isPending || path.isPending) return <PageState kind="loading" title="Loading your learning path" />;
  if (preferences.isError || progress.isError || path.isError || !path.data || !progress.data) return <><h1>Your learning path</h1><PageState kind="error" title="Couldn't load your learning path" description={preferences.error?.message ?? progress.error?.message ?? path.error?.message} actionLabel="Try again" onAction={() => { void preferences.refetch(); void progress.refetch(); void path.refetch(); }} /></>;
  return <LearningPathView path={path.data} progress={progress.data} />;
}
