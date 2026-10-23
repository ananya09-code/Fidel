import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, House, Library, Settings, Trophy } from "lucide-react";

import fidelLogo from "@/assets/fidallogo.png";

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
  { title: "Home", url: "/home", icon: House },
  { title: "Learn", url: "/learn", icon: BookOpen },
  { title: "Review", url: "/review", icon: Library },
  { title: "Progress", url: "/profile", icon: Trophy },
];

export function AppSidebar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-[var(--sea-ink)]/10 bg-[var(--sand)] p-4">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-3"
          aria-label="Fidel home"
        >
          <img
            src={fidelLogo}
            alt="Fidel"
            className="h-10 w-10 shrink-0 object-contain"
          />

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
                const isActive =
                  item.url === "/"
                    ? pathname === "/"
                    : pathname === item.url ||
                    pathname.startsWith(`${item.url}/`);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="text-[var(--sea-ink)] data-[active=true]:bg-[var(--sand)] data-[active=true]:font-semibold"
                    >
                      <Link to={item.url}>
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
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              className="text-[var(--sea-ink)]"
            >
              <Link to="/settings">
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
