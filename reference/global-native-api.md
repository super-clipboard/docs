# `globalNativeApi`

> Full signatures live in [`spec.d.ts`](https://github.com/super-clipboard/userscript-types/blob/main/spec.d.ts)
> under `SuperClipboard.GlobalNativeApi`. This page lists every method by
> category. Code blocks use [TwoSlash](https://twoslash.netlify.app/) — hover
> a symbol to see its inferred type.

```ts twoslash
globalNativeApi.info;
//              ^?
```

## At a glance

| Category | Sync / async | Methods |
|----------|--------------|---------|
| [Menu](#menu) | sync | `registerMenuCommand` `unregisterMenuCommand` |
| [Subscriptions](#subscriptions) | sync | `addClipboardListener` `removeClipboardListener` `addAppListener` `addPanelListener` |
| [Data](#data) | async | `getClipBody` `setClipOcrText` |
| [KV](#kv) | async | `setValue` `getValue` `deleteValue` `listValues` |
| [I/O](#io) | async | `notification` `saveFile` `copyLocalFile` |
| [Logging](#logging) | sync | `log` `warn` `error` |
| [Panel](#panel) | async | `showPanel` `resizePanel` `closePanel` |
| [Meta](#meta) | sync | `info` |

---

## Menu

### `registerMenuCommand(name, callback, options?)`

Register a context-menu entry on clip rows.

```ts twoslash
const id = globalNativeApi.registerMenuCommand(
  "Copy as link",
  async (ctx) => {
    //    ^?
    const target = ctx.clips[0];
    if (target?.type !== "text") return;
    const body = await globalNativeApi.getClipBody(target);
    if (body?.type === "text" && body.text) {
      utools.copyText(`<${body.text}>`);
    }
  },
  { matchClip: ["text"] },
);
```

- The returned `id` does not persist across restarts — re-register on each launch.
- `options.matchClip` intersects with the `@match-clip` header.
- `options.accessKey` — single character used as the menu's mnemonic.

### `unregisterMenuCommand(id)`

```ts twoslash
declare const id: string;
// ---cut---
globalNativeApi.unregisterMenuCommand(id);
```

Unknown ids are no-ops, never throw.

---

## Subscriptions

### `addClipboardListener(event, handler)` / `removeClipboardListener`

```ts twoslash
const onAdded = (e: SuperClipboard.ClipboardAddedEvent) => {
  //                ^?
  console.log("captured", e.type, e.hash);
};

globalNativeApi.addClipboardListener("added", onAdded);
// To unsubscribe, pass the SAME function reference:
globalNativeApi.removeClipboardListener("added", onAdded);
```

Channels: `"added"` (any type), `"text"`, `"image"`, `"file"`. Subscribing to a
specific type is more precise than filtering inside an `"added"` handler.

### `addAppListener(event, handler)`

```ts twoslash
globalNativeApi.addAppListener("visible", () => {
  // Fired when the main window becomes visible (placeholder for now).
});
```

> ⚠️ **Placeholder API**: the host does not currently emit any `app:*` events.
> Subscriptions are no-ops. Will be implemented in upcoming releases.

### `addPanelListener(event, handler)`

```ts twoslash
globalNativeApi.addPanelListener("closed", () => {
  // Fired when the panel is closed by the user or via closePanel().
});
```

> ⚠️ **Placeholder API**: same as above.

---

## Data

### `getClipBody(ref)`

Read a clip's body. Branch on `body.type` (tagged union):

```ts twoslash
declare const ref: SuperClipboard.ClipRef;
// ---cut---
async function demo() {
  const body = await globalNativeApi.getClipBody(ref);
  //    ^?
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

```ts twoslash
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

```ts twoslash
await globalNativeApi.setValue("settings", { autoOpen: true });
const s = await globalNativeApi.getValue<{ autoOpen: boolean }>("settings");
//    ^?

await globalNativeApi.deleteValue("settings");
const keys = await globalNativeApi.listValues();
//    ^?
```

- Values are `JSON.stringify`'d — don't store `Map` / `Set` / functions.
- `getValue<T>` returns `undefined` if the key is missing.
- Different scripts (different install URLs) cannot read each other's keys;
  matching `@namespace` values do not bridge the isolation.

---

## I/O

### `notification(options | string)`

```ts twoslash
await globalNativeApi.notification({
  title: "Done",
  body: "Saved to ~/Downloads/clip.png",
  timeoutMs: 4000,
});

// Shorthand: a string is treated as { body: "..." }
await globalNativeApi.notification("Saved");
```

### `saveFile(content, options)`

```ts twoslash
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

```ts twoslash
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

## Logging

> ⚠️ **Deprecated**：请改用 `console.log` / `console.warn` / `console.error`。
> 宿主会拦截沙箱内的 `console.*` 调用，自动加上
> `[script:<name>] [console]` 前缀写入应用主日志文件
> (`utools.getPath('logs')/super-clipboard-next/...`) 并在设置 → 脚本 → 调试日志面板实时显示。
> 以下 API 仍可用但在 spec 中已 `@deprecated`，后续版本会移除。

```ts twoslash
console.log("ordinary", { hash: "abc" });
console.warn("unexpected condition");
console.error(new Error("boom"));
```

- 同步调用。
- 输出自动带上 `[script:<name>]` 前缀，便于在 uTools 日志文件中 grep。
- 主动抛出的错误也会被宿主记在 `error` 级，但显式 `console.error` 更清晰。

---

## Panel

Each script has **one** dedicated iframe. `showPanel` only changes its style
and visibility — the DOM is not rebuilt, so state survives close/show.

### `showPanel(options)`

```ts twoslash
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

```ts twoslash
await globalNativeApi.resizePanel({ width: 480, height: "auto" });
```

Pass only the dimensions you want to change. No-op if the panel is closed.

### `closePanel()`

```ts twoslash
await globalNativeApi.closePanel();
```

Hides the panel **without** unmounting the iframe.

---

## Meta

### `info`

```ts twoslash
const info = globalNativeApi.info;
//    ^?

console.log(`[${info.name} v${info.version}] grants:`, info.grants);
```

Read-only, injected synchronously when the script boots. `scriptId` looks like
`config/script/<sha1-16hex>` — a stable identifier for log correlation.
