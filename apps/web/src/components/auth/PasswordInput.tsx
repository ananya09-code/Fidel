
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordInputProps {
  id: string;
  label?: string;
  placeholder?: string;
  autoComplete?: string;
}

export function PasswordInput({
  id,
  label = "Password",
  placeholder = "Enter your password",
  autoComplete = "current-password",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </Label>

      <div className="relative">
        <Input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="h-12 rounded-xl border-slate-200/90 bg-white/70 pr-12 placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-teal-600/20"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1 top-1/2 size-10 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        >
          {visible ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
