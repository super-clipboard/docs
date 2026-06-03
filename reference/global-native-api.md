# `globalNativeApi`

> Full signatures live in [`spec.d.ts`](https://github.com/super-clipboard/userscript-types/blob/main/spec.d.ts)
> under `SuperClipboard.GlobalNativeApi`. This page lists every method by
> category. Code blocks use standard TypeScript syntax highlighting.

```ts
globalNativeApi.info;
```

## At a glance

| Category | Sync / async | Methods |
|----------|--------------|---------|
| [Menu](#menu) | sync | `registerMenuCommand` `unregisterMenuCommand` |
| [Subscriptions](#subscriptions) | sync | `addClipboardListener` `removeClipboardListener` |
| [Data](#data) | async | `getClipBody` `setClipOcrText` |
| [KV](#kv) | async | `setValue` `getValue` `deleteValue` `listValues` |
| [I/O](#io) | async | `toast` `saveFile` `copyLocalFile` |
| [Panel](#panel) | async | `showPanel` `resizePanel` `closePanel` |
| [Meta](#meta) | sync | `info` |

---

## Menu

### `registerMenuCommand(name, callback, options?)`

Register a context-menu entry on clip rows.

```ts
const id = globalNativeApi.registerMenuCommand(
  "Copy as link",
  async (ctx) => {
    const target = ctx.clips[0];
    if (target?.type !== "text") return;
    const body = await globalNativeApi.getClipBody(target);
    if (body?.type === "text" && body.text) {
      utools.copyText(`<${body.text}>`);
    }
  },
  {
    matcher: (ctx) => ctx.clips.length === 1 && ctx.clips[0].type === "text",
  },
);
```

- The returned `id` does not persist across restarts — re-register on each launch.
- `options.matcher` is a command-level synchronous predicate — it runs after the
  script-level `@match-clip` has already accepted the selection. Must be a pure
  synchronous function (no `async`/`await`/closure variables). See `MenuMatcherContext`.
- ~~`options.matchClip`~~ is deprecated and has been removed — it duplicated
  `@match-clip`. Use `@match-clip` (script-level) + `options.matcher`
  (command-level) instead.

### `unregisterMenuCommand(id)`

```ts
declare const id: string;
// ---cut---
globalNativeApi.unregisterMenuCommand(id);
```

Unknown ids are no-ops, never throw.

---

## Subscriptions

### `addClipboardListener(event, handler)` / `removeClipboardListener`

```ts
const onAdded = (e: SuperClipboard.ClipboardAddedEvent) => {
  console.log("captured", e.type, e.hash);
};

globalNativeApi.addClipboardListener("added", onAdded);
// To unsubscribe, pass the SAME function reference:
globalNativeApi.removeClipboardListener("added", onAdded);
```

Channels: `"added"` (any type), `"text"`, `"image"`, `"file"`. Subscribing to a
specific type is more precise than filtering inside an `"added"` handler.

---

## Data

### `getClipBody(ref)`

Read a clip's body. Branch on `body.type` (tagged union):

```ts
declare const ref: SuperClipboard.ClipRef;
// ---cut---
async function demo() {
  const body = await globalNativeApi.getClipBody(ref);
  if (!body) return;
  switch (body.type) {
    case "text":
      console.log(body.text ?? body.preview);
      break;
    case "image":
      console.log(body.bytes?.byteLength, body.mime);
      break;
    case "file":
      body.files?.forEach((f) => console.log(f.path));
      break;
  }
}
```

`null` means the host has cleaned up that clip.

### `setClipOcrText(hash, ocrText)`

Persist OCR text for an image clip. Writes to the host-owned `ocr/{hash}`
document — the same store consumed by the built-in image text search, so
the result is visible across all scripts and survives uninstall.

```ts
declare const clip: SuperClipboard.ClipRef & { hash: string };
// ---cut---
await globalNativeApi.setClipOcrText(clip.hash, "hello world");
```

- Content-addressed by `hash` — identical image bytes share one OCR record.
- Pass an empty string to record a negative result (suppresses re-runs).
- For ad-hoc per-script annotations on a clip, see `setClipMetadata` in the
  generated [API reference](./api/@super-clipboard/namespaces/SuperClipboard/interfaces/GlobalNativeApi.md)
  (deprecated — its `scriptData` bag is isolated per script identity and is
  not picked up by host search; prefer dedicated APIs like `setClipOcrText`).

---

## KV

Per-script-identity key-value store (isolated by the install-source URL hash,
not by `@namespace`).

```ts
await globalNativeApi.setValue("settings", { autoOpen: true });
const s = await globalNativeApi.getValue<{ autoOpen: boolean }>("settings");

await globalNativeApi.deleteValue("settings");
const keys = await globalNativeApi.listValues();
```

- Values are `JSON.stringify`'d — don't store `Map` / `Set` / functions.
- `getValue<T>` returns `undefined` if the key is missing.
- Different scripts (different install URLs) cannot read each other's keys.
  `@namespace` values do not bridge the isolation (isolation is purely by
  install-source URL hash since v0.5).

---

## I/O

### `toast(options | string)`

Show an in-app toast message rendered by the host's built-in toast UI.
This is **not** a Web `Notification` or OS-level notification.

```ts
await globalNativeApi.toast({
  title: "Done",
  body: "Saved to ~/Downloads/clip.png",
  timeoutMs: 4000,
});

// Shorthand: a string is treated as { body: "..." }
await globalNativeApi.toast("Saved");
```

### `saveFile(content, options)`

```ts
declare const ref: SuperClipboard.ClipRef;
// ---cut---
const body = await globalNativeApi.getClipBody(ref);
if (body?.type === "image" && body.bytes) {
  await globalNativeApi.saveFile(body.bytes, {
    filename: "clip.png",
    mime: "image/png",
  });
}
```

- `content`: `string` / `Uint8Array` / `ArrayBuffer`.
- Pass `options.targetDir` to write the file directly to that directory
  (requires the Node environment provided by uTools).
- Without `targetDir`, falls back to a browser-style `<a download>` from
  the iframe; in that case the final path is not returned.
- `mime` controls the *Save as…* dialog default extension.

### `copyLocalFile(srcPath, destPath)`

```ts
await globalNativeApi.copyLocalFile(
  "/Users/me/Downloads/source.png",
  "/Users/me/Pictures/dest.png",
);
```

- Copies a local file or directory to another path in supported Node
  environments. Directories are copied recursively.
- Useful when handling `file`-type clips, or when the user picks a source
  path from the script's own panel.

---

## Panel

Each script has **one** dedicated iframe. `showPanel` only changes its style
and visibility — the DOM is not rebuilt, so state survives close/show.

### `showPanel(options)`

```ts
await globalNativeApi.showPanel({
  width: 360,
  height: "auto",
  placement: "center",
  closeOnOutside: true,
});
```

- `placement`: `"menu-anchor" | "center" | "right" | "bottom"`.
- `width` / `height` default per placement; `"auto"` follows the body's content size.
- `closeOnOutside` defaults `true`; `modal` defaults `false`.

### `resizePanel(size)`

```ts
await globalNativeApi.resizePanel({ width: 480, height: "auto" });
```

Pass only the dimensions you want to change. No-op if the panel is closed.

### `closePanel()`

```ts
await globalNativeApi.closePanel();
```

Hides the panel **without** unmounting the iframe.

---

## Meta

### `info`

```ts
const info = globalNativeApi.info;

console.log(`[${info.name} v${info.version}] grants:`, info.grants);
```

Read-only, injected synchronously when the script boots. `scriptId` looks like
`config/script/<sha1-16hex>` — a stable identifier for log correlation.
