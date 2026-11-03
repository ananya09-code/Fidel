import { Check, Laptop, Moon, Sun } from "lucide-react";
import type { Appearance } from "@/lib/theme";

export function AppearancePicker({ value, onChange }: {
  value: Appearance;
  onChange: (value: Appearance) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Appearance</legend>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {([
          { value: "light", label: "Light", icon: Sun },
          { value: "dark", label: "Dark", icon: Moon },
          { value: "system", label: "System", icon: Laptop },
        ] as const).map(({ value: option, label, icon: Icon }) => (
          <label key={option} className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border p-4 text-sm font-medium text-[var(--sea-ink)] transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--lagoon-deep)] ${value === option ? "border-[var(--lagoon-deep)] bg-[var(--sand)]" : "border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--sand)]/50"}`}>
            <input type="radio" name="appearance" value={option} checked={value === option} onChange={() => onChange(option)} className="sr-only" />
            <Icon size={22} aria-hidden="true" />
            {label}
            {value === option && <Check className="absolute right-2 top-2 size-3.5" aria-hidden="true" />}
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--sea-ink)]/65">System follows your device’s appearance. You can change this anytime.</p>
    </fieldset>
  );
}
