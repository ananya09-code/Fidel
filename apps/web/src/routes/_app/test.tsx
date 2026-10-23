
import { createFileRoute } from "@tanstack/react-router";
import { FlashcardSession } from "@/components/learn-ui/lesson/FlashcardSession";
import type { FlashcardWord } from "@/components/learn-ui/lesson/Flashcard";

export const Route = createFileRoute("/_app/test")({
  component: LessonDemo,
});

const demoWords: FlashcardWord[] = [
  {
    id: "1",
    word: "Akkam",
    meaning: "Hello / How are you?",
    transliteration: null,
  },
  {
    id: "2",
    word: "Nagaa",
    meaning: "Peace",
    transliteration: null,
  },
  {
    id: "3",
    word: "Galatoomi",
    meaning: "Thank you",
    transliteration: null,
  },
  {
    id: "4",
    word: "Maaloo",
    meaning: "Please",
    transliteration: null,
  },
  {
    id: "5",
    word: "Eeyyee",
    meaning: "Yes",
    transliteration: null,
  },
  {
    id: "6",
    word: "Lakki",
    meaning: "No",
    transliteration: null,
  },
  {
    id: "7",
    word: "Akkam jirta?",
    meaning: "How are you?",
    transliteration: null,
  },
  {
    id: "8",
    word: "Maqaan kee eenyu?",
    meaning: "What is your name?",
    transliteration: null,
  },
  {
    id: "9",
    word: "Nagaatti",
    meaning: "Goodbye",
    transliteration: null,
  },
  {
    id: "10",
    word: "Nagaan buli",
    meaning: "Good night",
    transliteration: null,
  },
];

import { useState } from "react";

import { LessonQuiz } from "@/components/learn-ui/lesson/LessonQuiz";

// Keep your existing demoWords array here.

function LessonDemo() {
  const [quizWords, setQuizWords] = useState<FlashcardWord[] | null>(null);

  if (quizWords) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6">
        <LessonQuiz
          category="Greetings"
          words={quizWords}
          onBack={() => setQuizWords(null)}
          onRetryMissed={(missedWords) => setQuizWords(missedWords)}
          onFinish={(result) => {
            console.log("Quiz results:", result);
          }}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <FlashcardSession
        category="Greetings"
        words={demoWords}
        initialWordLimit={10}
        onBack={() => console.log("Back to learning path")}
        onComplete={(words) => {
          setQuizWords(words);
        }}
      />
    </main>
  );
}
