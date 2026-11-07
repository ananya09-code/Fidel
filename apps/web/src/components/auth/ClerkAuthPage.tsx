import { useEffect } from "react";
import { SignIn, SignUp, useAuth } from "@clerk/tanstack-react-start";
import { LoaderCircle } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { getSafeAuthRedirect } from "@/lib/auth-redirect";

const appearance = {
  variables: {
    colorPrimary: "var(--auth-action)",
    colorText: "var(--auth-ink)",
    colorTextSecondary: "var(--auth-muted)",
    colorBackground: "var(--auth-paper)",
    colorInputBackground: "var(--auth-paper)",
    colorInputText: "var(--auth-ink)",
    borderRadius: "0.5rem",
    fontFamily: "Manrope, sans-serif",
    fontSize: "0.875rem",
  },
  elements: {
    rootBox: "auth-clerk-root",
    cardBox: "auth-clerk-box",
    card: "auth-clerk-card",
    headerTitle: "auth-clerk-title",
    headerSubtitle: "auth-clerk-subtitle",
    formButtonPrimary: "auth-clerk-primary",
    socialButtonsBlockButton: "auth-clerk-social",
    formFieldInput: "auth-clerk-input",
    footerActionLink: "auth-clerk-link",
    footer: "auth-clerk-footer",
    dividerLine: "auth-clerk-divider",
    dividerText: "auth-clerk-muted",
  },
} as const;

type ClerkAuthPageProps = {
  mode: "sign-in" | "sign-up";
  redirect?: string;
};

export function ClerkAuthPage({ mode, redirect }: ClerkAuthPageProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const isSignIn = mode === "sign-in";
  const fallback = isSignIn ? "/Home" : "/onboarding";
  const candidate = getSafeAuthRedirect(redirect, fallback);
  const pointsBackToAuth = ["/sign-in", "/sign-up"].some(
    (prefix) =>
      candidate === prefix ||
      candidate.startsWith(`${prefix}/`) ||
      candidate.startsWith(`${prefix}?`),
  );
  const target = pointsBackToAuth ? fallback : candidate;

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.replace(target);
    }
  }, [isLoaded, isSignedIn, target]);

  const alternatePath = isSignIn ? "/sign-up" : "/sign-in";
  const alternateUrl =
    target === fallback
      ? alternatePath
      : `${alternatePath}?redirect=${encodeURIComponent(target)}`;

  const loading = <div className="auth-form-loading"><h1>{isSignIn ? "Welcome back." : "Begin with a hello."}</h1><div role="status"><LoaderCircle size={24} aria-hidden="true" /><span className="sr-only">Opening secure authentication</span></div></div>;

  return (
    <AuthLayout variant={mode}>
      <div className="auth-clerk-host">
        {!isLoaded && loading}
        {isSignIn ? (
          <SignIn
            routing="path"
            path="/sign-in"
            forceRedirectUrl={target}
            fallbackRedirectUrl={target}
            signUpUrl={alternateUrl}
            appearance={appearance}
          />
        ) : (
          <SignUp
            routing="path"
            path="/sign-up"
            forceRedirectUrl={target}
            fallbackRedirectUrl={target}
            signInUrl={alternateUrl}
            appearance={appearance}
          />
        )}
      </div>
    </AuthLayout>
  );
}
