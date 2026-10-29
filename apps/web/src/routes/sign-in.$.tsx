import { createFileRoute } from "@tanstack/react-router";

import { ClerkAuthPage } from "@/components/auth/ClerkAuthPage";
import { validateAuthRedirectSearch } from "@/lib/auth-redirect";

export const Route = createFileRoute("/sign-in/$")({
  validateSearch: validateAuthRedirectSearch,
  component: SignInSplatPage,
});

function SignInSplatPage() {
  const { redirect } = Route.useSearch();

  return <ClerkAuthPage mode="sign-in" redirect={redirect} />;
}
