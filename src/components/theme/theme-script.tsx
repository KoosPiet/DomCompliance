import { THEME_STORAGE_KEY } from "./theme-config";

/**
 * Inline, render-blocking script that sets the initial `dark` class on <html>
 * from localStorage / system preference before first paint — preventing a flash
 * of the wrong theme. Rendered in the root layout's <head> (a Server Component),
 * so unlike next-themes it never runs during client render and never triggers
 * React 19's "script tag inside a React component" warning.
 */
export function ThemeScript() {
  const js = `(function(){try{var k='${THEME_STORAGE_KEY}';var t=localStorage.getItem(k)||'light';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='dark'||(t==='system'&&m);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
