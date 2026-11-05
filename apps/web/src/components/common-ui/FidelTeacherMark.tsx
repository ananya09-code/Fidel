import { useId } from "react";

/** Vector interpretation of the user's seated teacher, whisk and open-book mark. */
export function FidelTeacherMark({ className = "" }: { className?: string }) {
  const cutout = useId();
  return (
    <svg viewBox="0 0 360 390" className={className} role="img" aria-label="Fidel teacher with an open book" fill="none">
      <defs>
        <mask id={cutout}>
          <rect width="360" height="390" fill="white" />
          <path d="M173 101c30-12 69-12 105 0" stroke="black" strokeWidth="12" />
          <path d="M181 187c-22 17-34 48-41 82 4-46 12-72 29-91Z" fill="black" />
          <path d="M176 297c51 1 93 17 114 40-41-24-74-29-114-34Z" fill="black" />
          <path d="M116 326c22 17 64 27 107 25-36 12-89 3-107-25Z" fill="black" />
        </mask>
      </defs>
      <g fill="currentColor" mask={`url(#${cutout})`}>
        <path d="M173 96c-12-25 2-53 25-63 31-15 66-3 78 24 6 12 7 25 1 39-37-13-72-13-104 0Z" />
        <path d="M179 111c25-10 62-11 91 0l-1 19 10 17c6 7 13 9 11 16-1 6-12 6-16 10v19l-61 7-20-28c-14-17-15-34-14-60Z" />
        <path d="M200 179c-41-11-65 19-86 57l-30-5-10-9c-10-5-20 0-19 12 1 10 10 17 20 17l53 15c18 0 28-24 37-35l-18 66 116 31 51-23c-3-61-14-101-48-121Z" />
        <path d="M150 285c-42 14-68 36-64 58 5 25 49 32 91 32h112c37-1 58-11 55-31-3-19-29-36-64-47l-73 12Z" />
      </g>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="m68 227 18-75" strokeWidth="12" />
        <path d="M86 157c16-36 35-77 24-111C96 4 52 17 34 48 19 73 12 104 9 134c20-51 32-70 45-77-19 30-30 69-35 110 18-38 29-59 39-69-12 36-18 69-18 92 15-33 26-53 37-64-6 25-9 47-8 66Z" strokeWidth="5" />
        <path d="M26 83c18-36 42-55 63-39 7 5 10 12 10 19" strokeWidth="4" />
      </g>
      <g className="fidel-teacher-book" fill="var(--fidel-mark-accent, #e9a033)">
        <path d="M182 231c28 0 50 9 70 22v47c-22-12-45-18-70-19Z" />
        <path d="M263 253c20-13 43-21 69-22l-4 49c-25 1-45 7-65 20Z" />
      </g>
    </svg>
  );
}
