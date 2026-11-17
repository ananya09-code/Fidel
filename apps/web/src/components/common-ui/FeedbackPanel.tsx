import { useState, type FormEvent } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { useMutation } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { Check, LoaderCircle, MessageSquareText, X } from "lucide-react";
import { ApiError } from "@/lib/api";
import { submitFeedback, type FeedbackCategory } from "@/lib/api/feedback";
import { FidelTeacherMark } from "./FidelTeacherMark";
import "./feedback-panel.css";

const categories: { value: FeedbackCategory; label: string }[] = [
  { value: "bug", label: "Something isn’t working" },
  { value: "idea", label: "I have an idea" },
  { value: "content", label: "A word or audio needs attention" },
  { value: "other", label: "Something else" },
];

export function FeedbackPanel() {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [message, setMessage] = useState("");
  const [contactAllowed, setContactAllowed] = useState(false);
  const mutation = useMutation({
    mutationFn: () => submitFeedback(getToken, {
      category,
      message: message.trim(),
      page_path: window.location.pathname,
      contact_allowed: contactAllowed,
    }),
  });

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mutation.isPending) mutation.mutate();
  }

  function reset() {
    mutation.reset();
    setMessage("");
    setCategory("idea");
    setContactAllowed(false);
  }

  return <Dialog.Root open={open} onOpenChange={(value) => { setOpen(value); if (!value && mutation.isSuccess) reset(); }}>
    <Dialog.Trigger asChild><button type="button" className="app-feedback-trigger" aria-label="Give feedback"><MessageSquareText size={19} aria-hidden="true" /><span>Feedback</span></button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fidel-feedback-overlay" />
      <Dialog.Content className="fidel-feedback-panel" aria-describedby="feedback-description">
        <div className="feedback-panel-top"><span aria-hidden="true"><FidelTeacherMark /></span><Dialog.Close className="feedback-panel-close" aria-label="Close feedback"><X size={19} /></Dialog.Close></div>
        {mutation.isSuccess ? <div className="feedback-sent" role="status">
          <span className="feedback-sent-icon"><Check size={26} aria-hidden="true" /></span>
          <Dialog.Title>Thank you for helping Fidel grow.</Dialog.Title>
          <Dialog.Description id="feedback-description">Your note is saved. We read every piece of feedback.</Dialog.Description>
          <button type="button" className="app-secondary" onClick={reset}>Send another note</button>
        </div> : <>
          <div className="feedback-panel-intro"><span className="feedback-panel-rule" aria-hidden="true" /><Dialog.Title>Help shape Fidel.</Dialog.Title><Dialog.Description id="feedback-description">Found something we can improve? Tell us in your own words.</Dialog.Description></div>
          <form className="feedback-form" onSubmit={send}>
            <label className="feedback-label" htmlFor="feedback-category">What’s on your mind?</label>
            <select id="feedback-category" value={category} onChange={(event) => setCategory(event.target.value as FeedbackCategory)} disabled={mutation.isPending}>
              {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <label className="feedback-label" htmlFor="feedback-message">Your note</label>
            <textarea id="feedback-message" value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} maxLength={3000} required disabled={mutation.isPending} placeholder="What happened, or what would make learning better?" />
            <div className="feedback-form-meta"><span>The page you’re on is included automatically.</span><span>{message.length}/3000</span></div>
            <label className="feedback-contact"><input type="checkbox" checked={contactAllowed} onChange={(event) => setContactAllowed(event.target.checked)} disabled={mutation.isPending} /><span>You may email me about this note.<small>We’ll use your Fidel account email only if you choose this.</small></span></label>
            {mutation.isError && <p className="feedback-error" role="alert">{mutation.error instanceof ApiError && mutation.error.status === 429 ? mutation.error.message : "We couldn’t save your note. Please try again."}</p>}
            <button type="submit" className="app-primary feedback-submit" disabled={mutation.isPending || message.trim().length < 10}>{mutation.isPending ? <><LoaderCircle size={17} className="app-spinner" aria-hidden="true" />Sending…</> : "Send feedback"}</button>
          </form>
        </>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
