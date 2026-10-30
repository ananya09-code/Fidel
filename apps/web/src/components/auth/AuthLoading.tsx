import fidelLogo from "@/assets/fidallogo.png";
import { LoaderCircle } from "lucide-react";

export function AuthLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh items-center justify-center bg-[var(--bg-base)] px-6"
    >
      <div className="relative flex size-20 items-center justify-center rounded-3xl bg-white/55 shadow-sm">
        <img src={fidelLogo} alt="" className="h-10 w-10 object-contain" />
        <LoaderCircle className="absolute size-20 animate-spin text-[#E9A23B]" strokeWidth={1.5} />
        <span className="sr-only">Checking your session</span>
      </div>
    </div>
  );
}
