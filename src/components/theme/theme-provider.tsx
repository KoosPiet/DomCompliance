"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from "./theme-config";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPref(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Apply the resolved theme to <html>, briefly suppressing CSS transitions. */
function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none !important}",
    ),
  );
  document.head.appendChild(style);

  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;

  // Force a reflow, then re-enable transitions on the next frame.
  window.getComputedStyle(style).opacity;
  requestAnimationFrame(() => style.remove());
}

/**
 * Minimal theme provider. The initial <html> class is set by <ThemeScript /> in
 * the server-rendered <head>, so first render is flash-free; this provider only
 * tracks state and reacts to user toggles and OS changes after hydration.
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  // Deterministic on server and first client render (avoids hydration
  // mismatch); the stored preference is read in the effect below, post-mount.
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    // One-time mount sync from localStorage. Must happen post-hydration (the
    // server can't read localStorage), so a setState here is intentional.
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    const resolve = () => {
      const next = theme === "system" ? systemPref() : theme;
      setResolvedTheme(next);
      applyTheme(next);
    };
    resolve();

    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", resolve);
    return () => mq.removeEventListener("change", resolve);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (private mode, etc.) — theme still applies.
    }
    setThemeState(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Drop-in replacement for next-themes' `useTheme`, exposing the subset this app
 * uses. Falls back to safe defaults if called outside a provider.
 */
export function useTheme(): ThemeContextValue {
  return (
    useContext(ThemeContext) ?? {
      theme: "system",
      resolvedTheme: "light",
      setTheme: () => {},
    }
  );
}
