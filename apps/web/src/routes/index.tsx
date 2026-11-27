
import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { EditorialLanding } from "@/components/landing-ui/EditorialLanding";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { PageState } from "@/components/common-ui/PageState";
import { usePreferences } from "@/hooks/use-preferences";
import { appEntryState } from "@/lib/first-run";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const preferences = usePreferences();
  const entry = appEntryState(isLoaded, Boolean(isSignedIn), {
    isPending: preferences.isPending,
    isError: preferences.isError,
    onboarding_completed: preferences.data?.onboarding_completed,
  });

  useEffect(() => {
    if (entry === "onboarding") window.location.replace("/onboarding");
    else if (entry === "ready") window.location.replace("/Home");
  }, [entry]);

  if (entry === "sign-in") return <EditorialLanding />;
  if (entry === "error") return <main className="app-standalone"><PageState kind="error" title="We couldn’t load your setup" description={preferences.error instanceof Error ? preferences.error.message : "Please try again."} actionLabel="Try again" onAction={() => void preferences.refetch()} /></main>;
  return <AuthLoading />;
}
