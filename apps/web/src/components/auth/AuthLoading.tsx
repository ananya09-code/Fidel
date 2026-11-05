import { LoaderCircle } from "lucide-react";
import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";
import "@/components/common-ui/app-ui.css";

export function AuthLoading() {
  return <div className="auth-wait" role="status" aria-live="polite"><FidelTeacherMark className="auth-wait-teacher" /><LoaderCircle size={24} className="app-spinner" aria-hidden="true" /><span className="sr-only">Checking your session</span></div>;
}
