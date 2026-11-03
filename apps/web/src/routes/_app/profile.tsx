import { createFileRoute } from "@tanstack/react-router";
import ProfileOverview from "@/components/profile-ui/ProfileOverview";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="w-full min-w-0 px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10 xl:px-12">
      <ProfileOverview />
    </div>
  );
}
