import { FidelTeacherMark } from "@/components/common-ui/FidelTeacherMark";

/** The same teacher and golden book used at the entrance to Fidel. */
export function FidelWordmark() {
  return <span className="fidel-logo-lockup">
    <FidelTeacherMark className="landing-teacher-logo" /><span>Fidel<span className="fidel-logo-period">.</span></span>
  </span>;
}
