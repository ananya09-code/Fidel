export function DictionaryHeader({ languageCode = "om" }: { languageCode?: string }) {
  return <header className="dict-header"><div><h1>Dictionary</h1><p>A word found. A conversation closer.</p></div><p className="dict-language">{languageCode === "om" ? "Afaan Oromoo" : languageCode === "am" ? "አማርኛ" : languageCode}<span>English + Amharic meanings</span></p></header>;
}
