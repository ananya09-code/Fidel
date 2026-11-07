import { Link } from "@tanstack/react-router";
import { useUser } from "@clerk/tanstack-react-start";
import { ArrowRight } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useDashboard } from "@/hooks/use-dashboard";
import { usePreferences } from "@/hooks/use-preferences";
import { PageState } from "@/components/common-ui/PageState";
import { StudyActivitySection } from "./StudyActivitySection";
import type { DashboardSummary } from "@/lib/api/dashboard";
import "@/components/common-ui/app-ui.css";

type ProfileViewProps = {
  name: string; username?: string; email?: string; imageUrl?: string | null;
  joinedLabel: string; language: string; dashboard: DashboardSummary; activity: React.ReactNode;
};

export function ProfileView({ name, username, email, imageUrl, joinedLabel, language, dashboard, activity }: ProfileViewProps) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "F";
  const stats = [
    { label: "Words learned", value: dashboard.learned_words },
    { label: "Lessons completed", value: dashboard.lessons_completed },
    { label: "Current streak", value: dashboard.streak_days, unit: dashboard.streak_days === 1 ? " day" : " days" },
    { label: "Reviews completed", value: dashboard.reviews_completed },
    { label: "Correct answers", value: dashboard.correct_answers },
    { label: "Words to review", value: dashboard.needs_review_words },
  ];
  return <div className="fidel-profile">
    <header className="app-page-title"><div><h1>Your profile</h1><p>Look how far your words have taken you.</p></div><Link to="/settings" className="app-text-link">Your settings<ArrowRight size={16} aria-hidden="true" /></Link></header>
    <section className="profile-identity" aria-label="Your account">
      <div className="profile-avatar">{imageUrl ? <img src={imageUrl} alt="" /> : <span>{initials}</span>}</div>
      <div><h2>{name}</h2>{username && <p>@{username}</p>}{email && <p className="profile-email">{email}</p>}<p className="profile-member">{joinedLabel}</p></div>
      <div className="profile-language"><span>Learning</span><strong>{language}</strong></div>
    </section>
    <div className="profile-progress-layout">
      <section className="profile-progress" aria-labelledby="profile-progress-title"><h2 id="profile-progress-title">Your progress</h2><dl>{stats.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}<span>{stat.unit}</span></dd></div>)}</dl></section>
      <section className="profile-goal" aria-labelledby="profile-goal-title"><h2 id="profile-goal-title">Today’s word goal</h2><p><strong>{dashboard.words_learned_today}</strong><span> / {dashboard.daily_word_goal} words</span></p><progress value={Math.min(dashboard.words_learned_today, dashboard.daily_word_goal)} max={dashboard.daily_word_goal} aria-label="Today's learned words toward daily goal" /><span>{dashboard.words_learned_today >= dashboard.daily_word_goal ? "Today’s goal reached. Nicely done." : (dashboard.daily_word_goal - dashboard.words_learned_today) + " more words to reach your goal."}</span><Link to="/Learn" className="app-text-link">Keep learning<ArrowRight size={16} aria-hidden="true" /></Link></section>
    </div>
    {activity}
  </div>;
}

export default function ProfileOverview() {
  const { user } = useUser();
  const profile = useProfile(), dashboard = useDashboard(), preferences = usePreferences();
  if (profile.isPending || dashboard.isPending || preferences.isPending) return <div className="fidel-profile"><header className="app-page-title"><h1>Your profile</h1></header><PageState kind="loading" title="Loading your profile" /></div>;
  if (profile.isError || dashboard.isError || preferences.isError || !dashboard.data) return <div className="fidel-profile"><header className="app-page-title"><h1>Your profile</h1></header><PageState kind="error" title="Couldn't load your profile" description={(profile.error ?? dashboard.error ?? preferences.error)?.message} actionLabel="Try again" onAction={() => { void profile.refetch(); void dashboard.refetch(); void preferences.refetch(); }} /></div>;
  const local = profile.data;
  const name = user?.fullName || local?.display_name || user?.username || "Fidel learner";
  const created = local?.created_at ? new Date(local.created_at) : null;
  const joinedLabel = created && !Number.isNaN(created.getTime()) ? "Joined " + new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(created) : "Fidel learner";
  return <ProfileView name={name} username={user?.username ?? local?.username ?? ""} email={user?.primaryEmailAddress?.emailAddress ?? local?.email ?? ""} imageUrl={user?.imageUrl ?? local?.image_url} joinedLabel={joinedLabel} language={preferences.data?.learning_language === "am" ? "አማርኛ" : "Afaan Oromoo"} dashboard={dashboard.data} activity={<StudyActivitySection />} />;
}
