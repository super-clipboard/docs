#!/usr/bin/env node
/**
 * After TypeDoc generates ./reference/api, mirror it to ./zh/reference/api so
 * that Chinese readers don't 404 on links into the API tree. A small banner is
 * prepended noting that the page is in English; source comments are English
 * only and the bilingual narrative lives under /zh/scripts/ and /zh/guide/.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(__dirname, "..");
const SRC = path.join(DOCS_ROOT, "reference", "api");
const DST = path.join(DOCS_ROOT, "zh", "reference", "api");

const BANNER = `::: tip 暂无中文翻译\n以下 API 参考由 TypeDoc 从英文 \`spec.d.ts\` 自动生成。中文叙事性文档请参考 [脚本开发指南](/zh/scripts/overview)。\n:::\n\n`;

async function rimraf(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function copyTree(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      await copyTree(s, d);
    } else if (entry.name.endsWith(".md")) {
      const raw = await fs.readFile(s, "utf8");
      // Insert banner after the first H1 (if any) so the title still renders first.
      const h1End = raw.indexOf("\n", raw.indexOf("# "));
      const out =
        h1End >= 0
          ? raw.slice(0, h1End + 1) + "\n" + BANNER + raw.slice(h1End + 1)
          : BANNER + raw;
      await fs.writeFile(d, out);
    } else if (entry.name === "typedoc-sidebar.json") {
      // Rewrite sidebar links from /reference/api/... to /zh/reference/api/...
      const json = JSON.parse(await fs.readFile(s, "utf8"));
      const rewrite = (items) => {
        for (const item of items ?? []) {
          if (typeof item.link === "string") {
            item.link = item.link.replace(/^\/reference\/api\//, "/zh/reference/api/");
          }
          if (Array.isArray(item.items)) rewrite(item.items);
        }
      };
      rewrite(json);
      await fs.writeFile(d, JSON.stringify(json, null, 2));
    } else {
      await fs.copyFile(s, d);
    }
  }
}

await rimraf(DST);
await copyTree(SRC, DST);
console.log(`[mirror-api-zh] copied ${SRC} -> ${DST}`);
