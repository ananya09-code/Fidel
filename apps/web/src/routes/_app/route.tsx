import { useEffect } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";

import { AuthLoading } from "@/components/auth/AuthLoading";
import { AppSidebar } from "@/components/common-ui/AppSideBar";
import { Header } from "@/components/common-ui/Header";
import { useProfile } from "@/hooks/use-profile";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  useProfile();

  useEffect(() => {
    if (!isLoaded || isSignedIn) return;

    const target = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(
      `/sign-in?redirect=${encodeURIComponent(target)}`,
    );
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn) {
    return <AuthLoading />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />

      <SidebarInset className="min-h-svh min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-white/50 bg-white/60 px-3 backdrop-blur-2xl sm:px-5">
          <SidebarTrigger className="shrink-0 rounded-xl text-slate-600 hover:bg-white/80" />

          <div className="min-w-0 flex-1">
            <Header />
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

