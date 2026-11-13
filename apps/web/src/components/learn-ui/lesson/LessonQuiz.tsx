
import { useMemo, useState } from "react";
import type { FlashcardWord } from "./Flashcard";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, RotateCcw, X } from "lucide-react";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { topicLabel } from "@/components/homepage-ui/labels";
import { MatchingRound } from "./MatchingRound";
import { listeningIndices, matchingIndices, shuffleExercise as shuffle } from "./exercise-plan";
import { ListeningPrompt } from "./ListeningPrompt";
import { TeacherFeedback } from "./TeacherFeedback";
import { correctRun, type EncouragementEvent } from "./encouragement";
import { usePreferences } from "@/hooks/use-preferences";
import { playFeedbackSound, prepareFeedbackSound } from "@/lib/feedback-sounds";
import { playFeedbackHaptic } from "@/lib/feedback-haptics";
import "./lesson.css";

type LessonQuizProps = {
  words: FlashcardWord[];
  choiceWords?: FlashcardWord[];
  variant?: "practice" | "quiz";
  category?: string;
  languageCode?: "am" | "om" | "ti";
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
    questionType?: "multiple_choice" | "matching";
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

export function LessonQuiz({
  words,
  choiceWords,
  variant = "practice",
  category = "Practice",
  languageCode = "om",
  initialQuestionIndex = 0,
  initialAnswers = {},
  onBack,
  onContinue,
  remainingWordCount = 0,
  onRetryMissed,
  onAnswer,
  onFinish,
}: LessonQuizProps) {
  const feedbackPreferences = usePreferences().data;
  const soundEnabled = feedbackPreferences?.sound_enabled ?? false;
  const soundVolume = feedbackPreferences?.sound_volume ?? 75;
  const hapticsEnabled = feedbackPreferences?.haptics_enabled ?? false;
  const questions = useMemo<QuizQuestion[]>(() => {
    const usableWords = words.filter(
      (word) => word.word.trim() && word.meaning.trim(),
    );

    return usableWords.map((word) => {
      const distractors = shuffle(
        (choiceWords?.length ? choiceWords : usableWords).filter((candidate) => candidate.id !== word.id && candidate.meaning.trim() && candidate.meaning !== word.meaning), word.id,
      ).slice(0, 3);

      return {
        word,
        options: shuffle([word, ...distractors], word.id + "-options"),
      };
    });
  }, [words, choiceWords]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    // Matching can be answered out of order; never skip an unanswered word.
    const firstUnanswered = questions.findIndex(question => !(question.word.id in initialAnswers));
    return Object.keys(initialAnswers).length && firstUnanswered >= 0
      ? firstUnanswered
      : Math.min(initialQuestionIndex, Math.max(questions.length - 1, 0));
  });
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
  const [reaction, setReaction] = useState<EncouragementEvent | null>(null);
  const [readInstead, setReadInstead] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const selectedId = currentQuestion
    ? answers[currentQuestion.word.id]
    : undefined;

  const answered = selectedId !== undefined;
  const correct = selectedId === currentQuestion?.word.id;
  const listening = listeningIndices(questions.map(question => question.word), variant).includes(currentIndex)
    && readInstead !== currentQuestion?.word.id;

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
    prepareFeedbackSound(soundEnabled, soundVolume);
    setIsSaving(true);
    setSaveError(null);
    try {
      await onAnswer?.({
        questionId: currentQuestion.word.id,
        wordId: currentQuestion.word.id,
        selectedWordId: wordId,
        questionIndex: currentIndex,
      });
      const savedAnswers = { ...answers, [currentQuestion.word.id]: wordId };
      setAnswers(savedAnswers);
      setReaction({
        id: currentQuestion.word.id,
        outcome: wordId === currentQuestion.word.id ? "correct" : "incorrect",
        turn: Object.keys(savedAnswers).length,
        streak: correctRun(savedAnswers),
      });
      const cue = wordId === currentQuestion.word.id ? "correct" : "retry";
      playFeedbackSound(cue, soundEnabled, soundVolume);
      playFeedbackHaptic(cue, hapticsEnabled);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save your answer.");
    } finally {
      setIsSaving(false);
    }
  }

  async function nextQuestion(nextIndex = currentIndex + 1) {
    if (!answered || isSaving) return;
    if (nextIndex >= questions.length) {
      prepareFeedbackSound(soundEnabled, soundVolume);
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
        playFeedbackSound("complete", soundEnabled, soundVolume);
        playFeedbackHaptic("complete", hapticsEnabled);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "Unable to complete this lesson.");
      } finally {
        setIsSaving(false);
      }

      return;
    }

    setReaction(null);
    setReadInstead(null);
    setCurrentIndex(nextIndex);
  }

  function restartQuiz() {
    setCurrentIndex(0);
    setAnswers({});
    setFinished(false);
    setReaction(null);
  }


  if (!questions.length) {
    return <div className="fidel-study"><section className="study-milestone"><h1>Nothing to practise yet</h1><p>Explore some words before starting your practice.</p><button type="button" className="study-primary" onClick={onBack}>Back to learning</button></section></div>;
  }

  if (finished) {
    return <div className={"fidel-study" + (variant === "quiz" ? " is-quiz" : "")}><section className="study-milestone">
      <FidelTeacherMark className="study-teacher" />
      <h1>{variant === "quiz" ? "Quiz complete." : score === questions.length ? "Every word remembered." : "A little more familiar."}</h1>
      <p>{variant === "quiz" ? score === questions.length ? "A perfect score. You remembered every word." : "Your score is saved. Words you missed will return for another quiz." : score === questions.length ? "You recalled every word in this practice." : "Keep coming back. Familiarity grows with practice."}</p>
      <dl className="study-results"><div><dt>Correct</dt><dd>{score}/{questions.length}</dd></div><div><dt>Accuracy</dt><dd>{accuracy}%</dd></div><div><dt>To revisit</dt><dd>{missedWords.length}</dd></div></dl>
      {missedWords.length > 0 && <section className="study-missed"><h2>Words to revisit</h2><ul>{missedWords.map((word) => <li key={word.id}><strong>{word.word}</strong><span>{word.meaning}<span lang="am">{word.amharic ?? "Amharic translation unavailable"}</span></span></li>)}</ul></section>}
      <div className="study-milestone-actions">
        {remainingWordCount > 0 && onContinue && <button type="button" className="study-primary" onClick={onContinue}>Continue lesson ({remainingWordCount} left)<ArrowRight size={18} aria-hidden="true" /></button>}
        {missedWords.length > 0 && onRetryMissed && <button type="button" className="study-secondary" onClick={() => onRetryMissed(missedWords)}><RotateCcw size={16} aria-hidden="true" />Practise missed words</button>}
        {!onAnswer && <button type="button" className="study-secondary" onClick={restartQuiz}>Try again</button>}
        <button type="button" className="study-secondary" onClick={onBack}>{variant === "quiz" ? "Back to review" : "Back to learning"}</button>
      </div>
    </section></div>;
  }

  if (!currentQuestion) return null;

  const matching = matchingIndices(questions.map(question => question.word), variant);
  if (matching.includes(currentIndex)) {
    const roundWords = matching.map(index => questions[index].word);
    const nextIndex = matching[matching.length - 1] + 1;
    return <div className={"fidel-study" + (variant === "quiz" ? " is-quiz" : "")}>
      <header className="study-header"><button type="button" className="study-text-button" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />{variant === "quiz" ? "Save & exit quiz" : "Exit practice"}</button><span>{topicLabel(category)}</span></header>
      <div className="study-progress-label"><h1>Match the pairs</h1><span>{Object.keys(answers).length} / {questions.length} answered</span></div>
      <progress className="study-progress" value={Object.keys(answers).length} max={questions.length} aria-label={variant === "quiz" ? "Saved quiz answers" : "Saved practice answers"} />
      <MatchingRound words={roundWords} soundEnabled={soundEnabled} soundVolume={soundVolume} hapticsEnabled={hapticsEnabled} initialAnswers={Object.fromEntries(roundWords.filter(word => word.id in answers).map(word => [word.id, answers[word.id] === word.id]))}
        isCompleting={isSaving} continueLabel={nextIndex >= questions.length ? variant === "quiz" ? "Finish quiz" : "See my results" : variant === "quiz" ? "Continue quiz" : "Continue practice"}
        onAnswer={async (wordId, selectedWordId) => {
          const questionIndex = questions.findIndex(question => question.word.id === wordId);
          if (questionIndex < 0) throw new Error("This word is no longer in the practice session.");
          await onAnswer?.({ questionId: wordId, wordId, selectedWordId, questionIndex, questionType: "matching" });
          setAnswers(previous => ({ ...previous, [wordId]: selectedWordId }));
        }}
        onComplete={() => nextQuestion(nextIndex)} />
      {saveError && <p className="study-error" role="alert">{saveError}</p>}
    </div>;
  }

  return <div className={"fidel-study" + (variant === "quiz" ? " is-quiz" : "")}>
    <header className="study-header"><button type="button" className="study-text-button" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />{variant === "quiz" ? "Save & exit quiz" : "Exit practice"}</button><span>{topicLabel(category)}</span></header>
    <div className="study-progress-label"><h1>{listening ? "Listening challenge" : variant === "quiz" ? "Choose the right word" : "Find the matching word"}</h1><span>{variant === "quiz" ? "Question " : ""}{currentIndex + 1} of {questions.length}</span></div>
    <progress className="study-progress" value={variant === "quiz" ? Object.keys(answers).length : currentIndex + 1} max={questions.length} aria-label={variant === "quiz" ? "Quiz progress" : "Practice progress"} />
    <div className="study-feedback-space" aria-live="polite" aria-atomic="true">
      {answered && <TeacherFeedback event={reaction ?? { id: currentQuestion.word.id, outcome: correct ? "correct" : "incorrect", turn: 0 }} animate={reaction !== null} questGuide={listening ? languageCode : undefined}>
        <p>{currentQuestion.word.meaning} — <strong>{currentQuestion.word.word}</strong></p>
        <p lang="am">{currentQuestion.word.amharic ?? "Amharic translation unavailable"}</p>
      </TeacherFeedback>}
    </div>
    {listening ? !answered && <ListeningPrompt key={currentQuestion.word.id} word={currentQuestion.word} languageCode={languageCode} onAudioUnavailable={() => setReadInstead(currentQuestion.word.id)} /> : <section className="study-question" aria-label="Word to translate">
      <dl className="study-translations"><div><dt>English</dt><dd>{currentQuestion.word.meaning}</dd></div><div><dt>Amharic</dt><dd lang="am">{currentQuestion.word.amharic ?? "Translation unavailable"}</dd></div></dl>
    </section>}
    <div className="study-options" role="group" aria-label={listening ? "Choose the meaning you heard" : "Choose the matching word"}>
      {currentQuestion.options.map((option, index) => {
        const isCorrect = option.id === currentQuestion.word.id;
        const isSelected = selectedId === option.id;
        const status = answered && isCorrect ? " is-correct" : answered && isSelected ? " is-incorrect" : "";
        return <button type="button" key={option.id} disabled={answered || isSaving} onClick={() => void selectAnswer(option.id)} className={"study-option" + status}>
          <span className="study-option-letter">{String.fromCharCode(65 + index)}</span><span>{listening ? <><strong>{option.meaning}</strong><small lang="am">{option.amharic ?? "Amharic translation unavailable"}</small></> : option.word}</span>
          {answered && isCorrect && <Check size={20} aria-label="Correct answer" />}
          {answered && isSelected && !isCorrect && <X size={20} aria-label="Incorrect answer" />}
        </button>;
      })}
    </div>
    <div className="study-practice-actions">
      <span className="study-save-status" role="status">{isSaving ? <><LoaderCircle size={18} className="study-spinner" aria-hidden="true" /><span className="sr-only">Saving your answer</span></> : variant === "quiz" && answered ? "Answer saved" : null}</span>
      <button type="button" className="study-primary" disabled={!answered || isSaving} onClick={() => void nextQuestion()}>{currentIndex === questions.length - 1 ? variant === "quiz" ? "Finish quiz" : "See my results" : variant === "quiz" ? "Next question" : "Continue"}<ArrowRight size={18} aria-hidden="true" /></button>
    </div>
    {saveError && <p className="study-error" role="alert">{saveError}</p>}

  </div>;
}
