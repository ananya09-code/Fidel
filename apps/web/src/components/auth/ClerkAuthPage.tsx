import { useEffect } from "react";
import { SignIn, SignUp, useAuth } from "@clerk/tanstack-react-start";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { getSafeAuthRedirect } from "@/lib/auth-redirect";

const appearance = {
  variables: {
    colorPrimary: "#115e59",
    colorText: "#0f172a",
    colorTextSecondary: "#64748b",
    colorBackground: "rgba(255, 255, 255, 0.75)",
    colorInputBackground: "rgba(255, 255, 255, 0.7)",
    colorInputText: "#0f172a",
    borderRadius: "0.75rem",
    fontFamily: "inherit",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "border-0 bg-transparent p-0 shadow-none",
    headerTitle: "text-2xl font-bold tracking-tight text-slate-900",
    headerSubtitle: "text-sm leading-6 text-slate-500",
    formButtonPrimary:
      "bg-teal-700 text-white shadow-lg shadow-teal-900/10 hover:bg-teal-800",
    socialButtonsBlockButton:
      "border-slate-200 bg-white/70 text-slate-700 hover:bg-white",
    formFieldInput:
      "border-slate-200 bg-white/70 focus:border-teal-600 focus:ring-teal-600/20",
    footerActionLink: "text-teal-800 hover:text-teal-900",
    dividerLine: "bg-slate-200",
    dividerText: "text-slate-400",
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

  return (
    <AuthLayout variant={mode} contained={false}>
      <div className="rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-2xl shadow-slate-900/[0.07] backdrop-blur-2xl sm:p-9">
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
