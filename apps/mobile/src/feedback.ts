import { useAudioPlayer } from "expo-audio";
import { createContext, useContext } from "react";
import { Vibration } from "react-native";
import type { UserPreferences } from "@/lib/api/preferences";

export type FeedbackSettings = Pick<UserPreferences, "sound_enabled" | "sound_volume" | "haptics_enabled">;
export const FeedbackContext = createContext<FeedbackSettings>({ sound_enabled: false, sound_volume: 75, haptics_enabled: false });

export function useFeedback() {
  const settings = useContext(FeedbackContext);
  const correct = useAudioPlayer(require("../assets/feedback/correct.wav"));
  const retry = useAudioPlayer(require("../assets/feedback/retry.wav"));
  const complete = useAudioPlayer(require("../assets/feedback/complete.wav"));

  async function play(kind: "correct" | "retry" | "complete") {
    if (settings.haptics_enabled) Vibration.vibrate(kind === "complete" ? [0, 30, 70, 30] : kind === "correct" ? 20 : 35);
    if (!settings.sound_enabled || settings.sound_volume <= 0) return;
    try {
      const player = kind === "correct" ? correct : kind === "retry" ? retry : complete;
      player.volume = Math.min(1, settings.sound_volume / 75);
      await player.seekTo(0);
      player.play();
    } catch {
      // A blocked or unavailable audio device must not interrupt a saved answer.
    }
  }

  return play;
}
