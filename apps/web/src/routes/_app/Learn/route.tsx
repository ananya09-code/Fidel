import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/Learn")({
  component: LearnLayout,
});

function LearnLayout() {
  return <Outlet />;
}
