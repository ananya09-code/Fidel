
import { useMemo, useState } from "react";
import type { FlashcardWord } from "./Flashcard";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, RotateCcw, X } from "lucide-react";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { topicLabel } from "@/components/homepage-ui/labels";
import "./lesson.css";

type LessonQuizProps = {
  words: FlashcardWord[];
  category?: string;
  initialQuestionIndex?: number;
  initialAnswers?: Record<string, boolean>;
  onBack?: () => void;
  onContinue?: () => void;
  remainingWordCount?: number;
  onRetryMissed?: (words: FlashcardWord[]) => void;
  onAnswer?: (answer: {
    questionId: string;
    wordId: string;
    selectedWordId: string;
    questionIndex: number;
  }) => Promise<void> | void;
  onFinish?: (result: {
    score: number;
    total: number;
    missedWords: FlashcardWord[];
  }) => Promise<void> | void;
};

type QuizQuestion = {
  word: FlashcardWord;
  options: FlashcardWord[];
};

function shuffle<T>(items: T[], seed: string): T[] {
  let state = [...seed].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = Math.floor(state / 4294967296 * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function LessonQuiz({
  words,
  category = "Practice",
  initialQuestionIndex = 0,
  initialAnswers = {},
  onBack,
  onContinue,
  remainingWordCount = 0,
  onRetryMissed,
  onAnswer,
  onFinish,
}: LessonQuizProps) {
  const questions = useMemo<QuizQuestion[]>(() => {
    const usableWords = words.filter(
      (word) => word.word.trim() && word.meaning.trim(),
    );

    return usableWords.map((word) => {
      const distractors = shuffle(
        usableWords.filter((candidate) => candidate.id !== word.id), word.id,
      ).slice(0, 3);

      return {
        word,
        options: shuffle([word, ...distractors], word.id + "-options"),
      };
    });
  }, [words]);

  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(initialQuestionIndex, Math.max(questions.length - 1, 0)),
  );
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(initialAnswers).map(([questionId, isCorrect]) => [
        questionId,
        isCorrect ? questionId : "__incorrect__",
      ]),
    ),
  );
  const [finished, setFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const selectedId = currentQuestion
    ? answers[currentQuestion.word.id]
    : undefined;

  const answered = selectedId !== undefined;
  const correct = selectedId === currentQuestion?.word.id;

  const missedWords = questions
    .filter((question) => answers[question.word.id] !== question.word.id)
    .map((question) => question.word);

  const score = questions.length - missedWords.length;
  const accuracy =
    questions.length > 0
      ? Math.round((score / questions.length) * 100)
      : 0;

  async function selectAnswer(wordId: string) {
    if (answered || isSaving || !currentQuestion) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onAnswer?.({
        questionId: currentQuestion.word.id,
        wordId: currentQuestion.word.id,
        selectedWordId: wordId,
        questionIndex: currentIndex,
      });
      setAnswers((previous) => ({
        ...previous,
        [currentQuestion.word.id]: wordId,
      }));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save your answer.");
    } finally {
      setIsSaving(false);
    }
  }

  async function nextQuestion() {
    if (!answered || isSaving) return;
    if (currentIndex === questions.length - 1) {
      const nextAnswers = answers;
      const finalMissedWords = questions
        .filter(
          (question) =>
            nextAnswers[question.word.id] !== question.word.id,
        )
        .map((question) => question.word);

      const finalScore = questions.length - finalMissedWords.length;

      setIsSaving(true);
      setSaveError(null);
      try {
        await onFinish?.({
          score: finalScore,
          total: questions.length,
          missedWords: finalMissedWords,
        });
        setFinished(true);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "Unable to complete this lesson.");
      } finally {
        setIsSaving(false);
      }

      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  function restartQuiz() {
    setCurrentIndex(0);
    setAnswers({});
    setFinished(false);
  }


  if (!questions.length) {
    return <div className="fidel-study"><section className="study-milestone"><h1>Nothing to practise yet</h1><p>Explore some words before starting your practice.</p><button type="button" className="study-primary" onClick={onBack}>Back to learning</button></section></div>;
  }

  if (finished) {
    return <div className="fidel-study"><section className="study-milestone">
      <FidelTeacherMark className="study-teacher" />
      <h1>{score === questions.length ? "Every word remembered." : "A little more familiar."}</h1>
      <p>{score === questions.length ? "You recalled every word in this practice." : "Keep coming back. Familiarity grows with practice."}</p>
      <dl className="study-results"><div><dt>Correct</dt><dd>{score}/{questions.length}</dd></div><div><dt>Accuracy</dt><dd>{accuracy}%</dd></div><div><dt>To revisit</dt><dd>{missedWords.length}</dd></div></dl>
      {missedWords.length > 0 && <section className="study-missed"><h2>Words to revisit</h2><ul>{missedWords.map((word) => <li key={word.id}><strong>{word.word}</strong><span>{word.meaning}<span lang="am">{word.amharic ?? "Amharic translation unavailable"}</span></span></li>)}</ul></section>}
      <div className="study-milestone-actions">
        {remainingWordCount > 0 && onContinue && <button type="button" className="study-primary" onClick={onContinue}>Continue lesson ({remainingWordCount} left)<ArrowRight size={18} aria-hidden="true" /></button>}
        {missedWords.length > 0 && onRetryMissed && <button type="button" className="study-secondary" onClick={() => onRetryMissed(missedWords)}><RotateCcw size={16} aria-hidden="true" />Practise missed words</button>}
        {!onAnswer && <button type="button" className="study-secondary" onClick={restartQuiz}>Try again</button>}
        <button type="button" className="study-secondary" onClick={onBack}>Back to learning</button>
      </div>
    </section></div>;
  }

  if (!currentQuestion) return null;

  return <div className="fidel-study">
    <header className="study-header"><button type="button" className="study-text-button" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />Exit practice</button><span>{topicLabel(category)}</span></header>
    <div className="study-progress-label"><h1>Find the matching word</h1><span>{currentIndex + 1} of {questions.length}</span></div>
    <progress className="study-progress" value={currentIndex + 1} max={questions.length} aria-label="Practice progress" />
    <section className="study-question" aria-label="Word to translate">
      <dl className="study-translations"><div><dt>English</dt><dd>{currentQuestion.word.meaning}</dd></div><div><dt>Amharic</dt><dd lang="am">{currentQuestion.word.amharic ?? "Translation unavailable"}</dd></div></dl>
    </section>
    <div className="study-options" role="group" aria-label="Choose the matching word">
      {currentQuestion.options.map((option, index) => {
        const isCorrect = option.id === currentQuestion.word.id;
        const isSelected = selectedId === option.id;
        const status = answered && isCorrect ? " is-correct" : answered && isSelected ? " is-incorrect" : "";
        return <button type="button" key={option.id} disabled={answered || isSaving} onClick={() => void selectAnswer(option.id)} className={"study-option" + status}>
          <span className="study-option-letter">{String.fromCharCode(65 + index)}</span><span>{option.word}</span>
          {answered && isCorrect && <Check size={20} aria-label="Correct answer" />}
          {answered && isSelected && !isCorrect && <X size={20} aria-label="Incorrect answer" />}
        </button>;
      })}
    </div>
    <div className="study-practice-actions">
      <span className="study-save-status" role="status">{isSaving && <><LoaderCircle size={18} className="study-spinner" aria-hidden="true" /><span className="sr-only">Saving your answer</span></>}</span>
      <button type="button" className="study-primary" disabled={!answered || isSaving} onClick={() => void nextQuestion()}>{currentIndex === questions.length - 1 ? "See my results" : "Continue"}<ArrowRight size={18} aria-hidden="true" /></button>
    </div>
    <div className="study-feedback-space" aria-live="polite" aria-atomic="true">
      {answered && <div className={"study-feedback " + (correct ? "is-correct" : "is-incorrect")}>
        {correct ? <Check size={20} aria-hidden="true" /> : <X size={20} aria-hidden="true" />}
        <div><strong>{correct ? "That’s the one." : "A word for next time."}</strong><p>{currentQuestion.word.meaning} — <strong>{currentQuestion.word.word}</strong></p><p lang="am">{currentQuestion.word.amharic ?? "Amharic translation unavailable"}</p></div>
      </div>}
    </div>
    {saveError && <p className="study-error" role="alert">{saveError}</p>}

  </div>;
}
