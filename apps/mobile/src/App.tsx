import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { makeRedirectUri } from "expo-auth-session";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect, useState } from "react";
import { BackHandler, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { getDashboard } from "@/lib/api/dashboard";
import { getLearningPath, getProgress } from "@/lib/api/learning";
import { getPreferences, updatePreferences, type UserPreferences } from "@/lib/api/preferences";
import { learningLanguageCodes, learningLanguages, type LearningLanguage } from "@/lib/languages";
import type { ApiToken } from "./api";
import { Dictionary } from "./Dictionary";
import { Lesson, Review } from "./Study";
import { Button, Card, Copy, Loading, palettes, Problem, Theme, Title, usePalette } from "./ui";

const tabs = ["Home", "Learn", "Review", "Dictionary", "Profile"] as const;
type Tab = typeof tabs[number];
type Course = { token: ApiToken; language: LearningLanguage };
const logo = require("../assets/fidel.png");
const publicKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
const expoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient || !!Constants.expoGoConfig;

export default function App() {
  const systemDark = useColorScheme() === "dark";
  return <SafeAreaProvider>
    <Theme.Provider value={systemDark ? palettes.dark : palettes.light}>
      {publicKey ? <ClerkProvider publishableKey={publicKey} tokenCache={tokenCache}>
        <Session />
      </ClerkProvider> : <Frame dark={systemDark}><ScrollView contentContainerStyle={styles.body}>
        <Image source={logo} style={styles.mark} />
        <Title>Fidel</Title>
        <Problem error={new Error("Set up the mobile Clerk publishable key to sign in.")} />
      </ScrollView></Frame>}
    </Theme.Provider>
  </SafeAreaProvider>;
}

function Frame({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  const palette = usePalette();
  return <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }}>
    <StatusBar barStyle={dark ? "light-content" : "dark-content"} />
    {children}
  </SafeAreaView>;
}

function Session() {
  const auth = useAuth();
  const dark = useColorScheme() === "dark";
  if (!auth.isLoaded) return <Frame dark={dark}><Loading /></Frame>;
  if (!auth.isSignedIn) return <Frame dark={dark}><SignIn /></Frame>;
  return <Account key={auth.userId} token={auth.getToken} onSignOut={() => auth.signOut()} />;
}

function SignIn() {
  const { startHostedAuth } = useHostedAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  async function open(mode: "sign-in" | "sign-up") {
    setPending(true);
    setError(undefined);
    try {
      await startHostedAuth(expoGo ? {
        mode,
        redirectUrl: makeRedirectUri({ path: "hosted-auth-callback", isTripleSlashed: true }),
      } : { mode });
    } catch (cause) {
      const errors = cause && typeof cause === "object" && "errors" in cause ? cause.errors : null;
      const codes = Array.isArray(errors) ? errors.map((entry) => entry?.code) : [];
      const redirectRejected = codes.some((code) => typeof code === "string" && /redirect|callback/.test(code)) ||
        (codes.includes("resource_missmatch") && cause instanceof Error && /redirect|callback/i.test(cause.message));
      if (codes.includes("native_api_disabled")) {
        setError(new Error("Mobile sign-in hasn’t been enabled for Fidel in Clerk yet."));
      } else if (redirectRejected) {
        setError(new Error(expoGo
          ? "Fidel’s production sign-in requires an Android build registered with Clerk."
          : "This Android build’s sign-in callback hasn’t been registered with Clerk."));
      } else {
        setError(new Error("Sign-in couldn’t open. Please try again."));
      }
    } finally {
      setPending(false);
    }
  }
  return <ScrollView contentContainerStyle={[styles.body, styles.welcome]}>
    <Image source={logo} style={styles.heroMark} />
    <Title>Welcome to Fidel.</Title>
    <Copy>Get closer to your roots, one word at a time.</Copy>
    <Button primary title="Sign in" disabled={pending} onPress={() => void open("sign-in")} />
    <Button title="Create an account" disabled={pending} onPress={() => void open("sign-up")} />
    {pending && <Loading />}
    {!!error && <Problem error={error} />}
  </ScrollView>;
}

function Account({ token, onSignOut }: { token: ApiToken; onSignOut: () => Promise<void> }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 15_000 } } }));
  return <QueryClientProvider client={client}><Learner token={token} onSignOut={onSignOut} /></QueryClientProvider>;
}

function Learner({ token, onSignOut }: { token: ApiToken; onSignOut: () => Promise<void> }) {
  const system = useColorScheme();
  const prefs = useQuery({ queryKey: ["preferences"], queryFn: ({ signal }) => getPreferences(token, signal) });
  const [tab, setTab] = useState<Tab>("Home");
  const [lesson, setLesson] = useState<string>();
  const [settings, setSettings] = useState(false);
  const appearance = prefs.data?.appearance;
  const dark = appearance === "dark" || ((appearance === "system" || !appearance) && system === "dark");
  const color = dark ? palettes.dark : palettes.light;
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (lesson) { setLesson(undefined); return true; }
      if (settings) { setSettings(false); return true; }
      if (tab !== "Home") { setTab("Home"); return true; }
      return false;
    });
    return () => sub.remove();
  }, [lesson, settings, tab]);
  const language = prefs.data?.learning_language;
  const openLesson = (id: string) => { setLesson(id); setTab("Learn"); };
  return <Theme.Provider value={color}><Frame dark={dark}>
    <View style={[styles.header, { borderColor: color.line }]}>
      <Image source={logo} style={styles.mark} />
      <Text accessibilityRole="header" style={{ color: color.ink, fontSize: 22, fontWeight: "800" }}>Fidel</Text>
      {!!lesson && <Pressable accessibilityRole="button" onPress={() => setLesson(undefined)} style={{ marginLeft: "auto", padding: 12 }}>
        <Text style={{ color: color.ink, fontWeight: "700" }}>Back to Learn</Text>
      </Pressable>}
      {settings && <Pressable accessibilityRole="button" onPress={() => setSettings(false)} style={{ marginLeft: "auto", padding: 12 }}>
        <Text style={{ color: color.ink, fontWeight: "700" }}>Back to Profile</Text>
      </Pressable>}
    </View>
    <ScrollView key={lesson ?? (settings ? "Settings" : tab)} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      {prefs.isPending ? <Loading /> : prefs.error || !prefs.data || !language ?
        <>
          <Title>We couldn’t load your setup</Title>
          <Problem error={prefs.error} retry={() => void prefs.refetch()} />
          <SignOut onSignOut={onSignOut} />
        </> : !prefs.data.onboarding_completed ?
          <Settings token={token} prefs={prefs.data} onboarding onSignOut={onSignOut} /> :
          lesson ? <Lesson key={lesson} token={token} language={language} lessonId={lesson} back={() => setLesson(undefined)} /> :
          settings ? <Settings key={language} token={token} prefs={prefs.data} onSignOut={onSignOut} /> :
          tab === "Home" ? <Home token={token} language={language} openLesson={openLesson} goLearn={() => setTab("Learn")} /> :
          tab === "Learn" ? <Learn token={token} language={language} openLesson={openLesson} /> :
          tab === "Review" ? <Review key={language} token={token} language={language} /> :
          tab === "Dictionary" ? <Dictionary key={language} token={token} language={language} /> :
          <Profile token={token} language={language} openSettings={() => setSettings(true)} />}
    </ScrollView>
    {!!prefs.data?.onboarding_completed && !lesson && !settings && <View style={[styles.tabs, { backgroundColor: color.panel, borderColor: color.line }]}>
      {tabs.map((name) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: name === tab }}
        key={name} style={styles.tab} onPress={() => setTab(name)}>
        <View style={[styles.tabMarker, { backgroundColor: name === tab ? color.gold : "transparent" }]} />
        <Text numberOfLines={1} style={{ color: name === tab ? color.ink : color.muted, fontSize: 12, fontWeight: "700" }}>{name}</Text>
      </Pressable>)}
    </View>}
  </Frame></Theme.Provider>;
}

function Home({ token, language, openLesson, goLearn }: Course & { openLesson: (id: string) => void; goLearn: () => void }) {
  const dashboard = useQuery({ queryKey: ["dashboard", language], queryFn: ({ signal }) => getDashboard(token, language, signal) });
  const data = dashboard.data;
  const color = usePalette();
  return <>
    <Copy>{learningLanguages[language].nativeName}</Copy>
    <Title>Make today a study day.</Title>
    {dashboard.isPending ? <Loading /> : dashboard.error ? <Problem error={dashboard.error} retry={() => void dashboard.refetch()} /> : data && <>
      <Card>
        <Copy>Daily word goal</Copy>
        <Text style={{ color: color.ink, fontSize: 30, fontWeight: "800" }}>{data.words_learned_today} / {data.daily_word_goal} words</Text>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: data.daily_word_goal, now: Math.min(data.words_learned_today, data.daily_word_goal) }}
          style={{ height: 7, borderRadius: 8, backgroundColor: color.line }}>
          <View style={{ backgroundColor: color.gold, height: 7, borderRadius: 8, width: `${Math.min(100, data.words_learned_today / data.daily_word_goal * 100)}%` }} />
        </View>
        <Copy>{data.streak_days} day streak · {data.learned_words} words learned</Copy>
      </Card>
      <Card>
        <Title>{data.current_lesson?.title ?? "Your learning path"}</Title>
        <Button primary title={data.current_lesson ? "Resume lesson" : "Find a lesson"}
          onPress={() => data.current_lesson ? openLesson(data.current_lesson.lesson_key) : goLearn()} />
      </Card>
    </>}
  </>;
}

function Learn({ token, language, openLesson }: Course & { openLesson: (id: string) => void }) {
  const path = useQuery({ queryKey: ["path", language], queryFn: ({ signal }) => getLearningPath(language, signal) });
  const progress = useQuery({ queryKey: ["progress", language], queryFn: ({ signal }) => getProgress(token, language, signal) });
  return <>
    <Copy>{learningLanguages[language].nativeName}</Copy>
    <Title>Learning path</Title>
    {path.isPending || progress.isPending ? <Loading /> : path.error || progress.error ?
      <Problem error={path.error ?? progress.error} retry={() => { void path.refetch(); void progress.refetch(); }} /> :
      path.data?.levels.length ? path.data.levels.map((level) => <Card key={level.id}>
        <Title>{level.title}</Title>
        {level.lessons.map((item) => {
          const label = progress.data?.completed_lesson_keys.includes(item.id) ? "Completed" :
            progress.data?.in_progress.some((attempt) => attempt.lesson_key === item.id) ? "Resume" : `${item.word_count} words`;
          return <Button key={item.id} title={`${item.title} · ${label}`} onPress={() => openLesson(item.id)} />;
        })}
      </Card>) : <Card><Copy>This course has no lessons ready yet.</Copy></Card>}
  </>;
}

function SignOut({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const signOut = useMutation({ mutationFn: onSignOut });
  return <>
    <Button title="Sign out" disabled={signOut.isPending} onPress={() => signOut.mutate()} />
    {signOut.error && <Problem error={signOut.error} />}
  </>;
}

function Profile({ token, language, openSettings }: Course & { openSettings: () => void }) {
  const { user } = useUser();
  const dashboard = useQuery({ queryKey: ["dashboard", language], queryFn: ({ signal }) => getDashboard(token, language, signal) });
  const data = dashboard.data;
  return <>
    <Title>{user?.fullName || "Your profile"}</Title>
    <Copy>{learningLanguages[language].name}</Copy>
    <Button title="Settings" onPress={openSettings} />
    {dashboard.isPending ? <Loading /> : dashboard.error ?
      <Problem error={dashboard.error} retry={() => void dashboard.refetch()} /> : data && <Card>
        <Copy>{data.streak_days} day streak</Copy>
        <Copy>{data.learned_words} words learned</Copy>
        <Copy>{data.lessons_completed} lessons completed</Copy>
        <Copy>{data.reviews_completed} reviews completed</Copy>
      </Card>}
  </>;
}

function Settings({ token, prefs, onboarding = false, onSignOut }: {
  token: ApiToken; prefs: UserPreferences; onboarding?: boolean; onSignOut: () => Promise<void>;
}) {
  const client = useQueryClient();
  const [language, setLanguage] = useState(prefs.learning_language);
  const [goal, setGoal] = useState(prefs.daily_goal_words);
  const [appearance, setAppearance] = useState(prefs.appearance);
  const [level, setLevel] = useState(prefs.proficiency_level ?? "beginner");
  const save = useMutation({
    mutationFn: () => updatePreferences(token, {
      learning_language: language, daily_goal_words: goal, appearance, proficiency_level: level,
      ...(onboarding ? { onboarding_completed: true } : {}),
    }),
    onSuccess: (result) => {
      client.setQueryData(["preferences"], result);
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  return <>
    <Title>{onboarding ? "Make Fidel yours" : "Settings"}</Title>
    <Card><Copy>Learning language</Copy>{learningLanguageCodes.map((code) =>
      <Button key={code} title={learningLanguages[code].name} primary={language === code} onPress={() => setLanguage(code)} />)}</Card>
    <Card><Copy>Your level</Copy>{(["beginner", "some", "conversational", "improving"] as const).map((value) =>
      <Button key={value} title={{ beginner: "Just starting", some: "I know a little", conversational: "I can have a conversation", improving: "I’m polishing my skills" }[value]}
        primary={level === value} onPress={() => setLevel(value)} />)}</Card>
    <Card><Copy>Daily goal</Copy>{([5, 10, 15, 20] as const).map((value) =>
      <Button key={value} title={`${value} words per day`} primary={goal === value} onPress={() => setGoal(value)} />)}</Card>
    <Card><Copy>Appearance</Copy>{(["light", "dark", "system"] as const).map((value) =>
      <Button key={value} title={{ light: "Light", dark: "Dark", system: "Match device" }[value]} primary={appearance === value} onPress={() => setAppearance(value)} />)}</Card>
    {save.error && <Problem error={save.error} />}
    {save.isSuccess && <Copy>Preferences saved.</Copy>}
    <Button primary title={onboarding ? "Start learning" : "Save settings"} disabled={save.isPending} onPress={() => save.mutate()} />
    <SignOut onSignOut={onSignOut} />
  </>;
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingBottom: 28, gap: 14 },
  welcome: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28 },
  mark: { width: 34, height: 34, borderRadius: 8 },
  heroMark: { width: 94, height: 94, borderRadius: 22, marginBottom: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, minHeight: 56, borderBottomWidth: StyleSheet.hairlineWidth },
  tabs: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, minHeight: 58, justifyContent: "center", alignItems: "center", gap: 5 },
  tabMarker: { height: 3, width: 19, borderRadius: 2 },
});
