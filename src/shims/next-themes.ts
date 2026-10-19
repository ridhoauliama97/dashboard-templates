/**
 * Shim for `next-themes`.
 *
 * The dashboard already owns the theme through the preferences store and the
 * `data-theme-mode` attribute, so this reports that state instead of adding a
 * second theme provider. Only `src/components/ui/sonner.tsx` consumes it.
 */

import { useSyncExternalStore } from "react";

type ResolvedTheme = "light" | "dark";

function subscribe(onChange: () => void) {
  if (typeof document === "undefined") return () => undefined;

  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme-mode"],
  });

  return () => observer.disconnect();
}

function readTheme(): ResolvedTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  const resolvedTheme = useSyncExternalStore(subscribe, readTheme, () => "light" as const);

  return {
    theme: resolvedTheme,
    resolvedTheme,
    systemTheme: resolvedTheme,
    themes: ["light", "dark"],
    setTheme: () => undefined,
    forcedTheme: undefined,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return children;
}
