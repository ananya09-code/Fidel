
import { useState } from "react";
import {
  Bell,
  Check,
  Globe2,
  Laptop,
  LogOut,
  Moon,
  Save,
  Sun,
  Target,
  Volume2,
} from "lucide-react";

const initialSettings = {
  learningLanguage: "Afaan Oromoo",
  interfaceLanguage: "English",
  dailyGoal: 10,
  remindersEnabled: true,
  reminderTime: "19:00",
  soundEnabled: true,
  appearance: "system",
};

type Settings = typeof initialSettings;

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Globe2;
  title: string;
  description: string;
}) {
  return (<div className="mb-5 flex items-start gap-3"> <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sand)]/60 text-[var(--sea-ink)]"> <Icon size={19} /> </div> <div> <h2 className="font-semibold text-[var(--sea-ink)]">{title}</h2> <p className="mt-1 text-sm leading-relaxed text-[var(--sea-ink)]/60">
    {description} </p> </div> </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Globe2;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (<div className="flex flex-col gap-3 border-t border-[var(--sea-ink)]/10 py-4 sm:flex-row sm:items-center sm:justify-between"> <div className="flex items-start gap-3"> <Icon size={18} className="mt-0.5 shrink-0 text-[var(--sea-ink)]/55" /> <div> <p className="text-sm font-medium text-[var(--sea-ink)]">{title}</p> <p className="mt-1 text-xs leading-relaxed text-[var(--sea-ink)]/55">
    {description} </p> </div> </div> <div className="sm:ml-4 sm:shrink-0">{children}</div> </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sea-ink)] focus-visible:ring-offset-2 ${checked ? "bg-[var(--sea-ink)]" : "bg-[var(--sea-ink)]/20"
        }`}
    >
      <span
        className={`size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"
          }`}
      /> </button>
  );
}

function SelectField({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-w-36 rounded-xl border border-[var(--sea-ink)]/15 bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[var(--sea-ink)]"
    >
      {options.map((option) => (<option key={option} value={option}>
        {option} </option>
      ))} </select>
  );
}

export default function SettingsOverview() {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saved, setSaved] = useState(false);

  function updateSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function saveSettings() {
    console.log("Demo settings:", settings);
    setSaved(true);
  }

  return (<div className="mx-auto w-full max-w-5xl space-y-7 pb-10"> <div> <p className="mb-2 text-sm font-medium text-[var(--sea-ink)]/55">
    MAKE IT YOURS </p> <h1 className="text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
      Settings </h1> <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--sea-ink)]/65 sm:text-base">
      Set your learning goals, choose your preferences, and make Fidel feel
      right for you. </p> </div>

    ```
    {/* Language preferences */}
    <section className="rounded-3xl border border-[var(--sea-ink)]/10 bg-[var(--bg-base)] p-5 sm:p-7">
      <SectionHeading
        icon={Globe2}
        title="Language preferences"
        description="Choose the language you want to learn and the language used in the app."
      />

      <SettingRow
        icon={Globe2}
        title="Learning language"
        description="Your current language course."
      >
        <SelectField
          label="Learning language"
          value={settings.learningLanguage}
          onChange={(value) => updateSetting("learningLanguage", value)}
          options={["Afaan Oromoo", "Amharic"]}
        />
      </SettingRow>

      <SettingRow
        icon={Globe2}
        title="Interface language"
        description="The language used for navigation and instructions."
      >
        <SelectField
          label="Interface language"
          value={settings.interfaceLanguage}
          onChange={(value) => updateSetting("interfaceLanguage", value)}
          options={["English", "Afaan Oromoo", "Amharic"]}
        />
      </SettingRow>
    </section>

    {/* Daily goal */}
    <section className="rounded-3xl border border-[var(--sea-ink)]/10 bg-[var(--bg-base)] p-5 sm:p-7">
      <SectionHeading
        icon={Target}
        title="Daily learning goal"
        description="Choose a realistic daily target. Consistency matters more than intensity."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { minutes: 5, label: "Casual", detail: "A little every day" },
          { minutes: 10, label: "Regular", detail: "A steady pace" },
          { minutes: 15, label: "Serious", detail: "Make real progress" },
          { minutes: 20, label: "Intense", detail: "Challenge yourself" },
        ].map((goal) => {
          const selected = settings.dailyGoal === goal.minutes;

          return (
            <button
              key={goal.minutes}
              type="button"
              onClick={() => updateSetting("dailyGoal", goal.minutes)}
              className={`relative rounded-2xl border p-4 text-left transition ${selected
                  ? "border-[var(--sea-ink)] bg-[var(--sand)]/60"
                  : "border-[var(--sea-ink)]/10 hover:border-[var(--sea-ink)]/30"
                }`}
            >
              {selected && (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-[var(--sea-ink)] text-white">
                  <Check size={12} />
                </span>
              )}
              <p className="text-2xl font-bold text-[var(--sea-ink)]">
                {goal.minutes}
                <span className="ml-1 text-xs font-medium">min</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--sea-ink)]">
                {goal.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--sea-ink)]/55">
                {goal.detail}
              </p>
            </button>
          );
        })}
      </div>
    </section>

    {/* Reminders and sound */}
    <section className="rounded-3xl border border-[var(--sea-ink)]/10 bg-[var(--bg-base)] p-5 sm:p-7">
      <SectionHeading
        icon={Bell}
        title="Reminders & sound"
        description="Build a routine that fits your day."
      />

      <SettingRow
        icon={Bell}
        title="Daily reminder"
        description="Enable a reminder to encourage you to practice."
      >
        <Toggle
          label="Daily reminder"
          checked={settings.remindersEnabled}
          onChange={(value) => updateSetting("remindersEnabled", value)}
        />
      </SettingRow>

      {settings.remindersEnabled && (
        <SettingRow
          icon={Bell}
          title="Reminder time"
          description="Choose your preferred reminder time."
        >
          <input
            type="time"
            aria-label="Reminder time"
            value={settings.reminderTime}
            onChange={(event) =>
              updateSetting("reminderTime", event.target.value)
            }
            className="rounded-xl border border-[var(--sea-ink)]/15 bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--sea-ink)]"
          />
        </SettingRow>
      )}

      <SettingRow
        icon={Volume2}
        title="Sound effects"
        description="Enable sounds during lessons when supported."
      >
        <Toggle
          label="Sound effects"
          checked={settings.soundEnabled}
          onChange={(value) => updateSetting("soundEnabled", value)}
        />
      </SettingRow>
    </section>

    {/* Appearance */}
    <section className="rounded-3xl border border-[var(--sea-ink)]/10 bg-[var(--bg-base)] p-5 sm:p-7">
      <SectionHeading
        icon={Sun}
        title="Appearance"
        description="Choose your preferred appearance for Fidel."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { value: "light", label: "Light", icon: Sun },
          { value: "dark", label: "Dark", icon: Moon },
          { value: "system", label: "System", icon: Laptop },
        ].map((option) => {
          const Icon = option.icon;
          const selected = settings.appearance === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateSetting("appearance", option.value)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-medium transition ${selected
                  ? "border-[var(--sea-ink)] bg-[var(--sand)]/60 text-[var(--sea-ink)]"
                  : "border-[var(--sea-ink)]/10 text-[var(--sea-ink)]/70 hover:border-[var(--sea-ink)]/30"
                }`}
            >
              <Icon size={18} />
              {option.label}
              {selected && <Check size={15} className="ml-auto" />}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[var(--sea-ink)]/50">
        These appearance options are demo preferences. Selecting one does not
        yet change the app theme.
      </p>
    </section>

    {/* Account */}
    <section className="rounded-3xl border border-[var(--sea-ink)]/10 bg-[var(--bg-base)] p-5 sm:p-7">
      <SectionHeading
        icon={LogOut}
        title="Account"
        description="Account actions will be connected to authentication later."
      />

      <div className="flex flex-col gap-3 border-t border-[var(--sea-ink)]/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--sea-ink)]">
            Sign out
          </p>
          <p className="mt-1 text-xs text-[var(--sea-ink)]/55">
            Demo only — no account session will be ended.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            console.log("Demo sign-out action; authentication is not connected.")
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-500/5"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </section>

    {/* Save settings */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-relaxed text-[var(--sea-ink)]/55">
        Demo preferences reset when the page reloads.
      </p>

      <button
        type="button"
        onClick={saveSettings}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--sea-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sea-ink)] focus-visible:ring-offset-2"
      >
        {saved ? <Check size={17} /> : <Save size={17} />}
        {saved ? "Demo settings saved" : "Save changes"}
      </button>
    </div>
  </div>

  );
}
