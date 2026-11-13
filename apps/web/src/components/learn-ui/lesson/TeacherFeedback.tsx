import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { encouragementFor, type EncouragementEvent } from "./encouragement";
import type { CastMember } from "@/lib/character-cast";
import "./teacher-feedback.css";

/** Inline feedback: never an overlay, never a delay before continuing. */
export function TeacherFeedback({ event, animate = true, children, character }: {
  event: EncouragementEvent;
  animate?: boolean;
  children?: ReactNode;
  character?: CastMember;
}) {
  const message = encouragementFor(event);
  const missed = event.outcome === "incorrect" || event.outcome === "retry";
  const label = missed ? "Not quite" : event.outcome === "recovered" ? "Pair found" : event.outcome === "complete" ? "Round complete" : "Correct";
  return <div key={event.id} className={`teacher-feedback${character ? " is-quest-guide" : ""} reaction-${message.tone}${animate ? " is-animated" : ""}`} data-reaction={message.tone}>
    <div className="teacher-feedback-figure" aria-hidden="true">{character ? <img className="teacher-feedback-quest-guide" src={character.image} alt="" /> : <FidelTeacherMark className="teacher-feedback-mascot" />}</div>
    <div className="teacher-feedback-bubble">
      {event.outcome !== "ready" && <span className="teacher-feedback-result">{missed ? <X size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}{label}</span>}
      <strong className="teacher-feedback-title">{message.title}</strong>
      <p className="teacher-feedback-message">{message.text}</p>
      {children && <div className="teacher-feedback-detail">{children}</div>}
    </div>
  </div>;
}
