import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import TwoslashFloatingVue from "@shikijs/vitepress-twoslash/client";

import "@shikijs/vitepress-twoslash/style.css";
import "./twoslash.css";

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

  // 站点部署在 GitHub Pages 项目子路径下（如 `/docs/`）。必须基于 BASE_URL 计算
  // locale，否则 `/docs/` 会被错误地重定向到 `/zh/docs/`（404）。
  // VitePress 在客户端注入 Vite 的 `import.meta.env.BASE_URL`，但本项目根 tsconfig
  // 没有引入 `vite/client` 类型，故做一次安全断言。
  const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL || "/";
  const path = window.location.pathname;
  const relative = path.startsWith(base) ? path.slice(base.length) : path.replace(/^\/+/, "");

  // Already in a locale subpath — leave alone.
  if (relative === "zh" || relative.startsWith("zh/")) return;

  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  const prefersZh = langs.some((l) => l && l.toLowerCase().startsWith("zh"));
  if (!prefersZh) return;

  const normalizedBase = base.endsWith("/") ? base : base + "/";
  const target =
    normalizedBase + "zh/" + relative + window.location.search + window.location.hash;
  window.location.replace(target);
}

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(TwoslashFloatingVue);
    maybeRedirect();
  },
};

export default theme;
