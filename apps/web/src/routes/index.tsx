
import { createFileRoute } from "@tanstack/react-router";
import { EditorialLanding } from "@/components/landing-ui/EditorialLanding";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return <EditorialLanding />;
}
