export type Appearance = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "fidel.appearance";

export function parseAppearance(value: unknown): Appearance {
  return value === "light" || value === "dark" ? value : "system";
}

export function resolveTheme(appearance: Appearance, systemDark: boolean) {
  return appearance === "system" ? (systemDark ? "dark" : "light") : appearance;
}

export function watchTheme(appearance: Appearance) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    const resolved = resolveTheme(appearance, media.matches);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved;
  };
  apply();
  media.addEventListener("change", apply);
  return () => media.removeEventListener("change", apply);
}

// Runs before paint. Storage can be blocked in private/restricted browsers.
export const themeInitScript = `(() => {
  let appearance = "system";
  try { appearance = localStorage.getItem("${THEME_STORAGE_KEY}") || "system"; } catch {}
  const dark = appearance === "dark" || (appearance !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
})();`;
