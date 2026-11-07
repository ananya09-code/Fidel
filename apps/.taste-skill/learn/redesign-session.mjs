import {readFileSync,writeFileSync} from 'node:fs';
const file='web/src/components/learn-ui/lesson/FlashcardSession.tsx';
let s=readFileSync(file,'utf8');
s=s.replace(/import \{\r?\n  ArrowLeft,[\s\S]*?\} from "lucide-react";/, 'import { ArrowLeft, ArrowRight, LoaderCircle, RotateCcw } from "lucide-react";\nimport { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";\nimport { PageState } from "@/components/common-ui/PageState";\nimport { topicLabel } from "@/components/homepage-ui/labels";\nimport "./lesson.css";');
s=s.replace('    void onProgress?.(nextIndex);', '    void Promise.resolve(onProgress?.(nextIndex)).catch((error: unknown) => {\n      setSaveError(error instanceof Error ? error.message : "Unable to save your place.");\n    });');
s=s.replace('  function finishSession() {\n    setSessionCompleted(true);\n    void onProgress?.(sessionWords.length);\n  }', `  async function finishSession() {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onProgress?.(sessionWords.length);
      setSessionCompleted(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save your place.");
    } finally { setIsSaving(false); }
  }`);
const i=s.indexOf('  if (availableWords.length === 0)');
s=s.slice(0,i)+`
  const errorNotice = saveError && <p className="study-error" role="alert">{saveError}</p>;
  const busy = <LoaderCircle size={18} className="study-spinner" aria-hidden="true" />;

  if (availableWords.length === 0) {
    return <div className="fidel-study"><PageState kind="empty" title="No words yet" description="Try another lesson while vocabulary is being prepared." actionLabel="Back to lessons" onAction={onBack} /></div>;
  }

  if (sessionCompleted) {
    return <div className="fidel-study">
      <section className="study-milestone">
        <FidelTeacherMark className="study-teacher" />
        <h1>Words met. Time to practise.</h1>
        <p>You explored {sessionWords.length} {sessionWords.length === 1 ? "word" : "words"} in {topicLabel(category)}. Now see what you remember.</p>
        <div className="study-milestone-actions">
          <button type="button" className="study-primary" disabled={isSaving} onClick={() => void handlePractice()}>{isSaving ? busy : <ArrowRight size={18} aria-hidden="true" />}Continue to practice</button>
          <button type="button" className="study-secondary" disabled={isSaving} onClick={() => { setCurrentIndex(0); setSessionCompleted(false); }}><RotateCcw size={16} aria-hidden="true" />Look through the cards again</button>
          <button type="button" className="study-text-button" disabled={isSaving} onClick={onBack}>Back to lessons</button>
        </div>
        {errorNotice}
      </section>
    </div>;
  }

  if (sessionStarted && currentWord) {
    return <div className="fidel-study">
      <header className="study-header"><button type="button" className="study-text-button" onClick={handleBack}><ArrowLeft size={18} aria-hidden="true" />Exit session</button><h1>{topicLabel(category)}</h1></header>
      <Flashcard word={currentWord} currentIndex={currentIndex} total={sessionWords.length} direction={direction} onPrevious={handlePrevious} onNext={handleNext} onFinish={() => void finishSession()} />
      {isSaving && <p role="status" className="study-saving">{busy}<span className="sr-only">Saving progress</span></p>}
      {errorNotice}
    </div>;
  }

  return <div className="fidel-study">
    <header className="study-header"><button type="button" className="study-text-button" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />Back to lessons</button><span>Vocabulary</span></header>
    <section className="study-setup">
      <FidelTeacherMark className="study-teacher" />
      <h1>{topicLabel(category)}</h1>
      <p>Meet the words, hear how they sound, then put your memory to work.</p>
      <fieldset className="study-word-limit">
        <legend>Words in this session</legend>
        <p>{availableWords.length} {availableWords.length === 1 ? "word" : "words"} available</p>
        <div className="study-limit-options">{wordLimitOptions.filter((limit) => limit > 0).map((limit) => <button type="button" key={limit} aria-pressed={wordLimit === limit} disabled={isSaving} onClick={() => setWordLimit(limit)}><span>{limit}</span> {limit === 1 ? "word" : "words"}</button>)}</div>
      </fieldset>
      <button type="button" className="study-primary" disabled={!sessionWords.length || isSaving} onClick={() => void startSession()}>{isSaving ? busy : <ArrowRight size={18} aria-hidden="true" />}Start learning</button>
      {errorNotice}
    </section>
  </div>;
}
`;
writeFileSync(file,s);
let flash=readFileSync('web/src/components/learn-ui/lesson/Flashcard.tsx','utf8');
flash=flash.replace('    const sign = direction', '    moving.current = true;\n    const sign = direction');
writeFileSync('web/src/components/learn-ui/lesson/Flashcard.tsx',flash);
