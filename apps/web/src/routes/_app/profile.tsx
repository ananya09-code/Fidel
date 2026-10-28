import { createFileRoute } from "@tanstack/react-router";
import ProfileOverview from "@/components/profile-ui/ProfileOverview";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="w-full">
      <ProfileOverview />
    </div>
  );
}
