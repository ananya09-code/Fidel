import { useEffect } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";

import { AuthLoading } from "@/components/auth/AuthLoading";
import { AppSidebar } from "@/components/common-ui/AppSideBar";
import { Header } from "@/components/common-ui/Header";
import { MobileBottomNavigation } from "@/components/common-ui/MobileBottomNavigation";
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
    <SidebarProvider defaultOpen={true} className="fidel-app">
      <AppSidebar />

      <SidebarInset className="min-h-svh min-w-0">
        <header className="app-topbar">
          <SidebarTrigger className="hidden shrink-0 rounded-xl text-[var(--sea-ink)]/65 hover:bg-[var(--sand)]/30 md:inline-flex" />

          <div className="min-w-0 flex-1">
            <Header />
          </div>
        </header>

        <main className="min-w-0 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <Outlet />
        </main>
      </SidebarInset>
      <MobileBottomNavigation />
    </SidebarProvider>
  );
}

