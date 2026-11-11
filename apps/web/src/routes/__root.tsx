
import {
  HeadContent,
  Link,
  Scripts,
  Outlet,
  createRootRoute,
} from "@tanstack/react-router";
import { ClerkProvider } from "@clerk/tanstack-react-start";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { PageState } from "@/components/common-ui/PageState";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { InstallFidelProvider } from "@/components/install/InstallFidel";
import { PreferenceThemeSync, ThemeProvider } from "@/components/theme/ThemeProvider";
import { themeInitScript } from "@/lib/theme";

import "../styles.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#173a40" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Fidel" },
      { title: "Fidel" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/fidel-icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/fidel-icon-180.png", sizes: "180x180" },
    ],
  }),
  component: RootComponent,
  pendingComponent: AuthLoading,
  notFoundComponent: () => <main className="app-standalone"><FidelTeacherMark className="auth-wait-teacher" /><h1>That page wandered off.</h1><p>Let’s find your way back.</p><Link to="/" className="app-primary">Back to Fidel</Link></main>,
  errorComponent: ({ reset }) => <main className="app-standalone"><h1>A small pause.</h1><PageState kind="error" title="We couldn’t open this page" description="Please try again." actionLabel="Try again" onAction={reset} /><Link to="/" className="app-text-link">Back to Fidel</Link></main>,
});

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const clerkKey =
    typeof publishableKey === "string" && publishableKey.trim().length > 0
      ? publishableKey
      : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>

      <body>
        {clerkKey ? (
          <ClerkProvider publishableKey={clerkKey} localization={{
            signIn: { start: { title: "Welcome back.", subtitle: "Sign in to continue learning." } },
            signUp: { start: { title: "Begin with a hello.", subtitle: "Create your Fidel account." } },
          }}>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider>
                <PreferenceThemeSync />
                <InstallFidelProvider><Outlet /></InstallFidelProvider>
              </ThemeProvider>
            </QueryClientProvider>
          </ClerkProvider>
        ) : (
          <MissingClerkConfig />
        )}

        <Scripts />
      </body>
    </html>
  );
}

function MissingClerkConfig() {
  return <main className="app-standalone"><FidelTeacherMark className="auth-wait-teacher" /><h1>Fidel needs a moment of setup.</h1><PageState kind="error" title="Sign-in is not configured" description="Add the Clerk publishable key to the web environment, then restart the app." /></main>;
}
