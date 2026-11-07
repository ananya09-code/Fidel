import {readFileSync,writeFileSync} from 'node:fs';
const file='web/src/components/learn-ui/lesson/LessonQuiz.tsx';
let s=readFileSync(file,'utf8');
s=s.replace(/import \{\r?\n  ArrowLeft,[\s\S]*?\} from "lucide-react";/, 'import { ArrowLeft, ArrowRight, Check, LoaderCircle, RotateCcw, X } from "lucide-react";\nimport { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";\nimport { topicLabel } from "@/components/homepage-ui/labels";\nimport "./lesson.css";');
s=s.replace('function shuffle<T>(items: T[]): T[] {', 'function shuffle<T>(items: T[], seed: string): T[] {\n  let state = [...seed].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;');
s=s.replace('    const j = Math.floor(Math.random() * (i + 1));', '    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;\n    const j = Math.floor(state / 4294967296 * (i + 1));');
s=s.replace('usableWords.filter((candidate) => candidate.id !== word.id),','usableWords.filter((candidate) => candidate.id !== word.id), word.id,');
s=s.replace('options: shuffle([word, ...distractors]),','options: shuffle([word, ...distractors], word.id + "-options"),');
s=s.replace('  async function nextQuestion() {','  async function nextQuestion() {\n    if (!answered || isSaving) return;');
const i=s.indexOf('  if (questions.length === 0)');
s=s.slice(0,i)+`
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
    <div className="study-feedback-space" aria-live="polite" aria-atomic="true">
      {answered && <div className={"study-feedback " + (correct ? "is-correct" : "is-incorrect")}>
        {correct ? <Check size={20} aria-hidden="true" /> : <X size={20} aria-hidden="true" />}
        <div><strong>{correct ? "That’s the one." : "A word for next time."}</strong><p>{currentQuestion.word.meaning} — <strong>{currentQuestion.word.word}</strong></p><p lang="am">{currentQuestion.word.amharic ?? "Amharic translation unavailable"}</p></div>
      </div>}
    </div>
    {saveError && <p className="study-error" role="alert">{saveError}</p>}
    <div className="study-practice-actions">
      <span className="study-save-status" role="status">{isSaving && <><LoaderCircle size={18} className="study-spinner" aria-hidden="true" /><span className="sr-only">Saving your answer</span></>}</span>
      <button type="button" className="study-primary" disabled={!answered || isSaving} onClick={() => void nextQuestion()}>{currentIndex === questions.length - 1 ? "See my results" : "Continue"}<ArrowRight size={18} aria-hidden="true" /></button>
    </div>
  </div>;
}
`;
writeFileSync(file,s);

