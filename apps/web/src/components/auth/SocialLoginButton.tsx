
import { Button } from "@/components/ui/button";

interface SocialLoginButtonProps {
  label: string;
  onClick?: () => void;
}

export function SocialLoginButton({
  label,
  onClick,
}: SocialLoginButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="h-12 w-full rounded-xl border-slate-200 bg-white/60 font-medium text-slate-700 hover:bg-white"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className="mr-2 size-5"
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.69 13.22l7.98 6.19C13.56 13.72 18.28 9.5 24 9.5Z"
          transform="translate(0 4)"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.96 46.98 31.85 46.98 24.55Z"
        />
        <path
          fill="#FBBC05"
          d="M10.64 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.94 23.94 0 0 0 0 21.56l7.98-6.19Z"
          transform="translate(0 0)"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-5.72 0-10.44-3.86-12.16-9.06l-7.98 6.19C6.69 43.36 14.62 48 24 48Z"
        />
      </svg>

      {label}
    </Button>
  );
}
