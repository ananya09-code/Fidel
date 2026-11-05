import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, House, Library, Search, Settings, UserRound } from "lucide-react";

import { FidelTeacherMark } from "./FidelTeacherMark";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainLinks = [
  { title: "Home", url: "/Home", icon: House },
  { title: "Learn", url: "/Learn", icon: BookOpen },
  { title: "Review", url: "/review", icon: Library },
  { title: "Dictionary", url: "/dictionary", icon: Search },
] as const;

export function AppSidebar() {
  const isMobile = useIsMobile();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  }).toLowerCase();

  // The authenticated mobile layout uses bottom tabs, never a modal drawer.
  if (isMobile) return null;

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-[var(--sea-ink)]/10 bg-[var(--sand)] p-4">
        <Link
          to="/Home"
          className="flex min-w-0 items-center gap-3"
          aria-label="Fidel home"
        >
          <FidelTeacherMark className="h-11 w-10 shrink-0 text-[var(--sea-ink)]" />

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold text-[var(--sea-ink)]">
              Fidel
            </span>
            <p className="text-xs text-[var(--sea-ink)]/60">
              Learn Ethiopian languages
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[var(--sea-ink)]/60 group-data-[collapsible=icon]:hidden">
            Learning
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {mainLinks.map((item) => {
                const isActive = pathname === item.url.toLowerCase() ||
                  pathname.startsWith(item.url.toLowerCase() + "/");

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="text-[var(--sea-ink)] data-[active=true]:bg-[var(--sand)] data-[active=true]:font-semibold"
                    >
                      <Link to={item.url} aria-current={isActive ? "page" : undefined}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[var(--sea-ink)]/10 p-3">
        <SidebarMenu>
          <SidebarMenuItem><SidebarMenuButton asChild tooltip="Profile" isActive={pathname === "/profile"}><Link to="/profile" aria-current={pathname === "/profile" ? "page" : undefined}><UserRound /><span>Profile</span></Link></SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              isActive={pathname === "/settings"}
              className="text-[var(--sea-ink)]"
            >
              <Link to="/settings" aria-current={pathname === "/settings" ? "page" : undefined}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
