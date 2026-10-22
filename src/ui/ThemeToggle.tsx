import { useId, useState, type ReactNode } from "react";

// Theme control: Auto follows the system setting; Light and Dark override it.
// The choice is stored and applied before first paint by index.html.

const KEY = "fp-shapes-theme";
type Choice = "auto" | "light" | "dark";

function stored(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}

function apply(choice: Choice) {
  const root = document.documentElement;
  try {
    if (choice === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    // Storage can be unavailable (private mode); the choice still applies now.
  }
  if (choice === "auto") delete root.dataset.theme;
  else root.dataset.theme = choice;
}

const OPTIONS: { value: Choice; label: string; icon: ReactNode }[] = [
  { value: "auto", label: "Auto", icon: <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" /><path d="M8 2a6 6 0 000 12z" fill="currentColor" /></svg> },
  { value: "light", label: "Light", icon: <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" /><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1" /></svg> },
  { value: "dark", label: "Dark", icon: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 9.5A5.5 5.5 0 016.5 2.5a5.5 5.5 0 107 7z" /></svg> },
];

export function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>(stored);
  const name = useId();
  return (
    <fieldset className="theme-switch">
      <legend className="sr-only">Theme</legend>
      {OPTIONS.map((o) => (
        <label key={o.value} className={`theme-option${choice === o.value ? " on" : ""}`}>
          <input type="radio" className="sr-only" name={name} value={o.value} checked={choice === o.value}
            onChange={() => { apply(o.value); setChoice(o.value); }} />
          {o.icon}
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
