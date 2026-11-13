export type FeedbackSound = "correct" | "retry" | "complete";

type Note = { frequency: number; delay: number; length: number; volume: number };

// Short, soft cues that leave the word recordings in the foreground.
const notes: Record<FeedbackSound, Note[]> = {
  correct: [
    { frequency: 523.25, delay: 0, length: 0.13, volume: 0.026 },
    { frequency: 659.25, delay: 0.085, length: 0.19, volume: 0.031 },
  ],
  retry: [
    { frequency: 392, delay: 0, length: 0.12, volume: 0.018 },
    { frequency: 349.23, delay: 0.075, length: 0.17, volume: 0.016 },
  ],
  complete: [
    { frequency: 392, delay: 0, length: 0.12, volume: 0.024 },
    { frequency: 523.25, delay: 0.09, length: 0.14, volume: 0.027 },
    { frequency: 659.25, delay: 0.19, length: 0.25, volume: 0.032 },
  ],
};

let context: AudioContext | null = null;
let activeGain: GainNode | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
  try {
    context ??= new window.AudioContext();
    return context;
  } catch {
    return null;
  }
}

/** Call from the answer button gesture so browsers can unlock audio before the save finishes. */
export async function prepareFeedbackSound(enabled: boolean, volume = 75): Promise<void> {
  if (!enabled || volume <= 0) return;
  const audio = audioContext();
  if (audio?.state === "suspended") {
    try { await audio.resume(); } catch { /* The browser may block sound. */ }
  }
}

/** Feedback is optional: a missing or blocked audio device must never interrupt practice. */
export function playFeedbackSound(kind: FeedbackSound, enabled: boolean, volume = 75): void {
  if (!enabled || volume <= 0) return;
  const audio = audioContext();
  if (!audio || audio.state !== "running") return;

  try {
    const now = audio.currentTime;
    if (activeGain) {
      activeGain.gain.cancelScheduledValues(now);
      activeGain.gain.setTargetAtTime(0, now, 0.008);
    }
    const group = audio.createGain();
    group.connect(audio.destination);
    activeGain = group;

    for (const note of notes[kind]) {
      const start = now + note.delay;
      const end = start + note.length;
      const voice = audio.createOscillator();
      const envelope = audio.createGain();
      voice.type = "sine";
      voice.frequency.setValueAtTime(note.frequency, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(note.volume * Math.min(volume, 100) / 50, start + 0.015);
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      voice.connect(envelope);
      envelope.connect(group);
      voice.start(start);
      voice.stop(end + 0.01);
      voice.onended = () => {
        voice.disconnect();
        envelope.disconnect();
        if (note === notes[kind].at(-1)) {
          group.disconnect();
          if (activeGain === group) activeGain = null;
        }
      };
    }
  } catch {
    // Sound is an enhancement, never a reason for an answer to fail.
  }
}
