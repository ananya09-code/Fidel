export type EncouragementOutcome = "ready" | "correct" | "incorrect" | "retry" | "recovered" | "complete";
export type EncouragementEvent = {
  id: string;
  outcome: EncouragementOutcome;
  turn: number;
  streak?: number;
};

/** Count actual consecutive saved first answers, including restored answers. */
export function correctRun(answers: Record<string, string>): number {
  let count = 0;
  for (const [id, selected] of Object.entries(answers).reverse()) {
    if (id !== selected) break;
    count++;
  }
  return count;
}

export function encouragementFor(event: EncouragementEvent) {
  if (event.outcome === "ready") return { tone: "ready", title: "Let’s make some connections.", text: "Pick a word, then find its meaning. You can start on either side." };
  if (event.outcome === "retry") return { tone: "encourage", title: "Not this pair. Try another.", text: "You’re still learning the connection. Give it another look." };
  if (event.outcome === "incorrect") {
    const messages = [
      ["A word for next time.", "Mistakes are part of learning. Take a look at the answer below."],
      ["Keep going. You’re learning.", "One missed word doesn’t undo your practice."],
      ["Let’s give this word another look.", "Read it once more, then carry on. You’re building familiarity."],
    ];
    const [title, text] = messages[event.turn % messages.length];
    return { tone: "encourage", title, text };
  }
  if (event.outcome === "recovered") return { tone: "recovered", title: "You found the connection!", text: "That extra try counts as practice. We’ll revisit this word." };
  if (event.outcome === "complete") return { tone: "complete", title: "All pairs found!", text: "Your answers are saved. Ready for the next step?" };
  if (event.streak && event.streak >= 3 && event.streak % 3 === 0) return { tone: "streak", title: `${event.streak} right in a row!`, text: "Your practice is paying off. Keep that rhythm." };
  const messages = [
    ["Well remembered!", "One more word to take into your next conversation."],
    ["That’s it!", "A little practice makes the words more familiar."],
    ["You made the connection!", "Keep going, one word at a time."],
  ];
  const [title, text] = messages[event.turn % messages.length];
  return { tone: "correct", title, text };
}
