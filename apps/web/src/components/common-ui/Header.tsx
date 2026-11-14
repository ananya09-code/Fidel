import { languageLabel } from "@/lib/languages";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth, useClerk, useUser } from "@clerk/tanstack-react-start";
import { ChevronDown, CircleHelp, LogOut, Settings, UserRound } from "lucide-react";
import { openGuide } from "@/components/guide/GuideExperience";
import { useSidebar } from "@/components/ui/sidebar";
import { usePreferences } from "@/hooks/use-preferences";
import { disablePushOnThisDevice } from "@/lib/push-device";
import { FidelTeacherMark } from "./FidelTeacherMark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import "./app-ui.css";

type HeaderViewProps = {
  displayName: string;
  email?: string;
  imageUrl?: string;
  language?: string;
  area: string;
  sidebarOpen?: boolean;
  onSignOut: () => void;
};

export function HeaderView({ displayName, email, imageUrl, language, area, sidebarOpen, onSignOut }: HeaderViewProps) {
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "F";
  return <div className="app-header-content">
    <Link to="/Home" className={"app-wordmark" + (sidebarOpen ? " is-sidebar-open" : "")} aria-label="Fidel home"><FidelTeacherMark className="app-header-mark" /><span>Fidel<span className="app-wordmark-dot">.</span></span></Link>
    <span className="app-context">{area}</span>
    <div className="app-header-actions">
      {language && <Link to="/settings" className="app-header-language" aria-label={"Learning " + language + ". Change in Settings."}>{language}</Link>}
      <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="app-account-trigger" aria-label="Open profile menu"><Avatar className="app-avatar"><AvatarImage src={imageUrl} alt="" /><AvatarFallback>{initials}</AvatarFallback></Avatar><span>{displayName}</span><ChevronDown size={15} aria-hidden="true" /></button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="fidel-account-menu">
          <DropdownMenuLabel><p>{displayName}</p>{email && <span>{email}</span>}</DropdownMenuLabel><DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/profile"><UserRound size={16} />My profile</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/settings"><Settings size={16} />Settings</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => openGuide("tour")}><CircleHelp size={16} />Take the tour</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openGuide("updates")}><CircleHelp size={16} />What’s new</DropdownMenuItem>
          <DropdownMenuSeparator /><DropdownMenuItem onSelect={onSignOut}><LogOut size={16} />Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>;
}

export function Header() {
  const { state } = useSidebar();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const preferences = usePreferences();
  const pathname = useRouterState({ select: (router) => router.location.pathname }).toLowerCase();
  const area = pathname.startsWith("/learn/") ? "Lesson" : pathname.startsWith("/learn") ? "Learn" : pathname.startsWith("/dictionary") ? "Dictionary" : pathname.startsWith("/review") ? "Review" : pathname.startsWith("/settings") ? "Settings" : pathname.startsWith("/profile") ? "Profile" : "Home";
  return <HeaderView displayName={user?.fullName || user?.username || "Fidel learner"} email={user?.primaryEmailAddress?.emailAddress} imageUrl={user?.imageUrl} language={preferences.data ? languageLabel(preferences.data.learning_language) : undefined} area={area} sidebarOpen={state === "expanded"} onSignOut={() => { void disablePushOnThisDevice(getToken).catch(() => undefined).then(() => signOut({ redirectUrl: "/" })); }} />;
}
