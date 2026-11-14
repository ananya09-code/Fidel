import { useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/tanstack-react-start";
import { Check, LoaderCircle, LogOut } from "lucide-react";
import { PageState } from "@/components/common-ui/PageState";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { InstallFidel, useFidelInstalled } from "@/components/install/InstallFidel";
import { AppearancePicker } from "@/components/theme/AppearancePicker";
import { useThemePreview } from "@/components/theme/ThemeProvider";
import { deleteProfile } from "@/lib/api/profile";
import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import type { UserPreferences } from "@/lib/api/preferences";
import { playFeedbackSound, prepareFeedbackSound } from "@/lib/feedback-sounds";
import { PushDeviceControls } from "@/components/settings-ui/PushDeviceControls";
import { disablePushOnThisDevice } from "@/lib/push-device";
import "@/components/common-ui/app-ui.css";

export type Settings = Pick<UserPreferences, "learning_language" | "interface_language" | "daily_goal_words" | "reminders_enabled" | "quiz_notifications_enabled" | "streak_notifications_enabled" | "reminder_time" | "sound_enabled" | "sound_volume" | "haptics_enabled" | "appearance">;
type SettingsFormProps = {
  settings: Settings;
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onAppearance: (value: Settings["appearance"]) => void;
  onSave: () => void;
  onSignOut: () => void;
  onDelete: () => void;
  isSaving?: boolean;
  saved?: boolean;
  deleting?: boolean;
  error?: string | null;
  accountError?: string | null;
};

export function SettingsForm({ settings, onChange, onAppearance, onSave, onSignOut, onDelete, isSaving, saved, deleting, error, accountError }: SettingsFormProps) {
  const installed = useFidelInstalled();
  return <div className="fidel-settings">
    <header className="app-page-title"><div><h1>Settings</h1><p>A routine that feels like yours.</p></div><FidelTeacherMark className="app-title-teacher" /></header>
    <form onSubmit={(event) => { event.preventDefault(); if (!isSaving) onSave(); }}>
      <fieldset className="settings-fields" disabled={isSaving}>
        <section className="settings-section"><div className="settings-section-title"><h2>Languages</h2><p>Choose what you’re learning.</p></div><div className="settings-panel">
          <label className="settings-row"><span>Learning language<span>Your current course</span></span><select value={settings.learning_language} onChange={(event) => onChange("learning_language", event.target.value as Settings["learning_language"])}><option value="om">Afaan Oromoo</option><option value="am">Amharic</option><option value="ti">Tigrinya</option></select></label>
          <label className="settings-row"><span>Interface preference<span>Your saved language preference</span></span><select value={settings.interface_language} onChange={(event) => onChange("interface_language", event.target.value as Settings["interface_language"])}><option value="en">English</option><option value="om">Afaan Oromoo</option><option value="am">Amharic</option><option value="ti">Tigrinya</option></select></label>
        </div></section>
        <section className="settings-section"><div className="settings-section-title"><h2>Daily goal</h2><p>A few words, every day.</p></div><div className="settings-panel"><fieldset className="settings-goals"><legend>Words to learn each day</legend><div>{([5, 10, 15, 20] as const).map((count) => <button type="button" key={count} aria-pressed={settings.daily_goal_words === count} onClick={() => onChange("daily_goal_words", count)}><span>{count}</span> words{settings.daily_goal_words === count && <Check size={15} aria-hidden="true" />}</button>)}</div></fieldset><p className="settings-goal-caption">{settings.daily_goal_words} new words. One small daily habit.</p></div></section>
        <section className="settings-section"><div className="settings-section-title"><h2>Make it comfortable</h2><p>Your time, feedback and appearance.</p></div><div className="settings-panel">
          <label className="settings-row"><span>Daily word goal<span>Remind me when I have words left to learn</span></span><input className="app-switch" type="checkbox" role="switch" checked={settings.reminders_enabled} onChange={(event) => onChange("reminders_enabled", event.target.checked)} /></label>
          <label className="settings-row"><span>Word quiz<span>Tell me when a spaced quiz is due</span></span><input className="app-switch" type="checkbox" role="switch" checked={settings.quiz_notifications_enabled} onChange={(event) => onChange("quiz_notifications_enabled", event.target.checked)} /></label>
          <label className="settings-row"><span>Learning streak<span>Remind me if I studied yesterday but not today</span></span><input className="app-switch" type="checkbox" role="switch" checked={settings.streak_notifications_enabled} onChange={(event) => onChange("streak_notifications_enabled", event.target.checked)} /></label>
          {(settings.reminders_enabled || settings.quiz_notifications_enabled || settings.streak_notifications_enabled) && <label className="settings-row"><span>Reminder time<span>A time that suits your day</span></span><input type="time" value={settings.reminder_time} onChange={(event) => onChange("reminder_time", event.target.value)} /></label>}
          <label className="settings-row"><span>Practice sounds<span>Answer and completion cues. Word audio plays separately.</span></span><input className="app-switch" type="checkbox" role="switch" checked={settings.sound_enabled} onChange={(event) => onChange("sound_enabled", event.target.checked)} /></label>
          <div className="settings-volume"><div className="settings-volume-heading"><label htmlFor="practice-sound-volume">Feedback volume<span>Adjust the answer sounds, not word pronunciation.</span></label><output htmlFor="practice-sound-volume">{settings.sound_volume}%</output></div><div className="settings-volume-controls"><input id="practice-sound-volume" type="range" min="0" max="100" step="5" value={settings.sound_volume} disabled={!settings.sound_enabled} onChange={(event) => onChange("sound_volume", Number(event.target.value))} /><button type="button" className="app-secondary" disabled={!settings.sound_enabled || settings.sound_volume === 0} onClick={() => { void prepareFeedbackSound(true, settings.sound_volume).then(() => playFeedbackSound("correct", true, settings.sound_volume)); }}>Hear sample</button></div></div>
          <label className="settings-row"><span>Touch feedback<span>Gentle taps on supported phones. Device settings still apply.</span></span><input className="app-switch" type="checkbox" role="switch" checked={settings.haptics_enabled} onChange={(event) => onChange("haptics_enabled", event.target.checked)} /></label>
          <div className="settings-appearance"><h3>Appearance</h3><AppearancePicker value={settings.appearance} onChange={onAppearance} /><p>Preview now. Save changes to remember it.</p></div>
        </div></section>
      </fieldset>
      <div className="settings-save"><p role="status">{saved ? "Your preferences are saved." : "Save when you’re happy with your choices."}</p><button className="app-primary" type="submit" disabled={isSaving}>{isSaving ? <LoaderCircle size={17} className="app-spinner" aria-hidden="true" /> : saved ? <Check size={17} aria-hidden="true" /> : null}{saved ? "Saved" : "Save changes"}{isSaving && <span className="sr-only">Saving preferences</span>}</button></div>
      {error && <p className="app-error" role="alert">{error}</p>}
    </form>
    <PushDeviceControls />
    {!installed && <section className="settings-section settings-install-section"><div className="settings-section-title"><h2>Install Fidel</h2><p>Keep learning close.</p></div><div className="settings-panel"><div className="settings-row"><span>Fidel on this device<span>Open it from your home screen. Lessons still need internet.</span></span><InstallFidel /></div></div></section>}
    <section className="settings-section settings-account"><div className="settings-section-title"><h2>Account</h2><p>Your account and this device.</p></div><div className="settings-panel">
      <div className="settings-row"><span>Sign out<span>End your session on this device</span></span><button type="button" className="app-secondary" onClick={onSignOut} disabled={deleting || isSaving}><LogOut size={16} aria-hidden="true" />Sign out</button></div>
      <details className="settings-delete"><summary>Delete account</summary><p>Permanently delete your Clerk account and Fidel profile. This cannot be undone.</p><button type="button" className="app-danger" onClick={onDelete} disabled={deleting || isSaving}>{deleting && <LoaderCircle size={16} className="app-spinner" aria-hidden="true" />}Delete account</button></details>
      {accountError && <p className="app-error" role="alert">{accountError}</p>}
    </div></section>
  </div>;
}

export default function SettingsOverview() {
  const preview = useThemePreview();
  const { getToken, userId } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const preferences = usePreferences();
  const update = useUpdatePreferences();
  const [draft, setDraft] = useState<{ userId: string; settings: Settings } | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const settings = draft && draft.userId === userId ? draft.settings : preferences.data;

  function change<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (!userId || !settings) return;
    setDraft({ userId, settings: { ...settings, [key]: value } });
    setSaved(false);
  }
  async function save() {
    if (!settings) return;
    setSaved(false);
    try {
      const { learning_language, interface_language, daily_goal_words, reminders_enabled, quiz_notifications_enabled, streak_notifications_enabled, reminder_time, sound_enabled, sound_volume, haptics_enabled, appearance } = settings;
      await update.mutateAsync({ learning_language, interface_language, daily_goal_words, reminders_enabled, quiz_notifications_enabled, streak_notifications_enabled, reminder_time, sound_enabled, sound_volume, haptics_enabled, appearance });
      setSaved(true);
    } catch { /* Render the mutation error beside the save action. */ }
  }
  async function removeAccount() {
    if (!user || deleting || !window.confirm("Delete your Fidel account and local profile? This cannot be undone.")) return;
    setDeleting(true); setAccountError(null);
    try {
      await disablePushOnThisDevice(getToken).catch(() => undefined);
      await deleteProfile(getToken);
      await user.delete();
      await signOut({ redirectUrl: "/" });
    } catch (error) { setAccountError(error instanceof Error ? error.message : "Unable to delete your account. Please try again."); }
    finally { setDeleting(false); }
  }
  if (preferences.isPending) return <div className="fidel-settings"><header className="app-page-title"><h1>Settings</h1></header><PageState kind="loading" title="Loading your settings" /></div>;
  if (preferences.isError || !settings) return <div className="fidel-settings"><header className="app-page-title"><h1>Settings</h1></header><PageState kind="error" title="Couldn't load your settings" description={preferences.error?.message} actionLabel="Try again" onAction={() => void preferences.refetch()} /></div>;
  return <SettingsForm settings={settings} onChange={change} onAppearance={(value) => { change("appearance", value); preview(value); }} onSave={() => void save()} onSignOut={() => { void disablePushOnThisDevice(getToken).catch(() => undefined).then(() => signOut({ redirectUrl: "/" })); }} onDelete={() => void removeAccount()} isSaving={update.isPending} saved={saved} deleting={deleting} error={update.error?.message} accountError={accountError} />;
}
