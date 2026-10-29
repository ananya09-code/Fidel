import { createFileRoute } from "@tanstack/react-router";

import { ClerkAuthPage } from "@/components/auth/ClerkAuthPage";
import { validateAuthRedirectSearch } from "@/lib/auth-redirect";

export const Route = createFileRoute("/sign-up")({
  validateSearch: validateAuthRedirectSearch,
  component: SignUpPage,
});

function SignUpPage() {
  const { redirect } = Route.useSearch();

  return <ClerkAuthPage mode="sign-up" redirect={redirect} />;
}
