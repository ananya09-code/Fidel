import type { FeedbackSound } from "./feedback-sounds";

// Brief patterns: a single touch for recall, two gentle taps for retry,
// and a slightly longer finish cue. The phone may decline any request.
const patterns: Record<FeedbackSound, number | number[]> = {
  correct: 25,
  retry: [15, 45, 15],
  complete: [25, 55, 35],
};

export function playFeedbackHaptic(kind: FeedbackSound, enabled: boolean): void {
  if (!enabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(patterns[kind]);
  } catch {
    // Haptics are optional and must never interrupt saved practice.
  }
}
