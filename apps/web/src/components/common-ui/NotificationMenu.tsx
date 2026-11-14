import { useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, LoaderCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getNotificationInbox, type NotificationInboxItem } from "@/lib/api/notifications";

const reminderCopy = {
  goal: { title: "Daily word goal", detail: "A few words were waiting for you.", path: "/Home" },
  quiz: { title: "Word quiz", detail: "A spaced quiz was ready to practise.", path: "/test" },
  streak: { title: "Learning streak", detail: "A short lesson could keep your streak going.", path: "/Learn" },
} as const;

function dayLabel(value: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function ReminderRow({ item }: { item: NotificationInboxItem }) {
  const copy = reminderCopy[item.kind];
  return <DropdownMenuItem asChild className="app-notification-row">
    <Link to={copy.path}>
      <span className="app-notification-row-text"><strong>{copy.title}</strong><span>{copy.detail}</span></span>
      <time dateTime={item.local_date}>{dayLabel(item.local_date)}</time>
    </Link>
  </DropdownMenuItem>;
}

export function NotificationMenu() {
  const { getToken, userId } = useAuth();
  const [open, setOpen] = useState(false);
  const inbox = useQuery({
    queryKey: ["auth", "notification-inbox", userId ?? "signed-out"],
    queryFn: ({ signal }) => getNotificationInbox(getToken, signal),
    enabled: open && Boolean(userId),
    staleTime: 60_000,
    retry: false,
  });

  return <DropdownMenu open={open} onOpenChange={setOpen}>
    <DropdownMenuTrigger asChild><button type="button" className="app-notification-trigger" aria-label="Notifications" aria-expanded={open}><Bell size={19} aria-hidden="true" /></button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={8} className="fidel-notification-menu">
      <DropdownMenuLabel className="app-notification-heading"><strong>Notifications</strong><span>Recent reminders sent to your devices</span></DropdownMenuLabel>
      <DropdownMenuSeparator />
      {inbox.isPending ? <div className="app-notification-state" role="status"><LoaderCircle size={18} className="app-spinner" aria-hidden="true" />Loading reminders</div>
        : inbox.isError ? <DropdownMenuItem onSelect={(event) => { event.preventDefault(); void inbox.refetch(); }}>Couldn’t load reminders · Try again</DropdownMenuItem>
          : inbox.data.items.length ? inbox.data.items.map((item) => <ReminderRow key={`${item.local_date}-${item.kind}`} item={item} />)
            : <p className="app-notification-state">No reminders sent yet. Your recent reminders will appear here.</p>}
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild><Link to="/settings" className="app-notification-settings">Notification settings</Link></DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
