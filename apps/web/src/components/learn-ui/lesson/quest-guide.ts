export type QuestLanguageCode = "am" | "om" | "ti";

export const questGuides: Record<QuestLanguageCode, { name: string; image: string }> = {
  am: { name: "Abeba", image: "/quest/characters/am-guide.svg" },
  om: { name: "Caaltuu", image: "/quest/characters/om-guide.svg" },
  ti: { name: "Selam", image: "/quest/characters/ti-guide.svg" },
};
