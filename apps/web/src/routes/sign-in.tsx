import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import fidelLogo from "@/assets/fidallogo.png";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SocialLoginButton } from "@/components/auth/SocialLoginButton";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // UI only. Clerk will handle authentication later.
  }

  return (
    <AuthLayout variant="sign-in">
      <div className="mb-8">
        {/* Logo */}
        <Link
          to="/"
          className="relative z-10 flex shrink-0 items-center gap-2.5"
          aria-label="Fidel home"
        >
          <img
            src={fidelLogo}
            alt="Fidel"
            className="h-10 w-10 object-contain drop-shadow-sm"
          />
          <span className="text-xl font-bold tracking-tight text-[var(--sea-ink)]">
            Fidel
          </span>
        </Link>

        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back!
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your next word is waiting for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="h-12 rounded-xl border-slate-200 bg-white/70 placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-teal-600/20"
          />
        </div>

        <div className="space-y-2">
          <PasswordInput
            id="password"
            placeholder="Enter your password"
          />
          <div className="flex items-center justify-between gap-3">

            <Link
              to="/sign-in"
              className="text-xs font-medium text-teal-800 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>


        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-teal-700 font-semibold text-white shadow-lg shadow-teal-900/10 hover:bg-teal-800"
        >
          Sign in
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-slate-400">or</span>
        <Separator className="flex-1" />
      </div>

      <SocialLoginButton label="Continue with Google" />

      <p className="mt-7 text-center text-sm text-slate-500">
        New to Fidel?


        <Link
          to="/sign-up"
          className="font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
