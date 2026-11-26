import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  ActivityIndicator, Image, Pressable, StyleSheet, Text, View,
  type StyleProp, type TextStyle, type ViewStyle,
} from "react-native";

export const palettes = {
  light: { paper: "#f8faf7", panel: "#ffffff", frame: "#edf2ec", ink: "#193b31", muted: "#53645c", line: "#dce3dc", tint: "#eff3ed", gold: "#e9a033", goldInk: "#25372c", action: "#203e33", actionInk: "#ffffff", success: "#275f43", error: "#923b30", errorBg: "#fbefec", activity: ["#e6ece3", "#c7e2bd", "#8ac183", "#4e9864", "#245d41"], dark: false },
  dark: { paper: "#171c19", panel: "#252e27", frame: "#1c231e", ink: "#e7ede6", muted: "#b0bcb2", line: "#414b43", tint: "#222924", gold: "#e9a033", goldInk: "#25372c", action: "#e7ede6", actionInk: "#17241b", success: "#b4d8c0", error: "#f1beb4", errorBg: "#392a27", activity: ["#20343a", "#28543e", "#367a50", "#55a96d", "#86d99b"], dark: true },
};

export const Theme = createContext(palettes.light);
export const usePalette = () => useContext(Theme);
export const row = { flexDirection: "row", alignItems: "center", gap: 10 } as const;
export const grow = { flex: 1, minWidth: 0 } as const;

const icons = {
  home: require("../assets/ui/home.png"), learn: require("../assets/ui/learn.png"),
  review: require("../assets/ui/review.png"), search: require("../assets/ui/search.png"),
  profile: require("../assets/ui/profile.png"), settings: require("../assets/ui/settings.png"),
  arrow: require("../assets/ui/arrow.png"), back: require("../assets/ui/back.png"),
  check: require("../assets/ui/check.png"), lock: require("../assets/ui/lock.png"),
  play: require("../assets/ui/play.png"), pause: require("../assets/ui/pause.png"),
  volume: require("../assets/ui/volume.png"), chevron: require("../assets/ui/chevron.png"),
  bookmark: require("../assets/ui/bookmark.png"), alert: require("../assets/ui/alert.png"),
  close: require("../assets/ui/close.png"),
};

export type IconName = keyof typeof icons;

export function Icon({ name, size = 20, tint }: { name: IconName; size?: number; tint?: string }) {
  const color = usePalette();
  return <Image accessible={false} source={icons[name]} style={{ width: size, height: size, tintColor: tint ?? color.ink }} />;
}

export function Teacher({ size = 58 }: { size?: number }) {
  const color = usePalette();
  return <Image accessible={false} source={color.dark ? require("../assets/ui/teacher-dark.png") : require("../assets/ui/teacher.png")}
    resizeMode="contain" style={{ width: size, height: size * 1.08 }} />;
}

export function Label({ children, size = 15, strong = false, muted = false, style }: {
  children: ReactNode; size?: number; strong?: boolean; muted?: boolean; style?: StyleProp<TextStyle>;
}) {
  const color = usePalette();
  return <Text style={[{ color: muted ? color.muted : color.ink, fontFamily: "Manrope", fontSize: size, lineHeight: Math.round(size * 1.4) },
    strong && { fontFamily: "ManropeBold" }, style]}>{children}</Text>;
}

export function WordText({ children, size = 29, style }: { children: string; size?: number; style?: StyleProp<TextStyle> }) {
  const color = usePalette();
  return <Text selectable style={[{ color: color.ink, fontFamily: /[\u1200-\u137f]/.test(children) ? "Ethiopic" : "ManropeBold",
    fontSize: size, lineHeight: Math.round(size * 1.43) }, style]}>{children}</Text>;
}

export function Title({ children }: { children: ReactNode }) {
  const color = usePalette();
  return <Text accessibilityRole="header" style={{ color: color.ink, fontFamily: "ManropeBold", fontSize: 27, lineHeight: 36, letterSpacing: -0.8 }}>{children}</Text>;
}

export function Heading({ children }: { children: ReactNode }) {
  const color = usePalette();
  return <Text accessibilityRole="header" style={{ color: color.ink, fontFamily: "ManropeBold", fontSize: 17, lineHeight: 24 }}>{children}</Text>;
}

export function Copy({ children }: { children: ReactNode }) {
  return <Label muted>{children}</Label>;
}

export function PageHeading({ title, detail }: { title: string; detail?: string }) {
  return <View style={{ gap: 2 }}><Title>{title}</Title>{detail && <Copy>{detail}</Copy>}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const color = usePalette();
  return <View style={[styles.card, { backgroundColor: color.panel, borderColor: color.line }, style]}>{children}</View>;
}

export function Press({ children, label, onPress, style, disabled = false, selected, tab, expanded, dimDisabled = true }: {
  children: ReactNode; label?: string; onPress: () => void; style?: StyleProp<ViewStyle>;
  disabled?: boolean; selected?: boolean; tab?: boolean; expanded?: boolean; dimDisabled?: boolean;
}) {
  const color = usePalette();
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole={tab ? "tab" : "button"} accessibilityLabel={label}
    accessibilityState={{ disabled, selected, expanded }} disabled={disabled} onPress={onPress}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [style, { opacity: disabled && dimDisabled ? 0.54 : pressed ? 0.72 : 1 },
      focused && { outlineColor: color.ink, outlineWidth: 2, outlineOffset: 1 }]}>
    {children}
  </Pressable>;
}

export function Button({ title, onPress, primary, disabled, icon, kind, busy, style }: {
  title: string; onPress: () => void; primary?: boolean; disabled?: boolean; icon?: IconName;
  kind?: "gold" | "quiet"; busy?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const color = usePalette();
  const background = kind === "gold" ? color.gold : primary ? color.action : kind === "quiet" ? "transparent" : color.panel;
  const ink = kind === "gold" ? color.goldInk : primary ? color.actionInk : color.ink;
  return <Press onPress={onPress} disabled={disabled || busy} label={title} style={[styles.button, {
    backgroundColor: background, borderColor: primary || kind ? background : color.line,
  }, style]}>
    {busy && <ActivityIndicator color={ink} />}
    {icon === "back" && !busy && <Icon name={icon} size={17} tint={ink} />}
    <Label strong size={14} style={{ color: ink, textAlign: "center", flexShrink: 1 }}>{title}</Label>
    {icon && icon !== "back" && !busy && <Icon name={icon} size={17} tint={ink} />}
  </Press>;
}

export function IconButton({ name, label, onPress, tint, disabled }: {
  name: IconName; label: string; onPress: () => void; tint?: string; disabled?: boolean;
}) {
  return <Press label={label} onPress={onPress} disabled={disabled} style={styles.iconButton}><Icon name={name} tint={tint} /></Press>;
}

export function Progress({ value, total, label }: { value: number; total: number; label: string }) {
  const color = usePalette();
  const max = Math.max(total, 1);
  const now = Math.min(Math.max(value, 0), max);
  return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max, now }}
    style={{ height: 5, borderRadius: 4, backgroundColor: color.line, overflow: "hidden" }}>
    <View style={{ height: "100%", width: `${now / max * 100}%`, borderRadius: 4, backgroundColor: color.gold }} />
  </View>;
}

export function Loading({ label = "Loading Fidel" }: { label?: string }) {
  const color = usePalette();
  return <ActivityIndicator accessibilityLabel={label} color={color.ink} size="large" style={{ padding: 26 }} />;
}

export function Problem({ error, retry }: { error: unknown; retry?: () => void }) {
  const color = usePalette();
  return <Card style={{ backgroundColor: color.errorBg }}>
    <View style={row} accessibilityRole="alert">
      <Icon name="alert" size={18} tint={color.error} />
      <Label style={[grow, { color: color.error }]}>{error instanceof Error ? error.message : "Fidel couldn’t load this screen."}</Label>
    </View>
    {retry && <Button title="Try again" onPress={retry} />}
  </Card>;
}

export function Audio({ url, compact = false, label }: { url: string; compact?: boolean; label?: string }) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState(false);
  const title = status.playing ? "Pause audio" : "Listen";
  const icon = status.playing ? "pause" : "volume";
  async function toggle() {
    try {
      setError(false);
      if (status.playing) { player.pause(); return; }
      if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) await player.seekTo(0);
      player.play();
    } catch {
      setError(true);
    }
  }
  return <View style={{ gap: 4 }}>
    {compact ? <IconButton name={icon} label={label ? `${title} · ${label}` : title} onPress={() => void toggle()} /> :
      <Button title={title} icon={icon} onPress={() => void toggle()} />}
    {error && <Label muted size={12}>Audio couldn’t play.</Label>}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 15, gap: 12 },
  button: { ...row, minHeight: 46, borderRadius: 8, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9, justifyContent: "center" },
  iconButton: { width: 44, minHeight: 44, borderRadius: 8, justifyContent: "center", alignItems: "center" },
});
