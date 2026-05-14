import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";

const STORAGE_KEY = "super-clipboard-docs-locale-redirected";

/**
 * One-shot client-side locale auto-redirect.
 *
 * Only runs on the very first visit per browser session. If the user lands on
 * the English root and their browser prefers Chinese, send them to `/zh/…`.
 * Stops short of fighting an explicit user choice — a single sessionStorage
 * flag prevents redirect loops or overriding manual nav.
 */
function maybeRedirect(): void {
  if (typeof window === "undefined") return;
  if (window.sessionStorage.getItem(STORAGE_KEY)) return;
  window.sessionStorage.setItem(STORAGE_KEY, "1");

  const path = window.location.pathname;
  // Already in a locale subpath — leave alone.
  if (path.startsWith("/zh")) return;

  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  const prefersZh = langs.some((l) => l && l.toLowerCase().startsWith("zh"));
  if (!prefersZh) return;

  const target =
    "/zh" + (path === "/" ? "/" : path) + window.location.search + window.location.hash;
  window.location.replace(target);
}

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp() {
    maybeRedirect();
  },
};

export default theme;
