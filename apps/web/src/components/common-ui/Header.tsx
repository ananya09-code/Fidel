import { useSidebar } from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { useClerk, useUser } from "@clerk/tanstack-react-start";

import {
  Bell,
  ChevronDown,
  Globe2,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

import fidelLogo from "@/assets/fidallogo.png";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { state, isMobile, openMobile } = useSidebar();
  const { user } = useUser();
  const { signOut } = useClerk();

  const sidebarIsOpen = isMobile ? openMobile : state === "expanded";
  const displayName =
    user?.fullName || user?.username || "Fidel learner";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "F";

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-3">
      {!sidebarIsOpen && (
        <Link
          to="/"
          className="flex min-w-0 shrink-0 items-center gap-2.5"
          aria-label="Fidel home"
        >
          <img
            src={fidelLogo}
            alt="Fidel"
            className="h-9 w-9 shrink-0 object-contain"
          />

          <span className="text-lg font-bold tracking-tight text-[var(--sea-ink)]">
            Fidel
          </span>
        </Link>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 gap-2 rounded-xl border border-white/70 bg-white/50 px-3 text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-white/80"
            >
              <Globe2 className="h-4 w-4 text-[var(--sea-ink)]" />

              <span className="hidden text-sm font-medium sm:inline">
                Afaan Oromoo
              </span>

              <span className="text-sm font-medium sm:hidden">OM</span>

              <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-52 rounded-2xl border-white/60 bg-white/95 p-2 shadow-xl backdrop-blur-xl"
          >
            <DropdownMenuLabel>Learning language</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem className="rounded-lg">
              <span className="mr-2">🇪🇹</span>
              Afaan Oromoo
              <span className="ml-auto text-xs text-emerald-600">Active</span>
            </DropdownMenuItem>

            <DropdownMenuItem disabled className="rounded-lg">
              <span className="mr-2">🇪🇹</span>
              Amharic
              <span className="ml-auto text-xs text-slate-400">Soon</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative h-10 w-10 rounded-xl border border-white/70 bg-white/50 text-slate-600 shadow-sm backdrop-blur-xl transition hover:bg-white/80 hover:text-[var(--sea-ink)]"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[var(--hero-b)] ring-2 ring-white" />
        </Button>

        {/* Profile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open profile menu"
              className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/50 p-1.5 pr-2 shadow-sm backdrop-blur-xl transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hero-b)]"
            >
              <span className="hidden max-w-36 truncate text-sm font-medium text-slate-700 lg:block">
                {displayName}
              </span>

              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.imageUrl} alt="" />
                <AvatarFallback className="rounded-lg bg-[var(--sea-ink)] text-sm font-semibold text-[var(--foam)]">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 rounded-2xl border-white/60 bg-white/95 p-2 shadow-xl backdrop-blur-xl"
          >
            <DropdownMenuLabel className="px-3 py-2">
              <p className="truncate font-semibold text-[var(--sea-ink)]">
                {displayName}
              </p>
              <p className="mt-1 truncate text-xs font-normal text-slate-500">
                {email || "Your Fidel learning journey"}
              </p>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="rounded-lg">
              <Link to="/profile">
                <UserRound className="mr-2 h-4 w-4" />
                My profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="rounded-lg">
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="rounded-lg text-rose-600 focus:text-rose-700"
              onSelect={() => {
                void signOut({ redirectUrl: "/" });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
