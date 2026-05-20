# Scripts Overview

> Super Clipboard ships a Tampermonkey-style userscript system so you can
> extend the clipboard with menu commands, background listeners, floating
> panels, and per-script storage — all in a single `.user.ts` / `.user.js`
> file with full TypeScript IntelliSense.

## What scripts can do

| Capability | What it means for you |
|------------|----------------------|
| **Right-click menu commands** | Add custom actions to the context menu of any clip (text / image / file). |
| **Background listeners** | React to new clips as they are captured (auto-OCR, deduplication, tagging…). |
| **Floating panels** | Render your own UI in a small panel right next to the history list. |
| **Per-script storage** | Persist settings or caches in an isolated key-value store. |
| **Annotate clips** | Write back metadata (OCR text, language, custom tags) that becomes searchable. |
| **Save / copy files** | Drop image clips to disk or copy local files into the user's chosen folder. |
| **Use the uTools API** | Call into the host's `utools.*` surface (copy text, open links, system dialogs…). |
| **Fetch external resources** | Make HTTP requests, load external libraries via `@require` with SRI. |

You write the script; the host renders the menu entries, marshals events,
enforces permissions, and handles cleanup.

## A 60-second feel

```ts
// ==UserScript==
// @name         Copy as Markdown link
// @namespace    com.example.md-link
// @version      0.1.0
// @match-clip   text
// @grant        utools.copyText
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.notification
// ==/UserScript==

globalNativeApi.registerMenuCommand("Copy as Markdown link", async (ctx) => {
  const ref = ctx.clips[0];
  if (ref?.type !== "text") return;
  const body = await globalNativeApi.getClipBody(ref);
  if (body?.type !== "text" || !body.text) return;
  utools.copyText(`<${body.text.trim()}>`);
  await globalNativeApi.notification({ body: "Copied as Markdown" });
});
```

That's the entire script. Drop it into *Settings → Scripts → New* and the
command appears on every text clip. Read [Quickstart](./quickstart) to walk
through it end-to-end.

## The two injected globals

When the script runs, two namespaces *may* be available — only if you ask
for them via `@grant`:

| Global | What you use it for |
|--------|---------------------|
| `globalNativeApi` | Everything Super-Clipboard-specific: menu commands, clip data, KV store, panels, file IO, OCR write-back, logging. |
| `utools` | The host's published [uTools API](https://www.u.tools/docs/developer/api.html) — copy text, open links, native dialogs, etc. A small set of management / payment APIs is blocked (see [Grants](./grants)). |

Anything you didn't declare is left as `undefined`. **Always grant the
narrowest set you need** — the recommended style is fine-grained
(`@grant utools.copyText`, `@grant globalNativeApi.saveFile`) so users can
see exactly what your script touches.

## Trigger modes

| `@run-at` | When the script runs |
|-----------|----------------------|
| `foreground` *(default)* | Loaded on demand when the main window opens. Best for commands that need the UI. |
| `background` | Loaded as soon as the plugin starts, even with the main window closed. Best for listeners. |

## Built-in scripts

Several scripts ship in the box; they double as examples:

| Name | What it does |
|------|--------------|
| **QR code** | Generate a QR for the selected text clip and show it in a panel. |
| **Tokenize** | Chinese / mixed-language word segmentation in a floating panel. |
| **Save as…** | Download an image clip, or save its bytes into a chosen folder. |
| **Auto-OCR mark** | Run OCR on every new image clip and write the text back so you can search images by content. |

You can uninstall any of them; the plugin will not reinstall them silently.

## Where to next

- [Quickstart](./quickstart) — a complete script in five minutes.
- [Metadata headers](./meta-headers) — every supported `@key`.
- [Grants & permissions](./grants) — fine-grained authorization model.
- [Examples](./examples) — copy-paste patterns for the common cases.
- [Publishing](./publishing) — ship your script to the marketplace.
- [`globalNativeApi` reference](/reference/global-native-api) — full method list.
