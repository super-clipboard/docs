# Quickstart

A real, useful script in ~30 lines: **"Copy as Markdown link"** — adds a menu
command on text clips that wraps the text as `<url>` if it's a URL, otherwise
prompts you. Hover the symbols below for full types.

## 1. Scaffolding

```bash
mkdir my-script && cd $_
pnpm init -y
pnpm add -D @super-clipboard/userscript-types typescript
echo '/// <reference types="@super-clipboard/userscript-types" />' > my-script.user.ts
```

## 2. The script

```ts twoslash
// ==UserScript==
// @name         Copy as Markdown link
// @namespace    com.example.md-link
// @version      0.1.0
// @description  Wraps the focused text clip as a Markdown auto-link.
// @grant        utools.*
// @grant        globalNativeApi.*
// @match-clip   text
// ==/UserScript==

globalNativeApi.registerMenuCommand(
  "Copy as Markdown link",
  async (ctx) => {
    //    ^?
    const ref = ctx.clips[0];
    if (!ref || ref.type !== "text") return;

    const body = await globalNativeApi.getClipBody(ref);
    if (body?.type !== "text" || !body.text) return;

    const text = body.text.trim();
    const md = /^https?:\/\//i.test(text) ? `<${text}>` : `[link](${text})`;

    utools.copyText(md);
    await globalNativeApi.notification({ body: "Copied as Markdown" });
  },
  { matchClip: ["text"] },
);
```

## 3. Install

- **Dev** — *Settings → Scripts → Open scripts folder*, drop your `.user.ts`
  (or compiled `.user.js`) into `local/`.
- **Publish** — see [Publishing](./publishing).

## 4. Try it

1. Copy a URL.
2. Open Super Clipboard, focus that clip, right-click.
3. Choose *Copy as Markdown link* — the system clipboard now has `<https://…>`.

## What you used

- `globalNativeApi.registerMenuCommand` — declarative menu entry.
- `globalNativeApi.getClipBody` — read the actual content (the row only has metadata).
- `utools.copyText` — write back to the system clipboard.
- `globalNativeApi.notification` — non-blocking toast.

Read on:

- [Meta headers](./meta-headers) — what every `@key` means.
- [Grants & Sandbox](./grants) — security model.
- [Examples](./examples) — more patterns.
