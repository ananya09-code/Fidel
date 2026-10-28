
import { createFileRoute } from "@tanstack/react-router";
import SettingsOverview from "@/components/settings-ui/SettingsOverview";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (<div className="w-full"> <SettingsOverview /> </div>
  );
}

