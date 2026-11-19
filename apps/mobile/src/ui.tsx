import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { createContext, useContext, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export const palettes = {
  light: { paper: "#edf5ef", panel: "#fcfbf6", ink: "#173a40", muted: "#536b66", line: "#cadbd0", gold: "#eda83c", goldInk: "#22291f" },
  dark: { paper: "#142425", panel: "#203735", ink: "#f0f3e6", muted: "#bbcfc3", line: "#3d5750", gold: "#eda83c", goldInk: "#22291f" },
};
export const Theme = createContext(palettes.light);
export const usePalette = () => useContext(Theme);

export function Title({ children }: { children: ReactNode }) {
  const color = usePalette();
  return <Text accessibilityRole="header" style={[styles.title, { color: color.ink }]}>{children}</Text>;
}

export function Copy({ children }: { children: ReactNode }) {
  const color = usePalette();
  return <Text style={{ color: color.muted, fontSize: 16, lineHeight: 23 }}>{children}</Text>;
}

export function Card({ children }: { children: ReactNode }) {
  const color = usePalette();
  return <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.line }]}>{children}</View>;
}

export function Button({ title, onPress, primary = false, disabled = false }: {
  title: string; onPress: () => void; primary?: boolean; disabled?: boolean;
}) {
  const color = usePalette();
  return <Pressable
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [styles.button, {
      backgroundColor: primary ? color.gold : color.panel,
      borderColor: primary ? color.gold : color.line,
      opacity: disabled ? 0.5 : pressed ? 0.72 : 1,
    }]}
  >
    <Text style={{ color: primary ? color.goldInk : color.ink, fontSize: 16, fontWeight: "700" }}>{title}</Text>
  </Pressable>;
}

export function Loading() {
  const color = usePalette();
  return <ActivityIndicator accessibilityLabel="Loading Fidel" color={color.ink} size="large" style={{ padding: 32 }} />;
}

export function Problem({ error, retry }: { error: unknown; retry?: () => void }) {
  return <Card>
    <Copy>{error instanceof Error ? error.message : "Fidel could not load this screen."}</Copy>
    {retry && <Button title="Try again" onPress={retry} />}
  </Card>;
}

export function Audio({ url }: { url: string }) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  return <Button title={status.playing ? "Pause audio" : "Listen"} onPress={() => {
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) void player.seekTo(0).then(() => player.play());
      else player.play();
    }
  }} />;
}

const styles = StyleSheet.create({
  title: { fontSize: 33, lineHeight: 41, fontWeight: "800", letterSpacing: -1 },
  card: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 12 },
  button: { minHeight: 49, borderRadius: 13, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 11, justifyContent: "center", alignItems: "center" },
});
