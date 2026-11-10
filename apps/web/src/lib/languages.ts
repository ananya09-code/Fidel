/** Course codes shared by learner settings, labels and API schemas. */
export const learningLanguageCodes = ['om', 'am', 'ti'] as const
export type LearningLanguage = typeof learningLanguageCodes[number]
export const learningLanguages: Record<LearningLanguage, { name: string; nativeName: string }> = {
  om: { name: 'Afaan Oromoo', nativeName: 'Afaan Oromoo' },
  am: { name: 'Amharic', nativeName: 'አማርኛ' },
  ti: { name: 'Tigrinya', nativeName: 'ትግርኛ' },
}
export function languageLabel(code: string): string {
  return learningLanguages[code as LearningLanguage]?.nativeName ?? code
}
