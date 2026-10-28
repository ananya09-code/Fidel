
import { createFileRoute } from "@tanstack/react-router";
import { DictionaryOverview } from "@/components/dictionary-ui/DictionaryOverview";
import { useWords } from "@/hooks/use-words"



export const Route = createFileRoute("/_app/dictionary")({
  component: DictionaryPage,
});


function DictionaryPage() {
  const words = useWords();
  console.log(words)
  return (
    <DictionaryOverview
      onPracticeWord={(word) => {
        console.log("Practice dictionary word:", word);
      }}
    />
  );
}

