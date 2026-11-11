import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  LockKeyhole,
  Volume2,
} from "lucide-react";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { PageState } from "@/components/common-ui/PageState";
import { learningLanguages, type LearningLanguage } from "@/lib/languages";
import type {
  QuestBankWord,
  QuestItem,
  QuestOverview,
  QuestReply,
  QuestReplyResult,
  QuestState,
} from "@/lib/api/quests";
import { QuestVillageMap } from "@/components/quest-ui/QuestVillageMap";
import "./quest.css";

type Props = {
  overview: QuestOverview;
  onLanguage: (language: LearningLanguage) => void;
  onStart: (key: string) => Promise<QuestState>;
  onReply: (key: string, reply: QuestReply) => Promise<QuestReplyResult>;
  onRefresh: () => void;
};
const guides = { om: "Caaltuu", am: "Abeba", ti: "Selam" };
const families = [
  "ሀሁሂሃሄህሆ",
  "ለሉሊላሌልሎ",
  "ሐሑሒሓሔሕሖ",
  "መሙሚማሜምሞ",
  "ሠሡሢሣሤሥሦ",
  "ረሩሪራሬርሮ",
  "ሰሱሲሳሴስሶ",
  "ሸሹሺሻሼሽሾ",
  "ቀቁቂቃቄቅቆ",
  "ቐቑቒቓቔቕቖ",
  "በቡቢባቤብቦ",
  "ተቱቲታቴትቶ",
  "ቸቹቺቻቼችቾ",
  "ኀኁኂኃኄኅኆ",
  "ነኑኒናኔንኖ",
  "ኘኙኚኛኜኝኞ",
  "አኡኢኣኤእኦ",
  "ከኩኪካኬክኮ",
  "ኸኹኺኻኼኽኾ",
  "ወዉዊዋዌውዎ",
  "ዐዑዒዓዔዕዖ",
  "ዘዙዚዛዜዝዞ",
  "ዠዡዢዣዤዥዦ",
  "የዩዪያዬይዮ",
  "ደዱዲዳዴድዶ",
  "ጀጁጂጃጄጅጆ",
  "ገጉጊጋጌግጎ",
  "ጠጡጢጣጤጥጦ",
  "ጨጩጪጫጬጭጮ",
  "ጰጱጲጳጴጵጶ",
  "ጸጹጺጻጼጽጾ",
  "ፀፁፂፃፄፅፆ",
  "ፈፉፊፋፌፍፎ",
  "ፐፑፒፓፔፕፖ",
  "ቨቩቪቫቬቭቮ",
];

export function QuestExperience({
  overview,
  onLanguage,
  onStart,
  onReply,
  onRefresh,
}: Props) {
  const language = overview.language_code,
    guide = guides[language];
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState<QuestState | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [name, setName] = useState("");
  const [hint, setHint] = useState(false);
  const [family, setFamily] = useState(families[16]);
  const [inspected, setInspected] = useState<string | null>(null);
  const [limit, setLimit] = useState(12);
  const input = useRef<HTMLInputElement>(null),
    heading = useRef<HTMLHeadingElement>(null),
    end = useRef<HTMLDivElement>(null);
  const busy = useRef(false),
    composing = useRef(false),
    audio = useRef<HTMLAudioElement | null>(null);
  const item = overview.quests.find((item) => item.id === selected);
  const state = saved ?? item?.state;
  const chatting = Boolean(item && state);
  const step = item && state ? item.steps[state.step_index] : null;
  const character = item?.character === "host" ? "Your host" : guide;
  const ownName =
    overview.quests
      .flatMap((q) => q.state?.answers ?? [])
      .find((answer) => answer.step_id === "name")?.text ??
    state?.answers.find((answer) => answer.step_id === "name")?.text ??
    "";
  const prompt = (text: string) => text.replaceAll("{name}", ownName);
  const next =
    overview.quests.find((q) => !q.state?.completed) ??
    overview.quests[overview.quests.length - 1];
  const inspectedWord = overview.bank.find((word) => word.id === inspected);

  useEffect(() => () => audio.current?.pause(), []);
  useEffect(() => {
    if (!chatting) return;
    if (step?.kind === "name") input.current?.focus();
    else heading.current?.focus({ preventScroll: true });
    end.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [chatting, state?.step_index, step?.kind]);

  async function enter(quest: QuestItem) {
    if (busy.current || (quest.locked && !quest.state?.completed)) return;
    busy.current = true;
    setPending(true);
    setError("");
    setFeedback("");
    try {
      const result = await onStart(quest.id);
      setSaved(result);
      setSelected(quest.id);
      setHint(false);
      setName("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn’t open this conversation. Try again.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  function leave() {
    audio.current?.pause();
    setSelected(null);
    setSaved(null);
    setError("");
    setFeedback("");
    onRefresh();
  }
  async function reply(word?: QuestBankWord) {
    if (!item || !state || !step || busy.current || composing.current) return;
    const payload: QuestReply = {
      expected_step: state.step_index,
      version: item.version,
      ...(word ? { word_id: word.id } : { name: name.trim() }),
    };
    busy.current = true;
    setPending(true);
    setError("");
    setFeedback("");
    try {
      const result = await onReply(item.id, payload);
      setSaved(result.state);
      if (result.accepted) {
        setName("");
        setHint(false);
      } else {
        setFeedback(result.feedback ?? "Hmm? Let’s try that together.");
        setHint(true);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Your reply wasn’t saved. Try again.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  function insert(letter: string) {
    const start = input.current?.selectionStart ?? name.length,
      stop = input.current?.selectionEnd ?? start;
    const value = name.slice(0, start) + letter + name.slice(stop);
    if (Array.from(value).length > 40) return;
    setName(value);
    requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.setSelectionRange(
        start + letter.length,
        start + letter.length,
      );
    });
  }
  async function play(word: QuestBankWord) {
    if (!word.audio_url) return;
    audio.current?.pause();
    const player = new Audio(word.audio_url);
    audio.current = player;
    player.onerror = () => setError("That recording couldn’t play. Try again.");
    try {
      await player.play();
    } catch {
      setError("That recording couldn’t play. Try again.");
    }
  }

  return (
    <div className="fidel-quest">
      <header className="quest-header">
        <div>
          <Link to="/Learn" className="quest-back">
            <ArrowLeft size={15} />
            Back to Learn
          </Link>
          <h1>
            Fidel Quest<span>.</span>
          </h1>
          <p>A few words. A new place to belong.</p>
        </div>
        <label className="quest-language">
          Your adventure language
          <select
            value={language}
            disabled={pending}
            onChange={(event) =>
              onLanguage(event.target.value as LearningLanguage)
            }
          >
            {Object.entries(learningLanguages).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name} · {value.nativeName}
              </option>
            ))}
          </select>
        </label>
      </header>
      <p className="quest-preview">
        Five little adventures · Your conversations are saved as you go.
      </p>
      {error && (
        <PageState
          compact
          kind="error"
          title="Something needs another try"
          description={error}
          actionLabel={chatting ? "Back to village" : "Reload quests"}
          onAction={chatting ? leave : onRefresh}
        />
      )}
      <div className={`quest-layout${chatting ? " is-chatting" : ""}`}>
        <div className="quest-play-area">
          {!chatting ? (
            <section className="quest-world" aria-labelledby="quest-map-title">
              <div className="quest-world-heading">
                <div>
                  <h2 id="quest-map-title">
                    A village of little conversations
                  </h2>
                  <p>
                    Follow the path. Knock on a door. Let your words take you
                    inside.
                  </p>
                </div>
                <span>
                  {overview.quests.filter((q) => q.state?.completed).length} /{" "}
                  {overview.quests.length} visited
                </span>
              </div>
              <QuestVillageMap
                quests={overview.quests}
                onEnter={(quest) => void enter(quest)}
                disabled={pending}
              />
              <p className="quest-map-note">
                Each door opens with the previous conversation and its collected
                words. Words awaiting approved audio stay locked.
              </p>
              {pending && (
                <PageState
                  compact
                  kind="loading"
                  title="Opening your conversation"
                />
              )}
            </section>
          ) : (
            <section
              className="quest-adventure"
              aria-labelledby="quest-conversation-title"
              aria-busy={pending}
            >
              <header className="quest-chat-header">
                <button
                  type="button"
                  disabled={pending}
                  className="quest-return quest-text-button"
                  onClick={leave}
                  aria-label="Back to the village"
                >
                  <ArrowLeft size={18} />
                </button>
                <img
                  src={`/quest/characters/${language}-${item!.character}.svg`}
                  alt=""
                  width="32"
                  height="40"
                />
                <div>
                  <strong>{character}</strong>
                  <span>{item!.title}</span>
                </div>
                <span>
                  {state!.step_index} / {item!.steps.length}
                </span>
              </header>
              <div className="quest-conversation">
                <progress
                  className="quest-progress"
                  value={state!.step_index}
                  max={item!.steps.length}
                  aria-label="Conversation progress"
                />
                <div className="quest-chat-stage">
                  <div className="quest-chat-character" aria-hidden="true">
                    <img
                      src={`/quest/characters/${language}-${item!.character}.svg`}
                      alt=""
                      width="144"
                      height="180"
                    />
                    <span>{character}</span>
                  </div>
                  <div
                    className="quest-chat-log"
                    role="log"
                    aria-label="Conversation history"
                    aria-live="polite"
                    aria-relevant="additions"
                  >
                    {state!.answers.map((answer) => (
                      <div className="quest-chat-turn" key={answer.step_id}>
                        <p className="quest-guide-bubble">
                          {prompt(
                            item!.steps.find(
                              (step) => step.id === answer.step_id,
                            )?.prompt ?? "",
                          )}
                        </p>
                        <p className="quest-your-reply">
                          <span>You</span>
                          <b lang={language}>{answer.text}</b>
                          <Check size={14} aria-label="Saved" />
                        </p>
                      </div>
                    ))}
                    <h2
                      className="quest-guide-bubble"
                      id="quest-conversation-title"
                      tabIndex={-1}
                      ref={heading}
                    >
                      {step
                        ? prompt(step.prompt)
                        : "A little conversation, a new connection. Come back any time."}
                    </h2>
                    {feedback && (
                      <p className="quest-chat-gentle" role="status">
                        {feedback}
                      </p>
                    )}
                    <div ref={end} />
                  </div>
                </div>
                {state!.completed ? (
                  <div className="quest-ending">
                    <p>Conversation completed and saved.</p>
                    <button
                      className="quest-primary"
                      type="button"
                      onClick={leave}
                    >
                      Back to the village
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  <form
                    className="quest-answer-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (step?.kind === "name") void reply();
                    }}
                  >
                    {step?.kind === "name" ? (
                      <>
                        <label htmlFor="quest-answer">
                          Your name in {language === "om" ? "Qubee" : "fidel"}
                        </label>
                        <p>Your own spelling is welcome.</p>
                        <div className="quest-input-row">
                          <input
                            id="quest-answer"
                            ref={input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onCompositionStart={() => {
                              composing.current = true;
                            }}
                            onCompositionEnd={() => {
                              composing.current = false;
                            }}
                            disabled={pending}
                            maxLength={40}
                            autoComplete="off"
                            lang={language}
                          />
                          <button
                            className="quest-primary"
                            disabled={pending || !name.trim()}
                          >
                            Reply
                            <ArrowRight size={16} />
                          </button>
                        </div>
                        {language !== "om" && (
                          <details className="quest-keyboard">
                            <summary>Fidel character keyboard</summary>
                            <label htmlFor="quest-family">
                              Choose a letter family
                            </label>
                            <select
                              id="quest-family"
                              value={family}
                              onChange={(e) => setFamily(e.target.value)}
                            >
                              {families.map((row) => (
                                <option key={row}>{row}</option>
                              ))}
                            </select>
                            <div className="quest-keys">
                              {Array.from(family).map((letter) => (
                                <button
                                  key={letter}
                                  type="button"
                                  disabled={pending}
                                  onClick={() => insert(letter)}
                                  aria-label={`Insert ${letter}`}
                                >
                                  {letter}
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              className="quest-text-button"
                              onClick={() => insert(" ")}
                            >
                              Insert a space
                            </button>
                          </details>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="quest-choice-label">
                          Reply from your word bank · {overview.bank.length}{" "}
                          words
                        </p>
                        <p>Choose a collected word. No typing needed.</p>
                        <div
                          className="quest-reply-choices"
                          role="group"
                          aria-label="Choose your reply"
                        >
                          {overview.bank.slice(0, limit).map((word) => (
                            <button
                              className="quest-word-choice"
                              type="button"
                              key={word.id}
                              disabled={pending}
                              onClick={() => void reply(word)}
                            >
                              <strong lang={language}>{word.text}</strong>
                              <small>
                                {word.meaning} ·{" "}
                                <span lang="am">
                                  {word.amharic ?? "የአማርኛ ትርጉም የለም"}
                                </span>
                              </small>
                            </button>
                          ))}
                          {overview.bank.length > limit && (
                            <button
                              type="button"
                              className="quest-secondary"
                              onClick={() => setLimit((n) => n + 12)}
                            >
                              More bank words
                            </button>
                          )}
                        </div>
                        <div className="quest-hint">
                          <button
                            type="button"
                            className="quest-text-button"
                            onClick={() => setHint((v) => !v)}
                          >
                            A little hint
                            <ChevronRight size={14} />
                          </button>
                          {hint && (
                            <p>
                              {item!.required
                                .filter((word) =>
                                  step?.accepts.includes(word.key),
                                )
                                .map((word) => (
                                  <span key={word.key}>
                                    <span lang={language}>{word.text}</span> ·{" "}
                                    {word.english} ·{" "}
                                    <span lang="am">{word.amharic}</span>{" "}
                                  </span>
                                ))}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    {pending && (
                      <PageState
                        compact
                        kind="loading"
                        title="Saving your reply"
                      />
                    )}
                  </form>
                )}
              </div>
            </section>
          )}
        </div>
        {!chatting && (
          <aside
            className="quest-notebook"
            aria-label="Your journey and word bank"
          >
            <section className="quest-trail quest-journal">
              <header className="quest-journal-header">
                <FidelTeacherMark />
                <div>
                  <span>A note from {guide}</span>
                  <h2>
                    {next.state?.completed
                      ? "You know your way around."
                      : next.title}
                  </h2>
                </div>
              </header>
              <p>{next.description}</p>
              <details className="quest-packing-list" open>
                <summary>
                  <span>Pack for this conversation</span>
                  <span>
                    {next.required.length - next.missing_words.length} /{" "}
                    {next.required.length} words
                    <ChevronRight size={15} />
                  </span>
                </summary>
                <ul className="quest-word-keys">
                  {next.required.map((word) => (
                    <li
                      key={word.key}
                      className={
                        next.missing_words.includes(word.key) ? "" : "is-packed"
                      }
                    >
                      <span className="quest-key-hole" />
                      <div>
                        <strong lang={language}>{word.text}</strong>
                        <small>
                          {word.english} · <span lang="am">{word.amharic}</span>
                          {next.unavailable_words.includes(word.key)
                            ? " · Audio pending"
                            : ""}
                        </small>
                      </div>
                      {next.missing_words.includes(word.key) ? (
                        <LockKeyhole size={14} />
                      ) : (
                        <Check size={15} />
                      )}
                    </li>
                  ))}
                </ul>
              </details>
              {next.reasons.map((reason) => (
                <p className="quest-journal-footnote" key={reason}>
                  {reason}
                </p>
              ))}
              <button
                type="button"
                className="quest-primary quest-journal-action"
                disabled={pending || (next.locked && !next.state?.completed)}
                onClick={() => void enter(next)}
              >
                {next.state?.completed
                  ? "Revisit conversation"
                  : next.state
                    ? "Continue conversation"
                    : "Start conversation"}
                <ArrowRight size={16} />
              </button>
              {next.missing_words.length > 0 && (
                <Link
                  className="quest-text-button"
                  to="/dictionary"
                  search={{ category: undefined }}
                >
                  Find the missing words
                  <ArrowRight size={14} />
                </Link>
              )}
            </section>
            <section className="quest-bank quest-pouch">
              <header>
                <h2>Words in your pouch</h2>
                <span>{overview.bank.length} collected</span>
              </header>
              <p>Tap a word to unpack its meaning and hear it.</p>
              {overview.bank.length === 0 ? (
                <PageState
                  compact
                  kind="empty"
                  title="Room for your first word"
                  description="Collect a word in Learn or the dictionary, then return."
                />
              ) : (
                <>
                  <Pouch
                    words={overview.bank.slice(0, 8)}
                    language={language}
                    selected={inspected}
                    onSelect={setInspected}
                  />
                  {overview.bank.length > 8 && (
                    <details className="quest-bank-more">
                      <summary>Unpack all {overview.bank.length} words</summary>
                      <Pouch
                        words={overview.bank.slice(8)}
                        language={language}
                        selected={inspected}
                        onSelect={setInspected}
                      />
                    </details>
                  )}
                  {inspectedWord && (
                    <div className="quest-word-inspection">
                      <div>
                        <strong lang={language}>{inspectedWord.text}</strong>
                        <p>
                          {inspectedWord.meaning} ·{" "}
                          <span lang="am">
                            {inspectedWord.amharic ?? "የአማርኛ ትርጉም የለም"}
                          </span>
                        </p>
                      </div>
                      {inspectedWord.audio_url ? (
                        <button
                          className="quest-audio"
                          aria-label={`Listen to ${inspectedWord.text}`}
                          onClick={() => void play(inspectedWord)}
                        >
                          <Volume2 size={18} />
                        </button>
                      ) : (
                        <small>No approved recording yet</small>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}

function Pouch({
  words,
  language,
  selected,
  onSelect,
}: {
  words: QuestBankWord[];
  language: LearningLanguage;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="quest-pouch-words">
      {words.map((word) => (
        <li key={word.id}>
          <button
            type="button"
            aria-pressed={selected === word.id}
            onClick={() => onSelect(word.id)}
          >
            <span lang={language}>{word.text}</span>
            <small>
              {word.meaning} ·{" "}
              <span lang="am">{word.amharic ?? "የአማርኛ ትርጉም የለም"}</span>
            </small>
          </button>
        </li>
      ))}
    </ul>
  );
}
