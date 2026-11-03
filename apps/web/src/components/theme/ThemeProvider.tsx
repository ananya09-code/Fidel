import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { usePreferences } from "@/hooks/use-preferences";
import { parseAppearance, watchTheme, THEME_STORAGE_KEY, type Appearance } from "@/lib/theme";

const ThemeContext = createContext<{
  setSavedAppearance: (value: Appearance) => void;
  previewAppearance: (value: Appearance | null) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Keep the server and first client render identical; the head script handles paint.
  const [saved, setSaved] = useState<Appearance | null>(null);
  const [preview, setPreview] = useState<Appearance | null>(null);
  const setSavedAppearance = useCallback((value: Appearance) => setSaved(value), []);
  const previewAppearance = useCallback((value: Appearance | null) => setPreview(value), []);

  useEffect(() => {
    let cached: Appearance = "system";
    try { cached = parseAppearance(localStorage.getItem(THEME_STORAGE_KEY)); } catch { /* Optional device cache. */ }
    const appearance = preview ?? saved ?? cached;
    const stopWatching = watchTheme(appearance);
    // Only cache saved preferences; an unsaved preview disappears on navigation.
    if (saved !== null) {
      try { localStorage.setItem(THEME_STORAGE_KEY, saved); } catch { /* The account remains the source of truth. */ }
    }
    return stopWatching;
  }, [saved, preview]);

  const value = useMemo(() => ({ setSavedAppearance, previewAppearance }), [setSavedAppearance, previewAppearance]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function PreferenceThemeSync() {
  const { userId, isLoaded } = useAuth();
  const preferences = usePreferences();
  const theme = useContext(ThemeContext);
  const appearance = preferences.data?.appearance;
  const setSaved = theme?.setSavedAppearance;
  const preview = theme?.previewAppearance;
  const previousUser = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;
    // Retain the pre-paint device cache on initial load; clear it on account changes.
    if (previousUser.current !== undefined && previousUser.current !== (userId ?? null)) {
      preview?.(null);
      setSaved?.("system");
    }
    previousUser.current = userId ?? null;
  }, [userId, isLoaded, setSaved, preview]);

  useEffect(() => {
    if (userId && appearance) setSaved?.(appearance);
  }, [userId, appearance, setSaved]);
  return null;
}

export function useThemePreview() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("ThemeProvider is missing.");
  const { previewAppearance } = theme;
  useEffect(() => () => previewAppearance(null), [previewAppearance]);
  return previewAppearance;
}
