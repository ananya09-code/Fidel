import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import { AuthPortrait } from "./AuthPortrait";
import "./auth.css";

type AuthLayoutProps = {
  children: ReactNode;
  variant: "sign-in" | "sign-up";
};

export function AuthLayout({ children, variant }: AuthLayoutProps) {
  return (
    <main className="fidel-auth">
      <div className="auth-sheet">
        <section className="auth-art" aria-label="Languages, faces and stories of Ethiopia">
          <Link to="/" className="auth-brand" aria-label="Fidel home"><FidelTeacherMark className="auth-teacher-logo" /><span>Fidel<span className="auth-brand-dot">.</span></span></Link>
          <p className="auth-art-statement">Some words<br />feel like home.</p>
          <AuthPortrait initialIndex={variant === "sign-in" ? 0 : 1} />
        </section>
        <section className="auth-form-side" aria-label={variant === "sign-in" ? "Sign in" : "Create an account"}>
          <header className="auth-form-nav">
            <span>{variant === "sign-in" ? "A little more, every day." : "Your first word is waiting."}</span>
            <Link to="/" className="auth-back">Back to Fidel <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </header>
          <div className="auth-form-content">{children}</div>
          <p className="auth-form-note">Amharic · Afaan Oromoo<br /><span>Learn a little. Keep it for a lifetime.</span></p>
        </section>
      </div>
    </main>
  );
}
