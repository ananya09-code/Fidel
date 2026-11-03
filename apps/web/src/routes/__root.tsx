
import {
  HeadContent,
  Scripts,
  Outlet,
  createRootRoute,
} from "@tanstack/react-router";
import { ClerkProvider } from "@clerk/tanstack-react-start";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import fidelLogo from "@/assets/fidallogo.png";
import { PreferenceThemeSync, ThemeProvider } from "@/components/theme/ThemeProvider";
import { themeInitScript } from "@/lib/theme";

import "../styles.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Fidel" },
    ],
  }),
  component: RootComponent,
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
          <ClerkProvider publishableKey={clerkKey}>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider>
                <PreferenceThemeSync />
                <Outlet />
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
  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--bg-base)] px-6 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--panel)]/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur-xl">
        <img
          src={fidelLogo}
          alt="Fidel"
          className="h-12 w-12 object-contain"
        />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--sea-ink)]/100">
          Clerk is not configured
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--sea-ink)]/75">
          Add your Clerk publishable key to the web app environment and restart
          the dev server.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs text-slate-100">
          VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
        </pre>
        <p className="mt-4 text-xs leading-5 text-[var(--sea-ink)]/65">
          Only the publishable key belongs in the browser. Keep the Clerk secret
          key in the API environment.
        </p>
      </div>
    </main>
  );
}

