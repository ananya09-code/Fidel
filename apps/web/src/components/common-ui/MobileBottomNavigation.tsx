import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, House, Library, Search, UserRound } from "lucide-react";

const tabs = [
  { title: "Home", to: "/Home", icon: House },
  { title: "Learn", to: "/Learn", icon: BookOpen },
  { title: "Review", to: "/review", icon: Library },
  { title: "Dictionary", to: "/dictionary", icon: Search },
  { title: "Profile", to: "/profile", icon: UserRound },
] as const;

export function MobileBottomNavigation() {
  const pathname = useRouterState({ select: (state) => state.location.pathname }).toLowerCase();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--ui-line)] bg-[var(--ui-frame)] pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))] pt-1 md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5 gap-1 px-2">
        {tabs.map(({ title, to, icon: Icon }) => {
          const path = to.toLowerCase();
          const active = pathname === path || pathname.startsWith(`${path}/`);
          return (
            <li key={to} className="min-w-0">
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex h-full min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-xl outline-offset-[-2px] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--sea-ink)] ${active ? "font-semibold text-[var(--sea-ink)]" : "text-[var(--sea-ink)]/55 hover:bg-[var(--sand)]/40 hover:text-[var(--sea-ink)]"}`}
              >
                <span className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${active ? "bg-[var(--sea-ink)]/10" : "bg-transparent"}`}>
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
                </span>
                <span className="max-w-full truncate text-[11px] leading-4">{title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
