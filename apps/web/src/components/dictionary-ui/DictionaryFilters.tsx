import { Search, X } from "lucide-react";
import { topicLabel } from "@/components/homepage-ui/labels";
import type { WordCategory } from "@/lib/api/words";

type DictionaryFiltersProps = {
  query: string;
  onQueryChange: (query: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories: WordCategory[];
};

export function DictionaryFilters({ query, onQueryChange, activeCategory, onCategoryChange, categories }: DictionaryFiltersProps) {
  return <section className="dict-filters" aria-label="Find vocabulary">
    <div className="dict-search"><Search size={18} aria-hidden="true" />
      <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search a word or meaning" aria-label="Search dictionary" />
      {query && <button type="button" className="dict-icon-button" onClick={() => onQueryChange("")} aria-label="Clear search"><X size={18} aria-hidden="true" /></button>}
    </div>
    <label className="dict-category"><span>Topic</span><select value={activeCategory} onChange={(event) => onCategoryChange(event.target.value)}>
      <option value="All words">All topics</option>
      {activeCategory !== "All words" && !categories.some((item) => item.name === activeCategory) && <option value={activeCategory}>{topicLabel(activeCategory)}</option>}
      {categories.map((item) => <option key={item.name} value={item.name}>{topicLabel(item.name)} ({item.word_count})</option>)}
    </select></label>
  </section>;
}
