import { ClerkProvider, useAuth } from "@clerk/expo";
import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import * as Application from "expo-application";
import { makeRedirectUri } from "expo-auth-session";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useFonts } from "expo-font";
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { BackHandler, Image, Linking, Platform, ScrollView, StatusBar, StyleSheet, useColorScheme, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { getPreferences } from "@/lib/api/preferences";
import { learningLanguages } from "@/lib/languages";
import type { ApiToken } from "./api";
import { Dictionary } from "./Dictionary";
import { Home, Learn } from "./LearnerScreens";
import { Profile, Settings, SignOut } from "./AccountScreens";
import { Lesson, Review } from "./Study";
import { Quest } from "./Quest";
import { HomePreview } from "./HomePreview";
import { FeedbackContext } from "./feedback";
import { Button, Copy, grow, Icon, IconButton, type IconName, Label, Loading, palettes, Press, Problem, row, Teacher, Theme, Title, usePalette, WordText } from "./ui";

const tabs = [
  ["Home", "home"], ["Learn", "learn"], ["Review", "review"], ["Dictionary", "search"], ["Profile", "profile"],
] as const satisfies ReadonlyArray<readonly [string, IconName]>;
type Tab = typeof tabs[number][0];

const publicKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
const applicationId = Application.applicationId;
const expoGo = applicationId
  ? applicationId.toLowerCase() === "host.exp.exponent"
  : Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function signInCallback() {
  if (expoGo) return makeRedirectUri({ path: "hosted-auth-callback", isTripleSlashed: true });
  if (!applicationId) throw new Error("Fidel could not read the installed application ID.");
  return Platform.OS === "android"
    ? `clerk://${applicationId}.hosted-callback`
    : `${applicationId}://callback`;
}

const fonts = {
  Manrope: require("../assets/fonts/Manrope-Regular.ttf"),
  ManropeBold: require("../assets/fonts/Manrope-Bold.ttf"),
  Ethiopic: require("../assets/fonts/noto-serif-ethiopic.ttf"),
};

export default function App() {
  const systemDark = useColorScheme() === "dark";
  const [ready, fontError] = useFonts(fonts);
  return <SafeAreaProvider>
    <Theme.Provider value={systemDark ? palettes.dark : palettes.light}>
      {!ready && !fontError ? <Frame><Loading /></Frame> :
        __DEV__ && expoGo ? <HomePreview /> :
        publicKey ? <ClerkProvider publishableKey={publicKey} tokenCache={tokenCache}><Session /></ClerkProvider> :
          <Frame><ScrollView contentContainerStyle={styles.body}>
            <Teacher /><Title>Fidel</Title><Problem error={new Error("Set up the mobile Clerk publishable key to sign in.")} />
          </ScrollView></Frame>}
    </Theme.Provider>
  </SafeAreaProvider>;
}

function Frame({ children }: { children: ReactNode }) {
  const color = usePalette();
  return <SafeAreaView style={{ flex: 1, backgroundColor: color.frame }}>
    <StatusBar barStyle={color.dark ? "light-content" : "dark-content"} />
    {children}
  </SafeAreaView>;
}

function Session() {
  const auth = useAuth();
  if (!auth.isLoaded) return <Frame><Loading /></Frame>;
  if (!auth.isSignedIn) return <Frame><SignIn /></Frame>;
  return <Account key={auth.userId} token={auth.getToken} onSignOut={() => auth.signOut()} />;
}

function SignIn() {
  const { startHostedAuth } = useHostedAuth();
  const color = usePalette();
  const [pending, setPending] = useState<"sign-in" | "sign-up">();
  const [error, setError] = useState<unknown>();
  async function open(mode: "sign-in" | "sign-up") {
    setPending(mode);
    setError(undefined);
    try {
      await startHostedAuth({ mode, redirectUrl: signInCallback() });
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
      setPending(undefined);
    }
  }
  return <ScrollView contentContainerStyle={[styles.body, { gap: 22 }]} style={{ backgroundColor: color.paper }}>
    <View style={row}><Teacher size={36} /><Title>Fidel</Title></View>
    <View style={{ borderWidth: 1, borderColor: color.line, backgroundColor: color.tint, borderRadius: 12, overflow: "hidden" }}>
      <View style={{ height: 218, flexDirection: "row" }}>
        <View style={[grow, { justifyContent: "space-between", padding: 13 }]}>
          <Title>Some words feel like home.</Title>
          <View>
            <WordText size={24}>ሰላም</WordText>
            <Label muted size={12}>Selam · Hello · Amharic</Label>
          </View>
        </View>
        <Image accessible accessibilityLabel="A woman wearing a white netela with woven borders" source={require("../assets/ui/auth-portrait.jpg")}
          resizeMode="cover" style={{ width: "47%", height: "100%" }} />
      </View>
      <Press label="Photo by HagosBeyene · CC BY-SA 4.0 (adapted)" onPress={() => { void Linking.openURL("https://commons.wikimedia.org/wiki/File:Traditional_Habesha_clothes.jpg").catch(() => undefined); }}
        style={{ minHeight: 44, justifyContent: "center", padding: 8 }}>
        <Label muted size={12} style={{ textAlign: "center" }}>Photo by HagosBeyene · CC BY-SA 4.0 (adapted)</Label>
      </Press>
    </View>
    <View style={{ gap: 5 }}><Title>Welcome to Fidel</Title><Copy>Learn Amharic, Afaan Oromoo, and Tigrinya one word at a time.</Copy></View>
    <View style={{ gap: 8 }}>
      <Button primary title="Sign in" icon="arrow" disabled={!!pending} busy={pending === "sign-in"} onPress={() => void open("sign-in")} />
      <Button title="Create an account" disabled={!!pending} busy={pending === "sign-up"} onPress={() => void open("sign-up")} />
    </View>
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
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [tab, setTab] = useState<Tab>("Home");
  const [lesson, setLesson] = useState<string>();
  const [quest, setQuest] = useState(false);
  const [settings, setSettings] = useState(false);
  const [appearanceDraft, setAppearanceDraft] = useState<"light" | "dark" | "system">();
  const [topic, setTopic] = useState<string>();
  const [startReviewFromDictionary, setStartReviewFromDictionary] = useState(false);
  const appearance = appearanceDraft ?? prefs.data?.appearance;
  const dark = appearance === "dark" || ((appearance === "system" || !appearance) && system === "dark");
  const color = dark ? palettes.dark : palettes.light;
  const language = prefs.data?.learning_language;
  const ready = prefs.data?.onboarding_completed;
  const openLesson = (id: string) => { setLesson(id); setTab("Learn"); };
  const openDictionary = (category?: string) => { setTopic(category); setTab("Dictionary"); };
  const back = () => { if (lesson) setLesson(undefined); else if (quest) setQuest(false); else { setSettings(false); setAppearanceDraft(undefined); } };
  const scrollTop = () => scroll.current?.scrollTo({ y: 0, animated: false });
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (lesson) { setLesson(undefined); return true; }
      if (quest) { setQuest(false); return true; }
      if (settings) { setSettings(false); setAppearanceDraft(undefined); return true; }
      if (tab !== "Home") { setTab("Home"); return true; }
      return false;
    });
    return () => sub.remove();
  }, [lesson, quest, settings, tab]);
  return <Theme.Provider value={color}><FeedbackContext.Provider value={prefs.data ?? { sound_enabled: false, sound_volume: 75, haptics_enabled: false }}><Frame>
    <View style={[styles.header, { borderColor: color.line }]}>
      <View style={styles.shellWidth}>
        <View style={[row, { minHeight: 52 }]}>
          {lesson || settings || quest ? <>
            <IconButton name="back" label={lesson || quest ? "Back to Learn" : "Close settings"} onPress={back} />
            <Label strong size={16} style={grow}>{lesson ? "Lesson" : quest ? "Fidel Quest" : "Settings"}</Label>
          </> : <>
            <Teacher size={28} />
            <Label strong size={19} style={grow}>Fidel</Label>
            {!!ready && language && <Label muted size={12}>{learningLanguages[language].name}</Label>}
            {!!ready && <IconButton name="settings" label="Open settings" onPress={() => setSettings(true)} />}
          </>}
        </View>
      </View>
    </View>
    <ScrollView ref={scroll} key={lesson ?? (settings ? "Settings" : quest ? "Quest" : `${tab}-${topic ?? ""}`)} style={{ backgroundColor: color.paper }}
      contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      {prefs.isPending ? <Loading label="Loading your setup" /> : prefs.error || !prefs.data || !language ?
        <><Title>We couldn’t load your setup</Title><Problem error={prefs.error} retry={() => void prefs.refetch()} /><SignOut onSignOut={onSignOut} /></> :
        !ready ? <Settings token={token} prefs={prefs.data} onboarding onSignOut={onSignOut} onStepChange={scrollTop}
          onAppearancePreview={setAppearanceDraft} /> :
        lesson ? <Lesson key={lesson} token={token} language={language} lessonId={lesson} back={back} onStepChange={scrollTop} /> :
        settings ? <Settings token={token} prefs={prefs.data} onSignOut={onSignOut} onStepChange={scrollTop}
          onAppearancePreview={setAppearanceDraft} /> :
        quest ? <Quest token={token} language={language} goDictionary={() => { setQuest(false); openDictionary(); }} /> :
        tab === "Home" ? <Home key={language} token={token} language={language} openLesson={openLesson} goLearn={() => setTab("Learn")}
          goReview={() => setTab("Review")} goProfile={() => setTab("Profile")} openDictionary={openDictionary} goQuest={() => { setTab("Learn"); setQuest(true); }} /> :
        tab === "Learn" ? <Learn key={language} token={token} language={language} openLesson={openLesson} goReview={() => setTab("Review")}
          goDictionary={() => openDictionary()} goQuest={() => setQuest(true)} /> :
        tab === "Review" ? <Review key={language} token={token} language={language} goLearn={() => setTab("Learn")} goDictionary={() => openDictionary()}
          onStepChange={scrollTop} startImmediately={startReviewFromDictionary} onAutoStartHandled={() => setStartReviewFromDictionary(false)} /> :
        tab === "Dictionary" ? <Dictionary key={language} token={token} language={language} initialTopic={topic}
          goReview={() => { setStartReviewFromDictionary(true); setTab("Review"); }} /> :
        <Profile key={language} token={token} language={language} openSettings={() => setSettings(true)} goLearn={() => setTab("Learn")} />}
    </ScrollView>
    {!!ready && !lesson && !settings && !quest && <View style={{ borderTopWidth: 1, borderColor: color.line }}>
      <View accessibilityRole="tablist" style={[styles.shellWidth, styles.tabs]}>
        {tabs.map(([name, icon]) => <Press tab selected={name === tab} label={name} key={name} style={styles.tab} onPress={() => {
          if (name === tab) { scrollTop(); return; }
          setTopic(undefined);
          setTab(name);
        }}>
          <View style={[styles.tabIcon, { backgroundColor: name === tab ? color.line : "transparent" }]}>
            <Icon name={icon} tint={name === tab ? color.ink : color.muted} />
          </View>
          <Label size={11} strong={name === tab} muted={name !== tab} style={{ textAlign: "center" }}>{name}</Label>
        </Press>)}
      </View>
    </View>}
  </Frame></FeedbackContext.Provider></Theme.Provider>;
}

const styles = StyleSheet.create({
  shellWidth: { alignSelf: "center", width: "100%", maxWidth: 560, paddingHorizontal: 12 },
  body: { width: "100%", maxWidth: 560, alignSelf: "center", padding: 16, paddingBottom: 32, gap: 13 },
  header: { borderBottomWidth: 1 },
  tabs: { flexDirection: "row", paddingHorizontal: 4, paddingVertical: 4 },
  tab: { flex: 1, minWidth: 0, minHeight: 56, justifyContent: "center", alignItems: "center", gap: 3, borderRadius: 8, paddingHorizontal: 1 },
  tabIcon: { minWidth: 42, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
