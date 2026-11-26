import { useRef, useState, type ComponentRef } from "react";
import { useUser } from "@clerk/expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Image, ScrollView, View } from "react-native";
import { getDashboard, getStudyActivity, type StudyActivity } from "@/lib/api/dashboard";
import { updatePreferences, type UserPreferences } from "@/lib/api/preferences";
import { deleteProfile, getProfile } from "@/lib/api/profile";
import { learningLanguageCodes, learningLanguages } from "@/lib/languages";
import { activityDateLabel, activityLevel, activityRangeStart, activityWeeks, type ActivityRange } from "@/lib/study-activity";
import type { ApiToken } from "./api";
import { Character } from "./Character";
import { WordGoal, type Course } from "./LearnerScreens";
import { Button, Card, Copy, grow, Heading, Icon, Label, Loading, PageHeading, Press, Problem, Progress, row, Teacher, usePalette, WordText } from "./ui";

const ranges = [
  ["7d", "7 days", "7d"], ["30d", "30 days", "30d"], ["3m", "3 months", "3mo"], ["6m", "6 months", "6mo"], ["1y", "1 year", "1yr"],
] as const;

function PracticePattern({ activity }: { activity: StudyActivity }) {
  const color = usePalette();
  const [range, setRange] = useState<ActivityRange>("30d");
  const [selectedDate, setSelectedDate] = useState<string>();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const start = activityRangeStart(activity.end_date, range, activity.start_date);
  const days = activity.days.filter((day) => day.date >= start && day.date <= activity.end_date);
  const weeks = activityWeeks(days);
  const chosen = days.find((day) => day.date === selectedDate);
  const total = days.reduce((sum, day) => sum + day.answers, 0);
  const active = days.filter((day) => day.answers > 0).length;
  const short = range === "7d" || range === "30d";
  const cell = (day: (typeof days)[number] | null, index: number) => {
    const layout = short ? { flex: 1, minHeight: 38 } : { width: 28, minHeight: 28 };
    if (!day) return <View key={index} style={layout} />;
    const selected = day.date === selectedDate;
    const level = activityLevel(day.answers);
    return <Press key={day.date} onPress={() => setSelectedDate(day.date)} selected={selected}
      label={`${activityDateLabel(day.date)}: ${day.answers} practice ${day.answers === 1 ? "answer" : "answers"}`}
      style={[layout, { alignItems: "center", justifyContent: "center" }]}>
      <View style={{ width: short ? 17 : 13, aspectRatio: 1, backgroundColor: color.activity[level],
        borderColor: selected || day.date === activity.end_date ? color.gold : color.line,
        borderWidth: selected ? 2 : 1, transform: [{ rotate: "45deg" }], borderRadius: 2 }} />
    </Press>;
  };
  return <Card>
    <Heading>Your practice pattern</Heading>
    <Label muted size={13}>Each mark represents a day. Tap one to see your practice answers.</Label>
    <Label strong>{active} active {active === 1 ? "day" : "days"} · {total.toLocaleString()} practice {total === 1 ? "answer" : "answers"}</Label>
    <View style={[row, { gap: 3, backgroundColor: color.tint, borderRadius: 8, padding: 3 }]}>
      {ranges.map(([value, label, shortLabel]) => <Press key={value} label={label} selected={range === value}
        onPress={() => { setRange(value); setSelectedDate(undefined); }}
        style={{ flex: 1, minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: 6, backgroundColor: range === value ? color.panel : "transparent" }}>
        <Label strong={range === value} size={13}>{shortLabel}</Label>
      </Press>)}
    </View>
    {short ? <View style={{ gap: 3 }}>
      <View style={{ flexDirection: "row" }}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name) =>
        <Label key={name} style={{ flex: 1, textAlign: "center" }} size={11} muted>{name}</Label>)}</View>
      {weeks.map((week, index) => <View key={index} style={{ flexDirection: "row" }}>{week.days.map(cell)}</View>)}
    </View> : <ScrollView key={range} ref={scroll} horizontal onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
      contentContainerStyle={{ paddingBottom: 8 }}>
      {weeks.map((week, index) => <View key={index} style={{ width: 28, alignItems: "center" }}>
        <View style={{ minHeight: 18 }}><Label size={10} muted>{week.month}</Label></View>{week.days.map(cell)}
      </View>)}
    </ScrollView>}
    <View style={{ borderTopWidth: 1, borderColor: color.line, paddingTop: 10, gap: 4 }}>
      <Label size={12} muted>{activityDateLabel(start)} – {activityDateLabel(activity.end_date)}</Label>
      {chosen && <View accessibilityLiveRegion="polite"><Label strong size={13}>{activityDateLabel(chosen.date)} · {chosen.answers} {chosen.answers === 1 ? "answer" : "answers"}</Label></View>}
    </View>
  </Card>;
}

export function Profile({ token, language, openSettings, goLearn }: Course & { openSettings: () => void; goLearn: () => void }) {
  const color = usePalette();
  const { user } = useUser();
  const dashboard = useQuery({ queryKey: ["dashboard", language], queryFn: ({ signal }) => getDashboard(token, language, signal) });
  const activity = useQuery({ queryKey: ["activity", language], queryFn: ({ signal }) => getStudyActivity(token, language, signal) });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getProfile(token) });
  const name = user?.fullName || profile.data?.display_name || user?.username || "Fidel learner";
  const username = user?.username || profile.data?.username;
  const email = user?.primaryEmailAddress?.emailAddress || profile.data?.email;
  const joined = profile.data?.created_at ? new Date(profile.data.created_at) : null;
  const joinedLabel = joined && !Number.isNaN(joined.getTime())
    ? `Joined ${new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(joined)}`
    : "Fidel learner";
  const data = dashboard.data;
  const [imageFailed, setImageFailed] = useState(false);
  return <>
    <PageHeading title="Your profile" detail="Look how far your words have taken you." />
    <Card>
      <View style={row}>
        {user?.hasImage && !imageFailed ? <Image source={{ uri: user.imageUrl }} onError={() => setImageFailed(true)} style={{ width: 58, height: 58, borderRadius: 29 }} /> :
          <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: color.tint, alignItems: "center", justifyContent: "center" }}>
            <Label size={21} strong>{name.trim().slice(0, 1).toUpperCase()}</Label>
          </View>}
        <View style={grow}><Heading>{name}</Heading>{username && <Label muted size={12}>@{username}</Label>}
          {email && <Label muted size={12}>{email}</Label>}<Label muted size={12}>{joinedLabel}</Label></View>
      </View>
      <View style={[row, { borderTopWidth: 1, borderColor: color.line, paddingTop: 10 }]}>
        <Label muted size={12}>Learning</Label><Label strong size={13}>{learningLanguages[language].name}</Label>
      </View>
      <Button title="Your settings" icon="settings" onPress={openSettings} />
    </Card>
    {dashboard.isPending ? <Loading label="Loading your progress" /> : dashboard.error || !data ?
      <Problem error={dashboard.error} retry={() => void dashboard.refetch()} /> : <>
        <Card><Heading>Your progress</Heading>
          {([["Words learned", data.learned_words], ["Lessons completed", data.lessons_completed], ["Current streak", `${data.streak_days} ${data.streak_days === 1 ? "day" : "days"}`], ["Reviews completed", data.reviews_completed], ["Correct answers", data.correct_answers], ["Words to review", data.needs_review_words]] as const).map(([label, value]) =>
            <View key={label} style={[row, { borderTopWidth: 1, borderColor: color.line, paddingTop: 10 }]}>
              <Label style={grow} muted>{label}</Label><Label strong style={{ fontVariant: ["tabular-nums"] }}>{value}</Label>
            </View>)}
        </Card>
        <Card><WordGoal data={data} /><Button title="Keep learning" icon="arrow" onPress={goLearn} /></Card>
      </>}
    {activity.isPending ? <Loading label="Loading study activity" /> : activity.error || !activity.data ?
      <Problem error={activity.error} retry={() => void activity.refetch()} /> : <PracticePattern activity={activity.data} />}
  </>;
}

function Options<T extends string | number>({ items, value, onChoose, inline }: {
  items: readonly { value: T; label: string; detail?: string }[]; value: T; onChoose: (value: T) => void; inline?: boolean;
}) {
  const color = usePalette();
  return <View style={{ flexDirection: inline ? "row" : "column", flexWrap: inline ? "wrap" : "nowrap", gap: 6 }}>
    {items.map((item) => {
      const chosen = value === item.value;
      return <Press key={item.value} label={item.detail ? `${item.label}, ${item.detail}` : item.label} selected={chosen} onPress={() => onChoose(item.value)}
        style={[row, { flex: inline ? 1 : undefined, minWidth: inline ? 60 : undefined, minHeight: 47, paddingHorizontal: 10, paddingVertical: 8,
          justifyContent: inline ? "center" : "space-between", borderRadius: 7, borderWidth: 1, borderColor: chosen ? color.gold : color.line,
          backgroundColor: chosen ? color.tint : color.panel }]}>
        <View style={inline ? undefined : grow}><Label strong={chosen} size={14} style={inline ? { textAlign: "center" } : undefined}>{item.label}</Label>{item.detail && <WordText size={14}>{item.detail}</WordText>}</View>
        {chosen && !inline && <Icon name="check" size={17} tint={color.success} />}
      </Press>;
    })}
  </View>;
}

function ToggleRow({ title, detail, enabled, onChange }: { title: string; detail: string; enabled: boolean; onChange: (value: boolean) => void }) {
  const color = usePalette();
  return <Press label={`${title}, ${enabled ? "on" : "off"}`} selected={enabled} onPress={() => onChange(!enabled)}
    style={[row, { minHeight: 54, borderTopWidth: 1, borderColor: color.line, paddingVertical: 10 }]}>
    <View style={grow}><Label strong size={14}>{title}</Label><Label muted size={12}>{detail}</Label></View>
    <View style={{ width: 42, height: 24, borderRadius: 12, backgroundColor: enabled ? color.action : color.line,
      padding: 3, justifyContent: "center", alignItems: enabled ? "flex-end" : "flex-start" }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color.panel }} />
    </View>
  </Press>;
}

const levels = [
  { value: "beginner", label: "Just starting" },
  { value: "some", label: "I know a little" },
  { value: "conversational", label: "I can have a conversation" },
  { value: "improving", label: "I’m polishing my skills" },
] as const;
const themes = [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "Device" }] as const;
const motivations = [
  { value: "family", label: "Family & friends", detail: "Connect with the people I care about." },
  { value: "conversation", label: "Everyday conversations", detail: "Speak more naturally in daily life." },
  { value: "culture", label: "Culture & heritage", detail: "Connect with my roots and culture." },
  { value: "work", label: "Work & education", detail: "Use the language at work or school." },
  { value: "travel", label: "Travel", detail: "Feel confident visiting new places." },
  { value: "literacy", label: "Reading & writing", detail: "Build my reading and writing skills." },
  { value: "personal", label: "Personal growth", detail: "Learn something new for myself." },
] as const;

export function SignOut({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const signOut = useMutation({ mutationFn: onSignOut });
  return <>
    <Button title="Sign out" busy={signOut.isPending} onPress={() => signOut.mutate()} />
    {signOut.error && <Problem error={signOut.error} />}
  </>;
}

export function Settings({ token, prefs, onboarding = false, onSignOut, onStepChange, onAppearancePreview }: {
  token: ApiToken; prefs: UserPreferences; onboarding?: boolean; onSignOut: () => Promise<void>; onStepChange: () => void;
  onAppearancePreview: (value: UserPreferences["appearance"]) => void;
}) {
  const color = usePalette();
  const client = useQueryClient();
  const { user } = useUser();
  const [language, setLanguage] = useState(prefs.learning_language);
  const [goal, setGoal] = useState(prefs.daily_goal_words);
  const [appearance, setAppearance] = useState(prefs.appearance);
  const [level, setLevel] = useState(prefs.proficiency_level ?? "beginner");
  const [selectedMotivations, setSelectedMotivations] = useState<UserPreferences["motivations"]>(prefs.motivations);
  const [interfaceLanguage, setInterfaceLanguage] = useState(prefs.interface_language);
  const [soundEnabled, setSoundEnabled] = useState(prefs.sound_enabled);
  const [soundVolume, setSoundVolume] = useState(prefs.sound_volume);
  const [hapticsEnabled, setHapticsEnabled] = useState(prefs.haptics_enabled);
  const [step, setStep] = useState(0);
  const save = useMutation({
    mutationFn: () => updatePreferences(token, {
      learning_language: language, daily_goal_words: goal, appearance, proficiency_level: level,
      motivations: selectedMotivations, interface_language: interfaceLanguage,
      sound_enabled: soundEnabled, sound_volume: soundVolume, haptics_enabled: hapticsEnabled,
      ...(onboarding ? { onboarding_completed: true } : {}),
    }),
    onSuccess: (result) => {
      client.setQueryData(["preferences"], result);
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  const remove = useMutation({ mutationFn: async () => {
    if (!user) throw new Error("Your account could not be loaded.");
    await deleteProfile(token);
    await user.delete();
    await onSignOut();
  } });
  const hasChanges = language !== prefs.learning_language || goal !== prefs.daily_goal_words ||
    appearance !== prefs.appearance || level !== (prefs.proficiency_level ?? "beginner") ||
    interfaceLanguage !== prefs.interface_language || selectedMotivations.join("|") !== prefs.motivations.join("|") ||
    soundEnabled !== prefs.sound_enabled || soundVolume !== prefs.sound_volume || hapticsEnabled !== prefs.haptics_enabled;
  const languagePicker = <Card><Heading>Learning language</Heading>
    {onboarding ? learningLanguageCodes.map((code) => <Press key={code} selected={language === code} onPress={() => setLanguage(code)}
      style={[row, { minHeight: 82, padding: 10, borderWidth: 1, borderColor: language === code ? color.gold : color.line, borderRadius: 8 }]}>
      <Character language={code} width={46} />
      <View style={grow}><Label strong>{learningLanguages[code].name}</Label><WordText size={14}>{learningLanguages[code].nativeName}</WordText></View>
      {language === code && <Icon name="check" size={18} tint={color.success} />}
    </Press>) : <Options items={learningLanguageCodes.map((code) => ({ value: code, label: learningLanguages[code].name,
      detail: code === "om" ? undefined : learningLanguages[code].nativeName }))} value={language} onChoose={setLanguage} />}
  </Card>;
  const levelPicker = <Card><Heading>Your level</Heading><Options items={levels} value={level} onChoose={setLevel} /></Card>;
  const goalPicker = <Card><Heading>Daily word goal</Heading><Copy>How many words do you want to learn each day?</Copy>
    <Options inline items={([5, 10, 15, 20] as const).map((value) => ({ value, label: String(value) }))} value={goal} onChoose={setGoal} />
  </Card>;
  const appearancePicker = <Card><Heading>Appearance</Heading>
    <Options inline items={themes} value={appearance} onChoose={(value) => { setAppearance(value); onAppearancePreview(value); }} />
    <Label muted size={12}>Preview now. Save changes to remember it.</Label></Card>;
  const motivationPicker = <Card><Heading>What brings you here?</Heading><Copy>Choose all that feel right.</Copy>
    {motivations.map((item) => {
      const chosen = selectedMotivations.includes(item.value);
      return <Press key={item.value} selected={chosen} onPress={() => setSelectedMotivations(chosen
        ? selectedMotivations.filter((value) => value !== item.value) : [...selectedMotivations, item.value])}
        style={[row, { minHeight: 52, padding: 9, borderWidth: 1, borderColor: chosen ? "#e9a033" : "transparent", borderRadius: 7 }]}>
        <View style={grow}><Label strong>{item.label}</Label><Label muted size={12}>{item.detail}</Label></View>
        {chosen && <Icon name="check" size={17} />}
      </Press>;
    })}
  </Card>;
  const interfacePicker = <Card><Heading>Interface preference</Heading><Copy>Your saved language preference.</Copy>
    <Options items={[{ value: "en" as const, label: "English" }, ...learningLanguageCodes.map((code) => ({ value: code, label: learningLanguages[code].name }))]}
      value={interfaceLanguage} onChoose={setInterfaceLanguage} />
  </Card>;
  const feedbackPicker = <Card><Heading>Practice feedback</Heading>
    <ToggleRow title="Practice sounds" detail="Answer and completion cues. Word audio plays separately." enabled={soundEnabled} onChange={setSoundEnabled} />
    {soundEnabled && <View style={{ gap: 7 }}><View style={row}><Label style={grow}>Feedback volume</Label><Label strong>{soundVolume}%</Label></View>
      <View style={[row, { gap: 4 }]}>{[0, 25, 50, 75, 100].map((value) =>
        <Press key={value} label={`Feedback volume ${value} percent`} selected={soundVolume === value} onPress={() => setSoundVolume(value)}
          style={{ flex: 1, minHeight: 44, borderWidth: 1, borderColor: soundVolume === value ? color.gold : color.line,
            borderRadius: 6, alignItems: "center", justifyContent: "center" }}><Label size={12} strong={soundVolume === value}>{value}</Label></Press>)}</View>
    </View>}
    <ToggleRow title="Touch feedback" detail="Gentle vibration after saved answers." enabled={hapticsEnabled} onChange={setHapticsEnabled} />
  </Card>;
  const move = (next: number) => { setStep(next); onStepChange(); };
  return <>
    {onboarding && <><View style={row}><Teacher size={56} /><View style={grow}><Label muted size={13}>Step {step + 1} of 5</Label>
      <PageHeading title={["Choose your language", "Find your starting point", "What brings you here?", "Set a daily goal", "Make it yours"][step]} /></View></View>
      <Progress value={step + 1} total={5} label="Onboarding progress" /></>}
    {!onboarding && <PageHeading title="Settings" detail="Make Fidel work the way you like to learn." />}
    {(!onboarding || step === 0) && languagePicker}
    {(!onboarding || step === 1) && levelPicker}
    {onboarding && step === 2 && motivationPicker}
    {(!onboarding || step === 3) && goalPicker}
    {(!onboarding || step === 4) && appearancePicker}
    {!onboarding && interfacePicker}
    {!onboarding && feedbackPicker}
    {save.error && <Problem error={save.error} />}
    {save.isSuccess && !hasChanges && <View accessibilityLiveRegion="polite"><Copy>Preferences saved.</Copy></View>}
    {onboarding && step < 4 ? <Button kind="gold" title="Continue" icon="arrow" disabled={step === 2 && selectedMotivations.length === 0} onPress={() => move(step + 1)} /> :
      <Button primary={!onboarding} kind={onboarding ? "gold" : undefined} title={onboarding ? "Start learning" : "Save settings"}
        disabled={!onboarding && !hasChanges} busy={save.isPending} onPress={() => save.mutate()} />}
    {onboarding && step > 0 && <Button kind="quiet" title="Back" icon="back" onPress={() => move(step - 1)} />}
    {(!onboarding || step === 0) && <SignOut onSignOut={onSignOut} />}
    {!onboarding && <Card><Heading>Account</Heading><Copy>Permanently delete your Fidel profile and Clerk account.</Copy>
      <Button title="Delete account" busy={remove.isPending} onPress={() => Alert.alert("Delete your account?",
        "This permanently removes your Fidel account and learning data. This cannot be undone.", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete account", style: "destructive", onPress: () => remove.mutate() },
        ])} />
      {remove.error && <Problem error={remove.error} />}
    </Card>}
  </>;
}
