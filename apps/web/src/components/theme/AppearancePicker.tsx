import { Laptop, Moon, Sun } from "lucide-react";
import type { Appearance } from "@/lib/theme";

export function AppearancePicker({ value, onChange }: { value: Appearance; onChange: (value: Appearance) => void }) {
  return <fieldset className="app-appearance"><legend className="sr-only">Appearance</legend><div>
    {([{ value: "light", label: "Light", icon: Sun }, { value: "dark", label: "Dark", icon: Moon }, { value: "system", label: "System", icon: Laptop }] as const).map(({ value: option, label, icon: Icon }) => <label key={option}><input type="radio" name="appearance" value={option} checked={value === option} onChange={() => onChange(option)} /><span><Icon size={17} aria-hidden="true" />{label}</span></label>)}
  </div><p>System follows your device’s appearance.</p></fieldset>;
}
