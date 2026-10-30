
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DictionaryOverview } from "@/components/dictionary-ui/DictionaryOverview";

export const Route = createFileRoute("/_app/dictionary")({
  validateSearch: (search: Record<string, unknown>): { category?: string } => {
    const category =
      typeof search.category === "string" && search.category.trim()
        ? search.category.trim()
        : undefined;
    return category ? { category } : {};
  },
  component: DictionaryPage,
});

function DictionaryPage() {
  const { category } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <DictionaryOverview
      initialCategory={category}
      onCategoryChange={(nextCategory) =>
        void navigate({
          to: "/dictionary",
          search: nextCategory === "All words" ? {} : { category: nextCategory },
          replace: true,
        })
      }
    />
  );
}

