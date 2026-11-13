import type { LearningLanguage } from "@/lib/languages";

export type CharacterRole =
  | "coffee"
  | "student"
  | "techie"
  | "grandmother"
  | "peacemaker"
  | "runner"
  | "market"
  | "child";

export type CastMember = { id: string; name: string; role: string; image: string };

const members: Record<LearningLanguage, Record<CharacterRole, Omit<CastMember, "image">>> = {
  om: {
    coffee: { id: "gammachuu", name: "Gammachuu", role: "Coffee host" },
    student: { id: "hawwii", name: "Hawwii", role: "Student" },
    techie: { id: "tolaa", name: "Tolaa", role: "City techie" },
    grandmother: { id: "ayyaantuu", name: "Ayyaantuu", role: "Grandmother" },
    peacemaker: { id: "nagaa", name: "Nagaa", role: "Neighbor" },
    runner: { id: "caalaa", name: "Caalaa", role: "Runner" },
    market: { id: "aminaa", name: "Aminaa", role: "Market seller" },
    child: { id: "hundaa", name: "Hundaa", role: "Young learner" },
  },
  am: {
    coffee: { id: "abebe", name: "አበበ", role: "Coffee host" },
    student: { id: "tsehay", name: "ፀሐይ", role: "Student" },
    techie: { id: "dawit", name: "ዳዊት", role: "City techie" },
    grandmother: { id: "almaz", name: "አልማዝ", role: "Grandmother" },
    peacemaker: { id: "helen", name: "ሄለን", role: "Neighbor" },
    runner: { id: "haile", name: "ኃይሌ", role: "Runner" },
    market: { id: "aisha", name: "አይሻ", role: "Market seller" },
    child: { id: "kidan", name: "ኪዳን", role: "Young learner" },
  },
  ti: {
    coffee: { id: "tesfay", name: "ተስፋይ", role: "Coffee host" },
    student: { id: "berhan", name: "ብርሃን", role: "Student" },
    techie: { id: "dawit", name: "ዳዊት", role: "City techie" },
    grandmother: { id: "almaz", name: "ኣልማዝ", role: "Grandmother" },
    peacemaker: { id: "selam", name: "ሰላም", role: "Neighbor" },
    runner: { id: "yohannes", name: "ዮሃንስ", role: "Runner" },
    market: { id: "amina", name: "ኣሚና", role: "Market seller" },
    child: { id: "kidan", name: "ኪዳን", role: "Young learner" },
  },
};

export function characterFor(language: LearningLanguage, role: CharacterRole): CastMember {
  const member = members[language][role];
  return { ...member, image: `/characters/${language}/${member.id}.svg` };
}

const questRoles: Record<string, CharacterRole> = {
  intro: "student",
  cafe: "coffee",
  neighbor: "peacemaker",
  market: "market",
  family: "grandmother",
};

export function characterForQuest(language: LearningLanguage, questId: string, legacyRole: "guide" | "host") {
  return characterFor(language, questRoles[questId] ?? (legacyRole === "host" ? "coffee" : "student"));
}

export function characterForTopic(language: LearningLanguage, topic: string): CastMember {
  const normalized = topic.toLowerCase().replaceAll("_", " ");
  const role: CharacterRole = /food|drink|coffee/.test(normalized) ? "coffee"
    : /market|shopping/.test(normalized) ? "market"
    : /family|home/.test(normalized) ? "grandmother"
    : /travel|body|health|verb/.test(normalized) ? "runner"
    : /work/.test(normalized) ? "techie"
    : /number|question/.test(normalized) ? "child"
    : /greeting|expression|feeling/.test(normalized) ? "peacemaker"
    : "student";
  return characterFor(language, role);
}

const reviewRoles: CharacterRole[] = ["student", "runner", "techie", "peacemaker"];

/** The same saved word list chooses the same companion when a review is resumed. */
export function reviewCharacterFor(language: LearningLanguage, wordIds: string[]): CastMember {
  const seed = wordIds.join("");
  const hash = [...seed].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0);
  return characterFor(language, reviewRoles[hash % reviewRoles.length]);
}
