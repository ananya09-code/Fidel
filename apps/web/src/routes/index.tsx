import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import fidelLogo from "@/assets/fidallogo.png";
import WordQuestionCard from "@/components/WordQuestionCard";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const lessons = [
  {
    word: "ሰላም",
    pronunciation: "Selam",
    explanation: "A common Amharic greeting meaning hello or peace.",
    options: ["Thank you", "Hello / Peace", "Goodbye", "Good morning"],
    correctAnswer: "Hello / Peace",
    audioSrc:
      "https://br-floral-rain-b5mr73of.storage.c-7.us-east-2.aws.neon.tech/audio/Selam.mp3",
  },
  {
    word: "አመሰግናለሁ",
    pronunciation: "Ameseginalehu",
    explanation: "A polite way to say thank you in Amharic.",
    options: ["I'm sorry", "Welcome", "Thank you", "Good night"],
    correctAnswer: "Thank you",
    audioSrc: "/audio/amharic/ameseginalehu.mp3",
  },
  {
    word: "እንደምን አደርክ",
    pronunciation: "Endemin aderk",
    explanation: "An informal way to ask a male how he is doing.",
    options: [
      "Where are you going?",
      "How are you?",
      "Goodbye",
      "What's your name?",
    ],
    correctAnswer: "How are you?",
    audioSrc: "/audio/amharic/endemin-aderk.mp3",
  },
  {
    word: "ውሃ",
    pronunciation: "Wuha",
    explanation: "The Amharic word for water.",
    options: ["Milk", "Coffee", "Food", "Water"],
    correctAnswer: "Water",
    audioSrc: "/audio/amharic/wuha.mp3",
  },
  {
    word: "ቤት",
    pronunciation: "Bet",
    explanation: "The Amharic word for house or home.",
    options: ["School", "House", "Road", "Market"],
    correctAnswer: "House",
    audioSrc: "/audio/amharic/bet.mp3",
  },
  {
    word: "ፍቅር",
    pronunciation: "Fikir",
    explanation: "The Amharic word for love.",
    options: ["Friend", "Happiness", "Love", "Family"],
    correctAnswer: "Love",
    audioSrc: "/audio/amharic/fikir.mp3",
  },
];

function HomePage() {
  const [currentLesson, setCurrentLesson] = useState(0);

  const lesson = lessons[currentLesson];

  function handleNext() {
    setCurrentLesson((current) => (current + 1) % lessons.length);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-col items-center gap-4 border-b px-6 py-8 text-center">
        <img
          src={fidelLogo}
          alt="Fidel Logo"
          className="h-20 w-auto object-contain"
        />

        <h1 className="text-4xl font-bold">Fidel</h1>

        <p className="max-w-lg text-muted-foreground">
          Learn Ethiopian languages, one word at a time.
        </p>

        <nav className="flex gap-6">
          <a href="/" className="font-medium hover:underline">
            Home
          </a>
          <a href="/about" className="font-medium hover:underline">
            About
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-purple-600">
            Your daily lesson
          </p>

          <h2 className="text-3xl font-bold">Let's learn a new word!</h2>

          <p className="mt-2 text-muted-foreground">
            Listen, learn, and choose the correct meaning.
          </p>

          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Word {currentLesson + 1} of {lessons.length}
          </p>

          <div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-purple-600 transition-all duration-300"
              style={{
                width: `${((currentLesson + 1) / lessons.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <WordQuestionCard key={currentLesson} {...lesson} onNext={handleNext} />
      </main>
    </div>
  );
}
