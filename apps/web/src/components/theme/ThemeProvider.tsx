import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { usePreferences } from "@/hooks/use-preferences";
import { readDeviceAppearance, watchTheme, THEME_STORAGE_KEY, type Appearance } from "@/lib/theme";

const ThemeContext = createContext<{
  setSavedAppearance: (value: Appearance | null) => void;
  previewAppearance: (value: Appearance | null) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Keep the server and first client render identical; the head script handles paint.
  const [saved, setSaved] = useState<Appearance | null>(null);
  const [preview, setPreview] = useState<Appearance | null>(null);
  const setSavedAppearance = useCallback((value: Appearance | null) => {
    if (value !== null) {
      try { localStorage.setItem(THEME_STORAGE_KEY, value); } catch { /* Device storage is optional. */ }
    }
    setSaved(value);
  }, []);
  const previewAppearance = useCallback((value: Appearance | null) => setPreview(value), []);

  useEffect(() => {
    const appearance = preview ?? saved ?? readDeviceAppearance();
    const stopWatching = watchTheme(appearance);
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
    // Keep the device choice made on the landing page across sign-in.
    if (previousUser.current !== undefined && previousUser.current !== (userId ?? null)) {
      preview?.(null);
      setSaved?.(null);
    }
    previousUser.current = userId ?? null;
  }, [userId, isLoaded, setSaved, preview]);

  useEffect(() => {
    if (userId && preferences.data?.onboarding_completed && appearance) setSaved?.(appearance);
  }, [userId, appearance, preferences.data?.onboarding_completed, setSaved]);
  return null;
}

export function useThemePreview() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("ThemeProvider is missing.");
  const { previewAppearance } = theme;
  useEffect(() => () => previewAppearance(null), [previewAppearance]);
  return previewAppearance;
}

/** A device choice survives navigation; settings previews remain temporary. */
export function useAppearanceChoice() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("ThemeProvider is missing.");
  return theme.setSavedAppearance;
}
